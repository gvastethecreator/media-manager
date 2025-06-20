/**
 * @file Transformador principal para la entidad Tag
 * @module transformers/tag/transformer
 * @description Contiene la lógica para convertir un objeto Tag de Prisma a nuestro tipo canónico.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { TagWithRelations } from '@/types/entities/tag';
import { TransformerError } from '@/utils/transformers/errors';
// ⚠️ No debemos importar tipos de Prisma para evitar acoplamientos

const logger = serverLogger.withContext('TagTransformer');

// Define un tipo flexible para aceptar cualquier payload desde Prisma
// evitando así dependencias directas con el cliente de ORM 🟢
type TagFromPrisma = Record<string, any>;

/**
 * 🔄 Transforma un objeto Tag de Prisma a nuestro tipo canónico TagWithRelations.
 *
 * @param prismaTag - El objeto Tag obtenido de Prisma.
 * @returns Un objeto TagWithRelations compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaTag(prismaTag: TagFromPrisma | null): TagWithRelations {
	if (!prismaTag) {
		throw new TransformerError('El objeto de tag de Prisma no puede ser nulo.');
	}

	try {
		// `sortBy` y `filters` ya no existen en el modelo. Ignoramos esos campos 🧹
		const { _count, ...baseData } = prismaTag;

		return {
			...baseData,
			images: baseData.images ?? [],
			// videos: baseData.videos ?? [], // ❌ ELIMINADO - No existe relación Tag-Video en Prisma
			// albums: baseData.albums ?? [], // ❌ ELIMINADO - No existe relación Tag-Album en Prisma
			collections: baseData.collections ?? [],
			// characters: baseData.characters ?? [], // ❌ ELIMINADO - No existe relación Tag-Character en Prisma
			places: baseData.places ?? [],
			worldItems: baseData.worldItems ?? [],
			concepts: baseData.concepts ?? [],
			prompts: baseData.prompts ?? [],
			notes: baseData.notes ?? [],
			wildcards: baseData.wildcards ?? [],
			properties: baseData.properties ?? [],
			groups: baseData.groups ?? [],
			_count: {
				images: _count?.images ?? 0,
				// videos: _count?.videos ?? 0, // ❌ ELIMINADO - No existe en esquema Prisma Tag
				// albums: _count?.albums ?? 0, // ❌ ELIMINADO - No existe en esquema Prisma Tag
				collections: _count?.collections ?? 0,
				// characters: _count?.characters ?? 0, // ❌ ELIMINADO - No existe en esquema Prisma Tag
				places: _count?.places ?? 0,
				worldItems: _count?.worldItems ?? 0,
				concepts: _count?.concepts ?? 0,
				prompts: _count?.prompts ?? 0,
				notes: _count?.notes ?? 0,
				wildcards: _count?.wildcards ?? 0,
				properties: _count?.properties ?? 0,
				groups: _count?.groups ?? 0,
			},
		};
	} catch (error) {
		logger.error('Error transformando tag desde Prisma', {
			error,
			tagId: prismaTag.id,
		});
		throw new TransformerError(`Error al transformar el tag: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de tags de Prisma a una lista de TagWithRelations.
 *
 * @param prismaTags - Un array de objetos Tag de Prisma.
 * @returns Un array de objetos TagWithRelations.
 */
export function fromPrismaTags(prismaTags: TagFromPrisma[]): TagWithRelations[] {
	return prismaTags.map(fromPrismaTag);
}
