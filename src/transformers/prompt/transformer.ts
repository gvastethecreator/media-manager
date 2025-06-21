/**
 * @file Transformador principal para la entidad Prompt.
 * @module transformers/prompt/transformer
 * @description Contiene la lógica para transformar datos de Prisma a tipos canónicos de la aplicación.
 */



import { serverLogger } from '@/lib/logger/server';
import { safeJsonParse } from '@/lib/utils/json';
import type { AlbumComplete } from '@/types/entities/album';
import type { CharacterComplete } from '@/types/entities/character';
import type { CollectionComplete } from '@/types/entities/collection';
import type { ConceptComplete } from '@/types/entities/concept';
import type { GroupComplete } from '@/types/entities/group';
import type { ImageComplete } from '@/types/entities/image';
import type { NoteComplete } from '@/types/entities/note';
import type { PlaceComplete } from '@/types/entities/place';
import type { PromptComplete, PromptParameter } from '@/types/entities/prompt';
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
import { fromPrismaPlace } from '../place/transformer';
import { fromPrismaProperty } from '../property/transformer';
import { fromPrismaTag } from '../tag/transformer';
import { fromPrismaVideo } from '../video/transformer';
import { fromPrismaWildcard } from '../wildcard/transformer';
import { fromPrismaWorldItem } from '../world-item/transformer';

const logger = serverLogger.withContext('PromptTransformer');

// --- TIPO DE PAYLOAD DE PRISMA ---

export const promptPayload = {
	include: {
		images: true,
		videos: true,
		albums: true,
		collections: true,
		tagEntities: true,
		characters: true,
		places: true,
		worldItems: true,
		concepts: true,
		notes: true,
		wildcards: true,
		properties: true,
		groups: true,
		_count: true,
	},
};

export type PromptFromPrisma = Prisma.PromptGetPayload<typeof promptPayload>;

/**
 * 🔄 Transforma un objeto Prompt de Prisma a un PromptComplete.
 * @param prompt - El objeto Prompt obtenido de Prisma.
 * @returns Un objeto PromptComplete o null.
 */
export function fromPrismaPrompt(prompt: PromptFromPrisma | null): PromptComplete | null {
	if (!prompt) return null;

	const { _count, parameters, tags, tagEntities, ...baseData } = prompt;

	return {
		...baseData,

		// Deserialización de campos JSON
		parameters: safeJsonParse<PromptParameter[]>(parameters, []),
		tags: safeJsonParse<string[]>(tags, []),

		// Mapeo de relaciones
		images: prompt.images?.map(fromPrismaImage).filter((i): i is ImageComplete => i !== null) || [],
		videos: prompt.videos?.map(fromPrismaVideo).filter((v): v is VideoComplete => v !== null) || [],
		albums: prompt.albums?.map(fromPrismaAlbum).filter((a): a is AlbumComplete => a !== null) || [],
		collections:
			prompt.collections?.map(fromPrismaCollection).filter((c): c is CollectionComplete => c !== null) || [],
		tagEntities: tagEntities?.map(fromPrismaTag).filter((t): t is TagComplete => t !== null) || [],
		characters:
			prompt.characters?.map(fromPrismaCharacter).filter((c): c is CharacterComplete => c !== null) || [],
		places: prompt.places?.map(fromPrismaPlace).filter((p): p is PlaceComplete => p !== null) || [],
		worldItems:
			prompt.worldItems?.map(fromPrismaWorldItem).filter((wi): wi is WorldItemComplete => wi !== null) || [],
		concepts: prompt.concepts?.map(fromPrismaConcept).filter((c): c is ConceptComplete => c !== null) || [],
		notes: prompt.notes?.map(fromPrismaNote).filter((n): n is NoteComplete => n !== null) || [],
		wildcards:
			prompt.wildcards?.map(fromPrismaWildcard).filter((w): w is WildcardComplete => w !== null) || [],
		properties:
			prompt.properties?.map(fromPrismaProperty).filter((p): p is PropertyComplete => p !== null) || [],
		groups: prompt.groups?.map(fromPrismaGroup).filter((g): g is GroupComplete => g !== null) || [],

		// Conteo de relaciones
		_count: {
			images: _count?.images ?? 0,
			videos: _count?.videos ?? 0,
			albums: _count?.albums ?? 0,
			collections: _count?.collections ?? 0,
			tagEntities: _count?.tagEntities ?? 0,
			characters: _count?.characters ?? 0,
			places: _count?.places ?? 0,
			worldItems: _count?.worldItems ?? 0,
			concepts: _count?.concepts ?? 0,
			notes: _count?.notes ?? 0,
			wildcards: _count?.wildcards ?? 0,
			properties: _count?.properties ?? 0,
			groups: _count?.groups ?? 0,
		},
	};
}

/**
 * 🔄 Transforma una lista de prompts de Prisma a una lista de PromptComplete.
 *
 * @param prismaPrompts - Un array de objetos Prompt de Prisma.
 * @returns Un array de objetos PromptComplete.
 */
export function fromPrismaPrompts(prismaPrompts: PromptFromPrisma[]): PromptComplete[] {
	return prismaPrompts.map(fromPrismaPrompt).filter((p): p is PromptComplete => p !== null);
}

// Alias para compatibilidad con código existente
export const transformPrompt = fromPrismaPrompt;
export const transformPrompts = fromPrismaPrompts;
