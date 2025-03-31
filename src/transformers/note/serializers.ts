/**
 * @file Funciones para serializar y deserializar datos de notas
 * @module transformers/note/serializers
 */

import { TransformerError } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { NoteSchema } from '@/types/entities/note/schema';
import type {
    NoteBase,
    NoteComplete,
    NoteCreateInput,
    NoteTags,
    NoteTransformerOptions,
    NoteUpdateInput
} from '@/types/entities/note/types';

// Logger específico para el transformer de Note
const logger = serverLogger.withContext('NoteSerializer');

/**
 * 🔄 Serializa un note completo para Prisma
 * @param note Objeto NoteComplete con campos deserializados
 * @param options Opciones de transformación
 * @returns Objeto formateado para Prisma
 */
export function toPrismaNote(
    note: NoteComplete | NoteCreateInput | NoteUpdateInput,
    options: NoteTransformerOptions = {}
): Record<string, any> {
    try {
        const { validateFields = true, deserializeFields = true } = options;

        // Validar datos de entrada si es requerido
        if (validateFields) {
            NoteSchema.parse(note);
        }

        // Base de datos para Prisma - crear una copia para evitar mutar el original
        const { isFavorite, tagsArray, ...otherProps } = note as Record<string, any>;

        // Resultado base
        const prismaData: Record<string, any> = { ...otherProps };

        // Convertir isFavorite a favorite si está presente
        if (isFavorite !== undefined) {
            prismaData.favorite = isFavorite;
        }

        // Serializar tags si es un array
        if (deserializeFields && Array.isArray(tagsArray)) {
            prismaData.tags = serializeTags(tagsArray);
        }

        // Filtrar propiedades que no pertenecen al modelo Prisma
        const filteredData: Record<string, any> = {};

        // Propiedades básicas que siempre se deben incluir si están presentes
        const baseProps = [
            'id', 'title', 'content', 'color', 'emoji', 'tags', 'status',
            'favorite', 'category', 'createdAt', 'updatedAt', 'isActive'
        ];

        for (const prop of baseProps) {
            if (prop in prismaData) {
                filteredData[prop] = prismaData[prop];
            }
        }

        return filteredData;
    } catch (error) {
        logger.error('Error transformando note a formato Prisma', { error });
        throw new TransformerError(`Error transformando note a formato Prisma: ${(error as Error).message}`, { cause: error });
    }
}

/**
 * 🔄 Deserializa una nota desde Prisma
 * @param prismaNote Objeto de nota desde Prisma
 * @param options Opciones de transformación
 * @returns Nota completa con campos deserializados
 */
export function fromPrismaNote(
    prismaNote: NoteBase & Record<string, any>,
    options: NoteTransformerOptions = {}
): NoteComplete {
    try {
        const { deserializeFields = true, includeRelations = false, includeUI = false } = options;

        // Base de la nota - crear una copia para evitar mutar el original
        const noteComplete: Record<string, any> = { ...prismaNote };

        // Convertir favorite a isFavorite para mantener consistencia
        if ('favorite' in prismaNote) {
            noteComplete.isFavorite = prismaNote.favorite;
        }

        // Deserializar campos JSON
        if (deserializeFields) {
            noteComplete.tagsArray = deserializeTags(prismaNote.tags);
        }

        // Incluir relaciones si están presentes y habilitadas
        if (includeRelations) {
            // Mantener todas las relaciones que existan en el objeto Prisma
            const relationsFields = [
                'images', 'videos', 'albums', 'collections', 'tags', 'characters',
                'places', 'worldItems', 'concepts', 'prompts', 'notes',
                'wildcards', 'properties', 'groups'
            ];

            for (const field of relationsFields) {
                if (prismaNote[field]) {
                    noteComplete[field] = prismaNote[field];
                }
            }

            // Incluir contadores si están presentes
            if (prismaNote._count) {
                noteComplete._count = prismaNote._count;
            }
        }

        // Incluir campos UI si se solicita
        if (includeUI) {
            // Calcular extracto del contenido
            const contentText = noteComplete.content || '';
            noteComplete.excerpt = contentText.length > 150
                ? `${contentText.substring(0, 150)}...`
                : contentText;

            // Calcular conteo de palabras
            noteComplete.wordCount = contentText
                ? contentText.split(/\s+/).filter(Boolean).length
                : 0;

            // Formatear fecha
            if (noteComplete.updatedAt) {
                noteComplete.formattedDate = noteComplete.updatedAt instanceof Date
                    ? noteComplete.updatedAt.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                    : new Date(noteComplete.updatedAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
            }
        }

        return noteComplete as NoteComplete;
    } catch (error) {
        logger.error('Error transformando note desde formato Prisma', { error });
        throw new TransformerError(`Error transformando note desde formato Prisma: ${(error as Error).message}`, { cause: error });
    }
}

/**
 * 💾 Serializa los tags de una nota
 * @param tags Array de tags
 * @returns JSON string de tags
 */
export function serializeTags(tags: string[]): string {
    try {
        const tagsObj: NoteTags = { items: tags };
        return JSON.stringify(tagsObj);
    } catch (error) {
        logger.error('Error serializando tags de nota', { error });
        return JSON.stringify({ items: [] });
    }
}

/**
 * 🔍 Deserializa los tags de una nota
 * @param tagsJson JSON string de tags
 * @returns Array de tags
 */
export function deserializeTags(tagsJson: string | null | undefined): string[] {
    if (!tagsJson || tagsJson === 'empty_array') return [];

    try {
        const parsed = JSON.parse(tagsJson) as NoteTags;
        return Array.isArray(parsed.items) ? parsed.items : [];
    } catch (error) {
        logger.error('Error deserializando tags de nota', { error });
        return [];
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
        throw new TransformerError(`Error validando nota: ${(error as Error).message}`, { cause: error });
    }
}

/**
 * 🔄 Extiende una nota con datos adicionales
 * @param note Nota base
 * @param options Opciones de transformación
 * @returns Nota completa con campos extendidos
 */
export function extendNote(
    note: NoteBase & Record<string, any>,
    options: NoteTransformerOptions = {}
): NoteComplete {
    try {
        // Usar fromPrismaNote para hacer la transformación completa
        return fromPrismaNote(note, {
            ...options,
            deserializeFields: true,
            includeUI: true
        });
    } catch (error) {
        logger.error('Error extendiendo nota', { error });
        throw new TransformerError(`Error extendiendo nota: ${(error as Error).message}`, { cause: error });
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
    return notes.map(note => extendNote(note, options));
}

/**
 * @deprecated Usa las funciones específicas en su lugar
 * Objeto con las funciones de serialización para compatibilidad
 */
export const NoteSerializer = {
    toPrismaNote,
    fromPrismaNote,
    serializeTags,
    deserializeTags,
    validateNote,
    extendNote,
    extendNotes
};

// Exportar como default para compatibilidad
export default NoteSerializer;
