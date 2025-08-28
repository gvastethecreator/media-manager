import React from 'react';
import {
	generateAdvancedImageThumbnail,
	generateAdvancedVideoThumbnail,
	generateJsonPreview,
	generate3DModelThumbnail,
	generateAudioWaveform,
} from '@/config/thumbnail-generators';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { useSettings } from '@/lib/contexts';
import { cn } from '@/lib/utils';
import { useVideoViewport } from '@/hooks/use-in-viewport';

// Tipo unificado utilizado por las vistas del FileBrowser
export type MediaItem = {
	id: string;
	name: string;
	entityType: 'image' | 'video' | 'audio' | 'document' | 'jsonFile' | 'file3d';
	mimeType?: string | null;
	thumbnailUrl?: string | null;
	// Metacampos opcionales utilizados por distintas vistas/columnas
	createdAt?: number | string | Date;
	size?: number;
	path?: string;
	width?: number;
	height?: number;
};

interface MediaThumbnailProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	item: MediaItem;
	quality?: ThumbnailQuality;
	animateVideoOnHover?: boolean; // Respeta settings.videoThumbnailAnimation
	videoFramesCount?: number; // por defecto 8
	videoCycleDurationMs?: number; // por defecto 800ms
}

// Cache simple en memoria de frames de video por id con límite de tamaño
const videoFramesCache = new Map<string, string[]>();
const MAX_CACHE_SIZE = 50; // Límite para evitar exceso de memoria

// Función para limpiar el cache cuando excede el límite
function cleanupCache() {
	if (videoFramesCache.size > MAX_CACHE_SIZE) {
		const keysToDelete = Array.from(videoFramesCache.keys()).slice(0, 10);
		for (const key of keysToDelete) {
			videoFramesCache.delete(key);
		}
	}
}

export function MediaThumbnail({
	item,
	quality = ThumbnailQuality.MEDIUM,
	animateVideoOnHover = true,
	videoFramesCount = 8,
	videoCycleDurationMs = 800,
	className,
	style,
	...imgProps
}: MediaThumbnailProps) {
	const { settings } = useSettings();
	const allowVideoAnimation = Boolean(settings?.videoThumbnailAnimation) && animateVideoOnHover;
	const isVideo = item.entityType === 'video';

	const [src, setSrc] = React.useState<string>('');
	const [error, setError] = React.useState<string | null>(null);
	const [hovered, setHovered] = React.useState(false);

	// Estado para animación inicial en viewport
	const [hasPlayedInitialAnimation, setHasPlayedInitialAnimation] = React.useState(false);

	// Función para animar frames una sola vez (inicial)
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
				}
				// Al terminar, volver al frame inicial (poster)
				else {
					setSrc(frames[0]);
				}
			};

			animateOnce();
		},
		[videoCycleDurationMs]
	);

	// Función para cargar y reproducir frames iniciales una sola vez
	const playInitialAnimation = React.useCallback(async () => {
		if (hasPlayedInitialAnimation || !isVideo || !allowVideoAnimation) return;

		const cacheKey = item.id;
		let frames = videoFramesCache.get(cacheKey);

		// Si no están en cache, generarlos
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

				// Cleanup cache antes de agregar nuevos frames
				cleanupCache();
				videoFramesCache.set(cacheKey, urls);
				frames = urls;
			} catch {
				return; // Mantener poster estático si falla
			}
		}

		// Reproducir una sola vez
		framesRef.current = frames;
		setHasPlayedInitialAnimation(true);
		animateFramesOnce(frames);
	}, [hasPlayedInitialAnimation, isVideo, allowVideoAnimation, item, videoFramesCount, animateFramesOnce]);

	// Función para animación continua en hover (refactorizada del código existente)
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

	// Hook para detectar entrada al viewport (solo para videos)
	const viewportHook = useVideoViewport(isVideo && allowVideoAnimation ? playInitialAnimation : undefined);

	// Refs para animación de video
	const rafRef = React.useRef<number | null>(null);
	const abortRef = React.useRef<AbortController | null>(null);
	const framesRef = React.useRef<string[] | null>(null);
	const frameIndexRef = React.useRef(0);

	// Detección simple de GIF por nombre o mime
	const isGif = React.useMemo(() => {
		const n = (item.name || '').toLowerCase();
		const mt = (item.mimeType || '').toLowerCase();
		return n.endsWith('.gif') || mt.includes('gif');
	}, [item.name, item.mimeType]);

	// Resolver thumbnail base (imagen estática o frame inicial de video)
	React.useEffect(() => {
		let alive = true;
		setError(null);
		(async () => {
			try {
				if (item.entityType === 'image') {
					const url = await generateAdvancedImageThumbnail(item as any);
					if (alive) setSrc(url || item.thumbnailUrl || '');
				} else if (item.entityType === 'video') {
					const url = await generateAdvancedVideoThumbnail(item as any, { timeOffset: 0 });
					if (alive) setSrc(url || item.thumbnailUrl || '');
				} else if (item.entityType === 'jsonFile') {
					const url = await generateJsonPreview(item as any);
					if (alive) setSrc(url || getFallbackIcon(item.entityType));
				} else if (item.entityType === 'file3d') {
					const url = await generate3DModelThumbnail(item as any);
					if (alive) setSrc(url || getFallbackIcon(item.entityType));
				} else if (item.entityType === 'audio') {
					const url = await generateAudioWaveform(item as any);
					if (alive) setSrc(url || getFallbackIcon(item.entityType));
				} else {
					// Tipos no soportados por generadores: usar icono genérico según tipo
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
	}, [item]);

	// Animación de preview para video al hover (refactorizada)
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

		// Si no están en cache y no se ha reproducido la animación inicial, generarlos
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

					// Cleanup cache antes de agregar
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

	const baseClass = cn('block h-full w-full', className);
	const baseStyle: React.CSSProperties = React.useMemo(() => ({ objectFit: 'cover', ...style }), [style]);
	const validSrc = src || item.thumbnailUrl;

	if (error) {
		return (
			<div className={cn(baseClass, 'flex items-center justify-center bg-muted text-muted-foreground text-xs')}>
				Error
			</div>
		);
	}

	// GIF: el navegador lo anima de forma nativa
	if (!isVideo && isGif && validSrc) {
		return (
			<img
				alt={item.name}
				className={baseClass}
				draggable={false}
				loading="lazy"
				src={validSrc}
				style={baseStyle}
				{...imgProps}
			/>
		);
	}

	// No renderizar si no hay src válido
	if (!validSrc) {
		return (
			<div className={cn(baseClass, 'flex items-center justify-center bg-muted text-muted-foreground')}>
				<div className="text-xs">Sin thumbnail</div>
			</div>
		);
	}

	// Videos: renderizar con badge VID
	if (isVideo) {
		const badgeInfo = getBadgeInfo(item.entityType);
		const badgeClasses = getBadgeClasses(imgProps.width as number, imgProps.height as number);

		return (
			<div ref={viewportHook.ref} className={cn(baseClass, 'relative')} style={style}>
				<img
					alt={item.name}
					className="h-full w-full"
					draggable={false}
					loading="lazy"
					onBlur={() => setHovered(false)}
					onFocus={() => setHovered(true)}
					onMouseEnter={() => setHovered(true)}
					onMouseLeave={() => setHovered(false)}
					src={validSrc}
					style={baseStyle}
					{...imgProps}
				/>
				{/* Badge VID para videos */}
				{badgeInfo && (
					<div className={cn(badgeClasses.container, badgeInfo.bg)} title={badgeInfo.title}>
						<span className={badgeClasses.text}>{badgeInfo.text}</span>
					</div>
				)}
			</div>
		);
	}

	// Otros tipos de archivo (imágenes, audio, JSON, 3D, etc.)
	const badgeInfo = getBadgeInfo(item.entityType);
	const badgeClasses = getBadgeClasses(imgProps.width as number, imgProps.height as number);

	return (
		<div className={cn(baseClass, 'relative')} style={style}>
			<img
				alt={item.name}
				className="h-full w-full"
				draggable={false}
				loading="lazy"
				onBlur={() => setHovered(false)}
				onFocus={() => setHovered(true)}
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
				src={validSrc}
				style={baseStyle}
				{...imgProps}
			/>
			{/* Badge para tipos especiales con tamaño adaptativo */}
			{badgeInfo && (
				<div className={cn(badgeClasses.container, badgeInfo.bg)} title={badgeInfo.title}>
					<span className={badgeClasses.text}>{badgeInfo.text}</span>
				</div>
			)}
		</div>
	);
}

function getFallbackIcon(entityType: MediaItem['entityType']): string {
	switch (entityType) {
		case 'audio':
			return '/file.svg';
		case 'document':
			return '/file.svg';
		case 'jsonFile':
			return '/file.svg';
		case 'file3d':
			return '/file.svg';
		default:
			return '/file.svg';
	}
}

function getBadgeInfo(entityType: MediaItem['entityType']) {
	switch (entityType) {
		case 'video':
			return { text: 'VID', bg: 'bg-blue-600/90', title: 'Video File' };
		case 'audio':
			return { text: 'AUD', bg: 'bg-orange-600/90', title: 'Audio File' };
		case 'document':
			return { text: 'PDF', bg: 'bg-red-600/90', title: 'Document File' };
		case 'jsonFile':
			return { text: 'JSON', bg: 'bg-green-600/90', title: 'JSON File' };
		case 'file3d':
			return { text: '3D', bg: 'bg-purple-600/90', title: '3D Model' };
		default:
			return null;
	}
}

// Get badge classes based on thumbnail size
function getBadgeClasses(width?: number, height?: number) {
	const minDimension = Math.min(width || 150, height || 150);

	if (minDimension <= 30) {
		// Very small thumbnails (table view ~20px)
		return {
			container:
				'absolute right-0 bottom-0 rounded px-0.5 py-0 font-bold text-white text-[7px] backdrop-blur-sm leading-none min-w-0',
			text: 'truncate',
		};
	} else if (minDimension <= 100) {
		// Medium thumbnails (list view ~90px)
		return {
			container: 'absolute right-1 bottom-1 rounded px-1 py-0.5 font-medium text-white text-[9px] backdrop-blur-sm',
			text: '',
		};
	} else {
		// Large thumbnails (grid, cards, etc.)
		return {
			container: 'absolute right-1 bottom-1 rounded px-1.5 py-0.5 font-medium text-white text-xs backdrop-blur-sm',
			text: '',
		};
	}
}
