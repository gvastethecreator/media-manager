import { z } from 'zod'

const CacheEntrySchema = z.object({
  max: z.number(),
  ttl: z.number(),
  cleanupInterval: z.number().optional(),
  updateAgeOnGet: z.boolean().optional(),
  allowStale: z.boolean().optional(),
})

export const CacheConfigSchema = z.object({
  default: z.object({
    max: z.number(),
    ttl: z.number(),
    updateAgeOnGet: z.boolean(),
    allowStale: z.boolean(),
    cleanupInterval: z.number(),
    statsInterval: z.number(),
  }),
  thumbnails: CacheEntrySchema,
  stats: CacheEntrySchema,
  metadata: CacheEntrySchema,
  search: CacheEntrySchema,
})

export type CacheConfig = z.infer<typeof CacheConfigSchema>

export const cacheConfig: CacheConfig = {
  default: {
    max: 500,
    ttl: 1000 * 60 * 60, // 1 hour
    updateAgeOnGet: true,
    allowStale: false,
    cleanupInterval: 1000 * 60 * 15, // 15 minutes
    statsInterval: 1000 * 60 * 5, // 5 minutes
  },
  thumbnails: {
    max: 1000,
    ttl: 1000 * 60 * 60 * 24, // 24 hours
    cleanupInterval: 1000 * 60 * 30, // 30 minutes
    updateAgeOnGet: true,
    allowStale: true,
  },
  stats: {
    max: 200,
    ttl: 1000 * 60 * 5, // 5 minutes
    cleanupInterval: 1000 * 60 * 1, // 1 minute
    updateAgeOnGet: true,
    allowStale: true,
  },
  metadata: {
    max: 5000,
    ttl: 1000 * 60 * 60, // 1 hour
    cleanupInterval: 1000 * 60 * 30, // 30 minutes
    updateAgeOnGet: true,
    allowStale: true,
  },
  search: {
    max: 100,
    ttl: 1000 * 60 * 5, // 5 minutes
    updateAgeOnGet: false,
    allowStale: true,
  },
}
