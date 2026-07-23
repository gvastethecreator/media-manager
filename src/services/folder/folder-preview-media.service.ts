import { inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { images, videos } from '@/lib/drizzle/schema';

const IMAGE_PREVIEW_PATH = /^\/api\/images\/([A-Za-z0-9_-]+)\/thumbnail$/;
const VIDEO_PREVIEW_PATH = /^\/api\/videos\/([A-Za-z0-9_-]+)\/thumbnail$/;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const MAX_EMBEDDED_PREVIEW_BYTES = 512 * 1024;
const MAX_TOTAL_EMBEDDED_PREVIEW_BYTES = 1024 * 1024;

export interface FolderPreviewMediaReference {
	id: string;
	thumbnailDataUrl?: string;
	thumbnailPath: string;
}

interface EmbeddedThumbnail {
	byteLength: number;
	dataUrl: string;
}

function detectRasterMimeType(buffer: Buffer): string | undefined {
	if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
		return 'image/webp';
	}
	if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
		return 'image/png';
	}
	if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
	if (buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'))) return 'image/gif';
	if (buffer.length >= 2 && buffer.subarray(0, 2).toString('ascii') === 'BM') return 'image/bmp';
	if (
		buffer.length >= 12 &&
		buffer.subarray(4, 8).toString('ascii') === 'ftyp' &&
		['avif', 'avis'].includes(buffer.subarray(8, 12).toString('ascii'))
	) {
		return 'image/avif';
	}
	return undefined;
}

export function toEmbeddedFolderPreviewThumbnail(raw: string | null): EmbeddedThumbnail | undefined {
	if (!raw) return undefined;

	const value = raw.replace(/\s+/g, '');
	if (!BASE64.test(value)) return undefined;
	const byteLength = Math.floor((value.length * 3) / 4);
	if (byteLength > MAX_EMBEDDED_PREVIEW_BYTES) return undefined;

	const mime = detectRasterMimeType(Buffer.from(value, 'base64'));
	if (!mime) return undefined;
	return { byteLength, dataUrl: `data:${mime};base64,${value}` };
}

/**
 * Adjunta thumbnails inline sólo para el SVG de fallback. La UI normal conserva las rutas locales y carga la media
 * directamente; el SVG no debe depender de peticiones anidadas que un navegador puede bloquear al usarlo como imagen.
 */
export async function embedFolderPreviewMedia<T extends FolderPreviewMediaReference>(files: T[]): Promise<T[]> {
	const imageIds: string[] = [];
	const videoIds: string[] = [];

	for (const file of files) {
		const imageMatch = IMAGE_PREVIEW_PATH.exec(file.thumbnailPath);
		if (imageMatch) {
			imageIds.push(imageMatch[1]);
			continue;
		}

		const videoMatch = VIDEO_PREVIEW_PATH.exec(file.thumbnailPath);
		if (videoMatch) videoIds.push(videoMatch[1]);
	}

	const [imageRows, videoRows] = await Promise.all([
		imageIds.length > 0
			? db.select({ id: images.id, thumbnail: images.thumbnail }).from(images).where(inArray(images.id, imageIds))
			: Promise.resolve([]),
		videoIds.length > 0
			? db.select({ id: videos.id, thumbnail: videos.thumbnail }).from(videos).where(inArray(videos.id, videoIds))
			: Promise.resolve([]),
	]);

	const embeddedById = new Map<string, EmbeddedThumbnail>();
	for (const image of imageRows) {
		const thumbnail = toEmbeddedFolderPreviewThumbnail(image.thumbnail);
		if (thumbnail) embeddedById.set(image.id, thumbnail);
	}
	for (const video of videoRows) {
		const thumbnail = toEmbeddedFolderPreviewThumbnail(video.thumbnail);
		if (thumbnail) embeddedById.set(video.id, thumbnail);
	}

	let embeddedBytes = 0;
	return files.map((file) => {
		const thumbnail = embeddedById.get(file.id);
		if (!thumbnail || embeddedBytes + thumbnail.byteLength > MAX_TOTAL_EMBEDDED_PREVIEW_BYTES) return file;
		embeddedBytes += thumbnail.byteLength;
		return { ...file, thumbnailDataUrl: thumbnail.dataUrl };
	});
}
