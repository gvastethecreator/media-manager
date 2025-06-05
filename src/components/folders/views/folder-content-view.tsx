'use client';

import { reindexFolder } from '@/app/actions/folders';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useFolderImages } from '@/hooks/use-folder-images';
import { useFolder } from '@/lib/hooks/use-navigation';
import { clientLogger } from '@/lib/logger/client-logger';
import { Folder, RefreshCw } from 'lucide-react';
import { useCallback, useEffect } from 'react';

// Logger para depuración
const logger = clientLogger.withContext('FolderContentView');

export function FolderContentView() {
	// 📂 Usar el hook especializado para carpetas (solo para obtener el ID y metadatos)
	const { currentFolder, setCurrentFolder, isLoading: folderLoading } = useFolder();
	const currentFolderId = currentFolder?.id || null;

	// Usar el hook personalizado para obtener las imágenes
	const { data: images, isLoading, isError, error, refetch } = useFolderImages(currentFolderId);

	// 🔄 Registrar información sobre la carpeta y las imágenes
	useEffect(() => {
		logger.info('🔍 DIAGNÓSTICO DETALLADO CARPETAS VACÍAS:', {
			currentFolder: currentFolder
				? {
						id: currentFolder.id,
						name: currentFolder.name,
						path: (currentFolder as any).path || 'No disponible',
					}
				: null,
			currentFolderId,
			imagesLength: images?.length || 0,
			isLoading,
			isError,
			errorMessage: error instanceof Error ? error.message : error,
		});

		if (currentFolder) {
			logger.info(`📂 Carpeta actual: ${currentFolder.name} (${currentFolderId})`);
		}

		if (images !== undefined) {
			logger.info(`🖼️ Imágenes cargadas: ${images.length}`);
			// 🔍 DIAGNÓSTICO: Log detallado cuando no hay imágenes pero debería haberlas
			if (images.length === 0) {
				logger.warn(`🚨 PROBLEMA DETECTADO: Carpeta "${currentFolder?.name}" devuelve 0 imágenes`);
				logger.warn(`   📂 FolderId: ${currentFolderId}`);
				logger.warn(`   📍 Path: ${(currentFolder as any)?.path || 'No disponible'}`);
				logger.warn(`   ⏱️ isLoading: ${isLoading}`);
				logger.warn(`   ❌ isError: ${isError}`);
				if (error) {
					logger.warn('   📊 Error details:', error);
				}
			} else {
				// Log de la primera imagen para verificar estructura
				const firstImage = images[0];
				logger.info(`📄 Primera imagen: ${firstImage.name} (ID: ${firstImage.id})`);
				// Thumbnail no existe en FileItem, usar path en su lugar
				logger.info(`   📁 Path: ${firstImage.path}`);
				logger.info(`   📐 Tamaño: ${firstImage.size} bytes`);
			}
		}
	}, [currentFolder, currentFolderId, images, isLoading, isError, error]);

	// Función para reindexar la carpeta
	const handleReindex = useCallback(async () => {
		if (!currentFolderId) return;

		try {
			logger.info(`🔄 Iniciando reindexación de carpeta: ${currentFolderId}`);
			await reindexFolder(currentFolderId);
			// Recargar las imágenes después de reindexar
			logger.info('🔄 Recargando imágenes después de reindexar');
			refetch();
		} catch (error) {
			logger.error('❌ Error al reindexar la carpeta:', error);
		}
	}, [currentFolderId, refetch]);

	// Función para forzar la recarga de imágenes
	const handleForceRefresh = useCallback(() => {
		logger.info('🔄 Forzando recarga de imágenes');
		refetch();
	}, [refetch]);

	// Mostrar estado de carga
	if (isLoading || folderLoading) {
		logger.debug('⏳ Mostrando estado de carga');
		return (
			<div className="flex items-center justify-center h-full">
				<LoadingSpinner />
			</div>
		);
	}

	// Mostrar estado de error
	if (isError) {
		logger.error('❌ Error al cargar imágenes:', error);
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<EmptyState
					icon={Folder}
					title="Error al cargar imágenes"
					description={`Ha ocurrido un error al cargar las imágenes. ${error instanceof Error ? error.message : ''}`}
				/>
				<Button variant="outline" size="sm" onClick={refetch}>
					<RefreshCw className="h-4 w-4 mr-2" />
					Reintentar
				</Button>
			</div>
		);
	}

	// Mostrar estado vacío si no hay imágenes
	if (!images || images.length === 0) {
		logger.debug('📭 Mostrando estado vacío - No hay imágenes');
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<EmptyState
					icon={Folder}
					title="No hay imágenes"
					description="Esta carpeta está vacía. Haz clic en Reindexar para buscar nuevas imágenes."
				/>

				<Button variant="outline" size="sm" onClick={handleReindex}>
					<RefreshCw className="h-4 w-4 mr-2" />
					Reindexar Carpeta
				</Button>

				<Button variant="outline" size="sm" onClick={handleForceRefresh}>
					<RefreshCw className="h-4 w-4 mr-2" />
					Forzar Recarga
				</Button>
			</div>
		);
	}

	// Usar directamente las imágenes del hook, ya que ahora son FileItem[]
	const displayImages = images;
	logger.debug(`🖼️ Renderizando FileBrowser con ${displayImages.length} imágenes`);

	// Renderizar el navegador de archivos
	return (
		<div className="h-full w-full">
			<div className="absolute top-2 right-2 z-10">
				<Button variant="outline" size="sm" onClick={handleForceRefresh}>
					<RefreshCw className="h-4 w-4 mr-2" />
					Recargar
				</Button>
			</div>

			<FileBrowser
				items={displayImages}
				onItemClick={(item) => {
					logger.debug('🖱️ Click en item:', item.id);
					// Aquí puedes manejar el clic en un item si es necesario
				}}
				onItemDoubleClick={(item) => {
					logger.debug('🖱️🖱️ Doble click en item:', item.id);
					// Aquí puedes manejar el doble clic en un item si es necesario
				}}
			/>
		</div>
	);
}
