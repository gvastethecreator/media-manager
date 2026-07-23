const RASTER_DATA_URL = /^data:image\/(?:avif|bmp|gif|jpe?g|png|webp);base64,[a-z0-9+/]+={0,2}$/i;
const RAW_BASE64 = /^[a-z0-9+/]+={0,2}$/i;
const LOCAL_PREVIEW_ORIGIN = 'http://media-manager-preview.local';
const LOCAL_THUMBNAIL_PATH = /^\/api\/(?:images|videos)\/[A-Za-z0-9_-]+\/thumbnail$/;
const LOCAL_FOLDER_PREVIEW_PATH = /^\/api\/folders\/[A-Za-z0-9_-]+\/preview$/;
const FOLDER_PREVIEW_QUERY_KEYS = new Set(['layout', 'max', 'v', 'width']);
const SAFE_PREVIEW_VERSION = /^[A-Za-z0-9._:-]{1,128}$/;
const MAX_INLINE_PREVIEW_DATA_LENGTH = 1_000_000;

function normalizeLocalPreviewPath(value: string): string | null {
	if (
		!value.startsWith('/api/') ||
		/[\x00-\x1F\x7F\\\s"'`(){};]/.test(value)
	) {
		return null;
	}

	let url: URL;
	try {
		url = new URL(value, LOCAL_PREVIEW_ORIGIN);
	} catch {
		return null;
	}

	if (url.origin !== LOCAL_PREVIEW_ORIGIN || url.hash) {
		return null;
	}

	if (LOCAL_THUMBNAIL_PATH.test(url.pathname)) {
		return url.search ? null : url.pathname;
	}

	if (!LOCAL_FOLDER_PREVIEW_PATH.test(url.pathname)) {
		return null;
	}

	const seen = new Set<string>();
	for (const [key, parameter] of url.searchParams) {
		if (seen.has(key) || !FOLDER_PREVIEW_QUERY_KEYS.has(key)) {
			return null;
		}
		seen.add(key);

		if (key === 'max' && !/^[1-4]$/.test(parameter)) {
			return null;
		}
		if (key === 'layout' && parameter !== 'grid' && parameter !== 'stack') {
			return null;
		}
		if (key === 'v' && !SAFE_PREVIEW_VERSION.test(parameter)) {
			return null;
		}
		if (key === 'width') {
			const width = Number.parseInt(parameter, 10);
			if (!/^[1-9]\d*$/.test(parameter) || width > 2048) return null;
		}
	}

	return `${url.pathname}${url.search}`;
}

export function isSafeLocalMediaThumbnailPath(value: unknown): value is string {
	return typeof value === 'string' && LOCAL_THUMBNAIL_PATH.test(value);
}

export function isSafeInlineRasterPreviewDataUrl(value: unknown): value is string {
	return (
		typeof value === 'string' &&
		value.length <= MAX_INLINE_PREVIEW_DATA_LENGTH &&
		RASTER_DATA_URL.test(value)
	);
}

/**
 * Convierte previews heredados al contrato del browser: datos ráster o media servida por la API local.
 * Las URLs remotas y `blob:` no sobreviven de forma fiable al reiniciar y no deben evitar el broker local.
 */
export function normalizeSafePreviewImageUrl(raw: unknown): string | null {
	if (typeof raw !== 'string') return null;

	const value = raw.trim();
	if (!value) return null;

	const localPath = normalizeLocalPreviewPath(value);
	if (localPath) return localPath;
	if (value.startsWith('/')) return null;

	const compactDataUrl = value.replace(/\s+/g, '');
	if (compactDataUrl.length > MAX_INLINE_PREVIEW_DATA_LENGTH) return null;
	if (isSafeInlineRasterPreviewDataUrl(compactDataUrl)) return compactDataUrl;

	if (!RAW_BASE64.test(compactDataUrl)) return null;

	return `data:image/webp;base64,${compactDataUrl}`;
}
