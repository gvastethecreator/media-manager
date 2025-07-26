/**
 * @file Funciones para serializar y deserializar datos de notas
 * @module transformers/note/serializers
 */

import { TransformerError } from '../../lib/errors/transformer-error';
import { serverLogger } from '../../lib/logger/server-logger';
import { NoteSchema } from '../../types/entities/note/schema';
import type {
	NoteBase,
	NoteComplete,
	NoteCreateInput,
	NoteTransformerOptions,
	NoteUpdateInput,
} from '../../types/entities/note/types';

// Logger específico para el transformer de Note
const logger = serverLogger.withContext('NoteSerializer');

/**
 * 🔄 Serializa un note completo para Drizzle
 * @param note Objeto NoteComplete con campos deserializados
 * @param options Opciones de transformación
 * @returns Objeto formateado para Drizzle
 */
export function toDrizzleNote(
	note: NoteComplete | NoteCreateInput | NoteUpdateInput,
	options: NoteTransformerOptions = {}
): Record<string, any> {
	try {
		const { validateFields = true } = options;

		if (validateFields) {
			NoteSchema.parse(note);
		}

		const { isFavorite, ...otherProps } = note as Record<string, any>;
		const drizzleData: Record<string, any> = { ...otherProps };

		if (isFavorite !== undefined) {
			drizzleData.isFavorite = isFavorite;
		}

		return drizzleData;
	} catch (error) {
		logger.error('Error transformando note a formato Drizzle', { error });
		throw new TransformerError(`Error transformando note a formato Drizzle: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Deserializa una nota desde Drizzle
 * @param drizzleNote Objeto de nota desde Drizzle
 * @param options Opciones de transformación
 * @returns Nota completa con campos deserializados
 */
export function fromDrizzleNote(
	drizzleNote: NoteBase & Record<string, any>,
	options: NoteTransformerOptions = {}
): NoteComplete {
	try {
		const { includeRelations = false, includeUI = false } = options;

		const noteComplete: Record<string, any> = { ...drizzleNote };

		if (includeRelations) {
			const relationsFields = [
				'images',
				'videos',
				'albums',
				'collections',
				'tags',
				'characters',
				'places',
				'worldItems',
				'concepts',
				'prompts',
				'notes',
				'wildcards',
				'properties',
				'groups',
			];

			for (const field of relationsFields) {
				if (drizzleNote[field]) {
					noteComplete[field] = drizzleNote[field];
				}
			}

			if (drizzleNote._count) {
				noteComplete._count = drizzleNote._count;
			}
		}

		if (includeUI) {
			const contentText = noteComplete.content || '';
			noteComplete.excerpt = contentText.length > 150 ? `${contentText.substring(0, 150)}...` : contentText;
			noteComplete.wordCount = contentText ? contentText.split(/\s+/).filter(Boolean).length : 0;

			if (noteComplete.updatedAt) {
				noteComplete.formattedDate =
					noteComplete.updatedAt instanceof Date
						? noteComplete.updatedAt.toLocaleDateString('es-ES', {
								day: '2-digit',
								month: '2-digit',
								year: 'numeric',
								hour: '2-digit',
								minute: '2-digit',
							})
						: new Date(noteComplete.updatedAt).toLocaleDateString('es-ES', {
								day: '2-digit',
								month: '2-digit',
								year: 'numeric',
								hour: '2-digit',
								minute: '2-digit',
							});
			}
		}

		return noteComplete as NoteComplete;
	} catch (error) {
		logger.error('Error transformando note desde formato Drizzle', { error });
		throw new TransformerError(`Error transformando note desde formato Drizzle: ${(error as Error).message}`);
	}
}

/**
 * 🔍 Valida una nota con el schema
 * @param note Objeto a validar
 * @returns Nota validada y tipada
 */
export function validateNote(note: Record<string, any>): NoteComplete {
	try {
		const validated = NoteSchema.parse(note);
		return validated as NoteComplete;
	} catch (error) {
		logger.error('Error validando nota', { error });
		throw new TransformerError(`Error validando nota: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Extiende una nota con datos adicionales
 * @param note Nota base
 * @param options Opciones de transformación
 * @returns Nota completa con campos extendidos
 */
export function extendNote(note: NoteBase & Record<string, any>, options: NoteTransformerOptions = {}): NoteComplete {
	try {
		return fromDrizzleNote(note, {
			...options,
			deserializeFields: true,
			includeUI: true,
		});
	} catch (error) {
		logger.error('Error extendiendo nota', { error });
		throw new TransformerError(`Error extendiendo nota: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Extiende múltiples notas con datos adicionales
 * @param notes Array de notas base
 * @param options Opciones de transformación
 * @returns Array de notas completas
 */
export function extendNotes(
	notes: (NoteBase & Record<string, any>)[],
	options: NoteTransformerOptions = {}
): NoteComplete[] {
	return notes.map((note) => extendNote(note, options));
}

/**
 * @deprecated Usa las funciones específicas en su lugar
 * Objeto con las funciones de serialización para compatibilidad
 */
export const NoteSerializer = {
	toDrizzleNote,
	fromDrizzleNote,
	validateNote,
	extendNote,
	extendNotes,
};

// Exportar como default para compatibilidad
export default NoteSerializer;
