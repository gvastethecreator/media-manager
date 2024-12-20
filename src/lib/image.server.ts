import sharp from 'sharp'
import { getImageMetadata as getMetadata } from './metadata'

export type { ImageMetadata } from './metadata'

export async function getImageMetadata(path: string) {
  try {
    return await getMetadata(path)
  } catch (error) {
    console.error('Error getting image metadata:', error)
    throw error
  }
}

export async function createThumbnail(path: string, options: {
  width?: number
  height?: number
  quality?: number
} = {}) {
  const {
    width = 200,
    height = 200,
    quality = 80
  } = options

  try {
    const imageBuffer = await sharp(path)
      .resize(width, height, {
        fit: 'cover',
        position: 'centre'
      })
      .webp({ quality })
      .toBuffer()

    return {
      buffer: imageBuffer,
      size: imageBuffer.length,
      format: 'webp'
    }
  } catch (error) {
    console.error('Error creating thumbnail:', error)
    throw error
  }
}
