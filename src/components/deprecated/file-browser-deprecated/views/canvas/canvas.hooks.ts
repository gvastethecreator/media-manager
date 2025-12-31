/**
 * @file canvas.hooks.ts
 * @module components/file-browser/canvas/hooks
 * @description Hooks personalizados para FileCanvas
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from '@/hooks/useThrottle';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import type { MediaItem } from '../../components/media-thumbnail';
import type { Viewport } from './canvas.types';
import { computeOffsetTop } from './canvas.utils';
import { generateThumbnailUrl, getFallbackIcon, useImageCache } from './canvas-common';

/**
 * Hook para prefetch de thumbnails con debouncing y cancelación
 */
export function useThumbnailPrefetch() {
	const { load, get, set } = useImageCache();
	const abortControllerRef = useRef<AbortController | null>(null);

	const prefetch = useCallback(
		async (startIndex: number, endIndex: number, items: MediaItem[]) => {
			// Cancelar requests anteriores
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			abortControllerRef.current = new AbortController();
			const signal = abortControllerRef.current.signal;

			try {
				for (let i = startIndex; i <= endIndex; i++) {
					if (signal.aborted) break;

					const it = items[i];
					if (!it) continue;
					const key = it.id;

					if (get(key)) continue;

					try {
						// Caso especial para carpetas
						if (it.entityType === 'folder') {
							const previewUrl = `/api/folders/${it.id}/preview`;
							if (signal.aborted) break;
							await load(key, previewUrl);
							continue;
						}

						const src = await generateThumbnailUrl(it, ThumbnailQuality.MEDIUM);
						if (signal.aborted) break;

						if (src && !src.startsWith('🎵') && !src.startsWith('🖼️') && !src.startsWith('🎥')) {
							load(key, src);
						} else {
							set(key, { status: 'ready', fallbackIcon: src });
						}
					} catch (error) {
						if (signal.aborted) break;
						const fallback = getFallbackIcon(it.entityType);
						set(key, { status: 'ready', fallbackIcon: fallback });
					}
				}
			} catch (error: unknown) {
				if (error instanceof Error && error.name !== 'AbortError') {
					console.warn('Error en prefetch de thumbnails:', error);
				}
			}
		},
		[load, get, set]
	);

	const debouncedPrefetch = useDebounce(prefetch, 200);

	return debouncedPrefetch;
}

/**
 * Hook para observar viewport (tamaño y scroll)
 */
export function useViewportObserver(
	containerRef: React.RefObject<HTMLDivElement>,
	scrollContainer: HTMLElement | null
) {
	const [viewport, setViewport] = useState<Viewport>({
		width: 0,
		height: 0,
		scrollTop: 0,
		scrollLeft: 0,
		offsetTop: 0,
	});

	useEffect(() => {
		const internal = containerRef.current;
		if (!internal) return;

		let host: HTMLElement | null = null;

		if (scrollContainer) {
			host = scrollContainer;
		} else {
			const computedStyle = window.getComputedStyle(internal);
			if (computedStyle.overflow === 'auto' || computedStyle.overflowY === 'auto') {
				host = internal;
			} else {
				let parent = internal.parentElement;
				while (parent) {
					const style = window.getComputedStyle(parent);
					if (style.overflow === 'auto' || style.overflowY === 'auto') {
						host = parent;
						break;
					}
					parent = parent.parentElement;
				}
				host = host || internal;
			}
		}

		if (!host) return;

		let rafId: number | null = null;
		const onScroll = () => {
			if (!host) return;
			if (rafId != null) return;
			rafId = requestAnimationFrame(() => {
				rafId = null;
				setViewport((v) => ({
					...v,
					scrollTop: host.scrollTop,
					scrollLeft: host.scrollLeft,
					offsetTop: scrollContainer ? computeOffsetTop(host, internal) : 0,
				}));
			});
		};

		host.addEventListener('scroll', onScroll, { passive: true });

		const ro = new ResizeObserver(() => {
			if (!host) return;
			if (rafId != null) return;
			rafId = requestAnimationFrame(() => {
				rafId = null;
				setViewport((v) => ({
					...v,
					width: Math.floor(host.clientWidth),
					height: Math.floor(host.clientHeight),
					offsetTop: scrollContainer ? computeOffsetTop(host, internal) : 0,
				}));
			});
		});
		ro.observe(host);
		ro.observe(internal);

		// Init values
		const initialViewport = {
			width: host.clientWidth,
			height: host.clientHeight,
			scrollTop: host.scrollTop,
			scrollLeft: host.scrollLeft,
			offsetTop: scrollContainer ? computeOffsetTop(host, internal) : 0,
		};

		console.log('🚀 FileCanvas initial viewport:', initialViewport);
		setViewport(initialViewport);

		return () => {
			ro.disconnect();
			host.removeEventListener('scroll', onScroll);
			if (rafId != null) cancelAnimationFrame(rafId);
		};
	}, [scrollContainer, containerRef]);

	return viewport;
}
