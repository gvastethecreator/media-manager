/**
 * @file Tipos base para la entidad Image.
 * @module types/entities/image/base
 * @description Define los tipos canónicos para la entidad Image, siguiendo el nuevo patrón de `...WithStats`.
 */

/**
 * 🖼️ Tipo base de Image directamente desde el schema de Drizzle.
 */
export type ImageBase = {
    id: string;
    name: string;
    description: string | null;
    path: string;
    hash: string;
    size: number;
    width: number;
    height: number;
    metadata: string | null;
    thumbnail: string | null;
    thumbnailSize: number | null;
    thumbnailWidth: number | null;
    thumbnailHeight: number | null;
    thumbnailMimeType: string | null;
    thumbnailError: string | null;
    thumbnailErrorAt: Date | null;
    thumbnailOptimizedAt: Date | null;
    isFavorite: boolean;
    folderId: string;
    noteId: string | null;
    createdAt: Date;
    updatedAt: Date;
    addedAt: Date;
};

/**
 * 📊 Estadísticas base de una imagen, directamente desde el esquema de Drizzle.
 */
export interface ImageStatsBase {
	id: string;
	imageId: string;
	views: number;
	downloads: number;
	likes: number;
	comments: number;
	updatedAt: Date;
}

/**
 * 🟢 Datos mínimos requeridos para crear una imagen
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
 * 🟡 Datos para actualizar una imagen
 */
export interface UpdateImageData {
	name?: string;
	description?: string;
	presetId?: string | null;
	isFavorite?: boolean;
}

/**
 * 📋 Resumen básico de una imagen para listados
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
 * 🧩 Estructura de metadatos de una imagen
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
 * 🤖 Estructura de metadatos de IA para imágenes generadas
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
