'use client';

import { reindexFolder } from '@/app/actions/folders';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useFolderImages } from '@/hooks/use-folder-images';
import { useFolder } from '@/lib/hooks/use-navigation';
import type { FileItem, FileProcessingStatus, FileType } from '@/types/file-item';
import { Folder } from 'lucide-react';
import { useCallback, useEffect } from 'react';

export function FolderContentView() {
	// 📂 Usar el hook especializado para carpetas
	const { currentFolder, setCurrentFolder, folderImages, isLoading: folderLoading } = useFolder();
	const currentFolderId = currentFolder?.id || null;

	// Usar el hook personalizado para obtener las imágenes
	const { data: images, isLoading, isError, error, refetch } = useFolderImages(currentFolderId);

	// 🔄 Actualizar el contexto de carpeta cuando cambian las imágenes
	useEffect(() => {
		if (images && currentFolderId) {
			// Las imágenes se actualizan automáticamente a través del store unificado
			// No necesitamos setItems manual
		}
	}, [images, currentFolderId]);

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
	if (isLoading || folderLoading) {
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

	// 🎯 Usar las imágenes del hook o del store unificado
	const displayImages = folderImages.length > 0 ? folderImages :
		(images ? images.map((img: any) => ({
			...img,
			id: img.id,
			type: 'image' as FileType,
			mimeType: 'image/jpeg',
			processingStatus: 'completed' as FileProcessingStatus,
			metadata: img.metadata || '{}'
		})) as FileItem[] : []);

	// Renderizar el navegador de archivos
	return (
		<div className="h-full w-full">
			<FileBrowser
				items={displayImages}
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
