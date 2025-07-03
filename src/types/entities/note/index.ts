/**
 * @file Exportaciones principales de tipos para la entidad Note
 * @module types/entities/note
 * @warning ⚠️ SOLO exportar tipos canónicos desde './types'.
 * @description Este barrel ha sido limpiado para evitar dependencias legacy. Usar únicamente '@/types/entities/note/types'.
 */

export type {
	NoteBase,
	NoteComplete,
	NoteCreateInput as CreateNoteData, // Alias para retrocompatibilidad
	NoteCreateInput, // Alias para retrocompatibilidad
	NoteFilters,
	NoteRelations,
	NoteSearchOptions,
	NoteSearchResult,
	NoteStatistics,
	NoteTransformerOptions,
	NoteUI,
	NoteUpdateInput,
	NoteValidated,
	// Alias para retrocompatibilidad
	NoteWithStats as Note,
	NoteWithStats,
	
	RelatedNote,
} from './types';

export {
	NoteCategory,
	NotePriority,
	NoteSortCriteria,
	NoteSortOption,
	NoteStatus,
	NoteViewMode,
} from './types';
