/**
 * @file Serializers para transformar datos de Image
 * @module transformers/image/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    ImageComplete
} from '@/types/entities/image/types';
import { ImageSchema } from '@/types/entities/image/types';
import { handleTransformerError } from '@/utils/transformers/errors';
import { z } from 'zod';

const logger = serverLogger.withContext('ImageSerializer');

/**
 * Transforma datos planos a una entidad ImageComplete (solo campos canónicos)
 * @param data Objeto plano compatible con ImageComplete
 */
export function fromPrismaImage(data: Partial<ImageComplete>): ImageComplete {
	if (!data.id) throw new Error('El campo id es obligatorio en ImageComplete');
	if (!data.folder) throw new Error('El campo folder es obligatorio en ImageComplete');
	return {
		id: data.id,
		name: data.name ?? '',
		description: data.description ?? null,
		path: data.path ?? '',
		hash: data.hash ?? '',
		size: data.size ?? 0,
		width: data.width ?? 0,
		height: data.height ?? 0,
		metadata: data.metadata ?? null,
		isFavorite: data.isFavorite ?? false,
		addedAt: data.addedAt ?? new Date(),
		sortBy: data.sortBy ?? 'name',
		filters: data.filters ?? '{}',
		// Thumbnail y relaciones
		thumbnail: data.thumbnail ?? null,
		thumbnailSize: data.thumbnailSize ?? null,
		thumbnailWidth: data.thumbnailWidth ?? null,
		thumbnailHeight: data.thumbnailHeight ?? null,
		thumbnailError: data.thumbnailError ?? null,
		thumbnailErrorAt: data.thumbnailErrorAt ?? null,
		thumbnailOptimizedAt: data.thumbnailOptimizedAt ?? null,
		// Relaciones mínimas
		folder: data.folder,
		stats: data.stats,
		activities: data.activities,
		uploadedImages: data.uploadedImages,
		profiles: data.profiles,
		albums: data.albums,
		collections: data.collections,
		tags: data.tags,
		characters: data.characters,
		places: data.places,
		worldItems: data.worldItems,
		concepts: data.concepts,
		prompts: data.prompts,
		notes: data.notes,
		wildcards: data.wildcards,
		properties: data.properties,
		groups: data.groups,
		// Conteos
		_count: data._count,
	};
}

/**
 * Valida una imagen completa
 */
export function validateImage(data: unknown): ImageComplete {
	const parsed = ImageSchema.parse(data);
	if (!('folder' in parsed)) throw new Error('El campo folder es obligatorio en ImageComplete');
	return parsed as ImageComplete;
}

/**
 * Extiende una imagen con datos adicionales
 */
export function extendImage(
	image: ImageComplete,
	options: {
		includeStats?: boolean;
		includeRelations?: boolean;
	} = {}
): ImageComplete {
	try {
		// Aquí se pueden añadir datos adicionales que no vienen directamente
		// de la base de datos, como estadísticas calculadas, datos de sistemas externos, etc.
		const extended = { ...image };

		return extended;
	} catch (error) {
		logger.error('Error al extender imagen con datos adicionales', { error });
		throw handleTransformerError(error);
	}
}

/**
 * Parsea filtros de imagen
 */
export function parseImageFilters(filters: unknown): Record<string, unknown> {
	try {
		// Validar y parsear filtros con Zod
		const schema = z
			.object({
				text: z.string().optional(),
				category: z.enum(['GENERAL', 'ARTWORK', 'PHOTO', 'SCREENSHOT', 'OTHER']).optional(),
				type: z.enum(['ORIGINAL', 'GENERATED', 'EDITED', 'VARIANT', 'UPSCALED']).optional(),
				status: z.enum(['PENDING', 'PROCESSING', 'READY', 'ERROR']).optional(),
				sensitive: z.boolean().optional(),
				favorite: z.boolean().optional(),
				published: z.boolean().optional(),
				folderId: z.string().optional(),
				dateRange: z
					.object({
						from: z.string().optional(),
						to: z.string().optional(),
					})
					.optional(),
				albumIds: z.array(z.string()).optional(),
				collectionIds: z.array(z.string()).optional(),
				tagIds: z.array(z.string()).optional(),
				characterIds: z.array(z.string()).optional(),
				placeIds: z.array(z.string()).optional(),
				worldItemIds: z.array(z.string()).optional(),
				conceptIds: z.array(z.string()).optional(),
				promptIds: z.array(z.string()).optional(),
				noteIds: z.array(z.string()).optional(),
				wildcardIds: z.array(z.string()).optional(),
				propertyIds: z.array(z.string()).optional(),
				groupIds: z.array(z.string()).optional(),
			})
			.optional();

		const validatedFilters = schema.parse(filters) || {};
		return validatedFilters;
	} catch (error) {
		if (error instanceof z.ZodError) {
			logger.error('Error de validación en filtros de imagen', {
				error: error.errors,
				filters,
			});
			throw new Error(`Filtros inválidos: ${error.errors.map((e) => e.message).join(', ')}`);
		}
		throw handleTransformerError(error);
	}
}
