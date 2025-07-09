/**
 * @file Funciones de mapeo para la entidad Character
 * @module transformers/character/mappers
 
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { TransformerError } from '@/lib/utils/transformers/errors';
import type {
	CharacterCreateInput,
	CharacterFilters,
	CharacterSearchOptions,
	CharacterUpdateInput,
} from '@/types/entities/character';

// Tipos locales equivalentes a Drizzle
type DrizzleCharacterCreateInput = {
	id?: string;
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	totalImages?: number;
	totalVideos?: number;
	age?: string | null;
	gender?: string | null;
	species?: string | null;
	occupation?: string | null;
	personality?: string | null;
	background?: string | null;
	relationships?: string | null;
	skills?: string | null;
	equipment?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
	createdAt?: Date;
	updatedAt?: Date;
};

type DrizzleCharacterUpdateInput = {
	name?: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	isPublic?: boolean;
	isFavorite?: boolean;
	totalImages?: number;
	totalVideos?: number;
	age?: string | null;
	gender?: string | null;
	species?: string | null;
	occupation?: string | null;
	personality?: string | null;
	background?: string | null;
	relationships?: string | null;
	skills?: string | null;
	equipment?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
	updatedAt?: Date;
};

type DrizzleCharacterWhereInput = {
	id?: string;
	name?: { contains?: string };
	description?: { contains?: string };
	category?: { in?: string[] };
	isPublic?: boolean;
	isFavorite?: boolean;
	age?: { gte?: number; lte?: number };
	gender?: { in?: string[] };
	species?: { in?: string[] };
	occupation?: { contains?: string };
	personality?: { contains?: string };
	background?: { contains?: string };
	relationships?: { contains?: string };
	skills?: { contains?: string };
	equipment?: { contains?: string };
	notes?: { contains?: string };
	featuredImage?: { contains?: string };
	parentId?: string;
	OR?: DrizzleCharacterWhereInput[];
	tags?: { some?: { id?: { in?: string[] } } };
};

type DrizzleCharacterFindManyArgs = {
	where?: DrizzleCharacterWhereInput;
	orderBy?: { [key: string]: 'asc' | 'desc' } | { [key: string]: 'asc' | 'desc' }[];
	skip?: number;
	take?: number;
	// Los includes se manejan por separado en Drizzle con joins
};

/**
 * 🔄 Mapea un `CharacterCreateInput` a un `DrizzleCharacterCreateInput`.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapCreateCharacterDataToDrizzle(data: CharacterCreateInput): DrizzleCharacterCreateInput {
	try {
		const { imageIds, tagIds, groupIds, propertyIds, ...rest } = data;
		const drizzleData: DrizzleCharacterCreateInput = {
			...rest,
			id: crypto.randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// Nota: Las relaciones se manejan por separado en Drizzle
		// imageIds, tagIds, groupIds, propertyIds se procesarán en tablas de unión después de la inserción

		return drizzleData;
	} catch (error) {
		serverLogger.error('Error mapeando datos de creación de personaje', { error, data });
		throw new TransformerError('Error al mapear datos de creación de personaje.');
	}
}

/**
 * 🔄 Mapea un `CharacterUpdateInput` a un `DrizzleCharacterUpdateInput`.
 * Esta función no maneja desconexiones, solo actualizaciones y conexiones.
 * La lógica de desconexión debe ser manejada en la capa de servicio si es necesario.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapUpdateCharacterDataToDrizzle(data: CharacterUpdateInput): DrizzleCharacterUpdateInput {
	try {
		const { imageIds, tagIds, groupIds, propertyIds, ...rest } = data;
		const drizzleData: DrizzleCharacterUpdateInput = {
			...rest,
			updatedAt: new Date(),
		};

		// Nota: Las relaciones se manejan por separado en Drizzle
		// imageIds, tagIds, groupIds, propertyIds se procesarán en tablas de unión en operaciones separadas

		return drizzleData;
	} catch (error) {
		serverLogger.error('Error mapeando datos de actualización de personaje', { error, data });
		throw new TransformerError('Error al mapear datos de actualización de personaje.');
	}
}

/**
 * 🔄 Mapea `CharacterSearchOptions` a `DrizzleCharacterFindManyArgs`.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapCharacterSearchOptionsToDrizzle(options: CharacterSearchOptions): DrizzleCharacterFindManyArgs {
	const { filters, ...rest } = options;
	return {
		...rest,
		where: filters ? mapCharacterFiltersToDrizzle(filters) : undefined,
	};
}

function mapCharacterFiltersToDrizzle(filters: CharacterFilters): DrizzleCharacterWhereInput {
	const where: DrizzleCharacterWhereInput = {};

	if (filters.search && typeof filters.search === 'string' && filters.search.trim()) {
		where.OR = [
			{ name: { contains: filters.search } },
			{ description: { contains: filters.search } },
			{ age: { contains: filters.search } },
			{ gender: { contains: filters.search } },
			{ species: { contains: filters.search } },
			{ occupation: { contains: filters.search } },
			{ personality: { contains: filters.search } },
			{ background: { contains: filters.search } },
			{ relationships: { contains: filters.search } },
			{ skills: { contains: filters.search } },
			{ equipment: { contains: filters.search } },
			{ notes: { contains: filters.search } },
		];
	}

	
	if (filters.isFavorite !== undefined) {
		where.isFavorite = filters.isFavorite;
	}
	if (filters.tagIds?.length) {
		where.tags = { some: { id: { in: filters.tagIds } } };
	}
	return where;
}
