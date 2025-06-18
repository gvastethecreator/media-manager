/**
 * @file Tipos canónicos para la entidad Video
 * @module types/entities/video/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Video.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';
import { VideoFormat } from './enums';

/**
 * Metadatos del video
 */
export interface VideoMetadata {
	duration: number;
	width: number;
	height: number;
	format: VideoFormat;
	size: number;
	codec?: string;
	bitrate?: number;
	frameRate?: number;
	aspectRatio?: string;
	audioCodec?: string;
	audioChannels?: number;
	audioSampleRate?: number;
	rotation?: number;
	hasAudio?: boolean;
	subtitleLanguages?: string[];
	audioLanguages?: string[];
	creationDate?: Date;
	location?: {
		latitude: number;
		longitude: number;
		name?: string;
	};
	camera?: {
		make?: string;
		model?: string;
		software?: string;
	};
}

/**
 * Tipo base canónico para Video
 */
export interface VideoBase {
	id: string;
	name: string;
	description: string | null;
	path: string;
	hash: string;
	size: number;
	duration: number;
	width: number | null;
	height: number | null;
	metadata: string | null;
	thumbnail: Buffer | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;
	isPublic: boolean;
	isFavorite: boolean;
	folderId: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Relaciones principales (solo ids o any[] para evitar dependencias cruzadas)
 */
export interface VideoRelations {
	albums?: any[];
	collections?: any[];
	tags?: any[];
	characters?: any[];
	places?: any[];
	worldItems?: any[];
	concepts?: any[];
	prompts?: any[];
	notes?: any[];
	wildcards?: any[];
	properties?: any[];
	groups?: any[];
}

/**
 * UI y metadatos adicionales
 */
export interface VideoUI {
	thumbnailUrl?: string;
	isSelected?: boolean;
}

/**
 * Video completo
 */
export interface VideoComplete extends VideoBase, VideoRelations, VideoUI {}

/**
 * Input para creación
 */
export type VideoCreateInput = Omit<VideoBase, 'id' | 'createdAt' | 'updatedAt'> & Partial<VideoRelations>;

/**
 * Input para actualización
 */
export type VideoUpdateInput = Partial<Omit<VideoBase, 'id'>> & Partial<VideoRelations> & Partial<VideoUI>;

/**
 * Esquema Zod para validación de Video
 */
export const VideoSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	path: z.string(),
	hash: z.string(),
	size: z.number(),
	duration: z.number(),
	width: z.number().nullable(),
	height: z.number().nullable(),
	metadata: z.string().nullable(),
	thumbnail: z.any().nullable(),
	thumbnailSize: z.number().nullable(),
	thumbnailWidth: z.number().nullable(),
	thumbnailHeight: z.number().nullable(),
	isPublic: z.boolean(),
	isFavorite: z.boolean(),
	folderId: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con VideoSchema antes de persistir.
