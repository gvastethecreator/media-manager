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
	// Acciones - RelationsSlice
	addNoteToEntity: (noteId: string, entityId: string, entityType: EntityType) => Promise<void>;
	clearFilters: () => void;
	closeCreateModal: () => void;
	closeDeleteDialog: () => void;
	closeDetailsDrawer: () => void;
	closeEditModal: () => void;
	createNote: (data: NoteCreateInput) => Promise<void>;
	deleteNote: (id: string) => Promise<void>;
	error: string | null;

	// Estado - FiltersSlice
	filters: NoteFilters & { search?: string };
	isCreateModalOpen: boolean;
	isDeleteDialogOpen: boolean;
	isDetailsDrawerOpen: boolean;
	isEditModalOpen: boolean;
	isLoading: boolean;
	isMultiSelectMode: boolean;
	loading: boolean; // Alias para compatibilidad

	// Acciones - CoreSlice
	loadNotes: () => Promise<void>;
	// Estado - CoreSlice
	notes: Record<string, NoteWithStats>;

	// Acciones - UISlice
	openCreateModal: () => void;
	openDeleteDialog: () => void;
	openDetailsDrawer: () => void;
	openEditModal: () => void;
	page: number;
	pageSize: number;
	removeNoteFromEntity: (noteId: string, entityId: string, entityType: EntityType) => Promise<void>;
	reset: () => void;
	resetUI: () => void;
	selectedNote: NoteWithStats | null;
	selectedNoteId: string | null;
	selectedNoteIds: string[];
	selectNote: (note: NoteWithStats | null) => void;
	setCategoryFilter: (category: string | null) => void;

	// Acciones - FiltersSlice
	setFilters: (filters: Partial<NoteFilters>) => void;
	setOnlyFavoritesFilter: (onlyFavorites: boolean) => void;
	setPage: (page: number) => void;
	setPageSize: (size: number) => void;
	setPriorityFilter: (priority: number | null) => void;
	setSearchFilter: (search: string) => void;
	setSortBy: (sortOption: NoteSortOption) => void;
	setStatusFilter: (status: string | null) => void;
	setTagsFilter: (tags: string[]) => void;
	setViewMode: (mode: NoteViewMode) => void;
	sortBy: NoteSortOption;
	updateNote: (id: string, data: NoteUpdateInput) => Promise<void>;
	version: string;

	// Estado - UISlice
	viewMode: NoteViewMode;
}
