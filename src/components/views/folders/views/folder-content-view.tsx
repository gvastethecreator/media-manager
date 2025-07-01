'use client';

import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { Button } from '@/components/ui/button';
import { clientLogger } from '@/lib/logger/client-logger';
import { useImageStore } from '@/store/entities/image';
import type { EntityWithStats } from '@/types/migration';
import { Folder, FolderSearch, RefreshCw } from 'lucide-react';
import { useCallback } from 'react';

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

	const handleImageSelect = useCallback((image: EntityWithStats) => {
		logger.info('🖱️ Imagen seleccionada:', image.name);
		// Lógica de selección aquí
	}, []);

	const handleImageDoubleClick = useCallback((image: EntityWithStats) => {
		logger.info('🖱️ Doble click en imagen:', image.name);
		// Lógica de apertura de visor aquí
	}, []);

	const handleForceRefresh = useCallback(async () => {
		if (!currentFolderId) return;

		logger.info('🔄 Forzando recarga de imágenes');
		try {
			// Usar getState para obtener la función de forma estable
			const { loadImages } = useImageStore.getState();
			await loadImages({ folderId: currentFolderId, refresh: true });
		} catch (refreshError) {
			logger.error('❌ Error al forzar recarga:', refreshError);
		}
	}, [currentFolderId]);

	const handleScanFolder = useCallback(async () => {
		if (!currentFolderId) {
			logger.warn('⚠️ No hay carpeta seleccionada para escanear');
			return;
		}

		try {
			logger.info(`🔄 Iniciando escaneo de carpeta: ${currentFolderId}`);

			// Importar y ejecutar la función de reindexación
			const { reindexFolder } = await import('@/app/actions/folders/crud.actions');
			await reindexFolder(currentFolderId);

			logger.info('✅ Escaneo completado, recargando imágenes...');

			// Recargar las imágenes después del escaneo
			const { loadImages } = useImageStore.getState();
			await loadImages({ folderId: currentFolderId, refresh: true });

			logger.info('✅ Escaneo y recarga completados');
		} catch (error) {
			logger.error('❌ Error durante el escaneo:', error);
		}
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
	if (isLoading) {
		logger.debug('⏳ Mostrando estado de carga');
		return <LoadingScreen />;
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
					<Button variant="outline" size="sm" onClick={handleScanFolder}>
						<FolderSearch className="h-4 w-4 mr-2" />
						Escanear Carpeta
					</Button>
				</div>
			</div>
		);
	}

	// Renderizar galería de imágenes usando FileBrowser
	return (
		<div className="relative h-full w-full min-h-0 min-w-0 flex-1 flex flex-col overflow-hidden">
			{/* Controles en la esquina superior derecha */}
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

			{/* Header con información de la carpeta */}
			<div className="p-6 pb-4 border-b border-border bg-background/50 backdrop-blur-sm">
				<h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
					{currentItem?.emoji && <span className="text-3xl">{currentItem.emoji}</span>}
					{currentItem?.name || 'Carpeta'}
				</h2>
				{currentItem?.description && <p className="text-muted-foreground">{currentItem.description}</p>}
			</div>
			{/* FileBrowser con filtrado por carpeta */}
			<div className="flex-1 overflow-hidden">
				<FileBrowser
					entityType="image"
					filterId={currentFolderId}
					filterType="folder"
					onItemSelect={handleImageSelect}
					onItemDoubleClick={handleImageDoubleClick}
					className="h-full"
				/>
			</div>
		</div>
	);
}

/**
 * 📝 Documentación:
 * - Vista optimizada que usa FileBrowser para mostrar imágenes con thumbnails
 * - Integra store Zustand para gestión eficiente de estado
 * - Filtrado automático por carpeta usando filterId
 * - Controles de recarga y escaneo integrados
 * - Información contextual de la carpeta
 * - UI consistente con el resto del sistema
 */
