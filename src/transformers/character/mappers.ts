/**
 * @file Funciones de mapeo para la entidad Character
 * @module transformers/character/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    CharacterCreateInput,
    CharacterFilters,
    CharacterSearchOptions,
    CharacterUpdateInput,
} from '@/types/entities/character';
import { TransformerError } from '@/lib/utils/transformers/errors';
import type { Prisma } from '@prisma/client';

/**
 * 🔄 Mapea un `CharacterCreateInput` a un `Prisma.CharacterCreateInput`.
 */
export function mapCreateCharacterDataToPrisma(data: CharacterCreateInput): Prisma.CharacterCreateInput {
	try {
		const { imageIds, tagIds, groupIds, propertyIds, ...rest } = data;
		const prismaData: Prisma.CharacterCreateInput = {
			...rest,
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
		};

		if (imageIds) {
			prismaData.images = { connect: imageIds.map((id) => ({ id })) };
		}
		if (tagIds) {
			prismaData.tags = { connect: tagIds.map((id) => ({ id })) };
		}
		if (groupIds) {
			prismaData.groups = { connect: groupIds.map((id) => ({ id })) };
		}
		if (propertyIds) {
			prismaData.properties = { connect: propertyIds.map((id) => ({ id })) };
		}

		return prismaData;
	} catch (error) {
		serverLogger.error('Error mapeando datos de creación de personaje', { error, data });
		throw new TransformerError('Error al mapear datos de creación de personaje.');
	}
}

/**
 * 🔄 Mapea un `CharacterUpdateInput` a un `Prisma.CharacterUpdateInput`.
 * Esta función no maneja desconexiones, solo actualizaciones y conexiones.
 * La lógica de desconexión debe ser manejada en la capa de servicio si es necesario.
 */
export function mapUpdateCharacterDataToPrisma(data: CharacterUpdateInput): Prisma.CharacterUpdateInput {
	try {
		const { imageIds, tagIds, groupIds, propertyIds, ...rest } = data;
		const prismaData: Prisma.CharacterUpdateInput = { ...rest };

		if (imageIds) {
			prismaData.images = { set: imageIds.map((id) => ({ id })) };
		}
		if (tagIds) {
			prismaData.tags = { set: tagIds.map((id) => ({ id })) };
		}
		if (groupIds) {
			prismaData.groups = { set: groupIds.map((id) => ({ id })) };
		}
		if (propertyIds) {
			prismaData.properties = { set: propertyIds.map((id) => ({ id })) };
		}
		return prismaData;
	} catch (error) {
		serverLogger.error('Error mapeando datos de actualización de personaje', { error, data });
		throw new TransformerError('Error al mapear datos de actualización de personaje.');
	}
}

/**
 * 🔄 Mapea `CharacterSearchOptions` a `Prisma.CharacterFindManyArgs`.
 */
export function mapCharacterSearchOptionsToPrisma(options: CharacterSearchOptions): Prisma.CharacterFindManyArgs {
	const { filters, ...rest } = options;
	return {
		...rest,
		where: filters ? mapCharacterFiltersToPrisma(filters) : undefined,
	};
}

function mapCharacterFiltersToPrisma(filters: CharacterFilters): Prisma.CharacterWhereInput {
	const where: Prisma.CharacterWhereInput = {};

	if (filters.search) {
		where.OR = [
			{ name: { contains: filters.search } },
			{ description: { contains: filters.search } },
			{ backstory: { contains: filters.search } },
		];
	}

	if (filters.level) {
		const levelFilter: Prisma.IntFilter = {};
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
