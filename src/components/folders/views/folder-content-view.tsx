'use client';

import { reindexFolder } from '@/app/actions/folders';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
// Usar el hook del store de carpetas para mantener consistencia con FoldersView
import { useFolder } from '@/hooks/folder/use-folder';
import { useFolderImages } from '@/hooks/use-folder-images';
import { folderResponseCache } from '@/lib/folder-cache';
import { clientLogger } from '@/lib/logger/client-logger';
import { Folder, RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';

// Logger para depuración
const logger = clientLogger.withContext('FolderContentView');

export function FolderContentView() {
	// 📂 Usar el hook especializado para carpetas (solo para obtener el ID y metadatos)
	const { currentFolder, setCurrentFolder, isLoading: folderLoading } = useFolder();
	const currentFolderId = currentFolder?.id || null;

	// Estado para controlar la recarga manual
	const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);
	const [retryCount, setRetryCount] = useState(0);

	// Usar el hook personalizado para obtener las imágenes
	const { data: images, isLoading, isError, error, refetch } = useFolderImages(currentFolderId);

	// Función para reindexar la carpeta
	const handleReindex = useCallback(async () => {
		if (!currentFolderId) return;

		try {
			// logger.info(`🔄 Iniciando reindexación de carpeta: ${currentFolderId}`); // Comentado
			setIsManuallyRefreshing(true);
			await reindexFolder(currentFolderId);
			// Recargar las imágenes después de reindexar
			// logger.info('🔄 Recargando imágenes después de reindexar'); // Comentado
			// Limpiar caché para esta carpeta
			folderResponseCache.delete(`folder:${currentFolderId}`);
			await refetch();
		} catch (error) {
			// logger.error('❌ Error al reindexar la carpeta:', error); // Comentado
		} finally {
			setIsManuallyRefreshing(false);
		}
	}, [currentFolderId, refetch]);

	// Función para forzar la recarga de imágenes
	const handleForceRefresh = useCallback(async () => {
		// logger.info('🔄 Forzando recarga de imágenes'); // Comentado
		setIsManuallyRefreshing(true);
		setRetryCount((prev) => prev + 1);

		try {
			// Limpiar caché para esta carpeta
			if (currentFolderId) {
				folderResponseCache.delete(`folder:${currentFolderId}`);
				// logger.info(`🧹 Caché limpiada para carpeta: ${currentFolderId}`); // Comentado
			}

			// Recargar imágenes
			await refetch();
		} catch (refreshError) {
			// logger.error('❌ Error al forzar recarga:', refreshError); // Comentado
		} finally {
			setIsManuallyRefreshing(false);
		}
	}, [refetch, currentFolderId]);

	// Mostrar estado de carga
	if (isLoading || folderLoading || isManuallyRefreshing) {
		// logger.debug('⏳ Mostrando estado de carga'); // Comentado
		return (
			<div className="flex items-center justify-center h-full">
				<LoadingSpinner />
			</div>
		);
	}

	// Mostrar estado de error
	if (isError) {
		// logger.error('❌ Error al cargar imágenes:', error); // Comentado
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<EmptyState
					icon={Folder}
					title="Error al cargar imágenes"
					description={`Ha ocurrido un error al cargar las imágenes. ${error instanceof Error ? error.message : ''}`}
				/>
				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={refetch}>
						<RefreshCw className="h-4 w-4 mr-2" />
						Reintentar
					</Button>
					<Button variant="outline" size="sm" onClick={handleForceRefresh}>
						<RefreshCw className="h-4 w-4 mr-2" />
						Forzar Recarga
					</Button>
				</div>
			</div>
		);
	}

	// Mostrar estado vacío si no hay imágenes
	if (!images || images.length === 0) {
		// logger.debug('📭 Mostrando estado vacío - No hay imágenes'); // Comentado
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<EmptyState
					icon={Folder}
					title="No hay imágenes"
					description={
						currentFolder?.count && currentFolder.count > 0
							? `Esta carpeta debería tener ${currentFolder.count} imágenes pero no se pudieron cargar.`
							: 'Esta carpeta está vacía. Haz clic en Reindexar para buscar nuevas imágenes.'
					}
				/>

				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={handleReindex}>
						<RefreshCw className="h-4 w-4 mr-2" />
						Reindexar Carpeta
					</Button>

					<Button variant="outline" size="sm" onClick={handleForceRefresh}>
						<RefreshCw className="h-4 w-4 mr-2" />
						Forzar Recarga
					</Button>
				</div>
			</div>
		);
	}

	// Usar directamente las imágenes del hook, ya que ahora son FileItem[]
	const displayImages = images;
	// logger.debug(`🖼️ Renderizando FileBrowser con ${displayImages.length} imágenes`); // Comentado

	// Renderizar el navegador de archivos
	return (
		<div className="h-full w-full">
			{/* <div className="absolute top-2 right-2 z-10">
				<Button variant="outline" size="sm" onClick={handleForceRefresh}>
					<RefreshCw className="h-4 w-4 mr-2" />
					Recargar
				</Button>
			</div>

			<FileBrowser
				items={displayImages}
				onItemClick={(item) => {
					// logger.debug('🖱️ Click en item:', item.id); // Comentado
					// Aquí puedes manejar el clic en un item si es necesario
				}}
				onItemDoubleClick={(item) => {
					// logger.debug('🖱️🖱️ Doble click en item:', item.id); // Comentado
					// Aquí puedes manejar el doble clic en un item si es necesario
				}}
			/> */}
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 h-full overflow-y-auto">
				{displayImages.map((image) => (
					<div key={image.id} className="relative w-full aspect-square bg-gray-200 flex items-center justify-center text-center p-2 rounded-md">
						<p className="text-sm text-gray-500 break-words line-clamp-2">{image.name}</p>
						{/* Opcionalmente, puedes añadir una imagen simple para probar */}
						{/* {image.thumbnail && <img src={image.thumbnail} alt={image.name} className="absolute inset-0 w-full h-full object-cover" />} */}
					</div>
				))}
			</div>
		</div>
	);
}
