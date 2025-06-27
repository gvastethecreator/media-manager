/**
 * @file Transformador principal para la entidad WorldItem.
 * @module transformers/world-item/transformer
 * @description Contiene la lógica para transformar datos de Prisma a tipos canónicos de la aplicación.
 */

import type { AlbumWithStats } from '@/types/entities/album';
import type { CollectionComplete } from '@/types/entities/collection';
import type { ConceptComplete } from '@/types/entities/concept';
import type { GroupWithStats } from '@/types/entities/group';
import type { ImageWithStats } from '@/types/entities/image';
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
import { fromPrismaConcept } from '../concept/transformer';
import { fromPrismaGroup } from '../group/transformer';
import { fromPrismaImageWithCounts } from '../image/transformer';
import { fromPrismaNote } from '../note/transformer';
import { fromPrismaPlace } from '../place/transformer';
import { fromPrismaPrompt } from '../prompt/transformer';
import { fromPrismaProperty } from '../property/transformer';
import { fromPrismaTag } from '../tag/transformer';
import { fromPrismaVideo } from '../video/transformer';
import { fromPrismaWildcard } from '../wildcard/transformer';
import {
	deserializeAttributes,
	deserializeEffects,
	deserializeFilters,
	deserializeRequirements,
	deserializeStats,
} from './serializers';

// --- TIPO DE PAYLOAD DE PRISMA ---

export const worldItemPayload = {
	include: {
		images: {
			include: {
				tags: true,
				albums: true,
				collections: true,
				characters: true,
				places: true,
				worldItems: true,
				concepts: true,
				prompts: true,
				notes: true,
				wildcards: true,
				properties: true,
				groups: true,
				folder: { select: { id: true, name: true, path: true } },
				_count: {
					select: {
						tags: true,
						albums: true,
						collections: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
		},
		videos: {
			include: {
				_count: {
					select: {
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
						groups: true,
					},
				},
			},
		},
		albums: true,
		collections: true,
		tags: true,
		characters: true,
		places: true,
		concepts: true,
		prompts: true,
		notes: true,
		wildcards: true,
		properties: true,
		groups: true,
		_count: true,
	},
};

export type WorldItemFromPrisma = Prisma.WorldItemGetPayload<typeof worldItemPayload>;

/**
 * 🔄 Transforma un objeto WorldItem de Prisma a un WorldItemComplete.
 * @param worldItem - El objeto WorldItem obtenido de Prisma.
 * @returns Un objeto WorldItemComplete.
 */
export function fromPrismaWorldItem(worldItem: WorldItemFromPrisma | null): WorldItemComplete | null {
	if (!worldItem) return null;

	const { _count, tags: relationTags, properties: relationProperties, ...baseData } = worldItem;

	return {
		...baseData,

		// Deserialización de campos JSON
		attributes: deserializeAttributes(worldItem.attributes),
		effects: deserializeEffects(worldItem.effects),
		requirements: deserializeRequirements(worldItem.requirements),
		stats: deserializeStats(worldItem.stats),
		filters: deserializeFilters(worldItem.filters),

		// Mapeo de relaciones - usando transformer optimizado para imágenes y videos
		images: worldItem.images?.map(fromPrismaImageWithCounts).filter((i): i is ImageWithStats => i !== null) || [],
		videos: worldItem.videos?.map(fromPrismaVideo).filter((v): v is VideoComplete => v !== null) || [],
		albums: worldItem.albums?.map(fromPrismaAlbum).filter((a): a is AlbumWithStats => a !== null) || [],
		collections:
			worldItem.collections?.map(fromPrismaCollection).filter((c): c is CollectionComplete => c !== null) || [],
		characters: worldItem.characters?.map(fromPrismaCharacter).filter((c): c is CharacterWithStats => c !== null) || [],
		places: worldItem.places?.map(fromPrismaPlace).filter((p): p is PlaceComplete => p !== null) || [],
		concepts: worldItem.concepts?.map(fromPrismaConcept).filter((c): c is ConceptComplete => c !== null) || [],
		prompts: worldItem.prompts?.map(fromPrismaPrompt).filter((p): p is PromptComplete => p !== null) || [],
		notes: worldItem.notes?.map(fromPrismaNote).filter((n): n is any => n !== null) || [],
		wildcards: worldItem.wildcards?.map(fromPrismaWildcard).filter((w): w is WildcardComplete => w !== null) || [],
		groups: worldItem.groups?.map(fromPrismaGroup).filter((g): g is GroupWithStats => g !== null) || [],

		// Asignación correcta de relaciones
		tags: relationTags?.map(fromPrismaTag).filter((t): t is TagComplete => t !== null) || [],
		properties: relationProperties?.map(fromPrismaProperty).filter((p): p is PropertyComplete => p !== null) || [],

		// Conteo de relaciones
		_count: {
			images: _count?.images ?? 0,
			videos: _count?.videos ?? 0,
			albums: _count?.albums ?? 0,
			collections: _count?.collections ?? 0,
			tags: _count?.tags ?? 0,
			characters: _count?.characters ?? 0,
			places: _count?.places ?? 0,
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
 * 🔄 Transforma una lista de objetos WorldItem de Prisma a un array de WorldItemComplete.
 * @param worldItems - Los objetos WorldItem obtenidos de Prisma.
 * @returns Un array de objetos WorldItemComplete.
 */
export function fromPrismaWorldItems(worldItems: WorldItemFromPrisma[]): WorldItemComplete[] {
	return worldItems.map(fromPrismaWorldItem).filter((w): w is WorldItemComplete => w !== null);
}
