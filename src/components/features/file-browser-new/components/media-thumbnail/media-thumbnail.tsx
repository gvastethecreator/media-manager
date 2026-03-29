/**
 * @file Componente MediaThumbnail para renderizar thumbnails de media
 * @module file-browser-new/components/media-thumbnail
 *
 * Componente optimizado para mostrar thumbnails de diferentes tipos de media
 * con soporte para animación de video en hover, lazy loading y viewport gating.
 */

import React from 'react';
import {
	generate3DModelThumbnail,
	generateAdvancedImageThumbnail,
	generateAdvancedVideoThumbnail,
	generateAudioWaveform,
	generateJsonPreview,
} from '@/config/thumbnail-generators';
import { useInViewport, useVideoViewport } from '@/hooks/use-in-viewport';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { useSettings } from '@/lib/contexts';
import { cn } from '@/lib/utils';
import type { MediaItem, MediaThumbnailProps } from './types';
import './styles.css';

// Cache simple en memoria de frames de video por id con límite de tamaño
const videoFramesCache = new Map<string, string[]>();
const MAX_CACHE_SIZE = 50;

function cleanupCache() {
	if (videoFramesCache.size > MAX_CACHE_SIZE) {
		const keysToDelete = Array.from(videoFramesCache.keys()).slice(0, 10);
		for (const key of keysToDelete) {
			videoFramesCache.delete(key);
		}
	}
}

// Cache de thumbnails estáticos
const thumbnailCache = new Map<string, string>();
const MAX_THUMB_CACHE = 1000;

function cleanupThumbCache() {
	if (thumbnailCache.size > MAX_THUMB_CACHE) {
		const keysToDelete = Array.from(thumbnailCache.keys()).slice(0, 50);
		for (const k of keysToDelete) thumbnailCache.delete(k);
	}
}

function cacheKeyFor(
	item: MediaItem,
	kind: 'image' | 'videoPoster' | 'jsonFile' | 'audio' | 'file3d' | 'other',
	quality: ThumbnailQuality
) {
	return `${kind}:${item.id}:q${quality}`;
}

function MediaThumbnailInner({
	item,
	quality = ThumbnailQuality.MEDIUM,
	animateVideoOnHover = true,
	videoFramesCount = 8,
	videoCycleDurationMs = 800,
	className,
	style,
	preloadMargin,
	lockAspectRatio,
	predictedAspectRatio,
	...imgProps
}: MediaThumbnailProps) {
	const { settings } = useSettings();
	const allowVideoAnimation = Boolean(settings?.videoThumbnailAnimation) && animateVideoOnHover;
	const isVideo = item.entityType === 'video';

	const [src, setSrc] = React.useState<string>('');
	const [error, setError] = React.useState<string | null>(null);
	const [hovered, setHovered] = React.useState(false);
	const [hasPlayedInitialAnimation, setHasPlayedInitialAnimation] = React.useState(false);
	const [isLoaded, setIsLoaded] = React.useState(false);

	const rafRef = React.useRef<number | null>(null);
	const abortRef = React.useRef<AbortController | null>(null);
	const framesRef = React.useRef<string[] | null>(null);
	const frameIndexRef = React.useRef(0);

	const animateFramesOnce = React.useCallback(
		(frames: string[]) => {
			if (!frames.length) return;

			let currentFrame = 0;
			const totalFrames = frames.length;
			const frameInterval = Math.max(60, Math.floor(videoCycleDurationMs / totalFrames));

			const animateOnce = () => {
				if (currentFrame < totalFrames) {
					setSrc(frames[currentFrame]);
					currentFrame++;
					setTimeout(animateOnce, frameInterval);
				} else {
					setSrc(frames[0]);
				}
			};

			animateOnce();
		},
		[videoCycleDurationMs]
	);

	const playInitialAnimation = React.useCallback(async () => {
		if (hasPlayedInitialAnimation || !isVideo || !allowVideoAnimation) return;

		const cacheKey = item.id;
		let frames = videoFramesCache.get(cacheKey);

		if (!frames?.length) {
			const controller = new AbortController();
			abortRef.current = controller;

			try {
				const count = Math.max(1, videoFramesCount);
				const offsets = Array.from({ length: count }, (_, i) => i / count);
				const urls: string[] = [];

				for (const t of offsets) {
					if (controller.signal.aborted) return;
					const u = await generateAdvancedVideoThumbnail(item as any, { timeOffset: t });
					urls.push(u);
				}

				if (controller.signal.aborted) return;

				cleanupCache();
				videoFramesCache.set(cacheKey, urls);
				frames = urls;
			} catch {
				return;
			}
		}

		framesRef.current = frames;
		setHasPlayedInitialAnimation(true);
		animateFramesOnce(frames);
	}, [hasPlayedInitialAnimation, isVideo, allowVideoAnimation, item, videoFramesCount, animateFramesOnce]);

	const startContinuousAnimation = React.useCallback(() => {
		const frames = framesRef.current;
		if (!frames || frames.length === 0) return;

		const perFrame = Math.max(60, Math.floor(videoCycleDurationMs / frames.length));
		let last = performance.now();

		const tick = (now: number) => {
			if (!framesRef.current) return;
			if (!hovered) return;

			const delta = now - last;
			if (delta >= perFrame) {
				last = now;
				frameIndexRef.current = (frameIndexRef.current + 1) % frames.length;
				setSrc(frames[frameIndexRef.current]);
			}
			rafRef.current = requestAnimationFrame(tick);
		};

		if (rafRef.current) cancelAnimationFrame(rafRef.current);
		rafRef.current = requestAnimationFrame(tick);
	}, [hovered, videoCycleDurationMs]);

	const viewportHook = useVideoViewport(isVideo && allowVideoAnimation ? playInitialAnimation : undefined);
	const baseViewport = useInViewport({ rootMargin: preloadMargin ?? '200px', threshold: 0.01, once: true });

	const isGif = React.useMemo(() => {
		const n = (item.name || '').toLowerCase();
		const mt = (item.mimeType || '').toLowerCase();
		return n.endsWith('.gif') || mt.includes('gif');
	}, [item.name, item.mimeType]);

	// Resolver thumbnail base cuando entra a viewport
	React.useEffect(() => {
		if (!(baseViewport.inViewport || baseViewport.hasBeenInViewport)) {
			return;
		}
		let alive = true;
		setError(null);
		(async () => {
			try {
				let url = '';
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
					if (alive) setSrc(url || item.thumbnailUrl || '');
				} else if (item.entityType === 'video') {
					const key = cacheKeyFor(item, 'videoPoster', quality);
					url = thumbnailCache.get(key) || '';
					if (!url) {
						url = await generateAdvancedVideoThumbnail(item as any, { timeOffset: 0 });
						if (url) {
							cleanupThumbCache();
							thumbnailCache.set(key, url);
						}
					}
					if (alive) setSrc(url || item.thumbnailUrl || '');
				} else if (item.entityType === 'jsonFile') {
					const key = cacheKeyFor(item, 'jsonFile', quality);
					url = thumbnailCache.get(key) || '';
					if (!url) {
						url = await generateJsonPreview(item as any);
						if (url) {
							cleanupThumbCache();
							thumbnailCache.set(key, url);
						}
					}
					if (alive) setSrc(url || getFallbackIcon(item.entityType));
				} else if (item.entityType === 'file3d') {
					const key = cacheKeyFor(item, 'file3d', quality);
					url = thumbnailCache.get(key) || '';
					if (!url) {
						url = await generate3DModelThumbnail(item as any);
						if (url) {
							cleanupThumbCache();
							thumbnailCache.set(key, url);
						}
					}
					if (alive) setSrc(url || getFallbackIcon(item.entityType));
				} else if (item.entityType === 'audio') {
					const key = cacheKeyFor(item, 'audio', quality);
					url = thumbnailCache.get(key) || '';
					if (!url) {
						url = await generateAudioWaveform(item as any);
						if (url) {
							cleanupThumbCache();
							thumbnailCache.set(key, url);
						}
					}
					if (alive) setSrc(url || getFallbackIcon(item.entityType));
				} else if (item.entityType === 'folder') {
					let folderThumbnail = item.thumbnailUrl;
					if (!folderThumbnail) {
						folderThumbnail = `/api/folders/${item.id}/preview?max=4&layout=grid&v=${encodeURIComponent(String(item.createdAt ?? item.totalItems ?? '1'))}`;
					}
					if (alive) setSrc(folderThumbnail);
				} else {
					const fallback = getFallbackIcon(item.entityType);
					if (alive) setSrc(fallback);
				}
			} catch (e) {
				if (alive) setError(e instanceof Error ? e.message : 'Error generando thumbnail');
			}
		})();
		return () => {
			alive = false;
		};
	}, [item, quality, baseViewport.inViewport, baseViewport.hasBeenInViewport]);

	// Animación de preview para video al hover
	React.useEffect(() => {
		const shouldAnimate = isVideo && allowVideoAnimation && hovered;
		if (!shouldAnimate) {
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			frameIndexRef.current = 0;
			return;
		}

		const cacheKey = item.id;
		const cached = videoFramesCache.get(cacheKey);

		if (cached?.length) {
			framesRef.current = cached;
			startContinuousAnimation();
			return;
		}

		if (!hasPlayedInitialAnimation) {
			const controller = new AbortController();
			abortRef.current = controller;
			let alive = true;

			const count = Math.max(1, videoFramesCount);
			const offsets = Array.from({ length: count }, (_, i) => i / count);

			(async () => {
				try {
					const urls: string[] = [];
					for (const t of offsets) {
						if (!alive || controller.signal.aborted) return;
						const u = await generateAdvancedVideoThumbnail(item as any, { timeOffset: t });
						urls.push(u);
					}
					if (!alive || controller.signal.aborted) return;

					cleanupCache();
					videoFramesCache.set(cacheKey, urls);
					framesRef.current = urls;
					startContinuousAnimation();
				} catch {
					// Mantener poster estático si falla
				}
			})();
			return () => {
				alive = false;
				if (rafRef.current) cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
				if (abortRef.current) abortRef.current.abort();
				abortRef.current = null;
			};
		}
	}, [
		hovered,
		isVideo,
		allowVideoAnimation,
		item,
		videoFramesCount,
		hasPlayedInitialAnimation,
		startContinuousAnimation,
	]);

	const baseClass = cn('media-thumbnail-container block h-full w-full', className);

	const aspectStyle = React.useMemo(() => {
		if (!lockAspectRatio) return {} as React.CSSProperties;
		const w = item.width;
		const h = item.height;
		if (w && h && w > 0 && h > 0) {
			return { aspectRatio: `${w} / ${h}` } as React.CSSProperties;
		}
		if (predictedAspectRatio && predictedAspectRatio > 0) {
			return { aspectRatio: `${predictedAspectRatio} / 1` } as React.CSSProperties;
		}
		return {} as React.CSSProperties;
	}, [lockAspectRatio, item.width, item.height, predictedAspectRatio]);

	const baseStyle: React.CSSProperties = React.useMemo(() => {
		const sizing: React.CSSProperties = lockAspectRatio ? { width: '100%', height: 'auto' } : {};
		return { objectFit: 'cover', ...aspectStyle, ...sizing, ...style };
	}, [style, aspectStyle, lockAspectRatio]);

	const validSrc = src || item.thumbnailUrl;
	const imgClassName = cn('media-thumbnail-img', isLoaded && 'is-loaded');

	React.useEffect(() => {
		setIsLoaded(false);
	}, []);

	React.useEffect(() => {
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
			if (abortRef.current) abortRef.current.abort();
			abortRef.current = null;
		};
	}, []);

	const setCombinedRef = React.useCallback(
		(el: HTMLDivElement | null) => {
			(viewportHook.ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
			(baseViewport.ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
		},
		[viewportHook.ref, baseViewport.ref]
	);

	if (error) {
		return (
			<div className={cn(baseClass, 'flex items-center justify-center bg-muted text-muted-foreground text-xs')}>
				Error
			</div>
		);
	}

	if (!isVideo && isGif && validSrc) {
		return (
			<img
				alt={item.name}
				className={cn(baseClass, imgClassName)}
				loading="lazy"
				onLoad={() => setIsLoaded(true)}
				src={validSrc}
				style={baseStyle}
				{...imgProps}
			/>
		);
	}

	if (!validSrc) {
		return (
			<div
				className={cn(baseClass, 'flex items-center justify-center bg-muted text-muted-foreground')}
				ref={baseViewport.ref}
				style={baseStyle}
			>
				<div className="text-xs">Sin thumbnail</div>
			</div>
		);
	}

	if (isVideo) {
		const badgeInfo = getBadgeInfo(item.entityType);
		const badgeClasses = getBadgeClasses(imgProps.width as number, imgProps.height as number);

		return (
			<div
				className={cn(baseClass, 'media-thumbnail-video relative')}
				ref={setCombinedRef}
				style={{ ...aspectStyle, ...style }}
			>
				<img
					alt={item.name}
					className={cn('h-full w-full', imgClassName)}
					loading="lazy"
					onBlur={() => setHovered(false)}
					onFocus={() => setHovered(true)}
					onLoad={() => setIsLoaded(true)}
					onMouseEnter={() => setHovered(true)}
					onMouseLeave={() => setHovered(false)}
					src={validSrc}
					style={baseStyle}
					{...imgProps}
				/>
				{badgeInfo && (
					<div
						className={cn(badgeClasses.container, 'media-thumbnail-badge')}
						style={{ backgroundColor: `color-mix(in oklch, ${badgeInfo.color} 85%, transparent)` }}
						title={badgeInfo.title}
					>
						<span className={badgeClasses.text}>{badgeInfo.text}</span>
					</div>
				)}
			</div>
		);
	}

	const badgeInfo = getBadgeInfo(item.entityType);
	const badgeClasses = getBadgeClasses(imgProps.width as number, imgProps.height as number);

	return (
		<div className={cn(baseClass, 'relative')} ref={baseViewport.ref} style={{ ...aspectStyle, ...style }}>
			<img
				alt={item.name}
				className={cn('h-full w-full', imgClassName)}
				loading="lazy"
				onBlur={() => setHovered(false)}
				onFocus={() => setHovered(true)}
				onLoad={() => setIsLoaded(true)}
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
				src={validSrc}
				style={baseStyle}
				{...imgProps}
			/>
			{badgeInfo && (
				<div
					className={cn(badgeClasses.container, 'media-thumbnail-badge')}
					style={{ backgroundColor: `color-mix(in oklch, ${badgeInfo.color} 85%, transparent)` }}
					title={badgeInfo.title}
				>
					<span className={badgeClasses.text}>{badgeInfo.text}</span>
				</div>
			)}
		</div>
	);
}

export const MediaThumbnail = React.memo(MediaThumbnailInner, (prev, next) => {
	const a = prev.item;
	const b = next.item;
	return (
		a.id === b.id &&
		a.entityType === b.entityType &&
		(a.thumbnailUrl || '') === (b.thumbnailUrl || '') &&
		(a.mimeType || '') === (b.mimeType || '') &&
		(a.name || '') === (b.name || '') &&
		prev.quality === next.quality &&
		prev.className === next.className &&
		JSON.stringify(prev.style) === JSON.stringify(next.style) &&
		prev.animateVideoOnHover === next.animateVideoOnHover &&
		prev.videoFramesCount === next.videoFramesCount &&
		prev.videoCycleDurationMs === next.videoCycleDurationMs &&
		prev.preloadMargin === next.preloadMargin
	);
});

function getFallbackIcon(entityType: MediaItem['entityType']): string {
	switch (entityType) {
		case 'folder':
			return '/globe.svg';
		default:
			return '/file.svg';
	}
}

function getBadgeInfo(entityType: MediaItem['entityType']) {
	switch (entityType) {
		case 'folder':
			return { text: 'DIR', color: 'var(--entity-folder)', title: 'Folder' };
		case 'video':
			return { text: 'VID', color: 'var(--entity-video)', title: 'Video File' };
		case 'audio':
			return { text: 'AUD', color: 'var(--entity-audio)', title: 'Audio File' };
		case 'document':
			return { text: 'PDF', color: 'var(--entity-document)', title: 'Document File' };
		case 'jsonFile':
			return { text: 'JSON', color: 'var(--entity-json)', title: 'JSON File' };
		case 'file3d':
			return { text: '3D', color: 'var(--entity-file-3d)', title: '3D Model' };
		default:
			return null;
	}
}

function getBadgeClasses(width?: number, height?: number) {
	const minDimension = Math.min(width || 150, height || 150);

	if (minDimension <= 30) {
		return {
			container:
				'absolute right-0 bottom-0 rounded px-0.5 py-0 font-bold text-foreground text-[7px] backdrop-blur-sm leading-none min-w-0',
			text: 'truncate',
		};
	}
	if (minDimension <= 100) {
		return {
			container:
				'absolute right-1 bottom-1 rounded px-1 py-0.5 font-medium text-foreground text-[9px] backdrop-blur-sm',
			text: '',
		};
	}
	return {
		container: 'absolute right-1 bottom-1 rounded px-1.5 py-0.5 font-medium text-foreground text-xs backdrop-blur-sm',
		text: '',
	};
}
