/**
 * @file Transformadores principales para la entidad Note
 * @module transformers/note/transformer
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { NoteComplete } from '@/types/entities/note';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('NoteTransformer');

type PrismaNoteComplete = Prisma.NoteGetPayload<{
	include: {
		images: true;
		videos: true;
		albums: true;
		collections: true;
		tags: true;
		characters: true;
		places: true;
		worldItems: true;
		concepts: true;
		prompts: true;
		wildcards: true;
		properties: true;
		groups: true;
		_count: {
			select: {
				images: true;
				videos: true;
				albums: true;
				collections: true;
				tags: true;
				characters: true;
				places: true;
				worldItems: true;
				concepts: true;
				prompts: true;
				wildcards: true;
				properties: true;
				groups: true;
			};
		};
	};
}>;

/**
 * 🔄 Transforma un objeto Note de Prisma a nuestro tipo canónico NoteComplete.
 *
 * @param prismaNote - El objeto Note obtenido de Prisma.
 * @returns Un objeto NoteComplete compatible con nuestra aplicación o null.
 * @throws {TransformerError} Si hay un error durante la transformación.
 */
export function fromPrismaNote(prismaNote: PrismaNoteComplete | null): NoteComplete | null {
	if (!prismaNote) {
		return null;
	}

	try {
		const { _count, ...baseData } = prismaNote;

		return {
			...baseData,
			// Asegurar que las relaciones opcionales no sean undefined
			images: baseData.images ?? [],
			videos: baseData.videos ?? [],
			albums: baseData.albums ?? [],
			collections: baseData.collections ?? [],
			tags: baseData.tags ?? [],
			characters: baseData.characters ?? [],
			places: baseData.places ?? [],
			worldItems: baseData.worldItems ?? [],
			concepts: baseData.concepts ?? [],
			prompts: baseData.prompts ?? [],
			wildcards: baseData.wildcards ?? [],
			properties: baseData.properties ?? [],
			groups: baseData.groups ?? [],
			// Asignar el conteo de forma segura
			_count: {
				images: _count?.images ?? 0,
				videos: _count?.videos ?? 0,
				albums: _count?.albums ?? 0,
				collections: _count?.collections ?? 0,
				tags: _count?.tags ?? 0,
				characters: _count?.characters ?? 0,
				places: _count?.places ?? 0,
				worldItems: _count?.worldItems ?? 0,
				concepts: _count?.concepts ?? 0,
				prompts: _count?.prompts ?? 0,
				wildcards: _count?.wildcards ?? 0,
				properties: _count?.properties ?? 0,
				groups: _count?.groups ?? 0,
			},
		};
	} catch (error) {
		logger.error('Error transformando nota desde Prisma', {
			error,
			noteId: prismaNote?.id,
		});
		throw new TransformerError(`Error al transformar la nota: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una lista de notas de Prisma a una lista de NoteComplete.
 *
 * @param prismaNotes - Un array de objetos Note de Prisma.
 * @returns Un array de objetos NoteComplete.
 */
export function fromPrismaNotes(prismaNotes: PrismaNoteComplete[]): NoteComplete[] {
	return prismaNotes.map(fromPrismaNote).filter((note): note is NoteComplete => note !== null);
}

// Alias para compatibilidad con código existente
export const transformNote = fromPrismaNote;
export const transformNotes = fromPrismaNotes;
export const toCreateNoteData = (data: any) => data;
export const toUpdateNoteData = (data: any) => data;
