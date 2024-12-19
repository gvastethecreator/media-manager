import sharp from 'sharp'

export interface ImageMetadata {
  width: number
  height: number
  format: string
  space: string
  channels: number
  depth: string
  density: number
  isProgressive: boolean
  hasProfile: boolean
  hasAlpha: boolean
}

export async function getImageMetadata(path: string): Promise<ImageMetadata> {
  try {
    const metadata = await sharp(path).metadata()
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || '',
      space: metadata.space || '',
      channels: metadata.channels || 0,
      depth: metadata.depth || '',
      density: metadata.density || 0,
      isProgressive: metadata.isProgressive || false,
      hasProfile: metadata.hasProfile || false,
      hasAlpha: metadata.hasAlpha || false
    }
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
