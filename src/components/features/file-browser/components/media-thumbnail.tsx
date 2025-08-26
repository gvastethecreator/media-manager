import React from 'react';
import { generateAdvancedImageThumbnail, generateAdvancedVideoThumbnail } from '@/config/thumbnail-generators';
import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import { useSettings } from '@/lib/contexts';
import { cn } from '@/lib/utils';

// Tipo unificado utilizado por las vistas del FileBrowser
export type MediaItem = {
	id: string;
	name: string;
	entityType: 'image' | 'video' | 'audio' | 'document' | 'json' | 'file3d';
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

// Cache simple en memoria de frames de video por id
const videoFramesCache = new Map<string, string[]>();

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

	// Animación de preview para video al hover
	React.useEffect(() => {
		if (!isVideo) return;
		if (!allowVideoAnimation) return;

		if (!hovered) {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
			frameIndexRef.current = 0;
			return;
		}

		const cacheKey = item.id;
		const cached = videoFramesCache.get(cacheKey);
		if (cached?.length) {
			framesRef.current = cached;
			startAnimation();
			return;
		}

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
				videoFramesCache.set(cacheKey, urls);
				framesRef.current = urls;
				startAnimation();
			} catch {
				// Mantener poster estático si falla
			}
		})();

		function startAnimation() {
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
		}

		return () => {
			alive = false;
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
			if (abortRef.current) abortRef.current.abort();
			abortRef.current = null;
		};
	}, [hovered, isVideo, allowVideoAnimation, item, videoFramesCount, videoCycleDurationMs]);

	const baseClass = cn('block h-full w-full', className);
	const baseStyle: React.CSSProperties = React.useMemo(() => ({ objectFit: 'cover', ...style }), [style]);
	const validSrc = src || item.thumbnailUrl;

	// Extraer extensión del archivo para badge
	const getFileExtension = (filename: string): string => {
		const ext = filename.split('.').pop()?.toUpperCase();
		return ext || '';
	};

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

	// Videos: renderizar con badge de extensión
	if (isVideo) {
		const extension = getFileExtension(item.name);
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
				{/* Badge de extensión para videos */}
				{extension && (
					<div className="absolute right-1 bottom-1 rounded bg-black/70 px-1.5 py-0.5 font-medium text-white text-xs backdrop-blur-sm">
						{extension}
					</div>
				)}
			</div>
		);
	}

	// Otros tipos de archivo (imágenes, etc.)
	return (
		<img
			alt={item.name}
			className={baseClass}
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
	);
}

function getFallbackIcon(entityType: MediaItem['entityType']): string {
	switch (entityType) {
		case 'audio':
			return '/file.svg';
		case 'document':
			return '/file.svg';
		case 'json':
			return '/file.svg';
		case 'file3d':
			return '/file.svg';
		default:
			return '/file.svg';
	}
}
