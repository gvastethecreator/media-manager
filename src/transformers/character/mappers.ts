/**
 * @file Funciones de mapeo para la entidad Character
 * @module transformers/character/mappers
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { TransformerError } from '@/lib/utils/transformers/errors';
import type {
    CharacterCreateInput,
    CharacterFilters,
    CharacterSearchOptions,
    CharacterUpdateInput,
} from '@/types/entities/character';

// Tipos locales equivalentes a Prisma (migración a Drizzle)
type DrizzleCharacterCreateInput = {
	id?: string;
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	level?: number;
	class?: string | null;
	race?: string | null;
	alignment?: string | null;
	stats?: string;
	skills?: string;
	relationships?: string;
	goals?: string;
	fears?: string;
	beliefs?: string;
	personality?: string;
	abilities?: string;
	backstory?: string;
	psychologicalProfile?: string;
	socialProfile?: string;
	isFavorite?: boolean;
	createdAt?: Date;
	updatedAt?: Date;
};

type DrizzleCharacterUpdateInput = {
	name?: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	level?: number;
	class?: string | null;
	race?: string | null;
	alignment?: string | null;
	stats?: string;
	skills?: string;
	relationships?: string;
	goals?: string;
	fears?: string;
	beliefs?: string;
	personality?: string;
	abilities?: string;
	backstory?: string;
	psychologicalProfile?: string;
	socialProfile?: string;
	isFavorite?: boolean;
	updatedAt?: Date;
};

type DrizzleCharacterWhereInput = {
	id?: string;
	name?: { contains?: string };
	description?: { contains?: string };
	backstory?: { contains?: string };
	level?: { gte?: number; lte?: number };
	class?: { in?: string[] };
	race?: { in?: string[] };
	alignment?: { in?: string[] };
	isFavorite?: boolean;
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
			stats: data.stats ?? '',
			skills: data.skills ?? '[]',
			relationships: data.relationships ?? '[]',
			goals: data.goals ?? '[]',
			fears: data.fears ?? '[]',
			beliefs: data.beliefs ?? '[]',
			personality: data.personality ?? '[]',
			abilities: data.abilities ?? '[]',
			backstory: data.backstory ?? '',
			psychologicalProfile: data.psychologicalProfile ?? '',
			socialProfile: data.socialProfile ?? '',
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
			updatedAt: new Date()
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
			{ backstory: { contains: filters.search } },
		];
	}

	if (filters.level) {
		const levelFilter: { gte?: number; lte?: number } = {};
		if (filters.level.min !== undefined) {
			levelFilter.gte = filters.level.min;
		}
		if (filters.level.max !== undefined) {
			levelFilter.lte = filters.level.max;
		}
		if (Object.keys(levelFilter).length > 0) {
			where.level = levelFilter;
		}
	}

	if (filters.class?.length) {
		where.class = { in: filters.class };
	}
	if (filters.race?.length) {
		where.race = { in: filters.race };
	}
	if (filters.alignment?.length) {
		where.alignment = { in: filters.alignment };
	}
	if (filters.isFavorite !== undefined) {
		where.isFavorite = filters.isFavorite;
	}
	if (filters.tagIds?.length) {
		where.tags = { some: { id: { in: filters.tagIds } } };
	}
	return where;
}
