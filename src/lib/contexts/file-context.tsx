'use client';

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { moveAuthorizedAssets } from '@/hooks/use-move';
import { useLogActivity } from '@/lib/api/activity';
import { toMediaAssetType } from '@/lib/api/authorized-roots';
import {
	useAddTags,
	useAddToCollection,
	useRemoveFromCollection,
	useRemoveTags,
	useToggleFavorite,
} from '@/lib/api/files';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { createDefaultEntityStats } from '@/lib/utils';
import type { EntityWithStats } from '@/types/entities/entity.types';

// Declarar expresiones regulares a nivel superior
const FILE_NAME_REGEX = /[^/]+$/;
const fileCtxLogger = clientLogger.withContext('FileContext');

// Re-export EntityWithStats for components that need it
export type { EntityWithStats };

interface FileContextType {
	addFiles: (files: EntityWithStats[]) => void;
	addTags: (fileIds: string[], tags: string[]) => void;
	addToCollection: (fileIds: string[], collectionId: string) => void;
	clearSelection: () => void;
	currentItems: EntityWithStats[];
	deselectFiles: (fileIds: string[]) => void;
	downloadFiles: (fileIds: string[]) => Promise<void>;
	error: string | null;
	files: EntityWithStats[];
	getSortedFiles: () => EntityWithStats[];
	handleSelectItem: (item: EntityWithStats) => void;
	isLoading: boolean;
	loading: boolean;
	moveFiles: (fileIds: string[], targetFolderId: string) => Promise<void>;
	removeFiles: (fileIds: string[]) => void;
	removeFromCollection: (fileIds: string[], collectionId: string) => void;
	removeTags: (fileIds: string[], tags: string[]) => void;
	renameFile: (fileId: string, newName: string) => void;
	selectedFiles: string[];
	selectedItems: EntityWithStats[];
	selectFiles: (fileIds: string[]) => void;

	// Actions
	setFiles: (files: EntityWithStats[]) => void;
	setSortBy: (sortBy: 'name' | 'date' | 'size') => void;
	setSortOrder: (order: 'asc' | 'desc') => void;
	setThumbnailSize: (size: 'none' | 'small' | 'medium' | 'large') => void;
	setViewMode: (mode: 'grid' | 'list') => void;
	sortBy: 'name' | 'date' | 'size';
	sortOrder: 'asc' | 'desc';
	thumbnailSize: 'none' | 'small' | 'medium' | 'large';
	toggleFavorite: (fileId: string) => void;
	toggleItemSelection: (item: EntityWithStats, multiSelect?: boolean) => void;
	uploadFiles: (files: File[]) => Promise<void>;
	viewMode: 'grid' | 'list';
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
	const logActivityMutateAsync = logActivity.mutateAsync;

	const handleSelectItem = useCallback(
		async (item: EntityWithStats) => {
			selectFiles([item.id]);

			try {
				await logActivityMutateAsync({
					type: 'view',
					entityType: 'file',
					entityId: item.id,
					action: 'view',
					userId: 'anonymous',
					description: `View of ${item.name}`,
				});
			} catch (err) {
				fileCtxLogger.error('Error recording activity', { error: err });
			}
		},
		[selectFiles, logActivityMutateAsync]
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
			} else if (multiSelect) {
				// Añadir a la selección existente
				selectFiles([item.id]);
			} else {
				// Reemplazar la selección actual
				setSelectedFiles([item.id]);
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
			const targetFile = files.find((file) => file.id === fileId);

			if (!targetFile) {
				fileCtxLogger.warn('No file found when toggling favorite', { fileId });
				return;
			}

			toggleFavoriteMutate(
				{
					entityId: fileId,
					entityType: targetFile.entityType,
				},
				{
					onSuccess: (result) => {
						setFiles((prev) =>
							prev.map((file) => (file.id === fileId ? { ...file, isFavorite: result.isFavorite } : file))
						);
					},
					onError: (error) => {
						fileCtxLogger.error('Error toggling favorite from FileContext', { fileId, error });
					},
				}
			);
		},
		[files, toggleFavoriteMutate]
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

	const moveFiles = useCallback(
		async (fileIds: string[], targetFolderId: string) => {
			const assets = files.flatMap((file) => {
				if (!fileIds.includes(file.id)) return [];
				const assetType = toMediaAssetType(file.entityType);
				return assetType ? [{ assetId: file.id, assetType }] : [];
			});
			try {
				setLoading(true);
				setError(null);
				await moveAuthorizedAssets({ assets, targetFolderId });
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Could not move files');
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[files]
	);

	const renameFile = useCallback((fileId: string, newName: string) => {
		setFiles((prev) =>
			prev.map((file) =>
				file.id === fileId
					? {
							...file,
							name: newName,
							...((file as any).path ? { path: (file as any).path.replace(FILE_NAME_REGEX, newName) } : {}),
						}
					: file
			)
		);
	}, []);

	const uploadFiles = useCallback(
		async (inputFiles: File[]) => {
			try {
				setLoading(true);
				// Implementar lógica de carga de archivos
				const newFiles: EntityWithStats[] = await Promise.all(
					inputFiles.map(async (file) => {
						const reader = new FileReader();
						const thumbnail = await new Promise<string>((resolve) => {
							reader.onloadend = () => resolve(reader.result as string);
							reader.readAsDataURL(file);
						});

						const base: EntityWithStats = {
							id: crypto.randomUUID(),
							name: file.name,
							description: null,
							createdAt: new Date(),
							updatedAt: new Date(),
							entityType: 'image',
							stats: createDefaultEntityStats({
								size: file.size,
								mtime: new Date(file.lastModified),
								birthtime: new Date(file.lastModified),
								type: 'file',
							}),
						};

						// Devolver con propiedades adicionales no tipadas pero útiles para UI
						return Object.assign(base, {
							path: `/uploads/${file.name}`,
							size: file.size,
							type: file.type,
							modified: new Date(file.lastModified),
							thumbnail,
						});
					})
				);
				addFiles(newFiles);
			} catch (err) {
				setError('Error uploading files');
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
				const tasks = filesToDownload
					.map((file) => ({ file, fileAny: file as any }))
					.filter(({ fileAny }) => Boolean(fileAny.thumbnail))
					.map(async ({ file, fileAny }) => {
						const response = await fetch(fileAny.thumbnail as string);
						const blob = await response.blob();
						const url = URL.createObjectURL(blob);
						try {
							const link = document.createElement('a');
							link.href = url;
							link.download = file.name;
							link.rel = 'noopener noreferrer';
							document.body.appendChild(link);
							link.click();
							document.body.removeChild(link);
						} finally {
							URL.revokeObjectURL(url);
						}
					});
				await Promise.all(tasks);
			} catch (err) {
				setError('Error downloading files');
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

	const currentItems = files;
	const selectedItems = useMemo(
		() => files.filter((file) => selectedFiles.includes(file.id)),
		[files, selectedFiles]
	);
	const isLoading = loading;

	const value = useMemo(
		() => ({
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
			renameFile,
			uploadFiles,
			downloadFiles,
			getSortedFiles,
		}),
		[
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
			addFiles,
			removeFiles,
			selectFiles,
			deselectFiles,
			clearSelection,
			handleSelectItem,
			toggleItemSelection,
			toggleFavorite,
			addToCollection,
			removeFromCollection,
			addTags,
			removeTags,
			moveFiles,
			renameFile,
			uploadFiles,
			downloadFiles,
			getSortedFiles,
		]
	);

	return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
}

export function useFiles() {
	const context = useContext(FileContext);
	if (context === undefined) {
		throw new Error('useFiles must be used within a FileProvider');
	}
	return context;
}
