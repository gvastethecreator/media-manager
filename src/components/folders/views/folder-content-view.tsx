'use client';

import { reindexFolder, scanFolderAction } from '@/app/actions/folders';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { FileBrowser } from '@/components/features/file-browser';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
// Usar el hook del store de carpetas para mantener consistencia con FoldersView
import { useFolder } from '@/hooks/folder/use-folder';
import { useFolderImages } from '@/hooks/use-folder-images';
import { folderResponseCache } from '@/lib/folder-cache';
import { clientLogger } from '@/lib/logger/client-logger';
import { Folder, FolderSearch, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Logger para depuración
const logger = clientLogger.withContext('FolderContentView');

export function FolderContentView() {
	// 📂 Usar el hook especializado para carpetas (solo para obtener el ID y metadatos)
	const { currentFolder, setCurrentFolder, isLoading: folderLoading } = useFolder();
	const currentFolderId = currentFolder?.id || null;

	// Estado para controlar la recarga manual
	const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);
	const [retryCount, setRetryCount] = useState(0);
	const [scanResults, setScanResults] = useState<any>(null);

	// Usar el hook personalizado para obtener las imágenes
	const { data: imagesResponse, isLoading, isError, error, refetch } = useFolderImages(currentFolderId);

	// Acceder al array de imágenes desde la respuesta de manera segura
	const images = useMemo(() => {
		if (!imagesResponse) {
			return [];
		}

		// Verificar que tenemos la propiedad items
		if (!imagesResponse.items || !Array.isArray(imagesResponse.items)) {
			logger.warn('⚠️ imagesResponse.items no es un array válido');
			return [];
		}

		return imagesResponse.items;
	}, [imagesResponse]);

	// Log simple para depuración sin acceder a propiedades internas que puedan causar problemas
	logger.debug(`🖼️ Renderizando FileBrowser con ${images.length} imágenes`);

	// Verificación de datos con manejo seguro de errores
	useEffect(() => {
		if (images && images.length > 0) {
			try {
				const firstImage = images[0];
				logger.info('📊 Datos de la primera imagen:', {
					id: firstImage.id,
					name: firstImage.name,
					type: firstImage.type || 'unknown',
				});
			} catch (err) {
				logger.error('❌ Error al acceder a los datos de la imagen:', err);
			}
		}
	}, [images]);

	// Función para reindexar la carpeta
	const handleReindex = useCallback(async () => {
		if (!currentFolderId) return;

		try {
			logger.info(`🔄 Iniciando reindexación de carpeta: ${currentFolderId}`);
			setIsManuallyRefreshing(true);
			await reindexFolder(currentFolderId);
			// Recargar las imágenes después de reindexar
			logger.info('🔄 Recargando imágenes después de reindexar');
			// Limpiar caché para esta carpeta
			folderResponseCache.delete(`folder:${currentFolderId}`);
			await refetch();
		} catch (error) {
			logger.error('❌ Error al reindexar la carpeta:', error);
		} finally {
			setIsManuallyRefreshing(false);
		}
	}, [currentFolderId, refetch]);

	// Función para escanear directamente la carpeta
	const handleScanFolder = useCallback(async () => {
		if (!currentFolder?.path) return;

		try {
			logger.info(`🔍 Escaneando directamente la carpeta: ${currentFolder.path}`);
			setIsManuallyRefreshing(true);
			setScanResults(null);

			// Escanear la carpeta usando la acción del servidor
			const result = await scanFolderAction(currentFolder.path, {
				recursive: true,
				includeHidden: false,
			});

			// Guardar y mostrar los resultados
			setScanResults(result);

			logger.info('✅ Escaneo directo completado:', {
				path: currentFolder.path,
				totalFiles: result.totalFiles,
				images: result.images.length,
				videos: result.videos.length,
				others: result.others.length,
			});

			// Si hay imágenes pero no están en la base de datos, sugerir reindexar
			if (result.images.length > 0 && (!images || images.length === 0)) {
				logger.warn(
					`⚠️ Se encontraron ${result.images.length} imágenes en el sistema de archivos pero ninguna en la base de datos. Se recomienda reindexar.`
				);
			}
		} catch (error) {
			logger.error('❌ Error al escanear directamente la carpeta:', error);
		} finally {
			setIsManuallyRefreshing(false);
		}
	}, [currentFolder?.path, images]);

	// Función para forzar la recarga de imágenes
	const handleForceRefresh = useCallback(async () => {
		logger.info('🔄 Forzando recarga de imágenes');
		setIsManuallyRefreshing(true);
		setRetryCount((prev) => prev + 1);

		try {
			// Limpiar caché para esta carpeta
			if (currentFolderId) {
				folderResponseCache.delete(`folder:${currentFolderId}`);
				logger.info(`🧹 Caché limpiada para carpeta: ${currentFolderId}`);
			}

			// Recargar imágenes
			await refetch();
		} catch (refreshError) {
			logger.error('❌ Error al forzar recarga:', refreshError);
		} finally {
			setIsManuallyRefreshing(false);
		}
	}, [refetch, currentFolderId]);

	// Mostrar estado de carga
	if (isLoading || folderLoading || isManuallyRefreshing) {
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
				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={refetch}>
						<RefreshCw className="h-4 w-4 mr-2" />
						Reintentar
					</Button>
					<Button variant="outline" size="sm" onClick={handleForceRefresh}>
						<RefreshCw className="h-4 w-4 mr-2" />
						Forzar Recarga
					</Button>
					<Button variant="outline" size="sm" onClick={handleScanFolder}>
						<FolderSearch className="h-4 w-4 mr-2" />
						Escanear Carpeta
					</Button>
				</div>
			</div>
		);
	}

	// Mostrar estado vacío si no hay imágenes
	if (!imagesResponse || !imagesResponse.items || imagesResponse.items.length === 0) {
		logger.debug('📭 Mostrando estado vacío - No hay imágenes');
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

				{scanResults && (
					<div className="bg-muted p-4 rounded-md max-w-lg">
						<h3 className="font-medium mb-2">Resultados del escaneo directo:</h3>
						<p>Total archivos: {scanResults.totalFiles}</p>
						<p>Imágenes encontradas: {scanResults.images.length}</p>
						<p>Videos encontrados: {scanResults.videos.length}</p>
						{scanResults.images.length > 0 && (
							<div className="mt-2">
								<p className="text-warning">
									Se encontraron imágenes en el sistema de archivos pero ninguna en la base de datos.
								</p>
								<p className="text-sm">Haz clic en "Reindexar Carpeta" para añadirlas a la base de datos.</p>
							</div>
						)}
					</div>
				)}

				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={handleReindex}>
						<RefreshCw className="h-4 w-4 mr-2" />
						Reindexar Carpeta
					</Button>

					<Button variant="outline" size="sm" onClick={handleForceRefresh}>
						<RefreshCw className="h-4 w-4 mr-2" />
						Forzar Recarga
					</Button>

					<Button variant="outline" size="sm" onClick={handleScanFolder}>
						<FolderSearch className="h-4 w-4 mr-2" />
						Escanear Carpeta
					</Button>
				</div>
			</div>
		);
	}

	// Renderizar el navegador de archivos con las imágenes sin procesamiento adicional
	return (
		<div className="h-full w-full">
			<div className="absolute top-2 right-2 z-10 flex gap-2">
				<Button variant="outline" size="sm" onClick={handleScanFolder}>
					<FolderSearch className="h-4 w-4 mr-2" />
					Escanear
				</Button>
				<Button variant="outline" size="sm" onClick={handleForceRefresh}>
					<RefreshCw className="h-4 w-4 mr-2" />
					Recargar
				</Button>
			</div>

			<FileBrowser
				items={images}
				onItemClick={(item) => {
					logger.debug('🖱️ Click en item:', item.id);
				}}
				onItemDoubleClick={(item) => {
					logger.debug('🖱️🖱️ Doble click en item:', item.id);
				}}
			/>
		</div>
	);
}
