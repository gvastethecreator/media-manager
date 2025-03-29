/**
 * @file Funciones de mapeo para la entidad Collection
 * @module transformers/collection/mappers
 */

import type { CollectionExtended, CollectionSummary } from '@/types/entities/collection';
import {
    COLLECTION_CATEGORY_COLORS,
    COLLECTION_CATEGORY_EMOJIS,
    type CollectionCategory,
    CollectionRarity,
    type CreateCollectionData, type UpdateCollectionData,
} from '@/types/entities/collection';
import type { Image, Collection as PrismaCollection } from '@prisma/client';
import { parseCollectionFilters } from './serializers';

/**
 * Mapeador para obtener una lista de colecciones a partir de datos de Prisma
 * @param collections Datos de colecciones desde Prisma
 * @param imageCountMap Mapa opcional con conteo de imágenes por colección
 * @returns Array de CollectionExtended
 */
export function mapCollectionsFromPrisma(
	collections: PrismaCollection[],
	imageCountMap?: Record<string, number>
): CollectionExtended[] {
	return collections.map((collection) => mapCollectionFromPrisma(collection, imageCountMap?.[collection.id]));
}

/**
 * Mapeador para obtener una colección extendida a partir de datos de Prisma
 * @param collection Datos de colección desde Prisma
 * @param imageCount Contador opcional de imágenes
 * @returns CollectionExtended
 */
export function mapCollectionFromPrisma(collection: PrismaCollection, imageCount?: number): CollectionExtended {
	const parsedFilters = collection.filters ? parseCollectionFilters(collection.filters) : [];

	return {
		...collection,
		// Propiedades adicionales de UI
		isSelected: false,
		isHovered: false,
		isOpen: false,
		isLoading: false,
		hasError: false,
		// Datos calculados
		parsedFilters,
		imageCount: imageCount || 0,
		totalValue: collection.price || 0,
	};
}

/**
 * Mapeador para obtener un resumen de colecciones a partir de datos extendidos
 * @param collections Colecciones extendidas
 * @returns Array de CollectionSummary
 */
export function mapCollectionsToSummary(collections: CollectionExtended[]): CollectionSummary[] {
	return collections.map((collection) => ({
		id: collection.id,
		name: collection.name,
		emoji: collection.emoji || '🌟',
		color: collection.color || '#3b82f6',
		imageCount: collection.imageCount || 0,
		category: collection.category || undefined,
		rarity: collection.rarity || undefined,
	}));
}

/**
 * Mapeador para crear datos de colección a partir de un formulario
 * @param formData Datos del formulario
 * @returns Datos parciales de Collection
 */
export function mapFormToCollection(formData: Record<string, any>): Partial<PrismaCollection> {
	return {
		name: formData.name,
		description: formData.description || '',
		emoji: formData.emoji || '🌟',
		color: formData.color || '#3b82f6',
		category: formData.category || null,
		rarity: formData.rarity || CollectionRarity.COMMON,
		url: formData.url || null,
		alternativeUrl: formData.alternativeUrl || null,
		platform: formData.platform || null,
		price: formData.price ? Number.parseFloat(formData.price) : null,
		isFavorite: Boolean(formData.isFavorite),
		presetId: formData.presetId || null,
		texture: formData.texture || null,
	};
}

/**
 * Asigna color y emoji según la categoría si no están definidos
 * @param collection Colección a procesar
 * @returns Colección con color y emoji asignados
 */
export function applyDefaultStyleByCategory(collection: Partial<CollectionExtended>): Partial<CollectionExtended> {
	if (!collection.category) {
		return collection;
	}

	const category = collection.category as CollectionCategory;

	return {
		...collection,
		color: collection.color || COLLECTION_CATEGORY_COLORS[category] || '#3b82f6',
		emoji: collection.emoji || COLLECTION_CATEGORY_EMOJIS[category] || '🌟',
	};
}

/**
 * Extrae las imágenes destacadas de una colección
 * @param collection Colección con imágenes
 * @param maxImages Número máximo de imágenes a extraer
 * @returns URLs de imágenes destacadas
 */
export function extractFeaturedImages(collection: CollectionExtended & { images?: Image[] }, maxImages = 3): string[] {
	if (!collection.images || collection.images.length === 0) {
		return [];
	}

	// Priorizar la imagen destacada si existe
	const featuredImages: string[] = [];

	if (collection.featuredImage) {
		featuredImages.push(collection.featuredImage);
	}

	// Agregar hasta maxImages imágenes de la colección
	const remainingImages = collection.images
		.filter((img) => img.path !== collection.featuredImage)
		.slice(0, maxImages - featuredImages.length);

	return [...featuredImages, ...remainingImages.map((img) => img.path)];
}

/**
 * Mapea datos de creación de colección a formato compatible con Prisma
 * @param data Datos de creación de colección
 * @returns Objeto formateado para Prisma
 */
export function mapCreateCollectionDataToPrisma(data: CreateCollectionData) {
	return {
		name: data.name,
		description: data.description || null,
		emoji: data.emoji || '🌟',
		color: data.color || '#3b82f6',
		category: data.category || 'general',
		shortcut: data.shortcut || null,
		platform: data.platform || null,
		url: data.url || null,
		alternativeUrl: data.alternativeUrl || null,
		price: data.price || null,
		network: data.network || null,
		tokenId: data.tokenId || null,
		tokenAddress: data.tokenAddress || null,
		contractAddress: data.contractAddress || null,
		contractType: data.contractType || null,
		editions: data.editions ? JSON.stringify(data.editions) : 'empty_array',
		featuredImage: data.featuredImage || null,
		// Conexión con grupos si existen
		groups: data.groupIds ? {
			connect: data.groupIds.map((id) => ({ id })),
		} : undefined,
		// Conexión con propiedades si existen
		properties: data.propertyIds ? {
			connect: data.propertyIds.map((id) => ({ id })),
		} : undefined,
		// Conexión con comodines si existen
		wildcards: data.wildcardIds ? {
			connect: data.wildcardIds.map((id) => ({ id })),
		} : undefined,
	};
}

/**
 * Mapea datos de actualización de colección a formato compatible con Prisma
 * @param data Datos de actualización de colección
 * @returns Objeto formateado para Prisma
 */
export function mapUpdateCollectionDataToPrisma(data: UpdateCollectionData) {
	const updateData: Record<string, any> = {};

	// Actualizar propiedades básicas si están presentes
	if (data.name !== undefined) updateData.name = data.name;
	if (data.description !== undefined) updateData.description = data.description;
	if (data.emoji !== undefined) updateData.emoji = data.emoji;
	if (data.color !== undefined) updateData.color = data.color;
	if (data.category !== undefined) updateData.category = data.category;
	if (data.shortcut !== undefined) updateData.shortcut = data.shortcut;
	if (data.platform !== undefined) updateData.platform = data.platform;
	if (data.url !== undefined) updateData.url = data.url;
	if (data.alternativeUrl !== undefined) updateData.alternativeUrl = data.alternativeUrl;
	if (data.price !== undefined) updateData.price = data.price;
	if (data.network !== undefined) updateData.network = data.network;
	if (data.tokenId !== undefined) updateData.tokenId = data.tokenId;
	if (data.tokenAddress !== undefined) updateData.tokenAddress = data.tokenAddress;
	if (data.contractAddress !== undefined) updateData.contractAddress = data.contractAddress;
	if (data.contractType !== undefined) updateData.contractType = data.contractType;
	if (data.editions !== undefined) {
		updateData.editions = data.editions ? JSON.stringify(data.editions) : 'empty_array';
	}
	if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;

	// Gestionar relaciones con grupos
	if (data.groupIds !== undefined) {
		updateData.groups = {
			set: data.groupIds.map((id) => ({ id })),
		};
	}

	// Gestionar relaciones con propiedades
	if (data.propertyIds !== undefined) {
		updateData.properties = {
			set: data.propertyIds.map((id) => ({ id })),
		};
	}

	// Gestionar relaciones con comodines
	if (data.wildcardIds !== undefined) {
		updateData.wildcards = {
			set: data.wildcardIds.map((id) => ({ id })),
		};
	}

	return updateData;
}
