/**
 * @file Tipos para manejo de archivos
 * @module types/file-item
 */

import type { EntityId, JSONString } from '@/utils/types/utility-types';
import { z } from 'zod';
import type { MediaMetadata } from './metadata.types';

/**
 * Estado de procesamiento de archivo
 */
export enum FileProcessingStatus {
	PENDING = 'pending',
	PROCESSING = 'processing',
	COMPLETED = 'completed',
	FAILED = 'failed',
}

/**
 * Tipo de archivo
 */
export enum FileType {
	IMAGE = 'image',
	VIDEO = 'video',
	AUDIO = 'audio',
	DOCUMENT = 'document',
	OTHER = 'other',
}

/**
 * Interfaz base para archivos
 */
export interface FileItem {
	id: EntityId;
	name: string;
	path: string;
	type: FileType;
	size: number;
	mimeType: string;
	metadata: JSONString<MediaMetadata>;
	processingStatus: FileProcessingStatus;
	errorMessage?: string;
	createdAt: Date;
	updatedAt: Date;
	isFavorite?: boolean;
}

/**
 * Opciones de procesamiento
 */
export interface FileProcessingOptions {
	generateThumbnail?: boolean;
	extractMetadata?: boolean;
	optimizeFile?: boolean;
	maxWidth?: number;
	maxHeight?: number;
	quality?: number;
}

// Validación con Zod
export const fileProcessingStatusSchema = z.nativeEnum(FileProcessingStatus);
export const fileTypeSchema = z.nativeEnum(FileType);

export const fileItemSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
	path: z.string().min(1),
	type: fileTypeSchema,
	size: z.number().positive(),
	mimeType: z.string(),
	metadata: z.string(),
	processingStatus: fileProcessingStatusSchema,
	errorMessage: z.string().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const fileProcessingOptionsSchema = z.object({
	generateThumbnail: z.boolean().optional(),
	extractMetadata: z.boolean().optional(),
	optimizeFile: z.boolean().optional(),
	maxWidth: z.number().positive().optional(),
	maxHeight: z.number().positive().optional(),
	quality: z.number().min(1).max(100).optional(),
});

// Tipos inferidos
export type FileItemValidated = z.infer<typeof fileItemSchema>;
export type FileProcessingOptionsValidated = z.infer<typeof fileProcessingOptionsSchema>;

export type ViewType =
	| 'all-images'
	| 'favorites'
	| 'collections'
	| 'collection-content'
	| 'folders'
	| 'folder-content'
	| 'tags'
	| 'tag-content'
	| 'search'
	| 'files'
	| 'settings'
	| 'development'
	| 'loading'
	| 'albums'
	| 'album-content'
	| 'characters'
	| 'character-content'
	| 'places'
	| 'place-content'
	| 'world-items'
	| 'world-item-content'
	| 'concepts'
	| 'concept-content'
	| 'prompts'
	| 'prompt-content'
	| 'notes'
	| 'note-content'
	| 'groups'
	| 'group-content'
	| 'properties'
	| 'property-content'
	| 'wildcards'
	| 'wildcard-content'
	| 'entity-cards'
	| 'canvas'
	| 'chat';

export interface BaseItem {
	id: string;
	name: string;
	count: number;
	emoji?: string;
}

export interface Dimensions {
	width: number;
	height: number;
}

export interface ExifData {
	Make?: string;
	Model?: string;
	Software?: string;
	DateTime?: string;
	ExposureTime?: number;
	FNumber?: number;
	ISO?: number;
	FocalLength?: number;
}

export interface GenerationData {
	prompt?: string;
	negative_prompt?: string;
	model?: string;
	steps?: number;
	cfg_scale?: number;
	seed?: number;
	sampler?: string;
}

export interface FileMetadata {
	mimeType?: string;
	dimensions?: {
		width: number;
		height: number;
	};
	colorSpace?: string;
	hasAlpha?: boolean;
	isAnimated?: boolean;

	// EXIF metadata
	exif?: {
		make?: string;
		model?: string;
		software?: string;
		dateTime?: string | Date;
		exposureTime?: number;
		fNumber?: number;
		iso?: number;
		focalLength?: number;
		lens?: string;
		copyright?: string;
		artist?: string;
		description?: string;
		gps?: {
			latitude: number;
			longitude: number;
			altitude?: number;
		};
	};

	// XMP metadata
	xmp?: {
		title?: string;
		creator?: string;
		rights?: string;
		subject?: string[];
		rating?: number;
	};

	// IPTC metadata
	iptc?: {
		headline?: string;
		caption?: string;
		keywords?: string[];
		copyright?: string;
		source?: string;
	};

	// AI Generation metadata
	generation?: {
		type: 'stable-diffusion' | 'comfyui' | 'midjourney' | 'dalle' | string;
		prompt?: string;
		negative_prompt?: string;
		model?: string;
		steps?: number;
		cfg_scale?: number;
		cfg?: number; // Para ComfyUI
		seed?: number | string;
		sampler?: string;
		scheduler?: string;
		clip_skip?: number;
		workflow?: string; // Para ComfyUI
		extra_params?: Record<string, string | number | boolean | null | undefined | string[]>;
	};
}

export interface ImageStats {
	id: string;
	imageId: string;
	views: number;
	downloads: number;
	lastViewed: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface RelatedCollection {
	id: string;
	name: string;
}

export interface RelatedTag {
	id: string;
	name: string;
	color: string;
}

export interface RelatedAlbum {
	id: string;
	name: string;
}

export interface RelatedCharacter {
	id: string;
	name: string;
}

export interface RelatedPlace {
	id: string;
	name: string;
}

export interface RelatedWorldItem {
	id: string;
	name: string;
}

export interface RelatedConcept {
	id: string;
	name: string;
}

export interface RelatedPrompt {
	id: string;
	name: string;
}

export interface RelatedNote {
	id: string;
	title: string;
}

export interface RelatedGroup {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
}

export interface RelatedProperty {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
}

export interface RelatedWildcard {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
}

// Corrección: Redefinir ImageItem para resolver problemas de tipo
export interface ImageItem extends Omit<FileItem, 'mimeType'> {
	url?: string;
	src: string;
	alt: string;
	mimeType?: string; // Hacemos que sea opcional para compatibilidad
}

export interface ThumbnailResponse {
	thumbnail: string;
	width?: number;
	height?: number;
	size?: number;
	mimeType?: string;
}

/**
 * 🔒 Versión serializable de FileItem para Server/Client Components
 *
 * Este tipo garantiza que todos los campos son serializables y seguros
 * para pasar de Server Components a Client Components en Next.js.
 */
export interface SerializableFileItem extends Omit<FileItem, 'createdAt' | 'updatedAt'> {
	createdAt: string; // ISO string
	updatedAt: string; // ISO string
	thumbnail?: string | null; // URL o base64, nunca Buffer
}

export interface ViewProps {
	isResizing?: boolean;
}

export interface ViewContainerProps {
	isResizing?: boolean;
}
