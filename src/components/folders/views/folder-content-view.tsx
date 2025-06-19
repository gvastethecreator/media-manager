'use client';

import { Folder, FolderSearch, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { reindexFolder } from '@/app/actions/folders';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
// Usar el hook del store unificado para mejor integración con paginación
import { folderResponseCache } from '@/lib/folder-cache';
import { clientLogger } from '@/lib/logger/client-logger';
import { useUnifiedFileManager } from '@/store/unified-file-manager.store';
import { FileItem } from '@/types/files';

// Logger para depuración
const logger = clientLogger.withContext('FolderContentView');

export function FolderContentView() {
	// 📂 Obtener información de la carpeta actual desde navigation store
	const { currentItem } = useNavigationStore();
	const currentFolderId = currentItem?.id || null;

	// 📂 Usar el store unificado para manejo completo de archivos y paginación
	const {
		currentItems,
		displayedItems,
		isLoading,
		isLoadingMore,
		hasMoreItems,
		error,
		currentFolder,
		setCurrentFolder,
		loadMoreItems,
		refreshCurrentContext,
	} = useUnifiedFileManager();

	// Estado para controlar la recarga manual
	const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);
	const [_retryCount, setRetryCount] = useState(0);
	const [scanResults, setScanResults] = useState<any>(null);

	// 🚀 Inicializar carpeta cuando cambie currentFolderId
	useEffect(() => {
		if (currentFolderId) {
			logger.info(`🔄 Inicializando carpeta: ${currentFolderId}`);
			setCurrentFolder(currentFolderId);
		}
	}, [currentFolderId, setCurrentFolder]);

	// 🛡️ Validación: verificar que hay una carpeta seleccionada
	if (!currentFolderId) {
		logger.warn('⚠️ No hay carpeta seleccionada');
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<EmptyState
					icon={Folder}
					title="No hay carpeta seleccionada"
					description="Selecciona una carpeta desde la vista de carpetas para ver su contenido."
				/>
			</div>
		);
	}

	// 📂 Los archivos ahora vienen directamente del store unificado
	const images: FileItem[] = useMemo(() => {
		// Los items ya están transformados en el store
		return displayedItems || [];
	}, [displayedItems]);

	// Log simple para depuración sin acceder a propiedades internas que puedan causar problemas
	logger.debug(`🖼️ Renderizando FileBrowser2 con ${images.length} imágenes`);

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
			await refreshCurrentContext();
		} catch (error) {
			logger.error('❌ Error al reindexar la carpeta:', error);
		} finally {
			setIsManuallyRefreshing(false);
		}
	}, [currentFolderId, refreshCurrentContext]);

	// Función para escanear directamente la carpeta
	const handleScanFolder = useCallback(async () => {
		// Por ahora deshabilitamos esta función ya que no tenemos acceso al path
		// TODO: Implementar cuando tengamos acceso completo a la información de la carpeta
		logger.warn('⚠️ Función de escaneo directo temporalmente deshabilitada');
		setScanResults(null);
	}, []);

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
			await refreshCurrentContext();
		} catch (refreshError) {
			logger.error('❌ Error al forzar recarga:', refreshError);
		} finally {
			setIsManuallyRefreshing(false);
		}
	}, [refreshCurrentContext, currentFolderId]);

	// Mostrar estado de carga
	if (isLoading || isManuallyRefreshing) {
		logger.debug('⏳ Mostrando estado de carga');
		return (
			<div className="flex items-center justify-center h-full">
				<LoadingSpinner />
			</div>
		);
	}

	// Mostrar estado de error
	if (error) {
		logger.error('❌ Error al cargar imágenes:', error);
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<EmptyState
					icon={Folder}
					title="Error al cargar imágenes"
					description={`Ha ocurrido un error al cargar las imágenes. ${typeof error === 'string' ? error : 'Error desconocido'}`}
				/>
				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={handleForceRefresh}>
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
	if (!images || images.length === 0) {
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

	// 🛡️ Validación adicional: proteger contra arrays inconsistentes o corruptos
	const isArraySafe = Array.isArray(images) && images.every((img) => img && typeof img === 'object');
	if (!isArraySafe) {
		logger.error('🛡️ Array de imágenes inconsistente o corrupto detectado en FolderContentView', { images });
		return (
			<EmptyState
				icon={Folder}
				title="Error de datos"
				description="Se detectaron datos inconsistentes al cargar las imágenes de la carpeta. Por favor, reindexa o contacta soporte."
			/>
		);
	}

	// Renderizar el navegador de archivos con las imágenes y scroll infinito
	return (
		<div className="relative h-full w-full min-h-0 min-w-0 flex-1 flex flex-col overflow-hidden">
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

			{/* 🛡️ El contenedor de FileBrowser ahora ocupa todo el espacio disponible */}
			<div className="flex-1 min-h-0 min-w-0 h-full w-full overflow-hidden">
				<FileBrowser
					items={images}
					onItemSelect={(item: FileItem) => {
						logger.debug('🖱️ Select en item:', item.id);
					}}
					onItemDoubleClick={(item: FileItem) => {
						logger.debug('🖱️🖱️ Doble click en item:', item.id);
					}}
					// 🚀 Conectar scroll infinito
					loadMoreItems={hasMoreItems ? loadMoreItems : undefined}
					isLoading={isLoadingMore}
				/>
			</div>
		</div>
	);
}
