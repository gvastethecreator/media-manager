/**
 * @file Serializers para transformar datos de Image
 * @module transformers/image/serializers
 */

import { z } from 'zod';
import { TransformerError } from '@/lib/errors/transformer-error';
import { serverLogger } from '@/lib/logger/server-logger';
import type { ImageBase, ImageWithStats } from '@/types/entities/image/base';

const logger = serverLogger.withContext('ImageSerializer');

/**
 * Transforma datos planos a una entidad ImageWithStats (solo campos canónicos)
 * @param data Objeto plano compatible con ImageBase
 */
export function fromDrizzleImage(data: Partial<ImageBase>): ImageWithStats {
	if (!data.id) throw new Error('El campo id es obligatorio en ImageWithStats');
	if (!data.folderId) throw new Error('El campo folderId es obligatorio en ImageWithStats');
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
		createdAt: data.createdAt ?? new Date(),
		updatedAt: data.updatedAt ?? new Date(),
		// Thumbnail
		thumbnail: data.thumbnail ?? null,
		thumbnailSize: data.thumbnailSize ?? null,
		thumbnailWidth: data.thumbnailWidth ?? null,
		thumbnailHeight: data.thumbnailHeight ?? null,
		thumbnailMimeType: data.thumbnailMimeType ?? null,
		thumbnailError: data.thumbnailError ?? null,
		thumbnailErrorAt: data.thumbnailErrorAt ?? null,
		thumbnailOptimizedAt: data.thumbnailOptimizedAt ?? null,
		// Relaciones
		folderId: data.folderId,
		noteId: data.noteId ?? null,
		tags: data.tags ?? [],
		// Campos requeridos para ImageWithStats
		entityType: 'image' as const,
		stats: {
			viewCount: 0,
			downloadCount: 0,
			likeCount: 0,
			commentCount: 0,
			tagCount: 0,
			albumCount: 0,
			collectionCount: 0,
			characterCount: 0,
			placeCount: 0,
			worldItemCount: 0,
			conceptCount: 0,
			promptCount: 0,
			noteCount: 0,
			wildcardCount: 0,
			propertyCount: 0,
			groupCount: 0,
			aspectRatio: data.width && data.height ? Number((data.width / data.height).toFixed(2)) : 0,
		},
		thumbnailUrl: data.thumbnail ?? '',
		fullUrl: data.path ?? '',
	};
}

/**
 * Valida una imagen completa para serialización
 */
export function validateImageForSerialization(data: unknown): ImageWithStats {
	if (typeof data !== 'object' || data === null) {
		throw new Error('Los datos deben ser un objeto válido');
	}
	const imageData = data as Record<string, unknown>;
	if (!imageData.id || typeof imageData.id !== 'string') {
		throw new Error('El campo id es obligatorio y debe ser string');
	}
	if (!imageData.folderId || typeof imageData.folderId !== 'string') {
		throw new Error('El campo folderId es obligatorio y debe ser string');
	}
	return data as ImageWithStats;
}

/**
 * Extiende una imagen con datos adicionales
 */
export function extendImage(
	image: ImageWithStats,
	_options: {
		includeStats?: boolean;
		includeRelations?: boolean;
	} = {}
): ImageWithStats {
	try {
		// Aquí se pueden añadir datos adicionales que no vienen directamente
		// de la base de datos, como estadísticas calculadas, datos de sistemas externos, etc.
		const extended = { ...image };

		return extended;
	} catch (error) {
		logger.error('Error al extender imagen con datos adicionales', { error });
		throw TransformerError.wrap(error as Error, {
			operation: 'extendImageWithAdditionalData',
			message: 'Error al extender imagen con datos adicionales',
		});
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
				isFavorite: z.boolean().optional(),
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
		throw TransformerError.wrap(error as Error, {
			operation: 'parseImageFilters',
			message: 'Error al parsear filtros de imagen',
		});
	}
}
