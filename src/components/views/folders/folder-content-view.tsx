import { Folder, FolderSearch, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
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

	// 📂 Usar selectores específicos para evitar re-renders innecesarios
	const isLoading = useImageStore((s) => s.isLoading);
	const error = useImageStore((s) => s.error);
	const getImages = useImageStore((s) => s.getImages);

	// Cachear el resultado de getImages para evitar loops infinitos
	const images = useMemo(() => {
		return getImages();
	}, [getImages]);

	// Estado local para controlar cargas y evitar loops
	const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
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

	// Efecto para cargar imágenes solo una vez por carpeta
	useEffect(() => {
		if (!currentFolderId) {
			setHasAttemptedLoad(false);
			return;
		}

		// Solo cargar si no hemos intentado cargar para esta carpeta y no estamos cargando
		if (!hasAttemptedLoad && !isLoading) {
			setHasAttemptedLoad(true);
			logger.info(`📂 Cargando imágenes para carpeta: ${currentFolderId}`);

			const { loadImages } = useImageStore.getState();
			loadImages({ folderId: currentFolderId }).catch((loadError) => {
				logger.error('❌ Error al cargar imágenes:', loadError);
			});
		}
	}, [currentFolderId, hasAttemptedLoad, isLoading]);

	// Resetear estado cuando cambia la carpeta
	useEffect(() => {
		setHasAttemptedLoad(false);
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

	// Mostrar estado de carga
	if (isLoading && !hasAttemptedLoad) {
		logger.debug('⏳ Mostrando estado de carga');
		return <LoadingScreen />;
	}

	// Mostrar estado de error solo si hay error y hemos intentado cargar
	if (error && hasAttemptedLoad) {
		logger.error('❌ Error al cargar imágenes:', error);
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<EmptyState
					icon={Folder}
					title="Error al cargar imágenes"
					description={`Ha ocurrido un error al cargar las imágenes. ${typeof error === 'string' ? error : 'Error desconocido'}`}
				/>
				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={handleForceRefresh} disabled={isRetrying}>
						<RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
						{isRetrying ? 'Reintentando...' : 'Reintentar'}
					</Button>
					<Button variant="outline" size="sm" onClick={handleScanFolder} disabled={isRetrying}>
						<FolderSearch className="h-4 w-4 mr-2" />
						{isRetrying ? 'Escaneando...' : 'Escanear Carpeta'}
					</Button>
				</div>
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
 * - Vista optimizada que usa BaseContentView y FileBrowser para una experiencia completa
 * - Controles de recarga y escaneo integrados en el header
 * - Filtrado automático por carpeta usando filterId
 * - UI consistente con el resto del sistema usando componentes base
 * - Previene loops infinitos con estado local de control
 * - Experiencia unificada de navegación de archivos
 */
