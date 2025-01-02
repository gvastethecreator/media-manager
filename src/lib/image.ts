// No hay cambios en el archivo src/lib/image.ts, ya que el código proporcionado es el mismo que el original.
// Si se desea mover el código de imagen a un archivo separado para el servidor, se debería crear un nuevo archivo, por ejemplo, src/server/image.server.ts, y mover el código allí.

// Sin embargo, si se desea mantener el mismo archivo, el contenido sigue siendo el mismo:

import sharp from 'sharp'

export interface ImageMetadata {
  width: number
  height: number
  format: string | null
  space: string | null
  channels: number | null
  depth: string | null
  density: number | null
  hasAlpha: boolean | null
  orientation: number | null
}

export async function getImageMetadata(filePath: string): Promise<ImageMetadata> {
  try {
    console.log('📸 Getting metadata for:', filePath)
    const metadata = await sharp(filePath).metadata()

    const result = {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || null,
      space: metadata.space || null,
      channels: metadata.channels || null,
      depth: metadata.depth || null,
      density: metadata.density || null,
      hasAlpha: metadata.hasAlpha || null,
      orientation: metadata.orientation || null
    }

    console.log('✅ Metadata obtained:', result)
    return result
  } catch (error) {
    console.error('❌ Error getting image metadata:', {
      path: filePath,
      error: error instanceof Error ? error.message : error
    })

    // Devolver valores por defecto en caso de error
    return {
      width: 0,
      height: 0,
      format: null,
      space: null,
      channels: null,
      depth: null,
      density: null,
      hasAlpha: null,
      orientation: null
    }
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
    console.log('🖼️ Creating thumbnail for:', path)
    console.log('⚙️ Using options:', { width, height, quality })

    const imageBuffer = await sharp(path)
      .resize(width, height, {
        fit: 'cover',
        position: 'centre',
        withoutEnlargement: true
      })
      .webp({ quality })
      .toBuffer()

    const result = {
      buffer: imageBuffer,
      size: imageBuffer.length,
      format: 'webp'
    }

    console.log('✅ Thumbnail created:', {
      size: result.size,
      format: result.format
    })

    return result
  } catch (error) {
    console.error('❌ Error creating thumbnail:', {
      path,
      error: error instanceof Error ? error.message : error,
      options
    })
    throw error
  }
}
