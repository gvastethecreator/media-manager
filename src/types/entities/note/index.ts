/**
 * @file Exportaciones principales de tipos para la entidad Note
 * @module types/entities/note
 * @warning ⚠️ SOLO exportar tipos canónicos desde './types'.
 * @description Este barrel ha sido limpiado para evitar dependencias legacy. Usar únicamente '@/types/entities/note/types'.
 */

export type {
	NoteCreateInput as CreateNoteData, // Alias para retrocompatibilidad
	// Alias para retrocompatibilidad
	NoteWithStats as Note,
	NoteBase,
	NoteComplete,
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
	NoteWithStats,
	PrismaNoteWithCounts,
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
