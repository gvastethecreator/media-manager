/**
 * @file Exportaciones de transformadores para la entidad Note
 * @module transformers/note
 */

// Exportar serializadores
export {
  deserializeTags,
  extendNote,
  extendNotes,
  fromNoteComplete,
  // Funciones obsoletas, mantenidas por compatibilidad
  processNoteFields,
  serializeTags,
  toNoteComplete
} from './serializers';

// Exportar mappers
export {
  // Funciones obsoletas, mantenidas por compatibilidad
  prepareNoteForCreate,
  prepareNoteForUpdate, toCreateNoteData, toNoteExtended,
  toNotesExtended, toUpdateNoteData
} from './mappers';

