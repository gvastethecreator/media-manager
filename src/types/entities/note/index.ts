/**
 * @file Exportaciones principales de tipos para la entidad Note
 * @module types/entities/note
 * @warning ⚠️ SOLO exportar tipos canónicos desde './types'.
 * @description Este barrel ha sido limpiado para evitar dependencias legacy. Usar únicamente '@/types/entities/note/types'.
 */

export { NoteCategory, NotePriority, NoteSortOption, NoteStatus, NoteViewMode } from './enums';
export type {
	NoteBase,
	NoteComplete,
	NoteCreateInput as CreateNoteData, // Alias para retrocompatibilidad
	NoteCreateInput,
	NoteFilters,
	NoteSearchOptions,
	NoteSearchResult,
	NoteStatistics,
	NoteStats,
	NoteTransformerOptions,
	NoteUpdateInput,
	NoteValidated,
	// Alias para retrocompatibilidad
	NoteWithStats as Note,
	NoteWithStats,
	RelatedNote,
} from './types';

export { NoteSortCriteria } from './types';
