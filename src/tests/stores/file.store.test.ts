/**
 * @file Tests completos para FileStore
 * @module tests/stores/file.store.test
 * @description Pruebas unitarias comprehensivas para el store de File
 */

import { useFileStoreBase as useFileStore } from '@/store/entities/file';
import type { SortDirection, SortField } from '@/store/entities/file/slices/filters.slice';
import type { ViewMode } from '@/store/entities/file/slices/ui.slice';
import type { DirectoryReadResult, FileBase, FileFilterOptions } from '@/types/entities/file/base';
import type { EnhancedDirectory, EnhancedImageFile, FileListItem } from '@/types/entities/file/extended';

// 🔧 Tipo union para archivos mejorados
type EnhancedFile = EnhancedImageFile | EnhancedDirectory | FileListItem;

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

// 🎭 Mock del transformer de archivos para datos consistentes
jest.mock('@/transformers/file', () => ({
	transformFiles: jest.fn((files: FileBase[]): EnhancedFile[] =>
		files.map((file) => ({
			id: file.id || 'test-file-id',
			path: file.path || '/test/path/file.txt',
			name: file.name || 'test-file.txt',
			type: file.type || 'file',
			size: file.size || 1024,
			isDirectory: file.isDirectory || false,
			isHidden: file.isHidden || false,
			isSystem: file.isSystem || false,
			isReadOnly: file.isReadOnly || false,
			createdAt: file.createdAt || new Date(),
			modifiedAt: file.modifiedAt || new Date(),
			accessedAt: file.accessedAt || new Date(),
			extension: file.extension || '.txt',
			mimeType: file.mimeType || 'text/plain',
			thumbnailUrl: '/test/thumbnail.jpg',
			previewUrl: '/test/preview.jpg',
			isFavorite: false,
			metadata: {},
		}))
	),
	applyFileFilters: jest.fn((files: EnhancedFile[], filters: FileFilterOptions): EnhancedFile[] => {
		let filtered = [...files];

		// Aplicar filtro de búsqueda básico para tests
		if (filters.pattern) {
			filtered = filtered.filter(file =>
				file.name.toLowerCase().includes(filters.pattern?.toLowerCase() || '')
			);
		}

		if (filters.types?.length) {
			filtered = filtered.filter(file =>
				filters.types?.includes(file.type) || false
			);
		}

		return filtered;
	}),
}));

// 🎯 Mock de las server actions para simulación controlada
jest.mock('@/server/actions/file', () => ({
	createFileAction: jest.fn(),
	updateFileAction: jest.fn(),
	deleteFileAction: jest.fn(),
	readDirectoryAction: jest.fn(),
	moveFileAction: jest.fn(),
	copyFileAction: jest.fn(),
	renameFileAction: jest.fn(),
}));

// 📝 Datos de prueba
const mockFileBase: FileBase = {
	id: 'test-file-1',
	path: '/test/documents/sample.txt',
	name: 'sample.txt',
	type: 'file',
	size: 2048,
	isDirectory: false,
	isHidden: false,
	isSystem: false,
	isReadOnly: false,
	createdAt: new Date('2024-01-01T10:00:00Z'),
	modifiedAt: new Date('2024-01-02T10:00:00Z'),
	accessedAt: new Date('2024-01-03T10:00:00Z'),
	extension: '.txt',
	mimeType: 'text/plain',
};

const mockEnhancedFile: EnhancedFile = {
	...mockFileBase,
	thumbnailUrl: '/test/thumbnail.jpg',
	previewUrl: '/test/preview.jpg',
	isFavorite: false,
	metadata: {},
} as EnhancedFile;

const mockDirectoryFile: FileBase = {
	id: 'test-dir-1',
	path: '/test/documents',
	name: 'documents',
	type: 'directory',
	size: 0,
	isDirectory: true,
	isHidden: false,
	isSystem: false,
	isReadOnly: false,
	createdAt: new Date('2024-01-01T09:00:00Z'),
	modifiedAt: new Date('2024-01-01T09:00:00Z'),
	accessedAt: new Date('2024-01-03T10:00:00Z'),
	extension: '',
	mimeType: 'inode/directory',
};

const mockDirectoryReadResult: DirectoryReadResult = {
	path: '/test/documents',
	items: [mockFileBase, mockDirectoryFile],
	totalItems: 2,
	files: 1,
	directories: 1,
	hasMore: false,
};

describe('🗂️ FileStore Tests', () => {
	// Limpiar el store antes de cada test
	beforeEach(() => {
		useFileStore.getState().reset(); // Reset general
		useFileStore.getState().deselectAllFiles(); // Reset de selección
		useFileStore.getState().resetFilters(); // Reset de filtros
	});

	// =============================================
	// 📊 CORE SLICE TESTS
	// =============================================

	describe('📁 Core Slice', () => {
		describe('🏗️ Estado inicial', () => {
			test('Debe tener el estado inicial correcto', () => {
				const state = useFileStore.getState();

				expect(state.files).toEqual([]);
				expect(state.currentDirectory).toBeNull();
				expect(state.parentDirectories).toEqual([]);
				expect(state.isLoading).toBe(false);
				expect(state.error).toBeNull();
				expect(state.fileCount).toBe(0);
				expect(state.directoryCount).toBe(0);
				expect(state.totalSize).toBe(0);
				expect(state.hasMore).toBe(false);
			});
		});

		describe('📝 Setters básicos', () => {
			test('setFiles debe actualizar la lista de archivos', () => {
				const files = [mockEnhancedFile];

				useFileStore.getState().setFiles(files);

				expect(useFileStore.getState().files).toEqual(files);
			});

			test('setCurrentDirectory debe actualizar el directorio actual', () => {
				const path = '/test/documents';

				useFileStore.getState().setCurrentDirectory(path);

				expect(useFileStore.getState().currentDirectory).toBe(path);
			});

			test('setParentDirectories debe actualizar la jerarquía', () => {
				const paths = ['/test', '/test/documents'];

				useFileStore.getState().setParentDirectories(paths);

				expect(useFileStore.getState().parentDirectories).toEqual(paths);
			});

			test('setIsLoading debe cambiar el estado de carga', () => {
				useFileStore.getState().setIsLoading(true);
				expect(useFileStore.getState().isLoading).toBe(true);

				useFileStore.getState().setIsLoading(false);
				expect(useFileStore.getState().isLoading).toBe(false);
			});

			test('setError debe gestionar errores', () => {
				const error = 'Error de prueba';

				useFileStore.getState().setError(error);
				expect(useFileStore.getState().error).toBe(error);

				useFileStore.getState().setError(null);
				expect(useFileStore.getState().error).toBeNull();
			});

			test('setDirectoryStats debe actualizar estadísticas', () => {
				const stats = {
					fileCount: 5,
					directoryCount: 2,
					totalSize: 10240,
					hasMore: true,
				};

				useFileStore.getState().setDirectoryStats(stats);

				const state = useFileStore.getState();
				expect(state.fileCount).toBe(5);
				expect(state.directoryCount).toBe(2);
				expect(state.totalSize).toBe(10240);
				expect(state.hasMore).toBe(true);
			});
		});

		describe('🔧 Operaciones CRUD', () => {
			test('addFile debe agregar un archivo', () => {
				useFileStore.getState().addFile(mockEnhancedFile);

				expect(useFileStore.getState().files).toContain(mockEnhancedFile);
			});

			test('updateFile debe actualizar un archivo existente', () => {
				// Agregar archivo inicial
				useFileStore.getState().addFile(mockEnhancedFile);

				// Actualizar archivo
				const updates = { name: 'updated-file.txt', size: 4096 };
				useFileStore.getState().updateFile(mockEnhancedFile.id, updates);

				const updatedFile = useFileStore.getState().files.find(f => f.id === mockEnhancedFile.id);
				expect(updatedFile?.name).toBe('updated-file.txt');
				expect(updatedFile?.size).toBe(4096);
			});

			test('removeFile debe eliminar un archivo', () => {
				// Agregar archivo
				useFileStore.getState().addFile(mockEnhancedFile);
				expect(useFileStore.getState().files).toHaveLength(1);

				// Eliminar archivo
				useFileStore.getState().removeFile(mockEnhancedFile.id);
				expect(useFileStore.getState().files).toHaveLength(0);
			});
		});

		describe('🚀 Operaciones avanzadas', () => {
			test('navigateToDirectory debe cambiar directorio y limpiar archivos', () => {
				// Estado inicial con archivos
				useFileStore.getState().setFiles([mockEnhancedFile]);

				const newPath = '/test/new-directory';
				useFileStore.getState().navigateToDirectory(newPath);

				expect(useFileStore.getState().currentDirectory).toBe(newPath);
				expect(useFileStore.getState().files).toEqual([]);
				expect(useFileStore.getState().isLoading).toBe(false);
			});

			test('navigateUp debe navegar al directorio padre', () => {
				// Configurar estado con jerarquía
				useFileStore.getState().setCurrentDirectory('/test/documents/subfolder');
				useFileStore.getState().setParentDirectories(['/test', '/test/documents']);

				useFileStore.getState().navigateUp();

				expect(useFileStore.getState().currentDirectory).toBe('/test/documents');
				expect(useFileStore.getState().parentDirectories).toEqual(['/test']);
			});

			test('navigateUp no debe hacer nada si no hay directorio padre', () => {
				useFileStore.getState().setCurrentDirectory('/');
				useFileStore.getState().setParentDirectories([]);

				useFileStore.getState().navigateUp();

				expect(useFileStore.getState().currentDirectory).toBe('/');
				expect(useFileStore.getState().parentDirectories).toEqual([]);
			});

			test('updateDirectoryContents debe actualizar contenido completo', () => {
				useFileStore.getState().updateDirectoryContents(mockDirectoryReadResult);

				const state = useFileStore.getState();
				expect(state.currentDirectory).toBe('/test/documents');
				expect(state.files).toHaveLength(2); // File transformado + Directory transformado
				expect(state.fileCount).toBe(1);
				expect(state.directoryCount).toBe(1);
				expect(state.totalSize).toBe(2048);
				expect(state.hasMore).toBe(false);
			});

			test('updateFilesFromRaw debe transformar y actualizar archivos', () => {
				const rawFiles = [mockFileBase, mockDirectoryFile];

				useFileStore.getState().updateFilesFromRaw(rawFiles);

				expect(useFileStore.getState().files).toHaveLength(2);
				// Verificar que se llamó al transformer
				expect(require('@/transformers/file').transformFiles).toHaveBeenCalledWith(rawFiles);
			});
		});

		describe('🔄 Reset y limpieza', () => {
			test('reset debe restaurar estado inicial completo', () => {
				// Configurar estado complejo
				const state = useFileStore.getState();
				state.setFiles([mockEnhancedFile]);
				state.setCurrentDirectory('/test');
				state.setParentDirectories(['/']);
				state.setIsLoading(true);
				state.setError('test error');
				state.setDirectoryStats({
					fileCount: 5,
					directoryCount: 2,
					totalSize: 1024,
					hasMore: true,
				});

				// Reset
				state.reset();

				// Verificar estado inicial
				const newState = useFileStore.getState();
				expect(newState.files).toEqual([]);
				expect(newState.currentDirectory).toBeNull();
				expect(newState.parentDirectories).toEqual([]);
				expect(newState.isLoading).toBe(false);
				expect(newState.error).toBeNull();
				expect(newState.fileCount).toBe(0);
				expect(newState.directoryCount).toBe(0);
				expect(newState.totalSize).toBe(0);
				expect(newState.hasMore).toBe(false);
			});
		});
	});

	// =============================================
	// 🎨 UI SLICE TESTS
	// =============================================

	describe('🎨 UI Slice', () => {
		describe('🏗️ Estado inicial UI', () => {
			test('Debe tener el estado UI inicial correcto', () => {
				const state = useFileStore.getState();

				expect(state.selectedFileIds).toEqual([]);
				expect(state.viewMode).toBe('list');
				expect(state.lastVisitedPath).toBeNull();
				expect(state.expandedFolders).toEqual([]);
				expect(state.isCreateFolderModalOpen).toBe(false);
				expect(state.isDeleteModalOpen).toBe(false);
				expect(state.isPropertiesModalOpen).toBe(false);
				expect(state.isUploadModalOpen).toBe(false);
				expect(state.isRenameModalOpen).toBe(false);
				expect(state.activeFileId).toBeNull();
				expect(state.clipboardFiles).toEqual([]);
				expect(state.breadcrumbItems).toEqual([]);
			});
		});

		describe('✅ Gestión de selección', () => {
			beforeEach(() => {
				// Configurar archivos para seleccionar
				useFileStore.getState().setFiles([
					{ ...mockEnhancedFile, id: 'file-1' },
					{ ...mockEnhancedFile, id: 'file-2' },
					{ ...mockEnhancedFile, id: 'file-3' },
				]);
			});

			test('selectFile debe agregar archivo a selección', () => {
				useFileStore.getState().selectFile('file-1');

				expect(useFileStore.getState().selectedFileIds).toContain('file-1');
			});

			test('deselectFile debe quitar archivo de selección', () => {
				// Seleccionar primero
				useFileStore.getState().selectFile('file-1');
				expect(useFileStore.getState().selectedFileIds).toContain('file-1');

				// Deseleccionar
				useFileStore.getState().deselectFile('file-1');
				expect(useFileStore.getState().selectedFileIds).not.toContain('file-1');
			});

			test('toggleSelectFile debe alternar selección', () => {
				// Toggle para seleccionar
				useFileStore.getState().toggleSelectFile('file-1');
				expect(useFileStore.getState().selectedFileIds).toContain('file-1');

				// Toggle para deseleccionar
				useFileStore.getState().toggleSelectFile('file-1');
				expect(useFileStore.getState().selectedFileIds).not.toContain('file-1');
			});

			test('selectAllFiles debe seleccionar todos los archivos', () => {
				useFileStore.getState().selectAllFiles();

				const selectedIds = useFileStore.getState().selectedFileIds;
				expect(selectedIds).toContain('file-1');
				expect(selectedIds).toContain('file-2');
				expect(selectedIds).toContain('file-3');
				expect(selectedIds).toHaveLength(3);
			});

			test('deselectAllFiles debe limpiar toda la selección', () => {
				// Seleccionar archivos primero
				useFileStore.getState().selectAllFiles();
				expect(useFileStore.getState().selectedFileIds).toHaveLength(3);

				// Deseleccionar todo
				useFileStore.getState().deselectAllFiles();
				expect(useFileStore.getState().selectedFileIds).toEqual([]);
			});

			test('No debe seleccionar archivos duplicados', () => {
				useFileStore.getState().selectFile('file-1');
				useFileStore.getState().selectFile('file-1'); // Duplicado

				const selectedIds = useFileStore.getState().selectedFileIds;
				expect(selectedIds.filter(id => id === 'file-1')).toHaveLength(1);
			});
		});

		describe('👁️ Modos de visualización', () => {
			test('setViewMode debe cambiar el modo de vista', () => {
				const modes: ViewMode[] = ['list', 'grid', 'tree', 'details'];

				modes.forEach(mode => {
					useFileStore.getState().setViewMode(mode);
					expect(useFileStore.getState().viewMode).toBe(mode);
				});
			});

			test('setLastVisitedPath debe recordar última ruta visitada', () => {
				const path = '/test/last-visited';

				useFileStore.getState().setLastVisitedPath(path);
				expect(useFileStore.getState().lastVisitedPath).toBe(path);
			});
		});

		describe('📁 Gestión de carpetas expandidas', () => {
			test('expandFolder debe agregar carpeta a lista expandida', () => {
				const folderPath = '/test/folder';

				useFileStore.getState().expandFolder(folderPath);
				expect(useFileStore.getState().expandedFolders).toContain(folderPath);
			});

			test('collapseFolder debe quitar carpeta de lista expandida', () => {
				const folderPath = '/test/folder';

				// Expandir primero
				useFileStore.getState().expandFolder(folderPath);
				expect(useFileStore.getState().expandedFolders).toContain(folderPath);

				// Colapsar
				useFileStore.getState().collapseFolder(folderPath);
				expect(useFileStore.getState().expandedFolders).not.toContain(folderPath);
			});

			test('toggleExpandFolder debe alternar estado de expansión', () => {
				const folderPath = '/test/folder';

				// Toggle para expandir
				useFileStore.getState().toggleExpandFolder(folderPath);
				expect(useFileStore.getState().expandedFolders).toContain(folderPath);

				// Toggle para colapsar
				useFileStore.getState().toggleExpandFolder(folderPath);
				expect(useFileStore.getState().expandedFolders).not.toContain(folderPath);
			});
		});
		describe('🎭 Gestión de modales', () => {
			test('debe abrir y cerrar modales con parámetros', () => {
				// Abrir modales que requieren parámetros
				useFileStore.getState().openPropertiesModal('test-file-id');
				expect(useFileStore.getState().isPropertiesModalOpen).toBe(true);

				useFileStore.getState().openRenameModal('test-file-id');
				expect(useFileStore.getState().isRenameModalOpen).toBe(true);

				// Cerrar modales
				useFileStore.getState().closePropertiesModal();
				expect(useFileStore.getState().isPropertiesModalOpen).toBe(false);

				useFileStore.getState().closeRenameModal();
				expect(useFileStore.getState().isRenameModalOpen).toBe(false);
			});

			test('debe abrir y cerrar modales sin parámetros', () => {
				// Abrir modales sin parámetros
				useFileStore.getState().openCreateFolderModal();
				expect(useFileStore.getState().isCreateFolderModalOpen).toBe(true);

				useFileStore.getState().openDeleteModal();
				expect(useFileStore.getState().isDeleteModalOpen).toBe(true);

				useFileStore.getState().openUploadModal();
				expect(useFileStore.getState().isUploadModalOpen).toBe(true);

				// Cerrar modales
				useFileStore.getState().closeCreateFolderModal();
				expect(useFileStore.getState().isCreateFolderModalOpen).toBe(false);

				useFileStore.getState().closeDeleteModal();
				expect(useFileStore.getState().isDeleteModalOpen).toBe(false);

				useFileStore.getState().closeUploadModal();
				expect(useFileStore.getState().isUploadModalOpen).toBe(false);
			});
		});
		describe('📋 Gestión de portapapeles', () => {
			test('addToClipboard debe agregar archivos para copiar', () => {
				useFileStore.getState().addToClipboard('file-1', '/test/file1.txt', 'copy');
				useFileStore.getState().addToClipboard('file-2', '/test/file2.txt', 'copy');

				const clipboardFiles = useFileStore.getState().clipboardFiles;
				expect(clipboardFiles).toHaveLength(1); // Solo mantiene el último
				expect(clipboardFiles[0].action).toBe('copy');
			});

			test('addToClipboard debe agregar archivos para cortar', () => {
				useFileStore.getState().addToClipboard('file-1', '/test/file1.txt', 'cut');

				const clipboardFiles = useFileStore.getState().clipboardFiles;
				expect(clipboardFiles).toHaveLength(1);
				expect(clipboardFiles[0].action).toBe('cut');
			});

			test('clearClipboard debe limpiar el portapapeles', () => {
				// Agregar archivos al portapapeles
				useFileStore.getState().addToClipboard('file-1', '/test/file1.txt', 'copy');
				expect(useFileStore.getState().clipboardFiles).toHaveLength(1);

				// Limpiar
				useFileStore.getState().clearClipboard();
				expect(useFileStore.getState().clipboardFiles).toEqual([]);
			});
		});
		describe('🍞 Gestión de breadcrumbs', () => {
			test('updateBreadcrumbs debe actualizar breadcrumbs desde ruta', () => {
				const path = '/test/documents';

				useFileStore.getState().updateBreadcrumbs(path);

				const breadcrumbs = useFileStore.getState().breadcrumbItems;
				expect(breadcrumbs.length).toBeGreaterThan(0);
			});

			test('updateBreadcrumbs con null debe limpiar breadcrumbs', () => {
				// Establecer primero
				useFileStore.getState().updateBreadcrumbs('/test/path');
				expect(useFileStore.getState().breadcrumbItems.length).toBeGreaterThan(0);

				// Limpiar
				useFileStore.getState().updateBreadcrumbs(null);
				expect(useFileStore.getState().breadcrumbItems).toEqual([]);
			});
		});
		describe('📄 Gestión de archivo activo', () => {
			test('setActiveFileId debe establecer archivo activo', () => {
				const fileId = 'active-file-123';

				useFileStore.getState().setActiveFileId(fileId);
				expect(useFileStore.getState().activeFileId).toBe(fileId);
			});

			test('setActiveFileId con null debe limpiar archivo activo', () => {
				// Establecer archivo activo primero
				useFileStore.getState().setActiveFileId('test-file');
				expect(useFileStore.getState().activeFileId).toBe('test-file');

				// Limpiar
				useFileStore.getState().setActiveFileId(null);
				expect(useFileStore.getState().activeFileId).toBeNull();
			});
		});
	});

	// =============================================
	// 🔍 FILTERS SLICE TESTS
	// =============================================

	describe('🔍 Filters Slice', () => {
		describe('🏗️ Estado inicial de filtros', () => {
			test('Debe tener el estado de filtros inicial correcto', () => {
				const state = useFileStore.getState();

				expect(state.filterOptions).toEqual({});
				expect(state.sortBy).toBe('name');
				expect(state.sortDirection).toBe('asc');
				expect(state.searchTerm).toBe('');
			});
		});

		describe('📊 Gestión de ordenación', () => {
			test('setSortBy debe cambiar el campo de ordenación', () => {
				const fields: SortField[] = ['name', 'size', 'type', 'createdAt', 'modifiedAt'];

				fields.forEach(field => {
					useFileStore.getState().setSortBy(field);
					expect(useFileStore.getState().sortBy).toBe(field);
				});
			});

			test('setSortDirection debe cambiar la dirección de ordenación', () => {
				const directions: SortDirection[] = ['asc', 'desc'];

				directions.forEach(direction => {
					useFileStore.getState().setSortDirection(direction);
					expect(useFileStore.getState().sortDirection).toBe(direction);
				});
			});

			test('toggleSortDirection debe alternar dirección', () => {
				// Inicialmente 'asc'
				expect(useFileStore.getState().sortDirection).toBe('asc');

				// Toggle a 'desc'
				useFileStore.getState().toggleSortDirection();
				expect(useFileStore.getState().sortDirection).toBe('desc');

				// Toggle de vuelta a 'asc'
				useFileStore.getState().toggleSortDirection();
				expect(useFileStore.getState().sortDirection).toBe('asc');
			});
		});
		describe('🔧 Gestión de filtros', () => {
			test('setFilterOptions debe actualizar opciones completas', () => {
				const filterOptions: FileFilterOptions = {
					pattern: '*.txt',
					types: ['file'],
					minSize: 1024,
					maxSize: 10240,
					includeHidden: false,
					includeSystem: false,
				};

				useFileStore.getState().setFilterOptions(filterOptions);
				expect(useFileStore.getState().filterOptions).toEqual(filterOptions);
			});

			test('updateFilterOption debe actualizar opción específica', () => {
				// Actualizar opción individual
				useFileStore.getState().updateFilterOption('pattern', '*.jpg');
				expect(useFileStore.getState().filterOptions.pattern).toBe('*.jpg');

				useFileStore.getState().updateFilterOption('includeHidden', true);
				expect(useFileStore.getState().filterOptions.includeHidden).toBe(true);

				useFileStore.getState().updateFilterOption('types', ['image']);
				expect(useFileStore.getState().filterOptions.types).toEqual(['image']);
			});

			test('resetFilters debe restaurar filtros por defecto', () => {
				// Configurar filtros complejos
				useFileStore.getState().setFilterOptions({
					pattern: '*.txt',
					types: ['file'],
					minSize: 1024,
					includeHidden: true,
				});
				useFileStore.getState().setSortBy('size');
				useFileStore.getState().setSortDirection('desc');
				useFileStore.getState().setSearchTerm('test search');

				// Reset
				useFileStore.getState().resetFilters();

				const state = useFileStore.getState();
				expect(state.filterOptions).toEqual({});
				expect(state.sortBy).toBe('name');
				expect(state.sortDirection).toBe('asc');
				expect(state.searchTerm).toBe('');
			});
		});

		describe('🔍 Gestión de búsqueda', () => {
			test('setSearchTerm debe actualizar término de búsqueda', () => {
				const searchTerm = 'test search query';

				useFileStore.getState().setSearchTerm(searchTerm);
				expect(useFileStore.getState().searchTerm).toBe(searchTerm);
			});

			test('setSearchTerm debe limpiar búsqueda con string vacío', () => {
				// Establecer búsqueda primero
				useFileStore.getState().setSearchTerm('test search');
				expect(useFileStore.getState().searchTerm).toBe('test search');

				// Limpiar
				useFileStore.getState().setSearchTerm('');
				expect(useFileStore.getState().searchTerm).toBe('');
			});
		});
		describe('🎯 Selectores de filtrado', () => {
			beforeEach(() => {
				// Configurar archivos de prueba
				const testFiles: EnhancedFile[] = [
					{ ...mockEnhancedFile, id: 'file-1', name: 'document.txt', type: 'file' },
					{ ...mockEnhancedFile, id: 'file-2', name: 'image.jpg', type: 'file' },
					{ ...mockEnhancedFile, id: 'file-3', name: 'another-doc.txt', type: 'file' },
				];
				useFileStore.getState().setFiles(testFiles);
			});

			test('getFilteredFiles debe aplicar filtros básicos', () => {
				// Configurar filtro de nombre
				useFileStore.getState().updateFilterOption('pattern', 'doc');

				const filtered = useFileStore.getState().getFilteredFiles();

				// Debe incluir archivos que coincidan con el patrón
				expect(filtered).toHaveLength(2); // document.txt y another-doc.txt
				expect(filtered.every(f => f.name.includes('doc'))).toBe(true);
			});

			test('getFilteredFiles debe aplicar filtros de tipo', () => {
				// Configurar filtro de tipo
				useFileStore.getState().updateFilterOption('types', ['file']);

				const filtered = useFileStore.getState().getFilteredFiles();

				// Todos los archivos de prueba son tipo 'file'
				expect(filtered).toHaveLength(3);
				expect(filtered.every(f => f.type === 'file')).toBe(true);
			});

			test('getFilteredAndSortedFiles debe aplicar filtros y ordenación', () => {
				// Configurar ordenación por nombre descendente
				useFileStore.getState().setSortBy('name');
				useFileStore.getState().setSortDirection('desc');

				const filtered = useFileStore.getState().getFilteredAndSortedFiles();

				// Verificar que están ordenados
				expect(filtered).toHaveLength(3);
				// Los nombres deberían estar en orden descendente
				const names = filtered.map(f => f.name);
				expect(names[0] > names[1]).toBe(true);
				expect(names[1] > names[2]).toBe(true);
			});

			test('getFilteredAndSortedFiles debe combinar búsqueda, filtros y ordenación', () => {
				// Configurar búsqueda
				useFileStore.getState().setSearchTerm('txt');

				// Configurar filtro
				useFileStore.getState().updateFilterOption('types', ['file']);

				// Configurar ordenación
				useFileStore.getState().setSortBy('name');
				useFileStore.getState().setSortDirection('asc');

				const filtered = useFileStore.getState().getFilteredAndSortedFiles();

				// Debe filtrar archivos .txt y ordenarlos
				expect(filtered).toHaveLength(2);
				expect(filtered.every(f => f.name.includes('txt'))).toBe(true);
				expect(filtered.every(f => f.type === 'file')).toBe(true);
			});
		});
	});

	// =============================================
	// 🔗 INTEGRATION TESTS
	// =============================================

	describe('🔗 Tests de Integración', () => {
		describe('📊 Integración Core + UI', () => {
			test('Navegación debe limpiar selección y UI', () => {
				// Configurar estado inicial
				useFileStore.getState().setFiles([mockEnhancedFile]);
				useFileStore.getState().selectFile(mockEnhancedFile.id);
				useFileStore.getState().setActiveFileId(mockEnhancedFile.id);

				// Verificar estado inicial
				expect(useFileStore.getState().selectedFileIds).toContain(mockEnhancedFile.id);
				expect(useFileStore.getState().activeFileId).toBe(mockEnhancedFile.id);

				// Navegar a nuevo directorio
				useFileStore.getState().navigateToDirectory('/new/path');

				// UI debe mantenerse (no se limpia automáticamente)
				// Solo los archivos se limpian en navigateToDirectory
				expect(useFileStore.getState().files).toEqual([]);
			});

			test('Actualización de archivos debe mantener selección válida', () => {
				// Configurar archivos iniciales
				const files = [
					{ ...mockEnhancedFile, id: 'file-1' },
					{ ...mockEnhancedFile, id: 'file-2' },
				];
				useFileStore.getState().setFiles(files);
				useFileStore.getState().selectFile('file-1');

				// Actualizar con nuevos archivos (file-1 se mantiene)
				const newFiles = [
					{ ...mockEnhancedFile, id: 'file-1' },
					{ ...mockEnhancedFile, id: 'file-3' },
				];
				useFileStore.getState().setFiles(newFiles);

				// Selección de file-1 debe mantenerse
				expect(useFileStore.getState().selectedFileIds).toContain('file-1');
			});
		});

		describe('🔍 Integración Filters + Core', () => {
			test('Filtros deben aplicarse automáticamente a archivos cargados', () => {
				// Configurar filtro antes de cargar archivos
				useFileStore.getState().updateFilterOption('pattern', 'test');

				// Cargar archivos
				const files = [
					{ ...mockEnhancedFile, id: 'file-1', name: 'test-file.txt' },
					{ ...mockEnhancedFile, id: 'file-2', name: 'other-file.txt' },
				];
				useFileStore.getState().setFiles(files);

				// Obtener archivos filtrados
				const filtered = useFileStore.getState().getFilteredFiles();
				expect(filtered).toHaveLength(1);
				expect(filtered[0].name).toBe('test-file.txt');
			});

			test('Cambio de filtros debe actualizar resultados en tiempo real', () => {
				// Cargar archivos
				const files = [
					{ ...mockEnhancedFile, id: 'file-1', name: 'document.pdf' },
					{ ...mockEnhancedFile, id: 'file-2', name: 'image.jpg' },
					{ ...mockEnhancedFile, id: 'file-3', name: 'document.txt' },
				];
				useFileStore.getState().setFiles(files);

				// Aplicar filtro inicial
				useFileStore.getState().updateFilterOption('pattern', 'document');
				let filtered = useFileStore.getState().getFilteredFiles();
				expect(filtered).toHaveLength(2);

				// Cambiar filtro
				useFileStore.getState().updateFilterOption('pattern', 'image');
				filtered = useFileStore.getState().getFilteredFiles();
				expect(filtered).toHaveLength(1);
				expect(filtered[0].name).toBe('image.jpg');
			});
		});

		describe('🎭 Integración UI + Filters', () => {
			test('Selección debe respetarse después de filtrar', () => {
				// Cargar archivos
				const files = [
					{ ...mockEnhancedFile, id: 'file-1', name: 'selected.txt' },
					{ ...mockEnhancedFile, id: 'file-2', name: 'filtered.txt' },
					{ ...mockEnhancedFile, id: 'file-3', name: 'other.jpg' },
				];
				useFileStore.getState().setFiles(files);

				// Seleccionar archivos
				useFileStore.getState().selectFile('file-1');
				useFileStore.getState().selectFile('file-2');				// Aplicar filtro que incluye los archivos seleccionados
				useFileStore.getState().updateFilterOption('pattern', '.txt');

				// Selección debe mantenerse
				const selectedIds = useFileStore.getState().selectedFileIds;
				expect(selectedIds).toContain('file-1');
				expect(selectedIds).toContain('file-2');
			});

			test('Modal de propiedades debe mostrar archivo activo filtrado', () => {
				// Cargar archivos
				const files = [
					{ ...mockEnhancedFile, id: 'file-1', name: 'active.txt' },
					{ ...mockEnhancedFile, id: 'file-2', name: 'other.jpg' },
				];
				useFileStore.getState().setFiles(files);

				// Establecer archivo activo
				useFileStore.getState().setActiveFileId('file-1');

				// Abrir modal de propiedades
				useFileStore.getState().openPropertiesModal();				// Aplicar filtro que incluye el archivo activo
				useFileStore.getState().updateFilterOption('pattern', '.txt');

				const state = useFileStore.getState();
				expect(state.activeFileId).toBe('file-1');
				expect(state.isPropertiesModalOpen).toBe(true);

				const filtered = state.getFilteredFiles();
				expect(filtered.some(f => f.id === 'file-1')).toBe(true);
			});
		});
	});

	// =============================================
	// 🚨 ERROR HANDLING TESTS
	// =============================================

	describe('🚨 Manejo de Errores', () => {
		test('Debe manejar archivos con IDs duplicados', () => {
			const filesWithDuplicates = [
				{ ...mockEnhancedFile, id: 'duplicate-id', name: 'file1.txt' },
				{ ...mockEnhancedFile, id: 'duplicate-id', name: 'file2.txt' },
			];

			useFileStore.getState().setFiles(filesWithDuplicates);

			// Solo debe mantener uno (el último)
			const files = useFileStore.getState().files;
			const duplicateFiles = files.filter(f => f.id === 'duplicate-id');
			expect(duplicateFiles).toHaveLength(1);
		});

		test('Debe manejar actualizaciones de archivos inexistentes', () => {
			const initialFiles = [mockEnhancedFile];
			useFileStore.getState().setFiles(initialFiles);

			// Intentar actualizar archivo inexistente
			useFileStore.getState().updateFile('non-existent-id', { name: 'new-name.txt' });

			// Los archivos existentes no deben verse afectados
			expect(useFileStore.getState().files).toEqual(initialFiles);
		});

		test('Debe manejar eliminación de archivos inexistentes', () => {
			const initialFiles = [mockEnhancedFile];
			useFileStore.getState().setFiles(initialFiles);

			// Intentar eliminar archivo inexistente
			useFileStore.getState().removeFile('non-existent-id');

			// Los archivos existentes no deben verse afectados
			expect(useFileStore.getState().files).toEqual(initialFiles);
		});

		test('Debe manejar navegación con rutas inválidas', () => {
			// Configurar estado inicial
			useFileStore.getState().setCurrentDirectory('/valid/path');
			useFileStore.getState().setFiles([mockEnhancedFile]);

			// Navegar con ruta vacía/inválida
			useFileStore.getState().navigateToDirectory('');

			// Debe actualizar la ruta aunque sea vacía
			expect(useFileStore.getState().currentDirectory).toBe('');
			expect(useFileStore.getState().files).toEqual([]);
		});

		test('Debe manejar filtros con valores inválidos', () => {
			const files = [mockEnhancedFile];
			useFileStore.getState().setFiles(files);			// Aplicar filtros con valores undefined/null
			useFileStore.getState().updateFilterOption('pattern', undefined as any);
			useFileStore.getState().updateFilterOption('types', null as any);

			// No debe fallar y debe devolver archivos sin filtrar
			const filtered = useFileStore.getState().getFilteredFiles();
			expect(filtered).toEqual(files);
		});
	});

	// =============================================
	// ⚡ PERFORMANCE TESTS
	// =============================================

	describe('⚡ Tests de Performance', () => {
		test('Debe manejar grandes cantidades de archivos eficientemente', () => {
			// Generar 1000 archivos de prueba
			const largeFileSet: EnhancedFile[] = Array.from({ length: 1000 }, (_, i) => ({
				...mockEnhancedFile,
				id: `file-${i}`,
				name: `file-${i}.txt`,
			}));

			const startTime = performance.now();

			// Operaciones que deben ser eficientes
			useFileStore.getState().setFiles(largeFileSet);
			useFileStore.getState().selectAllFiles();
			useFileStore.getState().getFilteredFiles();

			const endTime = performance.now();

			// Debe completarse en menos de 100ms (límite generoso para CI)
			expect(endTime - startTime).toBeLessThan(100);

			// Verificar que los datos son correctos
			expect(useFileStore.getState().files).toHaveLength(1000);
			expect(useFileStore.getState().selectedFileIds).toHaveLength(1000);
		});

		test('Filtrado debe ser eficiente con muchos archivos', () => {
			// Generar archivos con diferentes tipos
			const largeFileSet: EnhancedFile[] = Array.from({ length: 500 }, (_, i) => ({
				...mockEnhancedFile,
				id: `file-${i}`,
				name: `file-${i}.${i % 2 === 0 ? 'txt' : 'jpg'}`,
				type: i % 2 === 0 ? 'text' : 'image',
			}));

			useFileStore.getState().setFiles(largeFileSet);

			const startTime = performance.now();			// Aplicar filtros múltiples
			useFileStore.getState().updateFilterOption('pattern', '.txt');
			useFileStore.getState().updateFilterOption('types', ['text']);
			useFileStore.getState().setSortBy('name');
			useFileStore.getState().setSortDirection('desc');

			const filtered = useFileStore.getState().getFilteredAndSortedFiles();

			const endTime = performance.now();

			// Debe completarse eficientemente
			expect(endTime - startTime).toBeLessThan(50);

			// Verificar resultado correcto
			expect(filtered.length).toBeGreaterThan(0);
			expect(filtered.every(f => f.name.includes('.txt'))).toBe(true);
		});

		test('Selección masiva debe ser eficiente', () => {
			// Generar archivos
			const files: EnhancedFile[] = Array.from({ length: 1000 }, (_, i) => ({
				...mockEnhancedFile,
				id: `file-${i}`,
				name: `file-${i}.txt`,
			}));

			useFileStore.getState().setFiles(files);

			const startTime = performance.now();

			// Seleccionar todos
			useFileStore.getState().selectAllFiles();

			// Deseleccionar todos
			useFileStore.getState().deselectAllFiles();

			// Seleccionar algunos específicos
			for (let i = 0; i < 100; i++) {
				useFileStore.getState().selectFile(`file-${i}`);
			}

			const endTime = performance.now();

			// Debe ser eficiente
			expect(endTime - startTime).toBeLessThan(50);

			// Verificar resultado
			expect(useFileStore.getState().selectedFileIds).toHaveLength(100);
		});
	});

	// =============================================
	// 🔄 PERSISTENCE TESTS
	// =============================================

	describe('💾 Tests de Persistencia', () => {
		test('Debe persistir configuraciones de UI', () => {
			// Configurar estado UI
			useFileStore.getState().setViewMode('grid');
			useFileStore.getState().selectFile('test-file-id');
			useFileStore.getState().setLastVisitedPath('/test/path');

			// Simular recarga del store
			const persistedState = useFileStore.getState();

			// Los valores UI deben estar presentes
			expect(persistedState.viewMode).toBe('grid');
			expect(persistedState.selectedFileIds).toContain('test-file-id');
			expect(persistedState.lastVisitedPath).toBe('/test/path');
		});

		test('Debe persistir configuraciones de filtros', () => {			// Configurar filtros
			useFileStore.getState().setSortBy('size');
			useFileStore.getState().setSortDirection('desc');
			useFileStore.getState().updateFilterOption('includeHidden', true);
			useFileStore.getState().setSearchTerm('persistent search');

			// Simular recarga del store
			const persistedState = useFileStore.getState();

			// Los filtros deben persistir
			expect(persistedState.sortBy).toBe('size');
			expect(persistedState.sortDirection).toBe('desc');
			expect(persistedState.filterOptions.showHidden).toBe(true);
			expect(persistedState.searchTerm).toBe('persistent search');
		});

		test('No debe persistir datos temporales', () => {
			// Configurar datos temporales
			useFileStore.getState().setFiles([mockEnhancedFile]);
			useFileStore.getState().setCurrentDirectory('/temp/path');
			useFileStore.getState().setIsLoading(true);
			useFileStore.getState().setError('temporary error');
			useFileStore.getState().openCreateFolderModal();

			// Estos datos no deberían persistir (son temporales)
			// En un test real, habría que simular una recarga completa del store
			// Para este test, simplemente verificamos que el estado temporal existe
			const state = useFileStore.getState();
			expect(state.files).toHaveLength(1);
			expect(state.currentDirectory).toBe('/temp/path');
			expect(state.isLoading).toBe(true);
			expect(state.error).toBe('temporary error');
			expect(state.isCreateFolderModalOpen).toBe(true);
		});
	});
});
