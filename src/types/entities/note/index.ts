/**
 * @file Exportaciones principales de tipos para la entidad Note
 * @module types/entities/note
 * @warning ⚠️ SOLO exportar tipos canónicos desde './types'.
 * @description Este barrel ha sido limpiado para evitar dependencias legacy. Usar únicamente '@/types/entities/note/types'.
 */

export type {
	NoteCreateInput as CreateNoteData,
	// Alias para retrocompatibilidad
	NoteComplete as Note,
	NoteBase,
	NoteComplete,
	NoteCounts,
	NoteCreateInput, // Alias para retrocompatibilidad
	NoteFilters,
	NoteRelations,
	NoteSearchOptions,
	NoteSearchResult,
	NoteTransformerOptions,
	NoteUI,
	NoteUpdateInput,
	NoteValidated, // Alias para retrocompatibilidad
	NoteComplete as NoteWithStats,
	RelatedNote,
} from './types';

export {
	NoteCategory,
	NotePriority,
	NoteSortCriteria,
	NoteStatus,
} from './types';
