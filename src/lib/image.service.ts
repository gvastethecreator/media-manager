import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'

class ImageService {
  async getOriginalImage(imageId: string): Promise<Buffer> {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { path: true }
    });

    if (!image) {
      logger.error('Imagen no encontrada', { imageId });
      throw new Error('Imagen no encontrada');
    }

    try {
      const buffer = await fs.readFile(image.path);
      return buffer;
    } catch (error) {
      logger.error('Error leyendo imagen original', { imageId, error });
      throw new Error('Error al leer la imagen original');
    }
  }
}