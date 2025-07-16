import { Folder, FolderSearch, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/core/data-display';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { Button } from '@/components/ui/button';
import BaseContentView from '@/components/views/base/base-content-view';
import { useReindexFolder } from '@/lib/api/folders';
import { clientLogger } from '@/lib/logger/client-logger';
import { useImageStore } from '@/store/entities/image';
import type { EntityWithStats } from '@/types/migration';

// Logger para depuración
const logger = clientLogger.withContext('FolderContentView');

interface FolderContentViewProps {
	folderId?: string;
}

export function FolderContentView({ folderId: propFolderId }: FolderContentViewProps = {}) {
	// 📂 Obtener información de la carpeta actual desde navigation store o props
	const { currentItem } = useNavigationStore();
	const currentFolderId = propFolderId || currentItem?.id || null;

	// Estado local para controlar operaciones
	const [isRetrying, setIsRetrying] = useState(false);

	const handleImageSelect = useCallback((image: EntityWithStats) => {
		logger.info('🖱️ Imagen seleccionada:', image.name);
		// Lógica de selección aquí
	}, []);

	const handleImageDoubleClick = useCallback((image: EntityWithStats) => {
		logger.info('🖱️ Doble click en imagen:', image.name);
		// Lógica de apertura de visor aquí
	}, []);

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

	// Renderizar galería de imágenes usando BaseContentView y FileBrowser
	return (
		<BaseContentView
			title={currentItem?.name || 'Carpeta'}
			description={currentItem?.description}
			icon={currentItem?.emoji}
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
				entityType="image"
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
