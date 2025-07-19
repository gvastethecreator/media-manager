import { Folder, FolderSearch, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/core/data-display';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import type { ImageItem } from '@/components/features/file-viewer/file-viewer';
import { Button } from '@/components/ui/button';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { useFolder, useReindexFolder } from '@/lib/api/folders';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useImageStore } from '@/store/entities/image';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import { EntityStatsType, type EntityWithStats } from '@/types/migration';
import type { ImageWithStats } from '@/types/entities/image';

// Logger para depuración
const logger = clientLogger.withContext('FolderContentView');

// Función auxiliar para convertir ImageWithStats a ImageItem
const imageWithStatsToImageItem = (image: ImageWithStats): ImageItem => ({
	id: image.id,
	name: image.name,
	type: image.type || 'image',
	path: image.path,
	size: image.size || 0,
	width: image.width,
	height: image.height,
	url: image.url,
	thumbnail: image.thumbnail,
	src: image.src,
	alt: image.alt,
	mimeType: image.mimeType,
	metadata: image.metadata,
	parsedMetadata: image.parsedMetadata,
});

interface FolderContentViewProps {
	folderId?: string;
}

export function FolderContentView({ folderId: propFolderId }: FolderContentViewProps = {}) {
	// 📂 Obtener información de la carpeta actual desde props
	const currentFolderId = propFolderId || null;

	// 🔄 Cargar información de la carpeta desde la API
	const { data: folderData, isLoading: isFolderLoading, error: folderError } = useFolder(currentFolderId || '');

	// Estados globales para panel de detalles y visor
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();
	const { openViewer } = useFileViewerStore();
	const { getImagesByFolder } = useImageStore();

	// Estado local para controlar operaciones
	const [isRetrying, setIsRetrying] = useState(false);

	const handleImageSelect = useCallback((image: EntityWithStats) => {
		logger.info('🖱️ Imagen seleccionada:', image.name);

		// Mostrar panel de detalles con la imagen seleccionada
		setSelectedItems([image]);
		setDetailsPanelVisible(true);
	}, [setSelectedItems, setDetailsPanelVisible]);

	const handleImageDoubleClick = useCallback((image: EntityWithStats) => {
		logger.info('🖱️ Doble click en imagen:', image.name);

		// Obtener todas las imágenes de la carpeta para el visor
		if (currentFolderId) {
			const folderImages = getImagesByFolder(currentFolderId);

			// Convertir a ImageItem y encontrar el índice de la imagen actual
			const imageItems = folderImages.map(imageWithStatsToImageItem);
			const currentIndex = imageItems.findIndex((item: ImageItem) => item.id === image.id);

			// Abrir el visor con todas las imágenes de la carpeta
			openViewer(imageItems, Math.max(0, currentIndex));
		}
	}, [currentFolderId, getImagesByFolder, openViewer]);

	const handleForceRefresh = useCallback(async () => {
		if (!currentFolderId || isRetrying) return;

		setIsRetrying(true);
		logger.info('🔄 Forzando recarga de imágenes');
		try {
			// Usar getState para obtener la función de forma estable
			const { loadImages } = useImageStore.getState();
			await loadImages({ folderId: currentFolderId, refresh: true });
		} catch (refreshError) {
			logger.error('❌ Error al forzar recarga:', refreshError);
		} finally {
			setIsRetrying(false);
		}
	}, [currentFolderId, isRetrying]);

	// Hook para reindexar carpeta
	const reindexFolderMutation = useReindexFolder();

	const handleScanFolder = useCallback(async () => {
		if (!currentFolderId || isRetrying) {
			logger.warn('⚠️ No hay carpeta seleccionada para escanear o ya hay una operación en curso');
			return;
		}

		setIsRetrying(true);
		try {
			logger.info(`🔄 Iniciando escaneo de carpeta: ${currentFolderId}`);

			// Importar y ejecutar la función de reindexación
			await reindexFolderMutation.mutateAsync(currentFolderId);

			logger.info('✅ Escaneo completado, recargando imágenes...');

			// Recargar las imágenes después del escaneo
			const { loadImages } = useImageStore.getState();
			await loadImages({ folderId: currentFolderId, refresh: true });

			logger.info('✅ Escaneo y recarga completados');
		} catch (error) {
			logger.error('❌ Error durante el escaneo:', error);
		} finally {
			setIsRetrying(false);
		}
	}, [currentFolderId, isRetrying, reindexFolderMutation.mutateAsync]);

	// Resetear estado cuando cambia la carpeta
	useEffect(() => {
		setIsRetrying(false);
	}, [currentFolderId]);

	// ️ Validación: verificar que hay una carpeta seleccionada
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

	// 🔄 Mostrar estado de carga mientras se obtiene información de la carpeta
	if (isFolderLoading) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<EmptyState icon={RefreshCw} title="Cargando carpeta..." description="Obteniendo información de la carpeta." />
			</div>
		);
	}

	// ❌ Mostrar error si no se pudo cargar la carpeta
	if (folderError) {
		logger.error('❌ Error al cargar carpeta:', folderError);
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<EmptyState
					icon={Folder}
					title="Error al cargar carpeta"
					description="No se pudo obtener la información de la carpeta. Verifica que existe y tienes permisos para acceder."
				/>
			</div>
		);
	}

	// Renderizar galería de imágenes usando BaseContentView y FileBrowser
	return (
		<BaseContentView
			title={folderData?.name || 'Carpeta'}
			description={folderData?.description || undefined}
			icon={folderData?.emoji || undefined}
			headerControls={
				<>
					<Button variant="outline" size="sm" onClick={handleScanFolder} disabled={isRetrying}>
						<FolderSearch className="h-4 w-4 mr-2" />
						{isRetrying ? 'Escaneando...' : 'Escanear'}
					</Button>
					<Button variant="outline" size="sm" onClick={handleForceRefresh} disabled={isRetrying}>
						<RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
						{isRetrying ? 'Recargando...' : 'Recargar'}
					</Button>
				</>
			}
		>
			<FileBrowser
				entityType={EntityStatsType.IMAGE}
				filterId={currentFolderId}
				filterType="folder"
				onItemClick={handleImageSelect}
				onItemDoubleClick={handleImageDoubleClick}
				className="h-full"
			/>
		</BaseContentView>
	);
}

/**
 * 📝 Documentación:
 * - Vista optimizada que delega la carga de imágenes completamente al FileBrowser
 * - Controles de recarga y escaneo integrados en el header
 * - Filtrado automático por carpeta usando filterId
 * - UI consistente con el resto del sistema usando componentes base
 * - Evita duplicación de lógica de carga entre componentes
 * - Experiencia unificada de navegación de archivos
 */
