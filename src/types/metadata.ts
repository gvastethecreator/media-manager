/**
 * @file Tipos para el sistema de metadatos y etiquetas
 * @module types/metadata
 */

import { z } from 'zod';

/**
 * Metadatos base que comparten todas las entidades
 */
export interface BaseMetadata {
	totalSize: number;
	itemCount: number;
	lastModified: Date;
	customFields?: Record<string, unknown>;
}

/**
 * Metadatos de localización
 */
export interface LocationMetadata {
	name: string;
	latitude: number;
	longitude: number;
	count: number;
}

/**
 * Metadatos específicos de archivos
 */
export interface FileMetadata extends BaseMetadata {
	format: string;
	width?: number;
	height?: number;
	duration?: number;
	fileSize: number;
	mimeType: string;
	encoding?: string;
	hash?: string;
}

/**
 * Metadatos de EXIF para fotografías
 */
export interface ExifMetadata {
	make?: string;
	model?: string;
	exposureTime?: string | number;
	fNumber?: number;
	iso?: number;
	focalLength?: string | number;
	lensModel?: string;
	dateTimeOriginal?: string;
	gpsLatitude?: number;
	gpsLongitude?: number;
	orientation?: number;
	[key: string]: unknown;
}

/**
 * Metadatos de IA generativa
 */
export interface AIMetadata {
	model?: string;
	prompt?: string;
	negativePrompt?: string;
	seed?: number;
	samplingSteps?: number;
	cfgScale?: number;
	samplingMethod?: string;
	extraParameters?: Record<string, unknown>;
}

/**
 * Metadatos completos de medios (integra todos los tipos)
 */
export interface MediaMetadata extends FileMetadata {
	exif?: ExifMetadata;
	iptc?: Record<string, unknown>;
	xmp?: Record<string, unknown>;
	icc?: Record<string, unknown>;
	ai?: AIMetadata;
}

/**
 * Tipo de metadato
 */
export enum MetadataType {
	EXIF = 'exif',
	IPTC = 'iptc',
	XMP = 'xmp',
	ICC = 'icc',
	CUSTOM = 'custom',
}

/**
 * Tipo de etiqueta
 */
export enum TagType {
	CATEGORY = 'category',
	SUBJECT = 'subject',
	LOCATION = 'location',
	PERSON = 'person',
	EVENT = 'event',
	TECHNIQUE = 'technique',
	CUSTOM = 'custom',
}

/**
 * Tipo de propiedad de metadatos
 */
export enum MetadataPropertyType {
	STRING = 'string',
	NUMBER = 'number',
	BOOLEAN = 'boolean',
	DATE = 'date',
	ARRAY = 'array',
	OBJECT = 'object',
}

/**
 * Propiedad de metadatos
 */
export interface MetadataProperty {
	id: EntityId;
	name: string;
	type: MetadataPropertyType;
	description?: string;
	required: boolean;
	defaultValue?: unknown;
	validation?: {
		min?: number;
		max?: number;
		pattern?: string;
		enum?: string[];
	};
}

/**
 * Etiqueta
 */
export interface Tag {
	id: EntityId;
	name: string;
	type: TagType;
	description?: string;
	color?: string;
	icon?: string;
	parent?: EntityId;
	metadata?: JSONString<Record<string, unknown>>;
	usageCount: number;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Grupo de etiquetas
 */
export interface TagGroup {
	id: EntityId;
	name: string;
	description?: string;
	tags: EntityId[];
	metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Resultado de extracción de metadatos
 */
export interface MetadataExtractionResult {
	success: boolean;
	metadata: {
		[key in MetadataType]?: Record<string, unknown>;
	};
	tags?: Tag[];
	error?: string;
}

// Validaciones Zod
export const metadataTypeSchema = z.nativeEnum(MetadataType);
export const tagTypeSchema = z.nativeEnum(TagType);
export const metadataPropertyTypeSchema = z.nativeEnum(MetadataPropertyType);

export const mediaMetadataSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	dateCreated: z.date().optional(),
	dateModified: z.date().optional(),
	authors: z.array(z.string()).optional(),
	copyright: z.string().optional(),
	dimensions: z
		.object({
			width: z.number().positive(),
			height: z.number().positive(),
			resolution: z.number().positive(),
		})
		.optional(),
	format: z.string().optional(),
	colorSpace: z.string().optional(),
	compression: z.string().optional(),
	duration: z.number().positive().optional(),
	camera: z
		.object({
			make: z.string().optional(),
			model: z.string().optional(),
			lens: z.string().optional(),
			focalLength: z.number().positive().optional(),
			aperture: z.string().optional(),
			shutterSpeed: z.string().optional(),
			iso: z.number().positive().optional(),
		})
		.optional(),
	location: z
		.object({
			latitude: z.number().optional(),
			longitude: z.number().optional(),
			altitude: z.number().optional(),
			place: z.string().optional(),
			country: z.string().optional(),
		})
		.optional(),
	custom: z.string().optional(),
});

export const metadataPropertySchema = z.object({
	id: z.string(),
	name: z.string(),
	type: metadataPropertyTypeSchema,
	description: z.string().optional(),
	required: z.boolean(),
	defaultValue: z.unknown().optional(),
	validation: z
		.object({
			min: z.number().optional(),
			max: z.number().optional(),
			pattern: z.string().optional(),
			enum: z.array(z.string()).optional(),
		})
		.optional(),
});

export const tagSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: tagTypeSchema,
	description: z.string().optional(),
	color: z.string().optional(),
	icon: z.string().optional(),
	parent: z.string().optional(),
	metadata: z.string().optional(),
	usageCount: z.number().nonnegative(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const tagGroupSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	tags: z.array(z.string()),
	metadata: z.string().optional(),
});

export const metadataExtractionResultSchema = z.object({
	success: z.boolean(),
	metadata: z.record(z.record(z.unknown())).optional(),
	tags: z.array(tagSchema).optional(),
	error: z.string().optional(),
});

// Tipos inferidos
export type MediaMetadataValidated = z.infer<typeof mediaMetadataSchema>;
export type MetadataPropertyValidated = z.infer<typeof metadataPropertySchema>;
export type TagValidated = z.infer<typeof tagSchema>;
export type TagGroupValidated = z.infer<typeof tagGroupSchema>;
export type MetadataExtractionResultValidated = z.infer<typeof metadataExtractionResultSchema>;
