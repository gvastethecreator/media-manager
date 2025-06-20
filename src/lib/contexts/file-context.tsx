'use client';

import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import { logActivity } from '@/app/actions/activity/activity.actions';
import { clientEvents } from '@/lib/client/events.client';

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

export function FileProvider({ children }: { children: ReactNode }) {
	const [files, setFiles] = useState<FileItem[]>([]);
	const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
	const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [thumbnailSize, setThumbnailSize] = useState<'small' | 'medium' | 'large'>('medium');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Usamos el hook de eventos optimistas del cliente
	const [_optimisticState, addEvent] = clientEvents.useEvents({});

	// Métodos del contexto original
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

	// Métodos del contexto de src/context/file-context.tsx
	const handleSelectItem = useCallback(
		async (item: FileItem) => {
			// Seleccionar el item
			selectFiles([item.id]);

			// Registrar actividad de vista usando server action en lugar del servicio
			await logActivity({
				type: 'view',
				description: `Vista de ${item.name}`,
				imageId: item.id,
			});
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
			if (item.collections?.length) {
				addEvent({ type: 'collections:modified', data: { item } });
			}
			if (item.tags?.length) {
				addEvent({ type: 'tags:modified', data: { item } });
			}
			if (item.characters?.length) {
				addEvent({ type: 'characters:modified', data: { item } });
			}
			if (item.places?.length) {
				addEvent({ type: 'places:modified', data: { item } });
			}
			if (item.worldItems?.length) {
				addEvent({ type: 'world-items:modified', data: { item } });
			}
			if (item.isFavorite || item.isFavorite) {
				addEvent({ type: 'favorites:modified', data: { item } });
			}
		},
		[selectedFiles, selectFiles, deselectFiles, addEvent]
	);

	// Resto de métodos del contexto original en lib/contexts/file-context.tsx
	const toggleFavorite = useCallback(
		(fileId: string) => {
			setFiles((prev) =>
				prev.map((file) => {
					if (file.id === fileId) {
						const newFile = {
							...file,
							isFavorite: !file.isFavorite,
						};
						addEvent({ type: 'favorites:modified', data: { item: newFile } });
						return newFile;
					}
					return file;
				})
			);
		},
		[addEvent]
	);

	const addToCollection = useCallback(
		(fileIds: string[], collectionId: string) => {
			setFiles((prev) =>
				prev.map((file) => {
					if (fileIds.includes(file.id)) {
						const newFile = {
							...file,
							collections: [...(file.collections || []), collectionId],
						};
						addEvent({ type: 'collections:modified', data: { item: newFile } });
						return newFile;
					}
					return file;
				})
			);
		},
		[addEvent]
	);

	const removeFromCollection = useCallback(
		(fileIds: string[], collectionId: string) => {
			setFiles((prev) =>
				prev.map((file) => {
					if (fileIds.includes(file.id)) {
						const newFile = {
							...file,
							collections: file.collections?.filter((id) => id !== collectionId),
						};
						addEvent({ type: 'collections:modified', data: { item: newFile } });
						return newFile;
					}
					return file;
				})
			);
		},
		[addEvent]
	);

	const addTags = useCallback(
		(fileIds: string[], tags: string[]) => {
			setFiles((prev) =>
				prev.map((file) => {
					if (fileIds.includes(file.id)) {
						const newFile = {
							...file,
							tags: [...new Set([...(file.tags || []), ...tags])],
						};
						addEvent({ type: 'tags:modified', data: { item: newFile } });
						return newFile;
					}
					return file;
				})
			);
		},
		[addEvent]
	);

	const removeTags = useCallback(
		(fileIds: string[], tags: string[]) => {
			setFiles((prev) =>
				prev.map((file) => {
					if (fileIds.includes(file.id)) {
						const newFile = {
							...file,
							tags: file.tags?.filter((tag) => !tags.includes(tag)),
						};
						addEvent({ type: 'tags:modified', data: { item: newFile } });
						return newFile;
					}
					return file;
				})
			);
		},
		[addEvent]
	);

	// Resto de funciones del contexto original
	const moveFiles = useCallback(async (fileIds: string[], targetPath: string) => {
		try {
			setLoading(true);
			// Implementar lógica de movimiento de archivos
			setFiles((prev) =>
				prev.map((file) => (fileIds.includes(file.id) ? { ...file, path: `${targetPath}/${file.name}` } : file))
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
					path: `${targetPath}/${file.name}`,
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
							path: file.path.replace(/[^/]+$/, newName),
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
				const newFiles: FileItem[] = await Promise.all(
					files.map(async (file) => {
						const reader = new FileReader();
						const thumbnail = await new Promise<string>((resolve) => {
							reader.onloadend = () => resolve(reader.result as string);
							reader.readAsDataURL(file);
						});

						return {
							id: crypto.randomUUID(),
							name: file.name,
							path: `/uploads/${file.name}`,
							size: file.size,
							type: file.type,
							modified: new Date(file.lastModified),
							thumbnail,
						};
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
					if (!file.thumbnail) continue;

					// Crear un blob con el tipo MIME adecuado
					const response = await fetch(file.thumbnail);
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
			switch (sortBy) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'date':
					comparison = a.modified.getTime() - b.modified.getTime();
					break;
				case 'size':
					comparison = a.size - b.size;
					break;
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
