/**
 * @file Serializers para transformar datos de Image
 * @module transformers/image/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    ImageBase,
    ImageComplete,
    ImageCreateInput,
    ImageRelations,
    ImageUpdateInput
} from '@/types/entities/image/types';
import { ImageSchema } from '@/types/entities/image/types';
import { handleTransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';

const logger = serverLogger.withContext('ImageSerializer');

/**
 * Transforma una Image para su uso en Prisma
 */
export function toPrismaImage(
	data: ImageCreateInput | ImageUpdateInput
): Prisma.ImageCreateInput | Prisma.ImageUpdateInput {
	try {
		const {
			id, title, description, path, alt, source, prompt,
			negativePrompt, params, width, height, size, type,
			category, status, sensitive, favorite, published,
			quality, upscaled, folderId, ...relations
		} = data;

		// Validar campos requeridos para creación
		if ((data as ImageCreateInput).isCreating) {
			if (!path) {
				throw new Error('La ruta de la imagen es requerida');
			}

			if (!width || !height) {
				throw new Error('Las dimensiones de la imagen son requeridas');
			}
		}

		// Construir objeto base para Prisma
		const prismaData: Record<string, unknown> = {
			title,
			description,
			path,
			alt,
			source,
			prompt,
			negativePrompt,
			params,
			width,
			height,
			size,
			type,
			category,
			status,
			sensitive: sensitive ?? false,
			favorite: favorite ?? false,
			published: published ?? false,
			quality,
			upscaled,
			folderId,
		};

		// Filtrar propiedades undefined
		const keys = Object.keys(prismaData);
		for (const key of keys) {
			if (prismaData[key] === undefined) {
				delete prismaData[key];
			}
		}

		return prismaData as Prisma.ImageCreateInput | Prisma.ImageUpdateInput;
	} catch (error) {
		logger.error('Error al convertir imagen a formato Prisma', { error });
		throw handleTransformerError(error);
	}
}

/**
 * Transforma datos de Prisma a una entidad ImageComplete
 */
export function fromPrismaImage(
	prismaImage: Prisma.ImageGetPayload<{
		include: {
			folder: true;
			stats: true;
			activities: true;
			uploadedImages: true;
			profiles: true;
			albums: true;
			collections: true;
			tags: true;
			characters: true;
			places: true;
			worldItems: true;
			concepts: true;
			prompts: true;
			notes: true;
			wildcards: true;
			properties: true;
			groups: true;
			_count: true;
		};
	}>
): ImageComplete {
	try {
		// Construir objeto base
		const base: ImageBase = {
			id: prismaImage.id,
			title: prismaImage.title ?? '',
			description: prismaImage.description ?? '',
			path: prismaImage.path,
			alt: prismaImage.alt ?? '',
			source: prismaImage.source ?? '',
			prompt: prismaImage.prompt ?? '',
			negativePrompt: prismaImage.negativePrompt ?? '',
			params: prismaImage.params ?? '',
			width: prismaImage.width,
			height: prismaImage.height,
			size: prismaImage.size ?? 0,
			type: prismaImage.type ?? 'ORIGINAL',
			category: prismaImage.category ?? 'GENERAL',
			status: prismaImage.status ?? 'PENDING',
			sensitive: prismaImage.sensitive ?? false,
			favorite: prismaImage.favorite ?? false,
			published: prismaImage.published ?? false,
			quality: prismaImage.quality ?? 0,
			upscaled: prismaImage.upscaled ?? false,
			folderId: prismaImage.folderId ?? null,
			createdAt: prismaImage.createdAt,
			updatedAt: prismaImage.updatedAt,
		};

		// Construir relaciones
		const relations: ImageRelations = {
			folder: prismaImage.folder ?? null,
			stats: prismaImage.stats ?? null,
			activities: prismaImage.activities ?? [],
			uploadedImages: prismaImage.uploadedImages ?? [],
			profiles: prismaImage.profiles ?? [],
			albums: prismaImage.albums ?? [],
			collections: prismaImage.collections ?? [],
			tags: prismaImage.tags ?? [],
			characters: prismaImage.characters ?? [],
			places: prismaImage.places ?? [],
			worldItems: prismaImage.worldItems ?? [],
			concepts: prismaImage.concepts ?? [],
			prompts: prismaImage.prompts ?? [],
			notes: prismaImage.notes ?? [],
			wildcards: prismaImage.wildcards ?? [],
			properties: prismaImage.properties ?? [],
			groups: prismaImage.groups ?? [],
		};

		// Construir contador
		const counts = {
			albums: prismaImage._count?.albums ?? 0,
			collections: prismaImage._count?.collections ?? 0,
			tags: prismaImage._count?.tags ?? 0,
			characters: prismaImage._count?.characters ?? 0,
			places: prismaImage._count?.places ?? 0,
			worldItems: prismaImage._count?.worldItems ?? 0,
			concepts: prismaImage._count?.concepts ?? 0,
			prompts: prismaImage._count?.prompts ?? 0,
			notes: prismaImage._count?.notes ?? 0,
			wildcards: prismaImage._count?.wildcards ?? 0,
			properties: prismaImage._count?.properties ?? 0,
			groups: prismaImage._count?.groups ?? 0,
		};

		// Campos UI para la interfaz
		const ui = {
			expanded: false,
			selected: false,
			visible: true,
			highlighted: false,
			focused: false,
		};

		return {
			...base,
			...relations,
			counts,
			ui,
		};
	} catch (error) {
		logger.error('Error al convertir datos de Prisma a ImageComplete', { error });
		throw handleTransformerError(error);
	}
}

/**
 * Valida una imagen completa
 */
export function validateImage(data: unknown): ImageComplete {
	try {
		return ImageSchema.parse(data);
	} catch (error) {
		if (error instanceof z.ZodError) {
			logger.error('Error de validación en imagen', {
				error: error.errors,
				data
			});
			throw new Error(`Validación fallida: ${error.errors.map(e => e.message).join(', ')}`);
		}
		throw handleTransformerError(error);
	}
}

/**
 * Extiende una imagen con datos adicionales
 */
export async function extendImage(
	image: ImageComplete,
	options: {
		includeStats?: boolean;
		includeRelations?: boolean;
	} = {}
): Promise<ImageComplete> {
	try {
		// Aquí se pueden añadir datos adicionales que no vienen directamente
		// de la base de datos, como estadísticas calculadas, datos de sistemas externos, etc.
		const extended = { ...image };

		// Ejemplo: añadir URL para vista previa
		extended.previewUrl = `/api/images/preview/${image.id}`;

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
		const schema = z.object({
			text: z.string().optional(),
			category: z.enum(['GENERAL', 'ARTWORK', 'PHOTO', 'SCREENSHOT', 'OTHER']).optional(),
			type: z.enum(['ORIGINAL', 'GENERATED', 'EDITED', 'VARIANT', 'UPSCALED']).optional(),
			status: z.enum(['PENDING', 'PROCESSING', 'READY', 'ERROR']).optional(),
			sensitive: z.boolean().optional(),
			favorite: z.boolean().optional(),
			published: z.boolean().optional(),
			folderId: z.string().optional(),
			dateRange: z.object({
				from: z.string().optional(),
				to: z.string().optional(),
			}).optional(),
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
		}).optional();

		const validatedFilters = schema.parse(filters) || {};
		return validatedFilters;
	} catch (error) {
		if (error instanceof z.ZodError) {
			logger.error('Error de validación en filtros de imagen', {
				error: error.errors,
				filters
			});
			throw new Error(`Filtros inválidos: ${error.errors.map(e => e.message).join(', ')}`);
		}
		throw handleTransformerError(error);
	}
}
