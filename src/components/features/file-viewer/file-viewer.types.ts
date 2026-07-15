/**
 * 🎬 FILE VIEWER - TIPOS Y CONSTANTES
 *
 * Tipos e interfaces extraídos del file-viewer.tsx
 */

export interface ImageItem {
	alt?: string;
	height: number | null;
	id: string;
	metadata: string | null;
	mimeType?: string;
	name: string;
	parsedMetadata?: {
		dimensions?: {
			width: number;
			height: number;
		};
		mimeType?: string;
		isLocal?: boolean;
	};
	size: number;
	src?: string;
	thumbnail: string | null;
	thumbnailUrl?: string;
	type: string;
	url?: string;
	width: number | null;
}

export interface PaneState {
	scale: number;
	x: number;
	y: number;
}

// 📊 Constantes de configuración
export const THUMBNAIL_ANIMATION = {
	duration: 0.2,
} as const;

export const THUMBNAIL_SIZES = {
	normal: { width: 56, height: 56 },
	active: { width: 64, height: 64 },
} as const;

// 🎯 Función auxiliar memoizada
export const isValidSrc = (src: string | null): src is string => {
	return Boolean(src) && typeof src === 'string' && src.trim() !== '';
};
