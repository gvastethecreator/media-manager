import { useRef } from 'react';
import {
	generate3DModelThumbnail,
	generateAdvancedImageThumbnail,
	generateAdvancedVideoThumbnail,
	generateAudioWaveform,
	generateJsonPreview,
} from '@/config/thumbnail-generators';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import type { MediaItem } from '../components/media-thumbnail';

export type CacheEntry = {
	status: 'loading' | 'ready' | 'error';
	image?: ImageBitmap | HTMLImageElement;
	fallbackIcon?: string;
	/** Momento en el que la entrada pasó a 'ready' para animación de fade-in */
	readyAt?: number;
};

export function useImageCache() {
	const cache = useRef<Map<string, CacheEntry>>(new Map());
	const pending = useRef<Map<string, Promise<void>>>(new Map());

	const load = (key: string, src: string) => {
		if (!key) return;
		if (!src) return;
		if (cache.current.has(key) || pending.current.has(key)) return;

		cache.current.set(key, { status: 'loading' });

		const p = (async () => {
			try {
				const imgEl = new Image();
				imgEl.decoding = 'async';
				imgEl.loading = 'eager';
				imgEl.crossOrigin = 'anonymous';
				imgEl.src = src;
				await new Promise((resolve, reject) => {
					imgEl.onload = resolve;
					imgEl.onerror = reject;
					setTimeout(() => reject(new Error('Timeout')), 10_000);
				});
				let bmp: ImageBitmap | HTMLImageElement;
				if ('createImageBitmap' in window) {
					try {
						bmp = await createImageBitmap(imgEl);
					} catch {
						bmp = imgEl;
					}
				} else {
					bmp = imgEl;
				}
				cache.current.set(key, { status: 'ready', image: bmp, readyAt: performance.now() });
			} catch {
				cache.current.set(key, { status: 'error' });
			} finally {
				pending.current.delete(key);
			}
		})();

		pending.current.set(key, p);
	};

	const get = (key: string) => cache.current.get(key);
	const set = (key: string, entry: CacheEntry) => {
		// Asegurar timestamp para animación cuando se marca como listo
		if (entry.status === 'ready' && entry.readyAt == null) {
			entry.readyAt = performance.now();
		}
		return cache.current.set(key, entry);
	};

	return { load, get, set } as const;
}

const thumbnailCache = new Map<string, string>();
const CACHE_MAX_SIZE = 200;

const cacheKeyFor = (item: MediaItem, type: string, quality: ThumbnailQuality) =>
	`${item.id || item.name}-${type}-${quality}`;

export const getFallbackIcon = (entityType: string) => {
	switch (entityType) {
		case 'image':
			return '🖼️';
		case 'video':
			return '🎥';
		case 'audio':
			return '🎵';
		case 'document':
			return '📄';
		case 'jsonFile':
			return '📋';
		case 'file3d':
			return '🎲';
		default:
			return '📁';
	}
};

const cleanupThumbCache = () => {
	if (thumbnailCache.size > CACHE_MAX_SIZE) {
		const entries = Array.from(thumbnailCache.entries());
		const toDelete = entries.slice(0, Math.floor(CACHE_MAX_SIZE * 0.3));
		for (const [key] of toDelete) {
			thumbnailCache.delete(key);
		}
	}
};

export const generateThumbnailUrl = async (
	item: MediaItem,
	quality: ThumbnailQuality = ThumbnailQuality.MEDIUM
): Promise<string> => {
	let url = '';
	try {
		if (item.entityType === 'image') {
			const key = cacheKeyFor(item, 'image', quality);
			url = thumbnailCache.get(key) || '';
			if (!url) {
				url = await generateAdvancedImageThumbnail(item as any);
				if (url) {
					cleanupThumbCache();
					thumbnailCache.set(key, url);
				}
			}
			return url || item.thumbnailUrl || getFallbackIcon(item.entityType);
		}
		if (item.entityType === 'video') {
			const key = cacheKeyFor(item, 'videoPoster', quality);
			url = thumbnailCache.get(key) || '';
			if (!url) {
				url = await generateAdvancedVideoThumbnail(item as any, { timeOffset: 0 });
				if (url) {
					cleanupThumbCache();
					thumbnailCache.set(key, url);
				}
			}
			return url || item.thumbnailUrl || getFallbackIcon(item.entityType);
		}
		if (item.entityType === 'jsonFile') {
			const key = cacheKeyFor(item, 'json', quality);
			url = thumbnailCache.get(key) || '';
			if (!url) {
				url = await generateJsonPreview(item as any);
				if (url) {
					cleanupThumbCache();
					thumbnailCache.set(key, url);
				}
			}
			return url || getFallbackIcon(item.entityType);
		}
		if (item.entityType === 'file3d') {
			const key = cacheKeyFor(item, 'file3d', quality);
			url = thumbnailCache.get(key) || '';
			if (!url) {
				url = await generate3DModelThumbnail(item as any);
				if (url) {
					cleanupThumbCache();
					thumbnailCache.set(key, url);
				}
			}
			return url || getFallbackIcon(item.entityType);
		}
		if (item.entityType === 'audio') {
			const key = cacheKeyFor(item, 'audio', quality);
			url = thumbnailCache.get(key) || '';
			if (!url) {
				url = await generateAudioWaveform(item as any);
				if (url) {
					cleanupThumbCache();
					thumbnailCache.set(key, url);
				}
			}
			return url || getFallbackIcon(item.entityType);
		}
		return getFallbackIcon(item.entityType);
	} catch (error) {
		console.error('Error generating thumbnail:', error);
		return getFallbackIcon(item.entityType);
	}
};
