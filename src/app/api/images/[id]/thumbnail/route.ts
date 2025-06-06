'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';

const apiLogger = serverLogger.withContext('ThumbnailAPI');

export async function GET(_request: Request, context: { params: { id: string } }) {
	const headers = new Headers();
	const id = context.params.id;

	try {
		const image = await prisma.image.findUnique({
			where: { id },
			select: {
				id: true,
				thumbnail: true,
				thumbnailMimeType: true, // Asumimos que guardamos el tipo MIME de la miniatura
			},
		});

		if (!image || !image.thumbnail) {
			apiLogger.warn('Thumbnail not found for image ID:', id);
			return new Response('Thumbnail not found', { status: 404 });
		}

		// Determinar el tipo MIME. Usar un valor por defecto si no está en la BD.
		const mimeType = image.thumbnailMimeType || 'image/webp'; // Asumimos webp como formato por defecto

		headers.set('Content-Type', mimeType);
		headers.set('Content-Length', image.thumbnail.length.toString());
		headers.set('Cache-Control', 'public, max-age=31536000'); // Cache por 1 año
		headers.set('ETag', `"${image.id}"`);

		apiLogger.debug(`Serving thumbnail for ${id} with size ${image.thumbnail.length} bytes`);

		return new Response(image.thumbnail, {
			headers,
		});
	} catch (error) {
		apiLogger.error('Error serving thumbnail for image ID:', id, error);
		return new Response('Error serving thumbnail', { status: 500 });
	}
}