'use client';

/**
 * @file Contexto de archivos seguro - Sin dependencias de eventos ni server actions
 * @module lib/contexts/file-context-safe
 */

import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';

export interface FileItem {
	id: string;
	name: string;
	path: string;
	size: number;
	type: string;
	modified: Date;
	metadata?: {
		width?: number;
		height?: number;
		format?: string;
		[key: string]: string | number | boolean | null | undefined;
	};
	tags?: string[];
	collections?: string[];
	characters?: string[];
	places?: string[];
	worldItems?: string[];
	favorite?: boolean;
	isFavorite?: boolean;
	thumbnail?: string;
}

interface FileContextType {
	files: FileItem[];
	selectedFiles: string[];
	currentItems: FileItem[];
	selectedItems: FileItem[];
	isLoading: boolean;
	sortBy: 'name' | 'date' | 'size';
	sortOrder: 'asc' | 'desc';
	viewMode: 'grid' | 'list';
	thumbnailSize: 'small' | 'medium' | 'large';
	loading: boolean;
	error: string | null;

	// Actions
	setFiles: (files: FileItem[]) => void;
	addFiles: (files: FileItem[]) => void;
	removeFiles: (fileIds: string[]) => void;
	selectFiles: (fileIds: string[]) => void;
	deselectFiles: (fileIds: string[]) => void;
	clearSelection: () => void;
	handleSelectItem: (item: FileItem) => void;
	toggleItemSelection: (item: FileItem, multiSelect?: boolean) => void;
	setSortBy: (sortBy: 'name' | 'date' | 'size') => void;
	setSortOrder: (order: 'asc' | 'desc') => void;
	setViewMode: (mode: 'grid' | 'list') => void;
	setThumbnailSize: (size: 'small' | 'medium' | 'large') => void;
	toggleFavorite: (fileId: string) => void;
	addToCollection: (fileIds: string[], collectionId: string) => void;
	removeFromCollection: (fileIds: string[], collectionId: string) => void;
	addTags: (fileIds: string[], tags: string[]) => void;
	removeTags: (fileIds: string[], tags: string[]) => void;
	moveFiles: (fileIds: string[], targetPath: string) => void;
	copyFiles: (fileIds: string[], targetPath: string) => void;
	renameFile: (fileId: string, newName: string) => void;
	uploadFiles: (files: File[]) => Promise<void>;
	downloadFiles: (fileIds: string[]) => Promise<void>;
	getSortedFiles: () => FileItem[];
}

const FileContext = createContext<FileContextType | undefined>(undefined);

/**
 * Provider de archivos seguro - Sin eventos ni server actions
 */
export function FileProviderSafe({ children }: { children: ReactNode }) {
	const [files, setFiles] = useState<FileItem[]>([]);
	const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
	const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [thumbnailSize, setThumbnailSize] = useState<'small' | 'medium' | 'large'>('medium');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Items calculados
	const currentItems = files;
	const selectedItems = files.filter((file) => selectedFiles.includes(file.id));

	// Métodos básicos
	const addFiles = useCallback((newFiles: FileItem[]) => {
		setFiles((prev) => [...prev, ...newFiles]);
	}, []);

	const removeFiles = useCallback((fileIds: string[]) => {
		setFiles((prev) => prev.filter((file) => !fileIds.includes(file.id)));
		setSelectedFiles((prev) => prev.filter((id) => !fileIds.includes(id)));
	}, []);

	const selectFiles = useCallback((fileIds: string[]) => {
		setSelectedFiles((prev) => [...new Set([...prev, ...fileIds])]);
	}, []);

	const deselectFiles = useCallback((fileIds: string[]) => {
		setSelectedFiles((prev) => prev.filter((id) => !fileIds.includes(id)));
	}, []);

	const clearSelection = useCallback(() => {
		setSelectedFiles([]);
	}, []);

	// Selección de items (sin server actions)
	const handleSelectItem = useCallback(
		async (item: FileItem) => {
			// Solo seleccionar el item, sin registrar actividad
			selectFiles([item.id]);
			console.log(`Item seleccionado: ${item.name}`);
		},
		[selectFiles]
	);

	const toggleItemSelection = useCallback(
		(item: FileItem, multiSelect = false) => {
			const isSelected = selectedFiles.includes(item.id);

			if (isSelected) {
				if (multiSelect) {
					deselectFiles([item.id]);
				} else {
					setSelectedFiles([]);
				}
			} else {
				if (multiSelect) {
					selectFiles([item.id]);
				} else {
					setSelectedFiles([item.id]);
				}
			}

			// Log simple sin eventos
			console.log(`Item ${isSelected ? 'deseleccionado' : 'seleccionado'}: ${item.name}`);
		},
		[selectedFiles, selectFiles, deselectFiles]
	);

	// Operaciones de favoritos (sin eventos)
	const toggleFavorite = useCallback((fileId: string) => {
		setFiles((prev) =>
			prev.map((file) => {
				if (file.id === fileId) {
					const newFile = {
						...file,
						isFavorite: !file.isFavorite,
					};
					console.log(`Favorito ${newFile.isFavorite ? 'añadido' : 'removido'}: ${file.name}`);
					return newFile;
				}
				return file;
			})
		);
	}, []);

	// Operaciones de colecciones (sin eventos)
	const addToCollection = useCallback((fileIds: string[], collectionId: string) => {
		setFiles((prev) =>
			prev.map((file) => {
				if (fileIds.includes(file.id)) {
					const newFile = {
						...file,
						collections: [...(file.collections || []), collectionId],
					};
					console.log(`Archivo añadido a colección ${collectionId}: ${file.name}`);
					return newFile;
				}
				return file;
			})
		);
	}, []);

	const removeFromCollection = useCallback((fileIds: string[], collectionId: string) => {
		setFiles((prev) =>
			prev.map((file) => {
				if (fileIds.includes(file.id)) {
					const newFile = {
						...file,
						collections: file.collections?.filter((id) => id !== collectionId),
					};
					console.log(`Archivo removido de colección ${collectionId}: ${file.name}`);
					return newFile;
				}
				return file;
			})
		);
	}, []);

	// Operaciones de etiquetas (sin eventos)
	const addTags = useCallback((fileIds: string[], tags: string[]) => {
		setFiles((prev) =>
			prev.map((file) => {
				if (fileIds.includes(file.id)) {
					const newFile = {
						...file,
						tags: [...new Set([...(file.tags || []), ...tags])],
					};
					console.log(`Etiquetas añadidas a ${file.name}: ${tags.join(', ')}`);
					return newFile;
				}
				return file;
			})
		);
	}, []);

	const removeTags = useCallback((fileIds: string[], tags: string[]) => {
		setFiles((prev) =>
			prev.map((file) => {
				if (fileIds.includes(file.id)) {
					const newFile = {
						...file,
						tags: file.tags?.filter((tag) => !tags.includes(tag)),
					};
					console.log(`Etiquetas removidas de ${file.name}: ${tags.join(', ')}`);
					return newFile;
				}
				return file;
			})
		);
	}, []);

	// Operaciones de archivos (simplificadas)
	const moveFiles = useCallback(async (fileIds: string[], targetPath: string) => {
		try {
			setLoading(true);
			setFiles((prev) =>
				prev.map((file) =>
					fileIds.includes(file.id)
						? { ...file, path: `${targetPath}/${file.name}` }
						: file
				)
			);
			console.log(`Archivos movidos a: ${targetPath}`);
		} catch (err) {
			setError('Error moving files');
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, []);

	const copyFiles = useCallback(async (fileIds: string[], targetPath: string) => {
		try {
			setLoading(true);
			const filesToCopy = files.filter((file) => fileIds.includes(file.id));
			const copiedFiles = filesToCopy.map((file) => ({
				...file,
				id: `${file.id}-copy-${Date.now()}`,
				name: `${file.name} - Copia`,
				path: `${targetPath}/${file.name}`,
			}));
			setFiles((prev) => [...prev, ...copiedFiles]);
			console.log(`${copiedFiles.length} archivos copiados a: ${targetPath}`);
		} catch (err) {
			setError('Error copying files');
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, [files]);

	const renameFile = useCallback(async (fileId: string, newName: string) => {
		try {
			setLoading(true);
			setFiles((prev) =>
				prev.map((file) =>
					file.id === fileId
						? { ...file, name: newName }
						: file
				)
			);
			console.log(`Archivo renombrado a: ${newName}`);
		} catch (err) {
			setError('Error renaming file');
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, []);

	const uploadFiles = useCallback(async (files: File[]) => {
		try {
			setLoading(true);
			// Simular upload
			const newFiles: FileItem[] = files.map((file) => ({
				id: `upload-${Date.now()}-${Math.random()}`,
				name: file.name,
				path: `/uploads/${file.name}`,
				size: file.size,
				type: file.type,
				modified: new Date(),
				isFavorite: false,
			}));
			addFiles(newFiles);
			console.log(`${files.length} archivos subidos`);
		} catch (err) {
			setError('Error uploading files');
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, [addFiles]);

	const downloadFiles = useCallback(async (fileIds: string[]) => {
		try {
			setLoading(true);
			// Simular download
			const filesToDownload = files.filter((file) => fileIds.includes(file.id));
			console.log(`Descargando ${filesToDownload.length} archivos`);
		} catch (err) {
			setError('Error downloading files');
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, [files]);

	// Función para obtener archivos ordenados
	const getSortedFiles = useCallback(() => {
		const sorted = [...files].sort((a, b) => {
			let comparison = 0;

			switch (sortBy) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'date':
					comparison = new Date(a.modified).getTime() - new Date(b.modified).getTime();
					break;
				case 'size':
					comparison = a.size - b.size;
					break;
			}

			return sortOrder === 'asc' ? comparison : -comparison;
		});

		return sorted;
	}, [files, sortBy, sortOrder]);

	const value: FileContextType = {
		files,
		selectedFiles,
		currentItems,
		selectedItems,
		isLoading: loading,
		sortBy,
		sortOrder,
		viewMode,
		thumbnailSize,
		loading,
		error,
		setFiles,
		addFiles,
		removeFiles,
		selectFiles,
		deselectFiles,
		clearSelection,
		handleSelectItem,
		toggleItemSelection,
		setSortBy,
		setSortOrder,
		setViewMode,
		setThumbnailSize,
		toggleFavorite,
		addToCollection,
		removeFromCollection,
		addTags,
		removeTags,
		moveFiles,
		copyFiles,
		renameFile,
		uploadFiles,
		downloadFiles,
		getSortedFiles,
	};

	return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
}

export function useFiles() {
	const context = useContext(FileContext);
	if (context === undefined) {
		throw new Error('useFiles must be used within a FileProvider');
	}
	return context;
}