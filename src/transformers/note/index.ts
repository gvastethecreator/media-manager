/**
 * @file Exportaciones para el transformer de Note
 * @module transformers/note
 */

// Serializadores
export {
    deserializeTags, extendNote,
    extendNotes,
    // Funciones principales
    fromPrismaNote,
    // Utilidades para campos JSON
    serializeTags, toPrismaNote,
    validateNote,
    // Opciones de transformación
    type NoteTransformerOptions
} from './serializers';

// Mappers
export {
    // Funciones para Prisma
    mapCreateNoteDataToPrisma, mapNoteFiltersToPrisma, mapNoteSearchOptionsToPrisma, mapNoteToRelatedNote, mapUpdateNoteDataToPrisma,
    // Funciones obsoletas (mantenidas por compatibilidad)
    toCreateNoteData,
    toUpdateNoteData
} from './mappers';

// Exportaciones por defecto
import {
    extendNote,
    extendNotes,
    fromPrismaNote,
    toPrismaNote,
    validateNote
} from './serializers';

import {
    mapCreateNoteDataToPrisma,
    mapNoteFiltersToPrisma,
    mapNoteSearchOptionsToPrisma,
    mapNoteToRelatedNote,
    mapUpdateNoteDataToPrisma
} from './mappers';

export default {
  // Serializers
  fromPrisma: fromPrismaNote,
  toPrisma: toPrismaNote,
  validate: validateNote,
  extend: extendNote,
  extendMany: extendNotes,

  // Mappers
  mapCreateData: mapCreateNoteDataToPrisma,
  mapUpdateData: mapUpdateNoteDataToPrisma,
  mapSearchOptions: mapNoteSearchOptionsToPrisma,
  mapFilters: mapNoteFiltersToPrisma,
  mapToRelated: mapNoteToRelatedNote
};

