/**
 * @file Transformador principal para la entidad Character
 * @module transformers/character/transformer
 * @description Contiene la lógica para convertir un objeto Character de Prisma a nuestros tipos canónicos.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { AlbumComplete } from '@/types/entities/album';
import type { CharacterComplete } from '@/types/entities/character';
import type { CollectionComplete } from '@/types/entities/collection';
import type { ConceptComplete } from '@/types/entities/concept';
import type { GroupComplete } from '@/types/entities/group';
import type { ImageComplete } from '@/types/entities/image';
import type { NoteComplete } from '@/types/entities/note';
import type { PlaceComplete } from '@/types/entities/place';
import type { PromptComplete } from '@/types/entities/prompt';
import type { PropertyComplete } from '@/types/entities/property';
import type { TagComplete } from '@/types/entities/tag';
import type { VideoComplete } from '@/types/entities/video';
import type { WildcardComplete } from '@/types/entities/wildcard';
import type { WorldItemComplete } from '@/types/entities/world-item';
import type { Prisma } from '@prisma/client';
import { fromPrismaAlbum } from '../album/transformer';
import { fromPrismaCollection } from '../collection/transformer';
import { fromPrismaConcept } from '../concept/transformer';
import { fromPrismaGroup } from '../group/transformer';
import { fromPrismaImage } from '../image/transformer';
import { fromPrismaNote } from '../note/transformer';
import { fromPrismaPlace } from '../place/transformer';
import { fromPrismaPrompt } from '../prompt/transformer';
import { fromPrismaProperty } from '../property/transformer';
import { fromPrismaTag } from '../tag/transformer';
import { fromPrismaVideo } from '../video/transformer';
import { fromPrismaWildcard } from '../wildcard/transformer';
import { fromPrismaWorldItem } from '../world-item/transformer';

const logger = serverLogger.withContext('CharacterTransformer');

type PrismaCharacterWithRelations = Prisma.CharacterGetPayload<{
	include: {
		images: true;
		videos: true;
		tags: true;
		groups: true;
		properties: true;
		collections: true;
		albums: true;
		places: true;
		worldItems: true;
		concepts: true;
		prompts: true;
		notes: true;
		wildcards: true;
		relatedCharacters: true;
		relatedTo: true;
		_count: {
			select: {
				images: true;
				videos: true;
				tags: true;
				groups: true;
				properties: true;
				collections: true;
				albums: true;
				places: true;
				worldItems: true;
				concepts: true;
				prompts: true;
				notes: true;
				wildcards: true;
				relatedCharacters: true;
				relatedTo: true;
			};
		};
	};
}>;

/**
 * 🔄 Transforma un objeto Character de Prisma a nuestro tipo canónico CharacterComplete.
 *
 * @param prismaCharacter - El objeto Character obtenido de Prisma, debe incluir relaciones y conteos.
 * @returns Un objeto CharacterComplete compatible con nuestra aplicación, o null si la entrada es nula.
 */
export function fromPrismaCharacter(
	prismaCharacter: PrismaCharacterWithRelations | null,
): CharacterComplete | null {
	if (!prismaCharacter) {
		return null;
	}

	try {
		const { _count, ...baseData } = prismaCharacter;

		// Transformamos los datos crudos de Prisma al tipo de la aplicación
		return {
			...baseData,

			// Los campos JSON ya vienen como strings desde Prisma, los mantenemos así
			stats: baseData.stats || '{}',
			skills: baseData.skills || '[]',
			relationships: baseData.relationships || '[]',
			goals: baseData.goals || '[]',
			fears: baseData.fears || '[]',
			beliefs: baseData.beliefs || '[]',
			personality: baseData.personality || '[]',
			abilities: baseData.abilities || '[]',
			filters: baseData.filters || '[]',
			psychologicalProfile: baseData.psychologicalProfile || '',
			socialProfile: baseData.socialProfile || '',

			// Asegurar que las relaciones no sean nulas y estén transformadas
			images:
				baseData.images?.map(fromPrismaImage).filter((i): i is ImageComplete => i !== null) || [],
			videos:
				baseData.videos?.map(fromPrismaVideo).filter((v): v is VideoComplete => v !== null) || [],
			tags: baseData.tags?.map(fromPrismaTag).filter((t): t is TagComplete => t !== null) || [],
			groups:
				baseData.groups?.map(fromPrismaGroup).filter((g): g is GroupComplete => g !== null) || [],
			properties:
				baseData.properties
					?.map(fromPrismaProperty)
					.filter((p): p is PropertyComplete => p !== null) || [],
			collections:
				baseData.collections
					?.map(fromPrismaCollection)
					.filter((c): c is CollectionComplete => c !== null) || [],
			albums:
				baseData.albums?.map(fromPrismaAlbum).filter((a): a is AlbumComplete => a !== null) || [],
			places:
				baseData.places?.map(fromPrismaPlace).filter((p): p is PlaceComplete => p !== null) || [],
			worldItems:
				baseData.worldItems
					?.map(fromPrismaWorldItem)
					.filter((wi): wi is WorldItemComplete => wi !== null) || [],
			concepts:
				baseData.concepts
					?.map(fromPrismaConcept)
					.filter((c): c is ConceptComplete => c !== null) || [],
			prompts:
				baseData.prompts?.map(fromPrismaPrompt).filter((p): p is PromptComplete => p !== null) || [],
			notes: baseData.notes?.map(fromPrismaNote).filter((n): n is NoteComplete => n !== null) || [],
			wildcards:
				baseData.wildcards
					?.map(fromPrismaWildcard)
					.filter((w): w is WildcardComplete => w !== null) || [],
			relatedCharacters:
				baseData.relatedCharacters
					?.map(fromPrismaCharacter)
					.filter((c): c is CharacterComplete => c !== null) || [],
			relatedTo:
				baseData.relatedTo
					?.map(fromPrismaCharacter)
					.filter((c): c is CharacterComplete => c !== null) || [],

			// Agregar conteos
			_count: {
				images: _count?.images ?? 0,
				videos: _count?.videos ?? 0,
				tags: _count?.tags ?? 0,
				groups: _count?.groups ?? 0,
				properties: _count?.properties ?? 0,
				collections: _count?.collections ?? 0,
				albums: _count?.albums ?? 0,
				places: _count?.places ?? 0,
				worldItems: _count?.worldItems ?? 0,
				concepts: _count?.concepts ?? 0,
				prompts: _count?.prompts ?? 0,
				notes: _count?.notes ?? 0,
				wildcards: _count?.wildcards ?? 0,
				relatedCharacters: _count?.relatedCharacters ?? 0,
				relatedTo: _count?.relatedTo ?? 0,
			},
		};
	} catch (error) {
		logger.error('Error al transformar personaje de Prisma', { error, prismaCharacter });
		// Devolvemos null en caso de error para mantener consistencia
		return null;
	}
}

/**
 * 🔄 Transforma una lista de personajes de Prisma a una lista de CharacterComplete.
 *
 * @param prismaCharacters - Un array de objetos Character de Prisma.
 * @returns Un array de objetos CharacterComplete.
 */
export function fromPrismaCharacters(
	prismaCharacters: PrismaCharacterWithRelations[],
): CharacterComplete[] {
	return prismaCharacters.map(fromPrismaCharacter).filter((c): c is CharacterComplete => c !== null);
}
