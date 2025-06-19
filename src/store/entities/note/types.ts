import { EntityType } from '@/types/entities/entities';
import type {
	NoteCreateInput,
	NoteFilters,
	NoteSortOption,
	NoteUpdateInput,
	NoteViewMode,
	NoteWithStats,
} from '@/types/entities/note';

/**
 * Store completo de Notas combinando todas las slices
 */
export interface NoteStore {
	// Estado - CoreSlice
	notes: NoteWithStats[];
	selectedNote: NoteWithStats | null;
	isLoading: boolean;
	error: string | null;

	// Acciones - CoreSlice
	loadNotes: () => Promise<void>;
	createNote: (data: NoteCreateInput) => Promise<void>;
	updateNote: (id: string, data: NoteUpdateInput) => Promise<void>;
	deleteNote: (id: string) => Promise<void>;
	selectNote: (note: NoteWithStats | null) => void;
	reset: () => void;

	// Estado - FiltersSlice
	filters: NoteFilters;
	sortBy: NoteSortOption;
	page: number;
	pageSize: number;

	// Estado - UISlice
	viewMode: NoteViewMode;
	isCreateModalOpen: boolean;
	isEditModalOpen: boolean;
	isDeleteDialogOpen: boolean;
	isDetailsDrawerOpen: boolean;

	// Acciones - FiltersSlice
	setFilters: (filters: Partial<NoteFilters>) => void;
	setSortBy: (sortOption: NoteSortOption) => void;
	setPage: (page: number) => void;
	setPageSize: (size: number) => void;
	setCategoryFilter: (category: string | null) => void;
	setStatusFilter: (status: string | null) => void;
	setPriorityFilter: (priority: number | null) => void;
	setSearchFilter: (search: string) => void;
	setTagsFilter: (tags: string[]) => void;
	setOnlyFavoritesFilter: (onlyFavorites: boolean) => void;
	clearFilters: () => void;

	// Acciones - UISlice
	openCreateModal: () => void;
	closeCreateModal: () => void;
	openEditModal: () => void;
	closeEditModal: () => void;
	openDeleteDialog: () => void;
	closeDeleteDialog: () => void;
	openDetailsDrawer: () => void;
	closeDetailsDrawer: () => void;
	setViewMode: (mode: NoteViewMode) => void;
	resetUI: () => void;

	// Acciones - RelationsSlice
	addNoteToEntity: (noteId: string, entityId: string, entityType: EntityType) => Promise<void>;
	removeNoteFromEntity: (noteId: string, entityId: string, entityType: EntityType) => Promise<void>;
}
