/**
 * @file Transformador principal para la entidad Concept.
 * @module transformers/concept/transformer
 * @description Contiene la lógica para transformar datos de Prisma a tipos canónicos de la aplicación.
 */


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
import { fromPrismaCharacter } from '../character/transformer';
import { fromPrismaCollection } from '../collection/transformer';
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

// --- TIPO DE PAYLOAD DE PRISMA ---

export const conceptPayload = {
	include: {
		images: true,
		videos: true,
		albums: true,
		collections: true,
		tagEntities: true, // Usar el nombre de la relación en Prisma
		characters: true,
		places: true,
		worldItems: true,
		prompts: true,
		notes: true,
		wildcards: true,
		properties: true,
		groups: true,
		_count: true,
	},
};

export type ConceptFromPrisma = Prisma.ConceptGetPayload<typeof conceptPayload>;

/**
 * 🔄 Transforma un objeto Concept de Prisma a un ConceptComplete.
 * @param concept - El objeto Concept obtenido de Prisma.
 * @returns Un objeto ConceptComplete o null.
 */
export function fromPrismaConcept(concept: ConceptFromPrisma | null): ConceptComplete | null {
	if (!concept) return null;

	const { _count, tagEntities, ...baseData } = concept;

	return {
		...baseData,

		// Mapeo de relaciones
		images: concept.images?.map(fromPrismaImage).filter((i): i is ImageComplete => i !== null) || [],
		videos: concept.videos?.map(fromPrismaVideo).filter((v): v is VideoComplete => v !== null) || [],
		albums: concept.albums?.map(fromPrismaAlbum).filter((a): a is AlbumComplete => a !== null) || [],
		collections:
			concept.collections?.map(fromPrismaCollection).filter((c): c is CollectionComplete => c !== null) || [],
		tags: tagEntities?.map(fromPrismaTag).filter((t): t is TagComplete => t !== null) || [], // Renombrar a 'tags'
		characters:
			concept.characters?.map(fromPrismaCharacter).filter((c): c is CharacterComplete => c !== null) || [],
		places: concept.places?.map(fromPrismaPlace).filter((p): p is PlaceComplete => p !== null) || [],
		worldItems:
			concept.worldItems?.map(fromPrismaWorldItem).filter((wi): wi is WorldItemComplete => wi !== null) ||
			[],
		prompts: concept.prompts?.map(fromPrismaPrompt).filter((p): p is PromptComplete => p !== null) || [],
		notes: concept.notes?.map(fromPrismaNote).filter((n): n is NoteComplete => n !== null) || [],
		wildcards:
			concept.wildcards?.map(fromPrismaWildcard).filter((w): w is WildcardComplete => w !== null) || [],
		properties:
			concept.properties?.map(fromPrismaProperty).filter((p): p is PropertyComplete => p !== null) || [],
		groups: concept.groups?.map(fromPrismaGroup).filter((g): g is GroupComplete => g !== null) || [],

		// Conteo de relaciones
		_count: {
			images: _count?.images ?? 0,
			videos: _count?.videos ?? 0,
			albums: _count?.albums ?? 0,
			collections: _count?.collections ?? 0,
			tags: _count?.tagEntities ?? 0,
			characters: _count?.characters ?? 0,
			places: _count?.places ?? 0,
			worldItems: _count?.worldItems ?? 0,
			prompts: _count?.prompts ?? 0,
			notes: _count?.notes ?? 0,
			wildcards: _count?.wildcards ?? 0,
			properties: _count?.properties ?? 0,
			groups: _count?.groups ?? 0,
		},
	};
}

/**
 * 🔄 Transforma una lista de objetos Concept de Prisma a un array de ConceptComplete.
 * @param concepts - Los objetos Concept obtenidos de Prisma.
 * @returns Un array de objetos ConceptComplete.
 */
export function fromPrismaConcepts(concepts: ConceptFromPrisma[]): ConceptComplete[] {
	return concepts.map(fromPrismaConcept).filter((c): c is ConceptComplete => c !== null);
}
