import { getOriginalImage } from '@/app/actions/images';
import { serverLogger } from '@/lib/logger/server-logger';

const _apiLogger = serverLogger.withContext('ImageAPI');

export async function GET(_request: Request, context: { params: { id: string } }) {
	const headers = new Headers();
	const { id } = context.params;

	try {
		const { buffer, mimeType } = await getOriginalImage(id);

		headers.set('Content-Type', mimeType);
		headers.set('Content-Length', buffer.length.toString());
		headers.set('Cache-Control', 'public, max-age=31536000');

		return new Response(buffer, {
			headers,
		});
	} catch (error) {
		console.error('Error serving image:', error);
		return new Response('Error serving image', { status: 500 });
	}
}
