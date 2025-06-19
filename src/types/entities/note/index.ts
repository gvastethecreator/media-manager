/**
 * @file Exportaciones principales de tipos para la entidad Note
 * @module types/entities/note
 * @warning ⚠️ SOLO exportar tipos canónicos desde './types'.
 * @description Este barrel ha sido limpiado para evitar dependencias legacy. Usar únicamente '@/types/entities/note/types'.
 */

export type {
    // Alias para retrocompatibilidad
    NoteComplete as Note, NoteBase,
    NoteComplete, NoteCounts,
    NoteCreateInput,
    NoteFilters,
    NoteRelations,
    NoteSearchOptions,
    NoteSearchResult,
    NoteTransformerOptions,
    NoteUI,
    NoteUpdateInput,
    NoteValidated,
    RelatedNote
} from './types';

export {
    NoteCategory,
    NotePriority,
    NoteSortCriteria,
    NoteStatus
} from './types';

