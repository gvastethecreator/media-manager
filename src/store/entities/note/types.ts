import { EntityType } from '@/types/entities/entities';
import type { NoteSortOption } from '@/types/entities/note/enums';
import type {
	NoteCreateInput,
	NoteFilters,
	NoteUpdateInput,
	NoteViewMode,
	NoteWithStats,
} from '@/types/entities/note/types';

/**
 * Store completo de Notas combinando todas las slices
 */
export interface NoteStore {
	// Estado - CoreSlice
	notes: Record<string, NoteWithStats>;
	selectedNote: NoteWithStats | null;
	selectedNoteId: string | null;
	selectedNoteIds: string[];
	isMultiSelectMode: boolean;
	isLoading: boolean;
	loading: boolean; // Alias para compatibilidad
	error: string | null;
	version: string;

	// Acciones - CoreSlice
	loadNotes: () => Promise<void>;
	createNote: (data: NoteCreateInput) => Promise<void>;
	updateNote: (id: string, data: NoteUpdateInput) => Promise<void>;
	deleteNote: (id: string) => Promise<void>;
	selectNote: (note: NoteWithStats | null) => void;
	reset: () => void;

	// Estado - FiltersSlice
	filters: NoteFilters & { search?: string };
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
