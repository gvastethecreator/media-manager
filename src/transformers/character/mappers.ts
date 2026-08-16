/**
 * @file Funciones de mapeo para la entidad Character
 * @module transformers/character/mappers
 
 */

import { TransformerError } from '@/lib/errors/transformer-error';
import { serverLogger } from '@/lib/logger/server-logger';
import type {
	CharacterCreateInput,
	CharacterFilters,
	CharacterSearchOptions,
	CharacterUpdateInput,
} from '@/types/entities/character';

// Tipos locales equivalentes a Drizzle
interface DrizzleCharacterCreateInput {
	age?: string | null;
	background?: string | null;
	category?: string | null;
	color?: string | null;
	createdAt?: Date;
	description?: string | null;
	emoji?: string | null;
	equipment?: string | null;
	featuredImage?: string | null;
	gender?: string | null;
	id?: string;
	name: string;
	notes?: string | null;
	occupation?: string | null;
	parentId?: string | null;
	personality?: string | null;
	relationships?: string | null;
	skills?: string | null;
	species?: string | null;
	totalImages?: number;
	totalVideos?: number;
	updatedAt?: Date;
}

interface DrizzleCharacterUpdateInput {
	age?: string | null;
	background?: string | null;
	category?: string | null;
	color?: string | null;
	description?: string | null;
	emoji?: string | null;
	equipment?: string | null;
	featuredImage?: string | null;
	gender?: string | null;
	name?: string;
	notes?: string | null;
	occupation?: string | null;
	parentId?: string | null;
	personality?: string | null;
	relationships?: string | null;
	skills?: string | null;
	species?: string | null;
	totalImages?: number;
	totalVideos?: number;
	updatedAt?: Date;
}

interface DrizzleCharacterWhereInput {
	age?: { gte?: number; lte?: number };
	background?: { contains?: string };
	category?: { in?: string[] };
	description?: { contains?: string };
	equipment?: { contains?: string };
	featuredImage?: { contains?: string };
	gender?: { in?: string[] };
	id?: string;

	isFavorite?: boolean;
	name?: { contains?: string };
	notes?: { contains?: string };
	OR?: DrizzleCharacterWhereInput[];
	occupation?: { contains?: string };
	parentId?: string;
	personality?: { contains?: string };
	relationships?: { contains?: string };
	skills?: { contains?: string };
	species?: { in?: string[] };
	tags?: { some?: { id?: { in?: string[] } } };
}

interface DrizzleCharacterFindManyArgs {
	orderBy?: { [key: string]: 'asc' | 'desc' } | { [key: string]: 'asc' | 'desc' }[];
	skip?: number;
	take?: number;
	where?: DrizzleCharacterWhereInput;
	// Los includes se manejan por separado en Drizzle con joins
}

/**
 * 🔄 Mapea un `CharacterCreateInput` a un `DrizzleCharacterCreateInput`.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapCreateCharacterDataToDrizzle(data: CharacterCreateInput): DrizzleCharacterCreateInput {
	try {
		const drizzleData: DrizzleCharacterCreateInput = {
			...data,
			id: crypto.randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// Nota: Las relaciones se manejan por separado en Drizzle

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
		const drizzleData: DrizzleCharacterUpdateInput = {
			...data,
			updatedAt: new Date(),
		};

		// Nota: Las relaciones se manejan por separado en Drizzle

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
