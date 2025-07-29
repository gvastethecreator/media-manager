'use client';

import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import { useLogActivity } from '@/lib/api/activity';
import {
    useAddTags,
    useAddToCollection,
    useRemoveFromCollection,
    useRemoveTags,
    useToggleFavorite,
} from '@/lib/api/files';
import { clientEvents } from '@/lib/client/events.client';

import type { EntityWithStats } from '@/types/migration';

// Re-export EntityWithStats for components that need it
export type { EntityWithStats };

interface FileContextType {
	files: EntityWithStats[];
	selectedFiles: string[];
	currentItems: EntityWithStats[];
	selectedItems: EntityWithStats[];
	isLoading: boolean;
	sortBy: 'name' | 'date' | 'size';
	sortOrder: 'asc' | 'desc';
	viewMode: 'grid' | 'list';
	thumbnailSize: 'none' | 'small' | 'medium' | 'large';
	loading: boolean;
	error: string | null;

	// Actions
	setFiles: (files: EntityWithStats[]) => void;
	addFiles: (files: EntityWithStats[]) => void;
	removeFiles: (fileIds: string[]) => void;
	selectFiles: (fileIds: string[]) => void;
	deselectFiles: (fileIds: string[]) => void;
	clearSelection: () => void;
	handleSelectItem: (item: EntityWithStats) => void;
	toggleItemSelection: (item: EntityWithStats, multiSelect?: boolean) => void;
	setSortBy: (sortBy: 'name' | 'date' | 'size') => void;
	setSortOrder: (order: 'asc' | 'desc') => void;
	setViewMode: (mode: 'grid' | 'list') => void;
	setThumbnailSize: (size: 'none' | 'small' | 'medium' | 'large') => void;
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
	getSortedFiles: () => EntityWithStats[];
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: ReactNode }) {
	const [files, setFiles] = useState<EntityWithStats[]>([]);
	const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
	const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [thumbnailSize, setThumbnailSize] = useState<'none' | 'small' | 'medium' | 'large'>('medium');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Usamos el hook de eventos optimistas del cliente
	const [_optimisticState, addEvent] = clientEvents.useEvents({});

	// Hook para registrar actividades - debe estar en el nivel superior
	const logActivity = useLogActivity();

	// Métodos del contexto original
	const addFiles = useCallback((newFiles: EntityWithStats[]) => {
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

	// Métodos del contexto de src/context/file-context.tsx
	const handleSelectItem = useCallback(
		async (item: EntityWithStats) => {
			// Seleccionar el item
			selectFiles([item.id]);

			// Registrar actividad de vista usando API hook
			try {
				await logActivity.mutateAsync({
					type: 'view',
					entityType: 'file',
					entityId: item.id,
					action: 'view',
					userId: 'anonymous', // TODO: obtener del contexto de usuario
					description: `Vista de ${item.name}`,
				});
			} catch (error) {
				console.error('Error registrando actividad:', error);
				// No bloquear la UI por errores de logging
			}
		},
		[selectFiles, logActivity]
	);

	const toggleItemSelection = useCallback(
		(item: EntityWithStats, multiSelect = false) => {
			const isSelected = selectedFiles.includes(item.id);

			if (isSelected) {
				if (multiSelect) {
					deselectFiles([item.id]);
				} else {
					// Si no es multiselección, deseleccionar todo y seleccionar solo este
					setSelectedFiles([]);
				}
			} else {
				if (multiSelect) {
					// Añadir a la selección existente
					selectFiles([item.id]);
				} else {
					// Reemplazar la selección actual
					setSelectedFiles([item.id]);
				}
			}

			// Emitir evento de actualización si es necesario
			const itemAny = item as any;
			if (itemAny.collections?.length) {
				addEvent({ type: 'collections:modified', data: { item } });
			}
			if (itemAny.tags?.length) {
				addEvent({ type: 'tags:modified', data: { item } });
			}
			if (itemAny.characters?.length) {
				addEvent({ type: 'characters:modified', data: { item } });
			}
			if (itemAny.places?.length) {
				addEvent({ type: 'places:modified', data: { item } });
			}
			if (itemAny.worldItems?.length) {
				addEvent({ type: 'world-items:modified', data: { item } });
			}
			if (itemAny.isFavorite) {
				addEvent({ type: 'favorites:modified', data: { item } });
			}
		},
		[selectedFiles, selectFiles, deselectFiles, addEvent]
	);

	// Resto de métodos del contexto original en lib/contexts/file-context.tsx
	const { mutate: toggleFavoriteMutate } = useToggleFavorite();

	const toggleFavorite = useCallback(
		(fileId: string) => {
			toggleFavoriteMutate(fileId);
		},
		[toggleFavoriteMutate]
	);

	const { mutate: addToCollectionMutate } = useAddToCollection();
	const { mutate: removeFromCollectionMutate } = useRemoveFromCollection();

	const addToCollection = useCallback(
		(fileIds: string[], collectionId: string) => {
			for (const fileId of fileIds) {
				addToCollectionMutate({ fileId, collectionId });
			}
		},
		[addToCollectionMutate]
	);

	const removeFromCollection = useCallback(
		(fileIds: string[], collectionId: string) => {
			for (const fileId of fileIds) {
				removeFromCollectionMutate({ fileId, collectionId });
			}
		},
		[removeFromCollectionMutate]
	);

	const { mutate: addTagsMutate } = useAddTags();
	const { mutate: removeTagsMutate } = useRemoveTags();

	const addTags = useCallback(
		(fileIds: string[], tags: string[]) => {
			for (const fileId of fileIds) {
				addTagsMutate({ fileId, tags });
			}
		},
		[addTagsMutate]
	);

	const removeTags = useCallback(
		(fileIds: string[], tags: string[]) => {
			for (const fileId of fileIds) {
				removeTagsMutate({ fileId, tags });
			}
		},
		[removeTagsMutate]
	);

	// Resto de funciones del contexto original
	const moveFiles = useCallback(async (fileIds: string[], targetPath: string) => {
		try {
			setLoading(true);
			// Implementar lógica de movimiento de archivos
			setFiles((prev) =>
				prev.map((file) =>
					fileIds.includes(file.id)
						? { ...file, ...((file as any).path ? { path: `${targetPath}/${file.name}` } : {}) }
						: file
				)
			);
		} catch (err) {
			setError('Error moving files');
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, []);

	const copyFiles = useCallback(
		async (fileIds: string[], targetPath: string) => {
			try {
				setLoading(true);
				// Implementar lógica de copia de archivos
				const filesToCopy = files.filter((file) => fileIds.includes(file.id));
				const copiedFiles = filesToCopy.map((file) => ({
					...file,
					id: crypto.randomUUID(),
					...((file as any).path ? { path: `${targetPath}/${file.name}` } : {}),
				}));
				addFiles(copiedFiles);
			} catch (err) {
				setError('Error copying files');
				console.error(err);
			} finally {
				setLoading(false);
			}
		},
		[files, addFiles]
	);

	const renameFile = useCallback((fileId: string, newName: string) => {
		setFiles((prev) =>
			prev.map((file) =>
				file.id === fileId
					? {
							...file,
							name: newName,
							...((file as any).path ? { path: (file as any).path.replace(/[^/]+$/, newName) } : {}),
						}
					: file
			)
		);
	}, []);

	const uploadFiles = useCallback(
		async (files: File[]) => {
			try {
				setLoading(true);
				// Implementar lógica de carga de archivos
				const newFiles: EntityWithStats[] = await Promise.all(
					files.map(async (file) => {
						const reader = new FileReader();
						const thumbnail = await new Promise<string>((resolve) => {
							reader.onloadend = () => resolve(reader.result as string);
							reader.readAsDataURL(file);
						});

						return {
							id: crypto.randomUUID(),
							name: file.name,
							description: null,
							createdAt: new Date(),
							updatedAt: new Date(),
							entityType: 'image' as const,
							stats: {},
							path: `/uploads/${file.name}`,
							size: file.size,
							type: file.type,
							modified: new Date(file.lastModified),
							thumbnail,
						} as EntityWithStats;
					})
				);
				addFiles(newFiles);
			} catch (err) {
				setError('Error uploading files');
				console.error(err);
			} finally {
				setLoading(false);
			}
		},
		[addFiles]
	);

	const downloadFiles = useCallback(
		async (fileIds: string[]) => {
			try {
				setLoading(true);
				const filesToDownload = files.filter((file) => fileIds.includes(file.id));
				// Implementar lógica de descarga de archivos
				for (const file of filesToDownload) {
					const fileAny = file as any;
					if (!fileAny.thumbnail) continue;

					// Crear un blob con el tipo MIME adecuado
					const response = await fetch(fileAny.thumbnail);
					const blob = await response.blob();
					const url = URL.createObjectURL(blob);

					const link = document.createElement('a');
					link.href = url;
					link.download = file.name;
					link.rel = 'noopener noreferrer';
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);

					// Liberar el objeto URL
					URL.revokeObjectURL(url);
				}
			} catch (err) {
				setError('Error downloading files');
				console.error(err);
			} finally {
				setLoading(false);
			}
		},
		[files]
	);

	// Método para obtener archivos ordenados según criterios actuales
	const getSortedFiles = useCallback(() => {
		return [...files].sort((a, b) => {
			let comparison = 0;
			const aAny = a as any;
			const bAny = b as any;
			switch (sortBy) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'date': {
					const aDate = aAny.modified || a.updatedAt;
					const bDate = bAny.modified || b.updatedAt;
					comparison = aDate.getTime() - bDate.getTime();
					break;
				}
				case 'size': {
					const aSize = aAny.size || 0;
					const bSize = bAny.size || 0;
					comparison = aSize - bSize;
					break;
				}
				default:
					comparison = 0;
			}
			return sortOrder === 'asc' ? comparison : -comparison;
		});
	}, [files, sortBy, sortOrder]);

	// Compatibilidad con contexto original
	const currentItems = files;
	const selectedItems = files.filter((file) => selectedFiles.includes(file.id));
	const isLoading = loading;

	const value = {
		files,
		selectedFiles,
		currentItems,
		selectedItems,
		isLoading,
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
