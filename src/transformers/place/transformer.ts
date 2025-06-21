/**
 * @file Transformador principal para la entidad Place.
 * @module transformers/place/transformer
 * @description Contiene la lógica para transformar datos de Prisma a tipos canónicos de la aplicación.
 */

import { safeJsonParse } from '@/lib/utils/json';
import type { AlbumComplete } from '@/types/entities/album';
import type { CharacterComplete } from '@/types/entities/character';
import type { CollectionComplete } from '@/types/entities/collection';
import type { ConceptComplete } from '@/types/entities/concept';
import type { GroupComplete } from '@/types/entities/group';
import type { ImageComplete } from '@/types/entities/image';
import type { NoteComplete } from '@/types/entities/note';
import type { PlaceComplete, PlaceDanger, PlaceResource, PlaceStats } from '@/types/entities/place';
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
import { fromPrismaConcept } from '../concept/transformer';
import { fromPrismaGroup } from '../group/transformer';
import { fromPrismaImage } from '../image/transformer';
import { fromPrismaNote } from '../note/transformer';
import { fromPrismaPrompt } from '../prompt/transformer';
import { fromPrismaProperty } from '../property/transformer';
import { fromPrismaTag } from '../tag/transformer';
import { fromPrismaVideo } from '../video/transformer';
import { fromPrismaWildcard } from '../wildcard/transformer';
import { fromPrismaWorldItem } from '../world-item/transformer';

// --- TIPO DE PAYLOAD DE PRISMA ---

export const placePayload = {
	include: {
		images: true,
		videos: true,
		albums: true,
		collections: true,
		tags: true,
		characters: true,
		worldItems: true,
		concepts: true,
		prompts: true,
		notes: true,
		wildcards: true,
		properties: true,
		groups: true,
		_count: true,
	},
};

export type PlaceFromPrisma = Prisma.PlaceGetPayload<typeof placePayload>;

/**
 * 🔄 Transforma un objeto Place de Prisma a un PlaceComplete.
 * @param place - El objeto Place obtenido de Prisma.
 * @returns Un objeto PlaceComplete o null.
 */
export function fromPrismaPlace(place: PlaceFromPrisma | null): PlaceComplete | null {
	if (!place) return null;

	const { _count, dangers, resources, stats, filters, ...baseData } = place;

	return {
		...baseData,

		// Deserialización de campos JSON
		dangers: safeJsonParse<PlaceDanger[]>(dangers, []),
		resources: safeJsonParse<PlaceResource[]>(resources, []),
		stats: safeJsonParse<PlaceStats | null>(stats, null),
		filters: safeJsonParse<Record<string, any> | null>(filters, null),

		// Mapeo de relaciones
		images: place.images?.map(fromPrismaImage).filter((i): i is ImageComplete => i !== null) || [],
		videos: place.videos?.map(fromPrismaVideo).filter((v): v is VideoComplete => v !== null) || [],
		albums: place.albums?.map(fromPrismaAlbum).filter((a): a is AlbumComplete => a !== null) || [],
		collections:
			place.collections?.map(fromPrismaCollection).filter((c): c is CollectionComplete => c !== null) || [],
		tags: place.tags?.map(fromPrismaTag).filter((t): t is TagComplete => t !== null) || [],
		characters:
			place.characters?.map(fromPrismaCharacter).filter((c): c is CharacterComplete => c !== null) || [],
		worldItems:
			place.worldItems?.map(fromPrismaWorldItem).filter((wi): wi is WorldItemComplete => wi !== null) || [],
		concepts: place.concepts?.map(fromPrismaConcept).filter((c): c is ConceptComplete => c !== null) || [],
		prompts: place.prompts?.map(fromPrismaPrompt).filter((p): p is PromptComplete => p !== null) || [],
		notes: place.notes?.map(fromPrismaNote).filter((n): n is NoteComplete => n !== null) || [],
		wildcards:
			place.wildcards?.map(fromPrismaWildcard).filter((w): w is WildcardComplete => w !== null) || [],
		properties: place.properties?.map(fromPrismaProperty).filter((p): p is PropertyComplete => p !== null) || [],
		groups: place.groups?.map(fromPrismaGroup).filter((g): g is GroupComplete => g !== null) || [],

		// Conteo de relaciones
		_count: {
			images: _count?.images ?? 0,
			videos: _count?.videos ?? 0,
			albums: _count?.albums ?? 0,
			collections: _count?.collections ?? 0,
			tags: _count?.tags ?? 0,
			characters: _count?.characters ?? 0,
			worldItems: _count?.worldItems ?? 0,
			concepts: _count?.concepts ?? 0,
			prompts: _count?.prompts ?? 0,
			notes: _count?.notes ?? 0,
			wildcards: _count?.wildcards ?? 0,
			properties: _count?.properties ?? 0,
			groups: _count?.groups ?? 0,
		},
	};
}

/**
 * 🔄 Transforma una lista de objetos Place de Prisma a un array de PlaceComplete.
 * @param places - Los objetos Place obtenidos de Prisma.
 * @returns Un array de objetos PlaceComplete.
 */
export function fromPrismaPlaces(places: PlaceFromPrisma[]): PlaceComplete[] {
	return places.map(fromPrismaPlace).filter((p): p is PlaceComplete => p !== null);
}
