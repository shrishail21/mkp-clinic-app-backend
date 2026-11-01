import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Collection, Document, MongoServerError } from 'mongodb';
import { ThrottlerStorage } from '@nestjs/throttler';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

interface RateLimitCounter {
  _id: string;
  totalHits: number;
  expiresAt: Date;
  blockedUntil: Date;
}

@Injectable()
export class MongoThrottlerStorage implements ThrottlerStorage {
  private readonly counters: Collection<RateLimitCounter>;

  constructor(@InjectConnection() connection: Connection) {
    if (!connection.db) {
      throw new Error(
        'MongoDB connection is not available for rate-limit storage',
      );
    }
    this.counters =
      connection.db.collection<RateLimitCounter>('api_rate_limits');
  }

  async initialize(): Promise<void> {
    await this.counters.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: 'rate_limit_expiry' },
    );
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const now = new Date();
    const counterKey = `${_throttlerName}:${key}`;
    const expiredWindow = {
      $lte: [{ $ifNull: ['$expiresAt', new Date(0)] }, now],
    };
    const activeBlock = {
      $gt: [{ $ifNull: ['$blockedUntil', new Date(0)] }, now],
    };
    const existingHits = { $ifNull: ['$totalHits', 0] };
    const cappedWithoutBlock = {
      $and: [{ $eq: [blockDuration, 0] }, { $gte: [existingHits, limit] }],
    };
    const nextHits = {
      $cond: [
        activeBlock,
        existingHits,
        {
          $cond: [
            expiredWindow,
            1,
            {
              $cond: [
                cappedWithoutBlock,
                existingHits,
                { $add: [existingHits, 1] },
              ],
            },
          ],
        },
      ],
    };
    const newlyBlocked = {
      $and: [
        { $eq: [expiredWindow, false] },
        { $eq: [activeBlock, false] },
        { $gt: [nextHits, limit] },
      ],
    };
    const expiresAt = new Date(now.getTime() + ttl);
    const blockedUntil = new Date(now.getTime() + blockDuration);
    const update: Document[] = [
      {
        $set: {
          totalHits: nextHits,
          expiresAt: {
            $cond: [
              expiredWindow,
              expiresAt,
              {
                $cond: [
                  newlyBlocked,
                  { $max: ['$expiresAt', blockedUntil] },
                  '$expiresAt',
                ],
              },
            ],
          },
          blockedUntil: {
            $cond: [
              activeBlock,
              '$blockedUntil',
              {
                $cond: [
                  expiredWindow,
                  new Date(0),
                  {
                    $cond: [
                      blockDuration === 0,
                      {
                        $cond: [
                          { $gte: [existingHits, limit] },
                          '$expiresAt',
                          { $ifNull: ['$blockedUntil', new Date(0)] },
                        ],
                      },
                      {
                        $cond: [
                          newlyBlocked,
                          blockedUntil,
                          { $ifNull: ['$blockedUntil', new Date(0)] },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    ];

    let counter: RateLimitCounter | null;
    try {
      counter = await this.counters.findOneAndUpdate(
        { _id: counterKey },
        update,
        {
          upsert: true,
          returnDocument: 'after',
        },
      );
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== 11000) {
        throw error;
      }
      counter = await this.counters.findOneAndUpdate(
        { _id: counterKey },
        update,
        {
          returnDocument: 'after',
        },
      );
    }
    if (!counter) {
      throw new Error('Rate-limit counter was not available after increment');
    }

    const timeToExpire = Math.max(
      0,
      Math.ceil((counter.expiresAt.getTime() - now.getTime()) / 1000),
    );
    const isBlocked = counter.blockedUntil.getTime() > now.getTime();
    const timeToBlockExpire = isBlocked
      ? blockDuration === 0
        ? timeToExpire
        : Math.max(
            0,
            Math.ceil((counter.blockedUntil.getTime() - now.getTime()) / 1000),
          )
      : 0;

    return {
      totalHits: counter.totalHits + (blockDuration === 0 && isBlocked ? 1 : 0),
      timeToExpire,
      isBlocked,
      timeToBlockExpire,
    };
  }
}
