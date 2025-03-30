/**
 * @file Funciones para serializar y deserializar datos de notas
 * @module transformers/note/serializers
 */

import { NoteSchema } from '@/types/entities/note/schema';
import type {
    NoteBase,
    NoteComplete,
    NoteCreateInput,
    NoteTags,
    NoteTransformerOptions,
    NoteUpdateInput
} from '@/types/entities/note/types';
import { createLogger } from '@/utils/logger';

// Logger específico para el transformer de Note
const log = createLogger('note-transformer');

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

        // Base de datos para Prisma
        const prismaData: Record<string, any> = {
            ...(note as Record<string, any>)
        };

        // Serializar tags si es un array
        if (deserializeFields && Array.isArray(note.tags)) {
            prismaData.tags = serializeTags(note.tags);
        }

        // Eliminar campos que no pertenecen al modelo Prisma
        delete prismaData.tagsArray;

        // Eliminar propiedades de UI
        delete prismaData.isSelected;
        delete prismaData.isEditing;
        delete prismaData.isExpanded;
        delete prismaData.isHovered;
        delete prismaData.isNew;
        delete prismaData.excerpt;
        delete prismaData.wordCount;
        delete prismaData.formattedDate;

        // Eliminar relaciones que se manejan de forma separada
        delete prismaData.images;
        delete prismaData.videos;
        delete prismaData.albums;
        delete prismaData.collections;
        delete prismaData.tagEntities;
        delete prismaData.characters;
        delete prismaData.places;
        delete prismaData.worldItems;
        delete prismaData.concepts;
        delete prismaData.prompts;
        delete prismaData.wildcards;
        delete prismaData.properties;
        delete prismaData.groups;
        delete prismaData._count;

        return prismaData;
    } catch (error) {
        log.error('Error transformando note a formato Prisma', { error });
        throw new Error(`Error transformando note a formato Prisma: ${(error as Error).message}`);
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

        // Base de la nota
        const noteComplete: Record<string, any> = {
            ...prismaNote
        };

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

            relationsFields.forEach(field => {
                if (prismaNote[field]) {
                    noteComplete[field] = prismaNote[field];
                }
            });

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
        log.error('Error transformando note desde formato Prisma', { error });
        throw new Error(`Error transformando note desde formato Prisma: ${(error as Error).message}`);
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
        log.error('Error serializando tags de nota', { error });
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
        log.error('Error deserializando tags de nota', { error });
        return [];
    }
}

/**
 * 🔍 Valida y formatea una nota para su uso
 * @param note Datos de la nota a validar
 * @returns Nota validada y formateada
 */
export function validateNote(note: Record<string, any>): NoteComplete {
    try {
        const validatedData = NoteSchema.parse(note);
        return validatedData as unknown as NoteComplete;
    } catch (error) {
        log.error('Error validando datos de nota', { error, note });
        throw new Error(`Error validando datos de nota: ${(error as Error).message}`);
    }
}

/**
 * 🎯 Extiende una nota con campos adicionales
 * @param note Nota base a extender
 * @param options Opciones de extensión
 * @returns Nota extendida con campos adicionales
 */
export function extendNote(
    note: NoteBase & Record<string, any>,
    options: NoteTransformerOptions = {}
): NoteComplete {
    try {
        // Crear la nota completa
        const extendedNote = fromPrismaNote(note, {
            ...options,
            includeUI: true
        });

        // Establecer valores por defecto para campos de UI
        extendedNote.isSelected = false;
        extendedNote.isEditing = false;
        extendedNote.isNew = false;
        extendedNote.isExpanded = false;
        extendedNote.isHovered = false;

        return extendedNote;
    } catch (error) {
        log.error('Error extendiendo nota', { error, note });
        throw new Error(`Error extendiendo nota: ${(error as Error).message}`);
    }
}

/**
 * 🔄 Extiende varias notas con campos adicionales
 * @param notes Lista de notas a extender
 * @param options Opciones de extensión
 * @returns Lista de notas extendidas
 */
export function extendNotes(
    notes: (NoteBase & Record<string, any>)[],
    options: NoteTransformerOptions = {}
): NoteComplete[] {
    return notes.map(note => extendNote(note, options));
}

// Exportar funciones obsoletas con alias para mantener compatibilidad
export const processNoteFields = (note: NoteBase): any => {
    log.warn('Función obsoleta: processNoteFields. Usar fromPrismaNote en su lugar.');
    return {
        ...note,
        tags: deserializeTags(note.tags)
    };
};

export const toNoteComplete = fromPrismaNote;
export const fromNoteComplete = toPrismaNote;
export const toNoteWithStats = (note: any): any => {
    log.warn('Función obsoleta: toNoteWithStats. Usar extendNote en su lugar.');
    return extendNote(note, { includeCount: true });
};
