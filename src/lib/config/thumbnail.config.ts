import { z } from 'zod';

/**
 * Enumeración de calidades de thumbnail.
 * Esta es la definición canónica que debe usarse en toda la aplicación.
 */
export enum ThumbnailQuality {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
}

/**
 * Interfaz para la configuración de calidad de thumbnails
 */
export interface ThumbnailQualityConfig {
	/** Alto máximo del thumbnail en píxeles */
	height: number;
	/** Descripción legible para la interfaz de usuario */
	label: string;
	/** Calidad de compresión (1-100) */
	quality: number;
	/** Ancho máximo del thumbnail en píxeles */
	width: number;
}

/**
 * Configuración de calidades de thumbnail.
 * Esta es la única fuente de configuración que debe usarse en toda la aplicación.
 */
export const THUMBNAIL_QUALITY_CONFIG: Record<ThumbnailQuality, ThumbnailQualityConfig> = {
	[ThumbnailQuality.LOW]: {
		width: 200,
		height: 200,
		quality: 60,
		label: 'Baja',
	},
	[ThumbnailQuality.MEDIUM]: {
		width: 400,
		height: 400,
		quality: 75,
		label: 'Media',
	},
	[ThumbnailQuality.HIGH]: {
		width: 800,
		height: 800,
		quality: 85,
		label: 'Alta',
	},
};

/**
 * Schema de validación para calidades de thumbnail
 */
export const ThumbnailQualitySchema = z.nativeEnum(ThumbnailQuality);

/**
 * Función auxiliar para validar y normalizar una calidad de thumbnail
 * @param quality La calidad a validar
 * @returns La calidad normalizada (la misma, si es válida, o MEDIUM si no)
 */
export function normalizeQuality(quality: string | undefined): ThumbnailQuality {
	if (!(quality && Object.values(ThumbnailQuality).includes(quality as ThumbnailQuality))) {
		return ThumbnailQuality.MEDIUM;
	}
	return quality as ThumbnailQuality;
}
