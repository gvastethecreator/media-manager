import { imageService } from '@/services/image.service';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

const routeLogger = logger.withContext('ImageOriginalRoute');

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const headersList = await headers();
  const id = params.id;

  try {
    // Primero obtenemos el tipo MIME y la ruta del archivo
    const image = await prisma.image.findUnique({
      where: { id },
      select: {
        metadata: true,
        path: true,
      },
    });

    if (!image) {
      routeLogger.error('Imagen no encontrada', { id });
      return NextResponse.json(
        { error: 'Imagen no encontrada' },
        { status: 404 }
      );
    }

    // Parseamos el metadata para obtener el tipo MIME
    const metadata = image.metadata ? JSON.parse(image.metadata as string) : {};
    const mimeType = metadata.mimeType || 'image/jpeg';

    // Obtenemos el buffer de la imagen
    const buffer = await imageService.getOriginalImage(id);

    // Verificamos si el cliente tiene la imagen en caché
    const etag = `"${id}"`;
    const ifNoneMatch = headersList.get('if-none-match');

    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': buffer.length.toString(),
        'ETag': etag,
      },
    });
  } catch (error) {
    routeLogger.error('Error obteniendo imagen original', {
      id,
      error
    });

    return NextResponse.json(
      { error: 'Error al obtener la imagen' },
      { status: 500 }
    );
  }
}