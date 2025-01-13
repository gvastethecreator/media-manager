class ImageService {
  async getOriginalImage(imageId: string): Promise<Buffer> {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { path: true }
    });

    if (!image) {
      imageLogger.error('Imagen no encontrada', { imageId });
      throw new Error('Imagen no encontrada');
    }

    try {
      const buffer = await fs.readFile(image.path);
      return buffer;
    } catch (error) {
      imageLogger.error('Error leyendo imagen original', { imageId, error });
      throw new Error('Error al leer la imagen original');
    }
  }
}