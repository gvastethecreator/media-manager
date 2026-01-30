/**
 * @file Core slice para el store de File
 * @module store/entities/file/slices/core
 */

import { StateCreator } from 'zustand';
// Refactor 2025-07: se usa cliente API para obtener info de directorio
import { getDirectoryInfoFromApi } from '@/lib/api/client/file.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { toFileWithStatsList } from '@/transformers/file/mappers';
import { FileBase, FileWithStats } from '@/types/entities/file/base';
import type { DirectoryReadResult, FileBase as FileBaseFromTypes } from '@/types/entities/file/types';
import { FileStore } from '..';

// Estado
export interface CoreState {
	// Datos
	files: FileWithStats[];
	currentDirectory: string | null;
	parentDirectories: string[];
	isLoading: boolean;
	error: string | null;

	// Estadísticas
	fileCount: number;
	directoryCount: number;
	totalSize: number;
	hasMore: boolean;
}

// Acciones
export interface CoreActions {
	// Setters básicos
	setFiles: (files: FileWithStats[]) => void;
	setCurrentDirectory: (path: string | null) => void;
	setParentDirectories: (paths: string[]) => void;
	setIsLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;
	setDirectoryStats: (stats: Pick<CoreState, 'fileCount' | 'directoryCount' | 'totalSize' | 'hasMore'>) => void;

	// Operaciones
	addFile: (file: FileWithStats) => void;
	updateFile: (id: string, file: Partial<FileWithStats>) => void;
	removeFile: (id: string) => void;

	// Operaciones avanzadas
	navigateToDirectory: (path: string) => Promise<void>;
	navigateUp: () => Promise<void>;
	updateDirectoryContents: (result: DirectoryReadResult) => void;
	updateFilesFromRaw: (files: FileBaseFromTypes[]) => void;

	// Operaciones masivas
	reset: () => void;
}

// Estado inicial
const initialState: CoreState = {
	files: [],
	currentDirectory: null,
	parentDirectories: [],
	isLoading: false,
	error: null,
	fileCount: 0,
	directoryCount: 0,
	totalSize: 0,
	hasMore: false,
};

// Crear slice
export const createCoreSlice: StateCreator<FileStore, [], [], CoreState & CoreActions> = (set, get) => ({
	...initialState,

	// Setters básicos
	setFiles: (files) => set({ files }),
	setCurrentDirectory: (currentDirectory) => set({ currentDirectory }),
	setParentDirectories: (parentDirectories) => set({ parentDirectories }),
	setIsLoading: (isLoading) => set({ isLoading }),
	setError: (error) => set({ error }),
	setDirectoryStats: (stats) => set(stats),

	// Operaciones
	addFile: (file) => {
		const { files } = get();
		set({ files: [...files, file] });
	},

	updateFile: (id, updatedData) => {
		const { files } = get();
		const updatedFiles = files.map((file) => (file.id === id ? { ...file, ...updatedData } : file));
		set({ files: updatedFiles });
	},

	removeFile: (id) => {
		const { files, fileCount, directoryCount, totalSize } = get();
		const fileToRemove = files.find((file) => file.id === id);

		if (!fileToRemove) {
			return;
		}

		// Actualizar estadísticas
		const newFileCount = fileToRemove.isDirectory ? fileCount : fileCount - 1;
		const newDirCount = fileToRemove.isDirectory ? directoryCount - 1 : directoryCount;
		const newTotalSize = totalSize - (fileToRemove.size || 0);

		set({
			files: files.filter((file) => file.id !== id),
			fileCount: newFileCount,
			directoryCount: newDirCount,
			totalSize: newTotalSize,
		});
	},

	// Operaciones avanzadas
	navigateToDirectory: async (path) => {
		const { currentDirectory, parentDirectories, setIsLoading, setError, updateDirectoryContents } = get();
		setIsLoading(true);
		setError(null);

		try {
			const result = await getDirectoryInfoFromApi(path);
			const newParentDirectories = currentDirectory ? [...parentDirectories, currentDirectory] : parentDirectories;
			set({ currentDirectory: path, parentDirectories: newParentDirectories });
			updateDirectoryContents(result);
		} catch (error: any) {
			setError(error.message);
			clientLogger.error('Error navigating to directory:', error);
		} finally {
			setIsLoading(false);
		}
	},

	navigateUp: async () => {
		const { currentDirectory, parentDirectories, setIsLoading, setError, updateDirectoryContents } = get();
		setIsLoading(true);
		setError(null);

		try {
			let targetPath: string | null = null;
			let newParents: string[] = [];

			if (parentDirectories.length > 0) {
				targetPath = parentDirectories.at(-1) ?? null;
				newParents = parentDirectories.slice(0, -1);
			}

			const result = await getDirectoryInfoFromApi(targetPath || ''); // Pasar cadena vacía para la raíz
			set({ currentDirectory: targetPath, parentDirectories: newParents });
			updateDirectoryContents(result);
		} catch (error: any) {
			setError(error.message);
			clientLogger.error('Error navigating up:', error);
		} finally {
			setIsLoading(false);
		}
	},

	updateDirectoryContents: (result) => {
		// Convertir FileBaseFromTypes a FileBase
		const convertedFiles: FileBase[] = result.items.map((rawFile) => ({
			id: rawFile.id,
			name: rawFile.name,
			path: rawFile.path,
			size: rawFile.size,
			hash: rawFile.hash,
			mimeType: rawFile.mimeType,
			extension: rawFile.extension,
			type: rawFile.type, // Conversión temporal
			isDirectory: false, // Valor por defecto, debería venir del API
			parentPath: '', // Valor por defecto
			absolutePath: rawFile.path,
			relativePath: rawFile.path,
			modifiedAt: rawFile.updatedAt,
			accessedAt: rawFile.accessedAt || rawFile.updatedAt,
			folderId: rawFile.folderId,
			isHidden: rawFile.isHidden,
			isReadonly: false, // Valor por defecto
			createdAt: rawFile.createdAt,
			updatedAt: rawFile.updatedAt,
		}));

		const transformedFiles = toFileWithStatsList(convertedFiles);

		set({
			files: transformedFiles,
			fileCount: result.files?.length || 0,
			directoryCount: result.directories?.length || 0,
			totalSize: transformedFiles.reduce((acc: number, file: FileWithStats) => acc + (file.size || 0), 0),
			hasMore: result.hasMore,
			currentDirectory: result.path,
			error: null,
		});
	},

	updateFilesFromRaw: (rawFiles: FileBaseFromTypes[]) => {
		// Convertir FileBaseFromTypes a FileBase
		const convertedFiles: FileBase[] = rawFiles.map((rawFile) => ({
			id: rawFile.id,
			name: rawFile.name,
			path: rawFile.path,
			size: rawFile.size,
			hash: rawFile.hash,
			mimeType: rawFile.mimeType,
			extension: rawFile.extension,
			type: rawFile.type, // Conversión temporal
			isDirectory: false, // Valor por defecto, debería venir del API
			parentPath: '', // Valor por defecto
			absolutePath: rawFile.path,
			relativePath: rawFile.path,
			modifiedAt: rawFile.updatedAt,
			accessedAt: rawFile.accessedAt || rawFile.updatedAt,
			folderId: rawFile.folderId,
			isHidden: rawFile.isHidden,
			isReadonly: false, // Valor por defecto
			createdAt: rawFile.createdAt,
			updatedAt: rawFile.updatedAt,
		}));

		const transformedFiles = toFileWithStatsList(convertedFiles);

		// Actualizar estadísticas
		const fileCount = transformedFiles.filter((file: FileWithStats) => !file.isDirectory).length;
		const directoryCount = transformedFiles.filter((file: FileWithStats) => file.isDirectory).length;
		const totalSize = transformedFiles.reduce((acc: number, file: FileWithStats) => acc + (file.size || 0), 0);

		set({
			files: transformedFiles,
			fileCount,
			directoryCount,
			totalSize,
		});
	},

	// Operaciones masivas
	reset: () => set(initialState),
});
