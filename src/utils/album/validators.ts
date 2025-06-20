/**
 * @file Validadores para datos de álbumes
 * @module utils/album/validators
 */

import { z } from 'zod';
import { AlbumPrivacyLevel, AlbumType } from '../../types/entities/album';

/**
 * Determina si un tipo de álbum es válido
 * @param type Tipo a validar
 * @returns true si el tipo es válido, false en caso contrario
 */
export function isValidAlbumType(type: string): boolean {
	return Object.values(AlbumType).includes(type as AlbumType);
}

/**
 * Determina si un nivel de privacidad de álbum es válido
 * @param privacyLevel Nivel de privacidad a validar
 * @returns true si el nivel es válido, false en caso contrario
 */
export function isValidPrivacyLevel(privacyLevel: string): boolean {
	return Object.values(AlbumPrivacyLevel).includes(privacyLevel as AlbumPrivacyLevel);
}

/**
 * Schema Zod para metadatos de álbum
 */
export const albumMetadataSchema = z.object({
	itemCount: z.number().int().min(0),
	imageCount: z.number().int().min(0).optional(),
	videoCount: z.number().int().min(0).optional(),
	totalSize: z.number().int().min(0).optional(),
	dateRange: z
		.object({
			from: z.string().or(z.date()).nullable(),
			to: z.string().or(z.date()).nullable(),
		})
		.optional(),
	locations: z
		.array(
			z.object({
				name: z.string(),
				latitude: z.number(),
				longitude: z.number(),
				count: z.number().int().min(1),
			})
		)
		.optional(),
	customFields: z.record(z.any()).optional(),
	coverImageUrl: z.string().url().optional(),
	thumbnailUrls: z.array(z.string().url()).optional(),
	lastModified: z.string().or(z.date()).optional(),
});

/**
 * Schema Zod para configuración de visualización de álbum
 */
export const albumViewConfigSchema = z.object({
	theme: z.string().optional(),
	layout: z.string().optional(),
	showDates: z.boolean().optional(),
	showLocations: z.boolean().optional(),
	showDescriptions: z.boolean().optional(),
	thumbnailSize: z.enum(['small', 'medium', 'large']).optional(),
	enableTransitions: z.boolean().optional(),
	coverImageFit: z.enum(['contain', 'cover']).optional(),
	backgroundColor: z.string().optional(),
	customCss: z.string().optional(),
});

/**
 * Schema Zod para datos de creación de álbum
 */
export const createAlbumSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	description: z.string().optional(),
	coverImageId: z.string().optional(),
	type: z.nativeEnum(AlbumType).optional(),
	// parentId: z.string().nullable().optional(), // ELIMINADO: no existe en modelo Album
	privacyLevel: z.nativeEnum(AlbumPrivacyLevel).optional(),
	items: z
		.array(
			z.object({
				itemId: z.string(),
				itemType: z.enum(['image', 'video']),
			})
		)
		.optional(),
	viewConfig: albumViewConfigSchema.partial().optional(),
});

/**
 * Schema Zod para datos de actualización de álbum
 */
export const updateAlbumSchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
	coverImageId: z.string().nullable().optional(),
	type: z.nativeEnum(AlbumType).optional(),
	// parentId: z.string().nullable().optional(), // ELIMINADO: no existe en modelo Album
	privacyLevel: z.nativeEnum(AlbumPrivacyLevel).optional(),
	isArchived: z.boolean().optional(),
	viewConfig: albumViewConfigSchema.partial().optional(),
});

/**
 * Schema Zod para datos de actualización de elementos de álbum
 */
export const updateAlbumItemsSchema = z.object({
	items: z.array(
		z.object({
			itemId: z.string(),
			itemType: z.enum(['image', 'video']),
			sortOrder: z.number().optional(),
			coverForAlbum: z.boolean().optional(),
		})
	),
	replaceExisting: z.boolean().optional(),
});

/**
 * Valida un objeto de metadatos de álbum
 * @param metadata Objeto a validar
 * @returns true si los metadatos son válidos, false en caso contrario
 */
export function validateAlbumMetadata(metadata: unknown): boolean {
	const result = albumMetadataSchema.safeParse(metadata);
	return result.success;
}

/**
 * Valida los datos para la creación de un álbum
 * @param data Datos de creación a validar
 * @returns Los datos validados o un error si no son válidos
 */
export function validateCreateAlbumData(data: unknown) {
	return createAlbumSchema.parse(data);
}

/**
 * Valida los datos para la actualización de un álbum
 * @param data Datos de actualización a validar
 * @returns Los datos validados o un error si no son válidos
 */
export function validateUpdateAlbumData(data: unknown) {
	return updateAlbumSchema.parse(data);
}

/**
 * Valida que un slug de álbum sea válido
 * @param slug Slug a validar
 * @returns true si el slug es válido, false en caso contrario
 */
export function isValidAlbumSlug(slug: string): boolean {
	// Un slug válido contiene solo letras minúsculas, números, guiones y tiene al menos 3 caracteres
	const slugRegex = /^[a-z0-9][a-z0-9-]{2,}[a-z0-9]$/;
	return slugRegex.test(slug);
}

/**
 * Valida un nombre de álbum
 * @param name Nombre a validar
 * @returns true si el nombre es válido, false en caso contrario
 */
export function isValidAlbumName(name: string): boolean {
	return name.trim().length >= 1 && name.trim().length <= 100;
}

/**
 * Valida una estructura jerárquica de álbumes para detectar ciclos
 * @param albumId ID del álbum a mover
 * @param newParentId ID del nuevo padre
 * @param allAlbums Todos los álbumes disponibles
 * @returns true si la operación es válida (no crea ciclos), false en caso contrario
 * @deprecated Album no tiene jerarquía en el modelo actual
 */
export function isValidAlbumHierarchy(_albumId: string, _newParentId: string, _allAlbums: Record<string, Album>): boolean {
	// TODO: Album no tiene relación parent/children en el modelo actual
	return true; // Siempre válido ya que no hay jerarquía
}
