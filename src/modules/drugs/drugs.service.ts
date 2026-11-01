import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { Drugs } from 'src/schema/drugs.schema';

@Injectable()
export class DrugsService {
  constructor(@InjectModel('Drugs') private DrugModel: Model<Drugs>) {}

  async getDrugsByName(name: string) {
    if (!name || name.trim().length < 2) return [];

    const trimmedName = name.trim();
    if (/^tab(?:let)?\.?$/i.test(trimmedName)) return [];

    const q = trimmedName.replace(/^tab(?:let)?\.?\s+/i, '').trim();
    if (q.length < 2) return [];

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const qNormalized = q.toLowerCase().replace(/[-\s]/g, '');
    const qLower = q.toLowerCase();

    const pipeline: PipelineStage[] = [
      // Step 1: normalize text and broad candidate filter
      {
        $addFields: {
          nameNormalized: {
            $replaceAll: {
              input: { $toLower: '$name' },
              find: '-',
              replacement: '',
            },
          },
          contentNormalized: {
            $replaceAll: {
              input: { $toLower: '$content' },
              find: '-',
              replacement: '',
            },
          },
          companyNormalized: {
            $replaceAll: {
              input: { $toLower: '$company' },
              find: '-',
              replacement: '',
            },
          },
        },
      } as PipelineStage.AddFields,
      {
        $match: {
          $or: [
            { nameNormalized: { $regex: qNormalized, $options: 'i' } },
            { contentNormalized: { $regex: qNormalized, $options: 'i' } },
            { companyNormalized: { $regex: qNormalized, $options: 'i' } },
            { name: { $regex: escaped, $options: 'i' } },
            { content: { $regex: escaped, $options: 'i' } },
            { company: { $regex: escaped, $options: 'i' } },
          ],
        },
      } as PipelineStage.Match,

      // Step 2: compute relevance score
      {
        $addFields: {
          _score: {
            $let: {
              vars: { nameLower: { $toLower: '$name' } },
              in: {
                $add: [
                  // +10 exact name match
                  { $cond: [{ $eq: ['$$nameLower', qLower] }, 10, 0] },
                  // +9 normalized exact name match (ignores dashes/spaces)
                  {
                    $cond: [
                      {
                        $eq: [
                          {
                            $replaceAll: {
                              input: { $toLower: '$name' },
                              find: '-',
                              replacement: '',
                            },
                          },
                          qNormalized,
                        ],
                      },
                      9,
                      0,
                    ],
                  },
                  // +8 name starts with query
                  {
                    $cond: [
                      {
                        $regexMatch: {
                          input: '$$nameLower',
                          regex: `^${escaped}`,
                          options: 'i',
                        },
                      },
                      8,
                      0,
                    ],
                  },
                  // +6 a word in name starts with query  e.g. "Nise Plus"
                  {
                    $cond: [
                      {
                        $regexMatch: {
                          input: '$$nameLower',
                          regex: `(^|\\s)${escaped}`,
                          options: 'i',
                        },
                      },
                      6,
                      0,
                    ],
                  },
                  // +5 normalized word-prefix match
                  {
                    $cond: [
                      {
                        $regexMatch: {
                          input: {
                            $replaceAll: {
                              input: { $toLower: '$name' },
                              find: '-',
                              replacement: '',
                            },
                          },
                          regex: `^${qNormalized}`,
                          options: 'i',
                        },
                      },
                      5,
                      0,
                    ],
                  },
                  // +4 name contains query anywhere  e.g. "Biozenises" → only 4 pts
                  {
                    $cond: [
                      {
                        $regexMatch: {
                          input: '$$nameLower',
                          regex: escaped,
                          options: 'i',
                        },
                      },
                      4,
                      0,
                    ],
                  },
                  // +2 content match
                  {
                    $cond: [
                      {
                        $regexMatch: {
                          input: { $toLower: '$content' },
                          regex: escaped,
                          options: 'i',
                        },
                      },
                      2,
                      0,
                    ],
                  },
                  // +1 company match
                  {
                    $cond: [
                      {
                        $regexMatch: {
                          input: { $toLower: '$company' },
                          regex: escaped,
                          options: 'i',
                        },
                      },
                      1,
                      0,
                    ],
                  },
                ],
              },
            },
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
}
