/**
 * @file Tests completos para FolderStore
 * @module tests/stores/folder.store.test
 * @description Pruebas unitarias comprehensivas para el store de Folder
 */

import { useFolderStore } from '@/store/entities/folder/store';
import type { CreateFolderData, FolderWithRelations, UpdateFolderData } from '@/types/entities/folder/types';

// 🧪 Mock del logger para evitar logs durante las pruebas
jest.mock('@/lib/logger/client-logger', () => ({
	clientLogger: {
		withContext: jest.fn(() => ({
			info: jest.fn(),
			error: jest.fn(),
			warn: jest.fn(),
			debug: jest.fn(),
		})),
	},
}));

// 🎭 Mock del transformer para datos consistentes
jest.mock('@/transformers/folder', () => ({
	transformFolder: jest.fn((folder: any): FolderWithRelations => ({
		id: folder.id || 'test-folder-id',
		name: folder.name || 'Test Folder',
		path: folder.path || '/test/path',
		description: folder.description || 'Test description',
		color: folder.color || '#3B82F6',
		emoji: folder.emoji || '📁',
		parentId: folder.parentId || null,
		isHidden: folder.isHidden || false,
		isFavorite: folder.isFavorite || false,
		autoReindex: folder.autoReindex || false,
		totalFiles: folder.totalFiles || 0,
		totalSize: folder.totalSize || 0,
		lastIndexed: folder.lastIndexed || new Date(),
		createdAt: folder.createdAt || new Date(),
		updatedAt: folder.updatedAt || new Date(),
		children: folder.children || [],
		parent: folder.parent || null,
		_count: folder._count || {
			children: 0,
			images: 0,
			uploadedImages: 0,
			tags: 0,
		},
	})),
}));

// 🎯 Mock de las actions para simulación controlada
const mockActions = {
	fetchFolders: jest.fn(),
	fetchFolderById: jest.fn(),
	createFolder: jest.fn(),
	updateFolder: jest.fn(),
	deleteFolder: jest.fn(),
};

jest.mock('@/store/entities/folder/actions', () => mockActions);

// 📁 Datos de prueba
const mockFolderData: FolderWithRelations = {
	id: 'folder-1',
	name: 'Test Folder',
	path: '/test/folder',
	description: 'A test folder',
	color: '#3B82F6',
	emoji: '📁',
	parentId: null,
	isHidden: false,
	isFavorite: false,
	autoReindex: true,
	totalFiles: 25,
	totalSize: 1024000,
	lastIndexed: new Date('2024-01-15T10:00:00.000Z'),
	createdAt: new Date('2024-01-01T10:00:00.000Z'),
	updatedAt: new Date('2024-01-15T10:00:00.000Z'),
	children: [],
	parent: null,
	_count: {
		children: 0,
		images: 25,
		uploadedImages: 25,
		tags: 5,
	},
};

const mockFoldersList: FolderWithRelations[] = [
	mockFolderData,
	{
		...mockFolderData,
		id: 'folder-2',
		name: 'Photos 2024',
		path: '/photos/2024',
		description: 'Photos from 2024',
		emoji: '📷',
		parentId: 'folder-1',
		isFavorite: true,
		totalFiles: 150,
		totalSize: 5120000,
		_count: {
			children: 2,
			images: 150,
			uploadedImages: 150,
			tags: 8,
		},
	},
	{
		...mockFolderData,
		id: 'folder-3',
		name: 'Documents',
		path: '/documents',
		description: 'Important documents',
		emoji: '📄',
		isHidden: true,
		totalFiles: 50,
		totalSize: 2048000,
		_count: {
			children: 5,
			images: 50,
			uploadedImages: 40,
			tags: 3,
		},
	},
];

const mockCreateData: CreateFolderData = {
	name: 'New Folder',
	path: '/new/folder',
	description: 'A new test folder',
	emoji: '📂',
	color: '#10B981',
	isFavorite: false,
	autoReindex: true,
};

const mockUpdateData: UpdateFolderData = {
	name: 'Updated Folder',
	description: 'Updated description',
	emoji: '📁',
	color: '#EF4444',
	isFavorite: true,
	autoReindex: false,
};

describe('FolderStore', () => {
	beforeEach(() => {
		// 🔄 Reset del store antes de cada test
		const store = useFolderStore.getState();
		useFolderStore.setState({
			coreState: {
				folders: [],
				currentFolderId: null,
				currentFolder: null,
				loading: false,
				error: null,
				isCreating: false,
				isUpdating: false,
				isDeleting: false,
			},
			uiState: {
				viewMode: 'grid',
				itemSize: 'medium',
				sidebarExpanded: true,
				expandedFolders: [],
				showCreateModal: false,
				showEditModal: false,
				showDeleteModal: false,
				showStatsModal: false,
				statsSelectedFolderId: null,
			},
			filtersState: {
				searchTerm: '',
				sortBy: 'name',
				sortDirection: 'asc',
				showFavorites: false,
				activeOnly: true,
				categoryFilter: null,
				minSize: null,
				maxSize: null,
				minFiles: null,
				maxFiles: null,
				notIndexed: false,
				autoReindexOnly: false,
				indexedAfter: null,
				indexedBefore: null,
			},
		});

		// 🧹 Limpiar mocks
		jest.clearAllMocks();
	});

	describe('Core Slice - CRUD Operations', () => {
		describe('fetchFolders', () => {
			it('✅ should fetch folders successfully', async () => {
				// Arrange
				mockActions.fetchFolders.mockResolvedValue({
					success: true,
					data: mockFoldersList,
					message: 'Folders fetched successfully',
				});

				// Act
				await useFolderStore.getState().coreActions.fetchFolders();

				// Assert
				const state = useFolderStore.getState();
				expect(state.coreState.folders).toEqual(mockFoldersList);
				expect(state.coreState.loading).toBe(false);
				expect(state.coreState.error).toBe(null);
				expect(mockActions.fetchFolders).toHaveBeenCalledTimes(1);
			});

			it('❌ should handle fetch folders error', async () => {
				// Arrange
				const errorMessage = 'Failed to fetch folders';
				mockActions.fetchFolders.mockRejectedValue(new Error(errorMessage));

				// Act
				await useFolderStore.getState().coreActions.fetchFolders();

				// Assert
				const state = useFolderStore.getState();
				expect(state.coreState.folders).toEqual([]);
				expect(state.coreState.loading).toBe(false);
				expect(state.coreState.error).toBe(errorMessage);
			});

			it('🔄 should set loading state during fetch', async () => {
				// Arrange
				let resolvePromise: (value: any) => void;
				const promise = new Promise((resolve) => {
					resolvePromise = resolve;
				});
				mockActions.fetchFolders.mockReturnValue(promise);

				// Act
				const fetchPromise = useFolderStore.getState().coreActions.fetchFolders();

				// Assert loading state
				const loadingState = useFolderStore.getState();
				expect(loadingState.coreState.loading).toBe(true);

				// Resolve and check final state
				resolvePromise!({
					success: true,
					data: mockFoldersList,
					message: 'Success',
				});
				await fetchPromise;

				const finalState = useFolderStore.getState();
				expect(finalState.coreState.loading).toBe(false);
			});
		});

		describe('fetchFolderById', () => {
			it('✅ should fetch folder by ID successfully', async () => {
				// Arrange
				const folderId = 'folder-1';
				mockActions.fetchFolderById.mockResolvedValue({
					success: true,
					data: mockFolderData,
					message: 'Folder fetched successfully',
				});

				// Act
				const result = await useFolderStore.getState().coreActions.fetchFolderById(folderId);

				// Assert
				expect(result).toEqual(mockFolderData);
				const state = useFolderStore.getState();
				expect(state.coreState.currentFolder).toEqual(mockFolderData);
				expect(state.coreState.currentFolderId).toBe(folderId);
				expect(state.coreState.loading).toBe(false);
				expect(mockActions.fetchFolderById).toHaveBeenCalledWith(folderId);
			});

			it('❌ should handle folder not found', async () => {
				// Arrange
				const folderId = 'non-existent-folder';
				mockActions.fetchFolderById.mockResolvedValue({
					success: false,
					data: null,
					message: 'Folder not found',
				});

				// Act
				const result = await useFolderStore.getState().coreActions.fetchFolderById(folderId);

				// Assert
				expect(result).toBe(null);
				const state = useFolderStore.getState();
				expect(state.coreState.currentFolder).toBe(null);
				expect(state.coreState.loading).toBe(false);
				expect(state.coreState.error).toBe('Folder not found');
			});

			it('❌ should handle fetch by ID error', async () => {
				// Arrange
				const folderId = 'folder-1';
				const errorMessage = 'Database connection failed';
				mockActions.fetchFolderById.mockRejectedValue(new Error(errorMessage));

				// Act
				const result = await useFolderStore.getState().coreActions.fetchFolderById(folderId);

				// Assert
				expect(result).toBe(null);
				const state = useFolderStore.getState();
				expect(state.coreState.error).toBe(errorMessage);
				expect(state.coreState.loading).toBe(false);
			});
		});

		describe('createFolder', () => {
			it('✅ should create folder successfully', async () => {
				// Arrange
				const newFolder = { ...mockFolderData, ...mockCreateData, id: 'new-folder-id' };
				mockActions.createFolder.mockResolvedValue({
					success: true,
					data: newFolder,
					message: 'Folder created successfully',
				});

				// Act
				const result = await useFolderStore.getState().coreActions.createFolder(mockCreateData);

				// Assert
				expect(result).toEqual(newFolder);
				const state = useFolderStore.getState();
				expect(state.coreState.folders).toContain(newFolder);
				expect(state.coreState.isCreating).toBe(false);
				expect(state.coreState.error).toBe(null);
				expect(mockActions.createFolder).toHaveBeenCalledWith(mockCreateData);
			});

			it('❌ should handle create folder error', async () => {
				// Arrange
				const errorMessage = 'Folder already exists';
				mockActions.createFolder.mockResolvedValue({
					success: false,
					data: null,
					message: errorMessage,
				});

				// Act
				const result = await useFolderStore.getState().coreActions.createFolder(mockCreateData);

				// Assert
				expect(result).toBe(null);
				const state = useFolderStore.getState();
				expect(state.coreState.isCreating).toBe(false);
				expect(state.coreState.error).toBe(errorMessage);
			});

			it('🔄 should set creating state during folder creation', async () => {
				// Arrange
				let resolvePromise: (value: any) => void;
				const promise = new Promise((resolve) => {
					resolvePromise = resolve;
				});
				mockActions.createFolder.mockReturnValue(promise);

				// Act
				const createPromise = useFolderStore.getState().coreActions.createFolder(mockCreateData);

				// Assert loading state
				const creatingState = useFolderStore.getState();
				expect(creatingState.coreState.isCreating).toBe(true);

				// Resolve and check final state
				resolvePromise!({
					success: true,
					data: { ...mockFolderData, ...mockCreateData },
					message: 'Success',
				});
				await createPromise;

				const finalState = useFolderStore.getState();
				expect(finalState.coreState.isCreating).toBe(false);
			});
		});

		describe('updateFolder', () => {
			beforeEach(() => {
				// Pre-populate with folders
				useFolderStore.setState({
					coreState: {
						...useFolderStore.getState().coreState,
						folders: mockFoldersList,
						currentFolderId: 'folder-1',
						currentFolder: mockFolderData,
					},
				});
			});

			it('✅ should update folder successfully', async () => {
				// Arrange
				const updatedFolder = { ...mockFolderData, ...mockUpdateData };
				mockActions.updateFolder.mockResolvedValue({
					success: true,
					data: updatedFolder,
					message: 'Folder updated successfully',
				});

				// Act
				const result = await useFolderStore.getState().coreActions.updateFolder('folder-1', mockUpdateData);

				// Assert
				expect(result).toEqual(updatedFolder);
				const state = useFolderStore.getState();
				const updatedInList = state.coreState.folders.find((f) => f.id === 'folder-1');
				expect(updatedInList).toEqual(updatedFolder);
				expect(state.coreState.currentFolder).toEqual(updatedFolder);
				expect(state.coreState.isUpdating).toBe(false);
				expect(mockActions.updateFolder).toHaveBeenCalledWith('folder-1', mockUpdateData);
			});

			it('✅ should handle updating non-existing folder in state', async () => {
				// Arrange
				const newId = 'new-folder-id';
				const updatedFolder = { ...mockFolderData, id: newId, ...mockUpdateData };
				mockActions.updateFolder.mockResolvedValue({
					success: true,
					data: updatedFolder,
					message: 'Folder updated successfully',
				});

				// Act
				const result = await useFolderStore.getState().coreActions.updateFolder(newId, mockUpdateData);

				// Assert
				expect(result).toEqual(updatedFolder);
				const state = useFolderStore.getState();
				expect(state.coreState.folders).toContain(updatedFolder);
			});

			it('❌ should handle update folder error', async () => {
				// Arrange
				const errorMessage = 'Failed to update folder';
				mockActions.updateFolder.mockResolvedValue({
					success: false,
					data: null,
					message: errorMessage,
				});

				// Act
				const result = await useFolderStore.getState().coreActions.updateFolder('folder-1', mockUpdateData);

				// Assert
				expect(result).toBe(null);
				const state = useFolderStore.getState();
				expect(state.coreState.isUpdating).toBe(false);
				expect(state.coreState.error).toBe(errorMessage);
			});

			it('🔄 should set updating state during folder update', async () => {
				// Arrange
				let resolvePromise: (value: any) => void;
				const promise = new Promise((resolve) => {
					resolvePromise = resolve;
				});
				mockActions.updateFolder.mockReturnValue(promise);

				// Act
				const updatePromise = useFolderStore.getState().coreActions.updateFolder('folder-1', mockUpdateData);

				// Assert updating state
				const updatingState = useFolderStore.getState();
				expect(updatingState.coreState.isUpdating).toBe(true);

				// Resolve and check final state
				resolvePromise!({
					success: true,
					data: { ...mockFolderData, ...mockUpdateData },
					message: 'Success',
				});
				await updatePromise;

				const finalState = useFolderStore.getState();
				expect(finalState.coreState.isUpdating).toBe(false);
			});
		});

		describe('deleteFolder', () => {
			beforeEach(() => {
				// Pre-populate with folders
				useFolderStore.setState({
					coreState: {
						...useFolderStore.getState().coreState,
						folders: mockFoldersList,
						currentFolderId: 'folder-1',
						currentFolder: mockFolderData,
					},
				});
			});

			it('✅ should delete folder successfully', async () => {
				// Arrange
				mockActions.deleteFolder.mockResolvedValue({
					success: true,
					message: 'Folder deleted successfully',
				});

				// Act
				const result = await useFolderStore.getState().coreActions.deleteFolder('folder-1');

				// Assert
				expect(result).toBe(true);
				const state = useFolderStore.getState();
				expect(state.coreState.folders).not.toContain(mockFolderData);
				expect(state.coreState.currentFolder).toBe(null);
				expect(state.coreState.currentFolderId).toBe(null);
				expect(state.coreState.isDeleting).toBe(false);
				expect(mockActions.deleteFolder).toHaveBeenCalledWith('folder-1');
			});

			it('✅ should delete folder without affecting current if different', async () => {
				// Arrange
				useFolderStore.setState({
					coreState: {
						...useFolderStore.getState().coreState,
						currentFolderId: 'folder-2',
						currentFolder: mockFoldersList[1],
					},
				});
				mockActions.deleteFolder.mockResolvedValue({
					success: true,
					message: 'Folder deleted successfully',
				});

				// Act
				const result = await useFolderStore.getState().coreActions.deleteFolder('folder-1');

				// Assert
				expect(result).toBe(true);
				const state = useFolderStore.getState();
				expect(state.coreState.folders).not.toContain(mockFolderData);
				expect(state.coreState.currentFolder).toEqual(mockFoldersList[1]);
				expect(state.coreState.currentFolderId).toBe('folder-2');
			});

			it('❌ should handle delete folder error', async () => {
				// Arrange
				const errorMessage = 'Cannot delete folder with content';
				mockActions.deleteFolder.mockResolvedValue({
					success: false,
					message: errorMessage,
				});

				// Act
				const result = await useFolderStore.getState().coreActions.deleteFolder('folder-1');

				// Assert
				expect(result).toBe(false);
				const state = useFolderStore.getState();
				expect(state.coreState.folders).toContain(mockFolderData);
				expect(state.coreState.isDeleting).toBe(false);
				expect(state.coreState.error).toBe(errorMessage);
			});

			it('🔄 should set deleting state during folder deletion', async () => {
				// Arrange
				let resolvePromise: (value: any) => void;
				const promise = new Promise((resolve) => {
					resolvePromise = resolve;
				});
				mockActions.deleteFolder.mockReturnValue(promise);

				// Act
				const deletePromise = useFolderStore.getState().coreActions.deleteFolder('folder-1');

				// Assert deleting state
				const deletingState = useFolderStore.getState();
				expect(deletingState.coreState.isDeleting).toBe(true);

				// Resolve and check final state
				resolvePromise!({
					success: true,
					message: 'Success',
				});
				await deletePromise;

				const finalState = useFolderStore.getState();
				expect(finalState.coreState.isDeleting).toBe(false);
			});
		});

		describe('State Management Actions', () => {
			beforeEach(() => {
				// Pre-populate with folders
				useFolderStore.setState({
					coreState: {
						...useFolderStore.getState().coreState,
						folders: mockFoldersList,
					},
				});
			});

			describe('setCurrentFolderId', () => {
				it('✅ should set current folder by ID when folder exists in state', () => {
					// Act
					useFolderStore.getState().coreActions.setCurrentFolderId('folder-2');

					// Assert
					const state = useFolderStore.getState();
					expect(state.coreState.currentFolderId).toBe('folder-2');
					expect(state.coreState.currentFolder).toEqual(mockFoldersList[1]);
				});

				it('✅ should set current folder ID when folder not in state', () => {
					// Act
					useFolderStore.getState().coreActions.setCurrentFolderId('non-existent-folder');

					// Assert
					const state = useFolderStore.getState();
					expect(state.coreState.currentFolderId).toBe('non-existent-folder');
					expect(state.coreState.currentFolder).toBe(null);
				});

				it('✅ should clear current folder when ID is null', () => {
					// Arrange
					useFolderStore.setState({
						coreState: {
							...useFolderStore.getState().coreState,
							currentFolderId: 'folder-1',
							currentFolder: mockFolderData,
						},
					});

					// Act
					useFolderStore.getState().coreActions.setCurrentFolderId(null);

					// Assert
					const state = useFolderStore.getState();
					expect(state.coreState.currentFolderId).toBe(null);
					expect(state.coreState.currentFolder).toBe(null);
				});
			});

			describe('setCurrentFolder', () => {
				it('✅ should set current folder directly', () => {
					// Act
					useFolderStore.getState().coreActions.setCurrentFolder(mockFolderData);

					// Assert
					const state = useFolderStore.getState();
					expect(state.coreState.currentFolder).toEqual(mockFolderData);
					expect(state.coreState.currentFolderId).toBe(mockFolderData.id);
				});

				it('✅ should clear current folder when passed null', () => {
					// Arrange
					useFolderStore.setState({
						coreState: {
							...useFolderStore.getState().coreState,
							currentFolderId: 'folder-1',
							currentFolder: mockFolderData,
						},
					});

					// Act
					useFolderStore.getState().coreActions.setCurrentFolder(null);

					// Assert
					const state = useFolderStore.getState();
					expect(state.coreState.currentFolder).toBe(null);
					expect(state.coreState.currentFolderId).toBe(null);
				});
			});

			describe('resetError', () => {
				it('✅ should reset error state', () => {
					// Arrange
					useFolderStore.setState({
						coreState: {
							...useFolderStore.getState().coreState,
							error: 'Some error occurred',
						},
					});

					// Act
					useFolderStore.getState().coreActions.resetError();

					// Assert
					const state = useFolderStore.getState();
					expect(state.coreState.error).toBe(null);
				});
			});
		});
	});

	describe('UI Slice - User Interface Management', () => {
		describe('View Mode Management', () => {
			it('✅ should set view mode', () => {
				// Act
				useFolderStore.getState().uiActions.setViewMode('list');

				// Assert
				const state = useFolderStore.getState();
				expect(state.uiState.viewMode).toBe('list');
			});

			it('✅ should set item size', () => {
				// Act
				useFolderStore.getState().uiActions.setItemSize('large');

				// Assert
				const state = useFolderStore.getState();
				expect(state.uiState.itemSize).toBe('large');
			});

			it('✅ should toggle sidebar', () => {
				// Act
				useFolderStore.getState().uiActions.toggleSidebar();

				// Assert
				const state = useFolderStore.getState();
				expect(state.uiState.sidebarExpanded).toBe(false);

				// Act again
				useFolderStore.getState().uiActions.toggleSidebar();

				// Assert
				const newState = useFolderStore.getState();
				expect(newState.uiState.sidebarExpanded).toBe(true);
			});
		});

		describe('Folder Expansion Management', () => {
			it('✅ should toggle folder expanded state', () => {
				// Act - Expand folder
				useFolderStore.getState().uiActions.toggleFolderExpanded('folder-1');

				// Assert
				let state = useFolderStore.getState();
				expect(state.uiState.expandedFolders).toContain('folder-1');

				// Act - Collapse folder
				useFolderStore.getState().uiActions.toggleFolderExpanded('folder-1');

				// Assert
				state = useFolderStore.getState();
				expect(state.uiState.expandedFolders).not.toContain('folder-1');
			});

			it('✅ should handle multiple expanded folders', () => {
				// Act
				useFolderStore.getState().uiActions.toggleFolderExpanded('folder-1');
				useFolderStore.getState().uiActions.toggleFolderExpanded('folder-2');
				useFolderStore.getState().uiActions.toggleFolderExpanded('folder-3');

				// Assert
				const state = useFolderStore.getState();
				expect(state.uiState.expandedFolders).toEqual(['folder-1', 'folder-2', 'folder-3']);
			});
		});

		describe('Modal Management', () => {
			describe('Create Modal', () => {
				it('✅ should open create modal', () => {
					// Act
					useFolderStore.getState().uiActions.openCreateModal();

					// Assert
					const state = useFolderStore.getState();
					expect(state.uiState.showCreateModal).toBe(true);
				});

				it('✅ should close create modal', () => {
					// Arrange
					useFolderStore.setState({
						uiState: {
							...useFolderStore.getState().uiState,
							showCreateModal: true,
						},
					});

					// Act
					useFolderStore.getState().uiActions.closeCreateModal();

					// Assert
					const state = useFolderStore.getState();
					expect(state.uiState.showCreateModal).toBe(false);
				});
			});

			describe('Edit Modal', () => {
				it('✅ should open edit modal', () => {
					// Act
					useFolderStore.getState().uiActions.openEditModal();

					// Assert
					const state = useFolderStore.getState();
					expect(state.uiState.showEditModal).toBe(true);
				});

				it('✅ should close edit modal', () => {
					// Arrange
					useFolderStore.setState({
						uiState: {
							...useFolderStore.getState().uiState,
							showEditModal: true,
						},
					});

					// Act
					useFolderStore.getState().uiActions.closeEditModal();

					// Assert
					const state = useFolderStore.getState();
					expect(state.uiState.showEditModal).toBe(false);
				});
			});

			describe('Delete Modal', () => {
				it('✅ should open delete modal', () => {
					// Act
					useFolderStore.getState().uiActions.openDeleteModal();

					// Assert
					const state = useFolderStore.getState();
					expect(state.uiState.showDeleteModal).toBe(true);
				});

				it('✅ should close delete modal', () => {
					// Arrange
					useFolderStore.setState({
						uiState: {
							...useFolderStore.getState().uiState,
							showDeleteModal: true,
						},
					});

					// Act
					useFolderStore.getState().uiActions.closeDeleteModal();

					// Assert
					const state = useFolderStore.getState();
					expect(state.uiState.showDeleteModal).toBe(false);
				});
			});

			describe('Stats Modal', () => {
				it('✅ should open stats modal with folder ID', () => {
					// Act
					useFolderStore.getState().uiActions.openStatsModal('folder-1');

					// Assert
					const state = useFolderStore.getState();
					expect(state.uiState.showStatsModal).toBe(true);
					expect(state.uiState.statsSelectedFolderId).toBe('folder-1');
				});

				it('✅ should close stats modal', () => {
					// Arrange
					useFolderStore.setState({
						uiState: {
							...useFolderStore.getState().uiState,
							showStatsModal: true,
							statsSelectedFolderId: 'folder-1',
						},
					});

					// Act
					useFolderStore.getState().uiActions.closeStatsModal();

					// Assert
					const state = useFolderStore.getState();
					expect(state.uiState.showStatsModal).toBe(false);
					expect(state.uiState.statsSelectedFolderId).toBe(null);
				});
			});
		});
	});

	describe('Filters Slice - Filtering and Sorting', () => {
		describe('Search and Basic Filters', () => {
			it('✅ should set search term', () => {
				// Act
				useFolderStore.getState().filtersActions.setSearchTerm('test search');

				// Assert
				const state = useFolderStore.getState();
				expect(state.filtersState.searchTerm).toBe('test search');
			});

			it('✅ should set sort criteria', () => {
				// Act
				useFolderStore.getState().filtersActions.setSortBy('size');

				// Assert
				const state = useFolderStore.getState();
				expect(state.filtersState.sortBy).toBe('size');
			});

			it('✅ should set sort direction', () => {
				// Act
				useFolderStore.getState().filtersActions.setSortDirection('desc');

				// Assert
				const state = useFolderStore.getState();
				expect(state.filtersState.sortDirection).toBe('desc');
			});

			it('✅ should toggle favorites filter', () => {
				// Act
				useFolderStore.getState().filtersActions.toggleFavorites();

				// Assert
				let state = useFolderStore.getState();
				expect(state.filtersState.showFavorites).toBe(true);

				// Act again
				useFolderStore.getState().filtersActions.toggleFavorites();

				// Assert
				state = useFolderStore.getState();
				expect(state.filtersState.showFavorites).toBe(false);
			});

			it('✅ should toggle active only filter', () => {
				// Act
				useFolderStore.getState().filtersActions.toggleActiveOnly();

				// Assert
				let state = useFolderStore.getState();
				expect(state.filtersState.activeOnly).toBe(false);

				// Act again
				useFolderStore.getState().filtersActions.toggleActiveOnly();

				// Assert
				state = useFolderStore.getState();
				expect(state.filtersState.activeOnly).toBe(true);
			});
		});

		describe('Category and Size Filters', () => {
			it('✅ should set category filter', () => {
				// Act
				useFolderStore.getState().filtersActions.setCategoryFilter('photos');

				// Assert
				const state = useFolderStore.getState();
				expect(state.filtersState.categoryFilter).toBe('photos');
			});

			it('✅ should clear category filter', () => {
				// Arrange
				useFolderStore.setState({
					filtersState: {
						...useFolderStore.getState().filtersState,
						categoryFilter: 'photos',
					},
				});

				// Act
				useFolderStore.getState().filtersActions.setCategoryFilter(null);

				// Assert
				const state = useFolderStore.getState();
				expect(state.filtersState.categoryFilter).toBe(null);
			});

			it('✅ should set size filters', () => {
				// Act
				useFolderStore.getState().filtersActions.setMinSize(1024);
				useFolderStore.getState().filtersActions.setMaxSize(1048576);

				// Assert
				const state = useFolderStore.getState();
				expect(state.filtersState.minSize).toBe(1024);
				expect(state.filtersState.maxSize).toBe(1048576);
			});

			it('✅ should set file count filters', () => {
				// Act
				useFolderStore.getState().filtersActions.setMinFiles(10);
				useFolderStore.getState().filtersActions.setMaxFiles(100);

				// Assert
				const state = useFolderStore.getState();
				expect(state.filtersState.minFiles).toBe(10);
				expect(state.filtersState.maxFiles).toBe(100);
			});
		});

		describe('Advanced Filters', () => {
			it('✅ should toggle not indexed filter', () => {
				// Act
				useFolderStore.getState().filtersActions.toggleNotIndexed();

				// Assert
				let state = useFolderStore.getState();
				expect(state.filtersState.notIndexed).toBe(true);

				// Act again
				useFolderStore.getState().filtersActions.toggleNotIndexed();

				// Assert
				state = useFolderStore.getState();
				expect(state.filtersState.notIndexed).toBe(false);
			});

			it('✅ should toggle auto reindex only filter', () => {
				// Act
				useFolderStore.getState().filtersActions.toggleAutoReindexOnly();

				// Assert
				let state = useFolderStore.getState();
				expect(state.filtersState.autoReindexOnly).toBe(true);

				// Act again
				useFolderStore.getState().filtersActions.toggleAutoReindexOnly();

				// Assert
				state = useFolderStore.getState();
				expect(state.filtersState.autoReindexOnly).toBe(false);
			});

			it('✅ should set indexing date filters', () => {
				// Arrange
				const afterDate = new Date('2024-01-01');
				const beforeDate = new Date('2024-12-31');

				// Act
				useFolderStore.getState().filtersActions.setIndexedAfter(afterDate);
				useFolderStore.getState().filtersActions.setIndexedBefore(beforeDate);

				// Assert
				const state = useFolderStore.getState();
				expect(state.filtersState.indexedAfter).toEqual(afterDate);
				expect(state.filtersState.indexedBefore).toEqual(beforeDate);
			});

			it('✅ should clear indexing date filters', () => {
				// Arrange
				useFolderStore.setState({
					filtersState: {
						...useFolderStore.getState().filtersState,
						indexedAfter: new Date('2024-01-01'),
						indexedBefore: new Date('2024-12-31'),
					},
				});

				// Act
				useFolderStore.getState().filtersActions.setIndexedAfter(null);
				useFolderStore.getState().filtersActions.setIndexedBefore(null);

				// Assert
				const state = useFolderStore.getState();
				expect(state.filtersState.indexedAfter).toBe(null);
				expect(state.filtersState.indexedBefore).toBe(null);
			});
		});

		describe('Reset Filters', () => {
			it('✅ should reset all filters to default values', () => {
				// Arrange - Set various filters
				useFolderStore.setState({
					filtersState: {
						searchTerm: 'test search',
						sortBy: 'size',
						sortDirection: 'desc',
						showFavorites: true,
						activeOnly: false,
						categoryFilter: 'photos',
						minSize: 1024,
						maxSize: 1048576,
						minFiles: 10,
						maxFiles: 100,
						notIndexed: true,
						autoReindexOnly: true,
						indexedAfter: new Date('2024-01-01'),
						indexedBefore: new Date('2024-12-31'),
					},
				});

				// Act
				useFolderStore.getState().filtersActions.resetFilters();

				// Assert
				const state = useFolderStore.getState();
				expect(state.filtersState).toEqual({
					searchTerm: '',
					sortBy: 'name',
					sortDirection: 'asc',
					showFavorites: false,
					activeOnly: true,
					categoryFilter: null,
					minSize: null,
					maxSize: null,
					minFiles: null,
					maxFiles: null,
					notIndexed: false,
					autoReindexOnly: false,
					indexedAfter: null,
					indexedBefore: null,
				});
			});
		});
	});

	describe('Store Integration - Combined Functionality', () => {
		beforeEach(() => {
			// Pre-populate with test data
			useFolderStore.setState({
				coreState: {
					...useFolderStore.getState().coreState,
					folders: mockFoldersList,
				},
			});
		});

		describe('Workflow Integration', () => {
			it('✅ should handle complete folder creation workflow', async () => {
				// Arrange
				const newFolder = { ...mockFolderData, ...mockCreateData, id: 'new-folder-id' };
				mockActions.createFolder.mockResolvedValue({
					success: true,
					data: newFolder,
					message: 'Folder created successfully',
				});

				// Act - Open modal, create folder, close modal
				useFolderStore.getState().uiActions.openCreateModal();
				const result = await useFolderStore.getState().coreActions.createFolder(mockCreateData);
				useFolderStore.getState().uiActions.closeCreateModal();

				// Assert
				const state = useFolderStore.getState();
				expect(state.uiState.showCreateModal).toBe(false);
				expect(state.coreState.folders).toContain(newFolder);
				expect(result).toEqual(newFolder);
			});

			it('✅ should handle complete folder editing workflow', async () => {
				// Arrange
				const updatedFolder = { ...mockFolderData, ...mockUpdateData };
				mockActions.updateFolder.mockResolvedValue({
					success: true,
					data: updatedFolder,
					message: 'Folder updated successfully',
				});

				// Act - Set current folder, open edit modal, update, close modal
				useFolderStore.getState().coreActions.setCurrentFolderId('folder-1');
				useFolderStore.getState().uiActions.openEditModal();
				const result = await useFolderStore.getState().coreActions.updateFolder('folder-1', mockUpdateData);
				useFolderStore.getState().uiActions.closeEditModal();

				// Assert
				const state = useFolderStore.getState();
				expect(state.uiState.showEditModal).toBe(false);
				expect(state.coreState.currentFolder?.name).toBe(mockUpdateData.name);
				expect(result).toEqual(updatedFolder);
			});

			it('✅ should handle complete folder deletion workflow', async () => {
				// Arrange
				mockActions.deleteFolder.mockResolvedValue({
					success: true,
					message: 'Folder deleted successfully',
				});

				// Act - Set current folder, open delete modal, delete, close modal
				useFolderStore.getState().coreActions.setCurrentFolderId('folder-1');
				useFolderStore.getState().uiActions.openDeleteModal();
				const result = await useFolderStore.getState().coreActions.deleteFolder('folder-1');
				useFolderStore.getState().uiActions.closeDeleteModal();

				// Assert
				const state = useFolderStore.getState();
				expect(state.uiState.showDeleteModal).toBe(false);
				expect(state.coreState.currentFolder).toBe(null);
				expect(state.coreState.folders.find((f) => f.id === 'folder-1')).toBeUndefined();
				expect(result).toBe(true);
			});
		});

		describe('Filter Integration', () => {
			it('✅ should handle complex filtering workflow', () => {
				// Act - Apply multiple filters
				useFolderStore.getState().filtersActions.setSearchTerm('2024');
				useFolderStore.getState().filtersActions.toggleFavorites();
				useFolderStore.getState().filtersActions.setSortBy('size');
				useFolderStore.getState().filtersActions.setSortDirection('desc');
				useFolderStore.getState().filtersActions.setMinFiles(100);

				// Assert
				const state = useFolderStore.getState();
				expect(state.filtersState.searchTerm).toBe('2024');
				expect(state.filtersState.showFavorites).toBe(true);
				expect(state.filtersState.sortBy).toBe('size');
				expect(state.filtersState.sortDirection).toBe('desc');
				expect(state.filtersState.minFiles).toBe(100);
			});

			it('✅ should reset filters and maintain other state', () => {
				// Arrange - Set current folder and filters
				useFolderStore.getState().coreActions.setCurrentFolderId('folder-1');
				useFolderStore.getState().filtersActions.setSearchTerm('test');
				useFolderStore.getState().filtersActions.toggleFavorites();

				// Act
				useFolderStore.getState().filtersActions.resetFilters();

				// Assert - Filters reset but core state maintained
				const state = useFolderStore.getState();
				expect(state.filtersState.searchTerm).toBe('');
				expect(state.filtersState.showFavorites).toBe(false);
				expect(state.coreState.currentFolderId).toBe('folder-1');
				expect(state.coreState.folders).toHaveLength(3);
			});
		});

		describe('UI State Integration', () => {
			it('✅ should handle view mode changes with folder expansion', () => {
				// Act
				useFolderStore.getState().uiActions.setViewMode('tree');
				useFolderStore.getState().uiActions.toggleFolderExpanded('folder-1');
				useFolderStore.getState().uiActions.toggleFolderExpanded('folder-2');

				// Assert
				const state = useFolderStore.getState();
				expect(state.uiState.viewMode).toBe('tree');
				expect(state.uiState.expandedFolders).toEqual(['folder-1', 'folder-2']);
			});

			it('✅ should handle sidebar and modal state interactions', () => {
				// Act
				useFolderStore.getState().uiActions.toggleSidebar();
				useFolderStore.getState().uiActions.openStatsModal('folder-1');
				useFolderStore.getState().uiActions.setItemSize('large');

				// Assert
				const state = useFolderStore.getState();
				expect(state.uiState.sidebarExpanded).toBe(false);
				expect(state.uiState.showStatsModal).toBe(true);
				expect(state.uiState.statsSelectedFolderId).toBe('folder-1');
				expect(state.uiState.itemSize).toBe('large');
			});
		});
	});

	describe('Error Handling and Edge Cases', () => {
		describe('Core Error Scenarios', () => {
			it('❌ should handle network errors gracefully', async () => {
				// Arrange
				const networkError = new Error('Network request failed');
				mockActions.fetchFolders.mockRejectedValue(networkError);

				// Act
				await useFolderStore.getState().coreActions.fetchFolders();

				// Assert
				const state = useFolderStore.getState();
				expect(state.coreState.error).toBe('Network request failed');
				expect(state.coreState.loading).toBe(false);
				expect(state.coreState.folders).toEqual([]);
			});

			it('❌ should handle API errors with custom messages', async () => {
				// Arrange
				mockActions.createFolder.mockResolvedValue({
					success: false,
					data: null,
					message: 'Validation failed: Folder name already exists',
				});

				// Act
				const result = await useFolderStore.getState().coreActions.createFolder(mockCreateData);

				// Assert
				expect(result).toBe(null);
				const state = useFolderStore.getState();
				expect(state.coreState.error).toBe('Validation failed: Folder name already exists');
				expect(state.coreState.isCreating).toBe(false);
			});

			it('❌ should handle undefined/null API responses', async () => {
				// Arrange
				mockActions.fetchFolderById.mockResolvedValue(undefined as any);

				// Act
				const result = await useFolderStore.getState().coreActions.fetchFolderById('folder-1');

				// Assert
				expect(result).toBe(null);
				const state = useFolderStore.getState();
				expect(state.coreState.currentFolder).toBe(null);
			});
		});

		describe('State Consistency', () => {
			it('✅ should maintain state consistency during concurrent operations', async () => {
				// Arrange
				const folder1Promise = mockActions.fetchFolderById.mockResolvedValue({
					success: true,
					data: mockFolderData,
					message: 'Success',
				});
				const folder2Promise = mockActions.fetchFolders.mockResolvedValue({
					success: true,
					data: mockFoldersList,
					message: 'Success',
				});

				// Act - Trigger concurrent operations
				const [result1, result2] = await Promise.all([
					useFolderStore.getState().coreActions.fetchFolderById('folder-1'),
					useFolderStore.getState().coreActions.fetchFolders(),
				]);

				// Assert
				const state = useFolderStore.getState();
				expect(state.coreState.folders).toHaveLength(3);
				expect(state.coreState.currentFolder).toEqual(mockFolderData);
				expect(state.coreState.loading).toBe(false);
			});

			it('✅ should handle rapid filter changes', () => {
				// Act - Rapid filter changes
				for (let i = 0; i < 10; i++) {
					useFolderStore.getState().filtersActions.setSearchTerm(`search-${i}`);
					useFolderStore.getState().filtersActions.setSortBy(i % 2 === 0 ? 'name' : 'size');
					useFolderStore.getState().filtersActions.toggleFavorites();
				}

				// Assert - Final state should be consistent
				const state = useFolderStore.getState();
				expect(state.filtersState.searchTerm).toBe('search-9');
				expect(state.filtersState.sortBy).toBe('name');
				expect(state.filtersState.showFavorites).toBe(false); // Toggled 10 times (even)
			});
		});

		describe('Memory and Performance', () => {
			it('🚀 should handle large folder lists efficiently', async () => {
				// Arrange - Large dataset
				const largeFolderList = Array.from({ length: 1000 }, (_, index) => ({
					...mockFolderData,
					id: `folder-${index}`,
					name: `Folder ${index}`,
					path: `/folder-${index}`,
				}));

				mockActions.fetchFolders.mockResolvedValue({
					success: true,
					data: largeFolderList,
					message: 'Success',
				});

				// Act
				const startTime = performance.now();
				await useFolderStore.getState().coreActions.fetchFolders();
				const endTime = performance.now();

				// Assert
				const state = useFolderStore.getState();
				expect(state.coreState.folders).toHaveLength(1000);
				expect(endTime - startTime).toBeLessThan(100); // Should be fast
			});

			it('🚀 should handle rapid UI state changes efficiently', () => {
				// Act - Rapid UI changes
				const startTime = performance.now();
				for (let i = 0; i < 100; i++) {
					useFolderStore.getState().uiActions.toggleFolderExpanded(`folder-${i}`);
				}
				const endTime = performance.now();

				// Assert
				const state = useFolderStore.getState();
				expect(state.uiState.expandedFolders).toHaveLength(100);
				expect(endTime - startTime).toBeLessThan(50); // Should be very fast
			});
		});
	});

	describe('Store Selectors and Computed Values', () => {
		beforeEach(() => {
			// Pre-populate with test data including different states
			useFolderStore.setState({
				coreState: {
					...useFolderStore.getState().coreState,
					folders: mockFoldersList,
					currentFolderId: 'folder-1',
					currentFolder: mockFolderData,
				},
				filtersState: {
					...useFolderStore.getState().filtersState,
					searchTerm: '2024',
					showFavorites: true,
				},
			});
		});

		it('✅ should provide access to core state through getters', () => {
			// Act
			const state = useFolderStore.getState();

			// Assert
			expect(state.coreState.folders).toHaveLength(3);
			expect(state.coreState.currentFolderId).toBe('folder-1');
			expect(state.coreState.currentFolder).toEqual(mockFolderData);
			expect(state.coreState.loading).toBe(false);
		});

		it('✅ should provide access to UI state', () => {
			// Act
			const state = useFolderStore.getState();

			// Assert
			expect(state.uiState.viewMode).toBe('grid');
			expect(state.uiState.itemSize).toBe('medium');
			expect(state.uiState.sidebarExpanded).toBe(true);
		});

		it('✅ should provide access to filter state', () => {
			// Act
			const state = useFolderStore.getState();

			// Assert
			expect(state.filtersState.searchTerm).toBe('2024');
			expect(state.filtersState.showFavorites).toBe(true);
			expect(state.filtersState.sortBy).toBe('name');
		});
	});
});
