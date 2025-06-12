'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { getImageThumbnailBuffer } from '@/app/actions/images';

const apiLogger = serverLogger.withContext('ThumbnailAPI');

export async function GET(_request: Request, context: { params: { id: string } }) {
	const headers = new Headers();
	const id = context.params.id;

	try {
		const { buffer, mimeType } = await getImageThumbnailBuffer(id);

		if (!buffer) {
			apiLogger.warn('Thumbnail not found for image ID:', id);
			return new Response('Thumbnail not found', { status: 404 });
		}

		headers.set('Content-Type', mimeType);
		headers.set('Content-Length', buffer.length.toString());
		headers.set('Cache-Control', 'public, max-age=31536000');

		return new Response(buffer, {
			headers,
		});
	} catch (error) {
		apiLogger.error('Error serving thumbnail for image ID:', id, error);
		return new Response('Error serving thumbnail', { status: 500 });
	}
}
