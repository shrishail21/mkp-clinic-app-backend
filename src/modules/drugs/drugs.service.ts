import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { Drugs, normalizeDrugSearchText } from '../../schema/drugs.schema';

const MAX_SEARCH_CANDIDATES_PER_FIELD = 100;

@Injectable()
export class DrugsService implements OnModuleInit {
  private readonly logger = new Logger(DrugsService.name);

  constructor(@InjectModel('Drugs') private DrugModel: Model<Drugs>) {}

  async onModuleInit(): Promise<void> {
    const result = await this.DrugModel.updateMany(
      {
        $or: [
          { nameNormalized: { $exists: false } },
          { contentNormalized: { $exists: false } },
          { companyNormalized: { $exists: false } },
        ],
      },
      [
        {
          $set: {
            nameNormalized: this.normalizedField('$name'),
            contentNormalized: this.normalizedField('$content'),
            companyNormalized: this.normalizedField('$company'),
          },
        },
      ],
    ).exec();

    if (result.modifiedCount > 0) {
      this.logger.log(
        `Backfilled search fields for ${result.modifiedCount} drug records`,
      );
    }
  }

  async getDrugsByName(name: string) {
    if (!name || name.trim().length < 2) return [];

    const trimmedName = name.trim();
    if (/^tab(?:let)?\.?$/i.test(trimmedName)) return [];

    const q = trimmedName.replace(/^tab(?:let)?\.?\s+/i, '').trim();
    if (q.length < 2) return [];

    const qNormalized = normalizeDrugSearchText(q);
    const escapedNormalized = qNormalized.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    );
    const qLower = q.toLowerCase();

    const prefixMatch = (field: string) => ({
      $match: { [field]: { $regex: `^${escapedNormalized}` } },
    });
    const candidateLimit = { $limit: MAX_SEARCH_CANDIDATES_PER_FIELD };

    const pipeline: PipelineStage[] = [
      // Bound each indexed prefix scan before relevance scoring and sorting.
      prefixMatch('nameNormalized') as PipelineStage.Match,
      candidateLimit as PipelineStage.Limit,
      {
        $unionWith: {
          coll: this.DrugModel.collection.name,
          pipeline: [
            prefixMatch('contentNormalized') as PipelineStage.Match,
            candidateLimit as PipelineStage.Limit,
          ],
        },
      } as PipelineStage.UnionWith,
      {
        $unionWith: {
          coll: this.DrugModel.collection.name,
          pipeline: [
            prefixMatch('companyNormalized') as PipelineStage.Match,
            candidateLimit as PipelineStage.Limit,
          ],
        },
      } as PipelineStage.UnionWith,
      {
        $group: {
          _id: '$_id',
          drug: { $first: '$$ROOT' },
        },
      } as PipelineStage.Group,
      {
        $replaceRoot: { newRoot: '$drug' },
      } as PipelineStage.ReplaceRoot,

      // Score only indexed prefix matches before ranking the results.
      {
        $addFields: {
          _score: {
            $add: [
              {
                $cond: [{ $eq: [{ $toLower: '$name' }, qLower] }, 10, 0],
              },
              { $cond: [{ $eq: ['$nameNormalized', qNormalized] }, 9, 0] },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: '$nameNormalized',
                      regex: `^${escapedNormalized}`,
                    },
                  },
                  8,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: '$contentNormalized',
                      regex: `^${escapedNormalized}`,
                    },
                  },
                  2,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: '$companyNormalized',
                      regex: `^${escapedNormalized}`,
                    },
                  },
                  1,
                  0,
                ],
              },
            ],
          },
        },
      } as PipelineStage.AddFields,

      // Step 3: sort — must use `1 | -1` literals, not plain number
      {
        $sort: { _score: -1 as const, name: 1 as const },
      } as PipelineStage.Sort,

      // Step 4: limit
      { $limit: 10 } as PipelineStage.Limit,

      // Step 5: drop internal score field from response
      {
        $project: {
          _id: 1,
          name: 1,
          content: 1,
          company: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      } as PipelineStage.Project,
    ];

    return this.DrugModel.aggregate(pipeline).exec();
  }

  private normalizedField(field: string) {
    return {
      $replaceAll: {
        input: { $toLower: { $ifNull: [field, ''] } },
        find: '-',
        replacement: '',
      },
    };
  }
}
