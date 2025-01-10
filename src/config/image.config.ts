import { z } from 'zod'

export const ThumbnailQualitySchema = z.enum(['compressed', 'low', 'medium', 'high'])
export type ThumbnailQuality = z.infer<typeof ThumbnailQualitySchema>

export const ImageConfigSchema = z.object({
  thumbnail: z.object({
    qualities: z.record(ThumbnailQualitySchema, z.object({
      quality: z.number().min(1).max(100),
      width: z.number().positive(),
      height: z.number().positive(),
    })),
    cacheDuration: z.number(),
    cacheSize: z.number(),
  }),
  processing: z.object({
    maxSize: z.number(),
    supportedFormats: z.array(z.string()),
    defaultFormat: z.string(),
  }),
})

export type ImageConfig = z.infer<typeof ImageConfigSchema>

export const imageConfig: ImageConfig = {
  thumbnail: {
    qualities: {
      compressed: { quality: 60, width: 200, height: 200 },
      low: { quality: 70, width: 300, height: 300 },
      medium: { quality: 80, width: 400, height: 400 },
      high: { quality: 90, width: 500, height: 500 },
    },
    cacheDuration: 1000 * 60 * 60 * 24, // 24 hours
    cacheSize: 1000,
  },
  processing: {
    maxSize: 1024 * 1024 * 20, // 20MB
    supportedFormats: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    defaultFormat: 'webp',
  },
}
