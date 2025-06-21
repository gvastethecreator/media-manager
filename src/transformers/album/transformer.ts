/**
 * @file Transformador principal para la entidad Album
 * @module transformers/album/transformer
 * @description Contiene la lógica para convertir un objeto Album de Prisma a nuestro tipo canónico.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { AlbumWithRelations } from '@/types/entities/album';
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
import { fromPrismaCharacter } from '../character/transformer';
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

const logger = serverLogger.withContext('AlbumTransformer');

/**
 * Tipo de Prisma para un álbum con todas sus relaciones y conteos.
 * Esto asegura que cualquier consulta a la base de datos que use este transformador
 * incluya todos los campos necesarios.
 */
type PrismaAlbumWithRelations = Prisma.AlbumGetPayload<{
	include: {
		images: true;
		videos: true;
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
		_count: {
			select: {
				images: true;
				videos: true;
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
			};
		};
	};
}>;

/**
 * 🔄 Transforma un objeto Album de Prisma a nuestro tipo canónico AlbumWithRelations.
 *
 * @param prismaAlbum - El objeto Album obtenido de Prisma.
 * @returns Un objeto AlbumWithRelations compatible con la aplicación, o null.
 */
export function fromPrismaAlbum(
	prismaAlbum: PrismaAlbumWithRelations | null,
): AlbumWithRelations | null {
	if (!prismaAlbum) {
		return null;
	}

	try {
		const { _count, ...baseData } = prismaAlbum;

		return {
			...baseData,
			category: baseData.category ?? 'general',
			// Mapear relaciones para asegurar tipos correctos
			images:
				baseData.images?.map(fromPrismaImage).filter((i): i is ImageComplete => i !== null) || [],
			videos:
				baseData.videos?.map(fromPrismaVideo).filter((v): v is VideoComplete => v !== null) || [],
			collections:
				baseData.collections
					?.map(fromPrismaCollection)
					.filter((c): c is CollectionComplete => c !== null) || [],
			tags: baseData.tags?.map(fromPrismaTag).filter((t): t is TagComplete => t !== null) || [],
			characters:
				baseData.characters
					?.map(fromPrismaCharacter)
					.filter((c): c is CharacterComplete => c !== null) || [],
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
			properties:
				baseData.properties
					?.map(fromPrismaProperty)
					.filter((p): p is PropertyComplete => p !== null) || [],
			groups:
				baseData.groups?.map(fromPrismaGroup).filter((g): g is GroupComplete => g !== null) || [],
			// Asignar el conteo de forma segura
			_count: {
				images: _count?.images ?? 0,
				videos: _count?.videos ?? 0,
				collections: _count?.collections ?? 0,
				tags: _count?.tags ?? 0,
				characters: _count?.characters ?? 0,
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
		logger.error('Error transformando álbum desde Prisma', {
			error,
			albumId: prismaAlbum?.id,
		});
		return null;
	}
}

/**
 * 🔄 Transforma una lista de álbumes de Prisma a una lista de AlbumWithRelations.
 *
 * @param prismaAlbums - Un array de objetos Album de Prisma.
 * @returns Un array de objetos AlbumWithRelations.
 */
export function fromPrismaAlbums(
	prismaAlbums: PrismaAlbumWithRelations[],
): AlbumWithRelations[] {
	return prismaAlbums.map(fromPrismaAlbum).filter((a): a is AlbumWithRelations => a !== null);
}
