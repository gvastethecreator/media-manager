/**
 * @file Core slice para el store de File
 * @module store/entities/file/slices/core
 */

import { transformFiles } from '@/transformers/file';
import { DirectoryReadResult, FileBase } from '@/types/entities/file/base';
import { EnhancedFile } from '@/types/entities/file/extended';
import { StateCreator } from 'zustand';
import { FileStore } from '..';

// Estado
export interface CoreState {
  // Datos
  files: EnhancedFile[];
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
  setFiles: (files: EnhancedFile[]) => void;
  setCurrentDirectory: (path: string | null) => void;
  setParentDirectories: (paths: string[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setDirectoryStats: (stats: Pick<CoreState, 'fileCount' | 'directoryCount' | 'totalSize' | 'hasMore'>) => void;

  // Operaciones
  addFile: (file: EnhancedFile) => void;
  updateFile: (id: string, file: Partial<EnhancedFile>) => void;
  removeFile: (id: string) => void;

  // Operaciones avanzadas
  navigateToDirectory: (path: string) => void;
  navigateUp: () => void;
  updateDirectoryContents: (result: DirectoryReadResult) => void;
  updateFilesFromRaw: (files: FileBase[]) => void;

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
  hasMore: false
};

// Crear slice
export const createCoreSlice: StateCreator<
  FileStore,
  [],
  [],
  CoreState & CoreActions
> = (set, get) => ({
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
    const updatedFiles = files.map(file =>
      file.id === id ? { ...file, ...updatedData } : file
    );
    set({ files: updatedFiles });
  },

  removeFile: (id) => {
    const { files, fileCount, directoryCount, totalSize } = get();
    const fileToRemove = files.find(file => file.id === id);

    if (!fileToRemove) return;

    // Actualizar estadísticas
    const newFileCount = fileToRemove.isDirectory ? fileCount : fileCount - 1;
    const newDirCount = fileToRemove.isDirectory ? directoryCount - 1 : directoryCount;
    const newTotalSize = totalSize - (fileToRemove.size || 0);

    set({
      files: files.filter(file => file.id !== id),
      fileCount: newFileCount,
      directoryCount: newDirCount,
      totalSize: newTotalSize
    });
  },

  // Operaciones avanzadas
  navigateToDirectory: (path) => {
    const { currentDirectory, parentDirectories } = get();

    // Guardar el directorio actual en los padres si existe
    const newParentDirectories = currentDirectory
      ? [...parentDirectories, currentDirectory]
      : parentDirectories;

    set({
      currentDirectory: path,
      parentDirectories: newParentDirectories,
      files: []  // Limpiar archivos al navegar
    });
  },

  navigateUp: () => {
    const { parentDirectories } = get();

    if (parentDirectories.length === 0) {
      // Si no hay padres, ir a null (root)
      set({ currentDirectory: null, files: [] });
      return;
    }

    // Obtener el último padre
    const lastParent = parentDirectories[parentDirectories.length - 1];
    const newParents = parentDirectories.slice(0, -1);

    set({
      currentDirectory: lastParent,
      parentDirectories: newParents,
      files: []  // Limpiar archivos al navegar
    });
  },

  updateDirectoryContents: (result) => {
    const transformedFiles = transformFiles(result.items);

    set({
      files: transformedFiles,
      fileCount: result.files,
      directoryCount: result.directories,
      totalSize: transformedFiles.reduce((acc, file) => acc + (file.size || 0), 0),
      hasMore: result.hasMore,
      currentDirectory: result.path,
      error: null
    });
  },

  updateFilesFromRaw: (rawFiles) => {
    const transformedFiles = transformFiles(rawFiles);

    // Actualizar estadísticas
    const fileCount = transformedFiles.filter(file => !file.isDirectory).length;
    const directoryCount = transformedFiles.filter(file => file.isDirectory).length;
    const totalSize = transformedFiles.reduce((acc, file) => acc + (file.size || 0), 0);

    set({
      files: transformedFiles,
      fileCount,
      directoryCount,
      totalSize
    });
  },

  // Operaciones masivas
  reset: () => set(initialState)
});