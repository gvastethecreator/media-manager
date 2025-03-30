/**
 * @file Exportaciones principales de transformers para la entidad Group
 * @module transformers/group
 */

import { Logger } from '@/lib/logger';
import {
    GroupComplete,
    GroupCreateInput,
    GroupSearchOptions,
    GroupSearchResult,
    GroupUpdateInput,
} from '@/types/entities/group/types';
import { handleTransformerError } from '@/utils/transformers/errors';
import {
    mapCreateGroupDataToPrisma,
    mapGroupSearchOptionsToPrisma,
    mapGroupToRelatedGroup,
    mapUpdateGroupDataToPrisma,
} from './mappers';
import {
    extendGroup,
    fromPrismaGroup,
    parseGroupFilters,
    toPrismaGroup,
    validateGroup,
} from './serializers';

const logger = new Logger('GroupTransformer');

/**
 * 🔄 Transformer para la entidad Group
 */
export class GroupTransformer {
	/**
	 * 🔍 Busca grupos según los criterios especificados
	 */
	static async search(options: GroupSearchOptions = {}): Promise<GroupSearchResult> {
		try {
			const prismaArgs = mapGroupSearchOptionsToPrisma(options);
			const [items, total] = await Promise.all([
				prisma.group.findMany(prismaArgs),
				prisma.group.count({ where: prismaArgs.where }),
			]);

			const hasMore = total > (options.skip || 0) + items.length;
			const transformedItems = items.map(item => fromPrismaGroup(item));

			return {
				items: transformedItems,
				total,
				hasMore,
			};
		} catch (error) {
			throw handleTransformerError(error);
		}
	}

	/**
	 * 🔍 Obtiene un grupo por su ID
	 */
	static async getById(id: string, options?: GroupSearchOptions): Promise<GroupComplete | null> {
		try {
			const prismaArgs = mapGroupSearchOptionsToPrisma(options);
			const group = await prisma.group.findUnique({
				where: { id },
				...prismaArgs,
			});

			if (!group) return null;

			const transformedGroup = fromPrismaGroup(group);
			return await extendGroup(transformedGroup, options);
		} catch (error) {
			throw handleTransformerError(error);
		}
	}

	/**
	 * ✨ Crea un nuevo grupo
	 */
	static async create(data: GroupCreateInput): Promise<GroupComplete> {
		try {
			const validatedData = validateGroup(data);
			const prismaData = mapCreateGroupDataToPrisma(validatedData);
			const group = await prisma.group.create({
				data: prismaData,
				include: {
					images: true,
					videos: true,
					albums: true,
					collections: true,
					tags: true,
					characters: true,
					places: true,
					worldItems: true,
					concepts: true,
					prompts: true,
					notes: true,
					wildcards: true,
					properties: true,
					_count: true,
				},
			});

			return fromPrismaGroup(group);
		} catch (error) {
			throw handleTransformerError(error);
		}
	}

	/**
	 * 🔄 Actualiza un grupo existente
	 */
	static async update(id: string, data: GroupUpdateInput): Promise<GroupComplete> {
		try {
			const validatedData = validateGroup({ id, ...data });
			const prismaData = mapUpdateGroupDataToPrisma(validatedData);
			const group = await prisma.group.update({
				where: { id },
				data: prismaData,
				include: {
					images: true,
					videos: true,
					albums: true,
					collections: true,
					tags: true,
					characters: true,
					places: true,
					worldItems: true,
					concepts: true,
					prompts: true,
					notes: true,
					wildcards: true,
					properties: true,
					_count: true,
				},
			});

			return fromPrismaGroup(group);
		} catch (error) {
			throw handleTransformerError(error);
		}
	}

	/**
	 * 🗑️ Elimina un grupo
	 */
	static async delete(id: string): Promise<void> {
		try {
			await prisma.group.delete({
				where: { id },
			});
		} catch (error) {
			throw handleTransformerError(error);
		}
	}

	/**
	 * 🔄 Convierte un grupo a su versión relacionada
	 */
	static toRelated(group: GroupComplete) {
		try {
			return mapGroupToRelatedGroup(group);
		} catch (error) {
			throw handleTransformerError(error);
		}
	}

	/**
	 * 🔍 Parsea filtros de grupo
	 */
	static parseFilters(filters: unknown) {
		try {
			return parseGroupFilters(filters);
		} catch (error) {
			throw handleTransformerError(error);
		}
	}
}

// Exportar funciones individuales para uso directo
export {
    extendGroup, fromPrismaGroup, mapCreateGroupDataToPrisma, mapGroupSearchOptionsToPrisma,
    mapGroupToRelatedGroup, mapUpdateGroupDataToPrisma, parseGroupFilters, toPrismaGroup, validateGroup
};

// Exportar mappers
    export {
        mapCreateGroupDataToPrisma, mapGroupFiltersToPrisma,
        mapGroupToRelatedGroup, mapUpdateGroupDataToPrisma
    } from './mappers';

// Exportar serializadores
export {
    DEFAULT_GROUP_COLOR, DEFAULT_GROUP_EMOJI, extendGroup,
    extendGroups,
    fromGroupComplete, generateGroupColor, generateGroupEmoji, parseGroupFilters,
    serializeGroupFilters,
    toGroupComplete
} from './serializers';

