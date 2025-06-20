/**
 * @file Transformadores principales para la entidad Note
 * @module transformers/note/transformer
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { NoteComplete } from '@/types/entities/note';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('NoteTransformer');

/**
 * 🔄 Transforma un objeto Note de Prisma a nuestro tipo canónico NoteComplete.
 *
 * @param prismaNote - El objeto Note obtenido de Prisma.
 * @returns Un objeto NoteComplete compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaNote(prismaNote: any): NoteComplete {
	if (!prismaNote) {
		throw new TransformerError('El objeto de nota de Prisma no puede ser nulo.');
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
export function fromPrismaNotes(prismaNotes: any[]): NoteComplete[] {
	return prismaNotes.map(fromPrismaNote);
}

// Alias para compatibilidad con código existente
export const transformNote = fromPrismaNote;
export const transformNotes = fromPrismaNotes;
export const toCreateNoteData = (data: any) => data;
export const toUpdateNoteData = (data: any) => data;
