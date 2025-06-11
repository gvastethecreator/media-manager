/**
 * 🔄 Tipo base para Image (tipos canónicos sin dependencias de Prisma)
 */
export interface ImageBase {
	id: string;
	name: string;
	description?: string | null;
	path: string;
	hash: string;
	size: number;
	width: number;
	height: number;
	metadata?: string | null;
	isFavorite: boolean;
	isPublic: boolean;
	folderId?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 🎨 Tipo base para configuración visual de Image
 */
export interface ImageVisualConfigBase {
	id: string;
	imageId: string;
	brightness: number;
	contrast: number;
	saturation: number;
	hue: number;
	gamma: number;
	highlights: number;
	shadows: number;
	clarity: number;
	vibrance: number;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 📊 Tipo base para estadísticas de Image
 */
export interface ImageStatsBase {
	id: string;
	imageId: string;
	viewCount: number;
	favoriteCount: number;
	shareCount: number;
	downloadCount: number;
	lastViewedAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Datos mínimos requeridos para crear una imagen
 */
export interface CreateImageData {
	name: string;
	path: string;
	folderId: string;
	hash: string;
	size: number;
	width: number;
	height: number;
	description?: string;
	metadata?: string;
	presetId?: string | null;
}

/**
 * Datos para actualizar una imagen
 */
export interface UpdateImageData {
	name?: string;
	description?: string;
	presetId?: string | null;
	isFavorite?: boolean;
	isPublic?: boolean;
}

/**
 * Resumen básico de una imagen para listados
 */
export interface ImageSummary {
	id: string;
	name: string;
	path: string;
	folderId: string;
	hash: string;
	size: number;
	width: number;
	height: number;
	thumbnailWidth?: number | null;
	thumbnailHeight?: number | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Estructura de metadatos de una imagen
 */
export interface ImageMetadata {
	format?: string;
	exif?: Record<string, unknown>;
	iptc?: Record<string, unknown>;
	xmp?: Record<string, unknown>;
	icc?: Record<string, unknown>;
	ai?: ImageAIMetadata;
}

/**
 * Estructura de metadatos de IA para imágenes generadas
 */
export interface ImageAIMetadata {
	model?: string;
	prompt?: string;
	negativePrompt?: string;
	seed?: number;
	samplingSteps?: number;
	cfgScale?: number;
	samplingMethod?: string;
	extraParameters?: Record<string, unknown>;
}
