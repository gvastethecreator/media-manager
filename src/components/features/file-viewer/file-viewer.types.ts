/**
 * 🎬 FILE VIEWER - TIPOS Y CONSTANTES
 *
 * Tipos e interfaces extraídos del file-viewer.tsx
 */

export interface ImageItem {
	id: string;
	name: string;
	type: string;
	path: string;
	size: number;
	width: number | null;
	height: number | null;
	url?: string;
	thumbnail: string | null;
	thumbnailUrl?: string;
	src?: string;
	alt?: string;
	mimeType?: string;
	metadata: string | null;
	parsedMetadata?: {
		dimensions?: {
			width: number;
			height: number;
		};
		mimeType?: string;
		isLocal?: boolean;
	};
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
