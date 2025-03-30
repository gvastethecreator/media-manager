'use client';

import { reindexFolder } from '@/app/actions/folders';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useFolderImages } from '@/hooks/use-folder-images';
import type { FileManagerState } from '@/store/files/file-manager.store';
import { useFileManager } from '@/store/files/file-manager.store';
import { Folder } from 'lucide-react';
import { useCallback, useEffect } from 'react';

export function FolderContentView() {
	// Obtener el ID de la carpeta actual del store
	const currentFolderId = useFileManager((state: FileManagerState) => state.currentFolderId);
	const setItems = useFileManager((state: FileManagerState) => state.setItems);

	// Usar el hook personalizado para obtener las imágenes
	const { data: images, isLoading, isError, error, refetch } = useFolderImages(currentFolderId);

	// Actualizar el store cuando cambian las imágenes
	useEffect(() => {
		if (images) {
			setItems(images);
		}
	}, [images, setItems]);

	// Función para reindexar la carpeta
	const handleReindex = useCallback(async () => {
		if (!currentFolderId) return;

		try {
			await reindexFolder(currentFolderId);
			// Recargar las imágenes después de reindexar
			refetch();
		} catch (error) {
			console.error('Error al reindexar la carpeta:', error);
		}
	}, [currentFolderId, refetch]);

	// Mostrar estado de carga
	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<LoadingSpinner />
			</div>
		);
	}

	// Mostrar estado vacío si no hay imágenes
	if (!images || images.length === 0) {
		return (
			<EmptyState
				icon={Folder}
				title="No hay imágenes"
				description="Esta carpeta está vacía. Haz clic en Reindexar para buscar nuevas imágenes."
			/>
		);
	}

	// Renderizar el navegador de archivos
	return (
		<div className="h-full w-full">
			<FileBrowser
				items={images as unknown as FileItem[]}
				onItemClick={(item) => {
					// Aquí puedes manejar el clic en un item si es necesario
				}}
				onItemDoubleClick={(item) => {
					// Aquí puedes manejar el doble clic en un item si es necesario
				}}
			/>
		</div>
	);
}
