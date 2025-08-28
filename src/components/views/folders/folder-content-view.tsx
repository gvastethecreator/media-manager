import { Folder, Images } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/core/data-display';
import { PerformanceMetricsPanel } from '@/components/debug/performance-metrics-panel';
import { FileBrowser } from '@/components/features/file-browser';
import type { ImageItem } from '@/components/features/file-viewer/file-viewer';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { useFolder, useReindexFolder } from '@/lib/api/folders';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useImageStore } from '@/store/entities/image';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import { useUIStore } from '@/store/ui.store';
import type { ImageWithStats } from '@/types/entities/image';
import type { AnyEntityWithStats } from '@/types/migration';

// Logger para depuración
const logger = clientLogger.withContext('FolderContentView');

// Función auxiliar para convertir ImageWithStats a ImageItem
const imageWithStatsToImageItem = (img: ImageWithStats): ImageItem => ({
	id: img.id,
	name: img.name,
	type: 'image',
	path: img.path,
	size: img.size,
	width: null,
	height: null,
	url: `/api/images/${img.id}/file`,
	thumbnail: `/api/images/${img.id}/thumbnail`,
	thumbnailUrl: `/api/images/${img.id}/thumbnail`,
	src: `/api/images/${img.id}/file`,
	alt: img.name,
	mimeType: 'image/jpeg',
	metadata: null,
	parsedMetadata: undefined,
});

function buildEmptySelectionState() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-0">
			<EmptyState
				description="Selecciona una carpeta desde la vista de carpetas para ver su contenido."
				icon={Folder}
				title="No hay carpeta seleccionada"
			/>
		</div>
	);
}

// (estado de carga visual no usado: FileBrowser se monta también en loading)

function buildErrorState() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-4">
			<EmptyState
				description="No se pudo obtener la información de la carpeta. Verifica que existe y tienes permisos para acceder."
				icon={Folder}
				title="Error al cargar carpeta"
			/>
		</div>
	);
}

function buildEmptyFolderState(handleScanFolder: () => void, handleForceRefresh: () => void) {
	return (
		<BaseContentView showHeader={false}>
			<div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
				<EmptyState
					description="No se encontraron archivos en esta carpeta todavía. Puedes escanear o refrescar."
					icon={Images}
					title="Carpeta vacía"
				/>
				<div className="flex flex-wrap items-center justify-center gap-3 text-muted-foreground text-sm">
					<button
						className="rounded-md border px-3 py-1.5 font-medium text-xs hover:bg-accent hover:text-accent-foreground"
						onClick={() => handleScanFolder()}
						type="button"
					>
						Escanear carpeta
					</button>
					<button
						className="rounded-md border px-3 py-1.5 font-medium text-xs hover:bg-accent hover:text-accent-foreground"
						onClick={() => handleForceRefresh()}
						type="button"
					>
						Refrescar
					</button>
				</div>
			</div>
		</BaseContentView>
	);
}

function shouldRenderEmptyFolder(params: {
	isFolderLoading: boolean;
	folderError: unknown;
	folderLoaded: boolean;
	getFolderImages: () => ImageWithStats[];
}): boolean {
	if (params.isFolderLoading) {
		return false;
	}
	if (params.folderError) {
		return false;
	}
	if (!params.folderLoaded) {
		return false; // Aún no se ha completado la primera carga real
	}
	try {
		const images = params.getFolderImages();
		return images.length === 0;
	} catch (e) {
		logger.warn('⚠️ Error comprobando carpeta vacía:', e);
		return false;
	}
}

interface FolderContentViewProps {
	folderId?: string;
	// Props para integración con toolbar
	onScanFolder?: () => void;
	onRefreshFolder?: () => void;
	isRetrying?: boolean;
}

export function FolderContentView({
	folderId: propFolderId,
	onScanFolder: externalOnScanFolder,
	onRefreshFolder: externalOnRefreshFolder,
	isRetrying: externalIsRetrying = false,
}: FolderContentViewProps = {}) {
	// 📂 Obtener información de la carpeta actual desde props
	const currentFolderId = propFolderId || null;

	// Estado de carpeta (loading/error) desde React Query
	const { isLoading: isFolderLoading, error: folderError } = useFolder(currentFolderId || '');

	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();
	const { openViewer } = useFileViewerStore();
	const { getImagesByFolder, folderLoadState, fetchImages } = useImageStore();

	// Importar el store de UI para controlar el panel físico
	const { isRightPanelCollapsed, toggleRightPanel } = useUIStore();

	// Efecto para abrir automáticamente el panel de estadísticas al navegar a una carpeta
	useEffect(() => {
		if (currentFolderId) {
			logger.info('📂 Navegando a carpeta:', currentFolderId);
			// Asegurar visibilidad del contenido del panel de detalles
			setDetailsPanelVisible(true);
			// Abrir el panel físico si está colapsado
			if (isRightPanelCollapsed) {
				logger.info('🔧 Abriendo panel físico para mostrar estadísticas');
				toggleRightPanel();
			}
		}
	}, [currentFolderId, setDetailsPanelVisible, isRightPanelCollapsed, toggleRightPanel]);

	// Estado local para controlar operaciones (usar externo si está disponible)
	const [internalIsRetrying, setInternalIsRetrying] = useState(false);
	const isRetrying = externalIsRetrying || internalIsRetrying;

	const handleImageSelect = useCallback(
		(item: AnyEntityWithStats) => {
			logger.info(`🖱️ Entidad seleccionada: ${item.name} (tipo: ${item.entityType})`);
			setSelectedItems([item]);
			setDetailsPanelVisible(true);
		},
		[setSelectedItems, setDetailsPanelVisible]
	);

	const handleImageDoubleClick = useCallback(
		(item: AnyEntityWithStats) => {
			logger.info(`🖱️ Doble click en entidad: ${item.name} (tipo: ${item.entityType})`);
			if (!currentFolderId) {
				return;
			}

			// Solo abrir viewer para imágenes (por ahora el viewer solo soporta imágenes)
			if (item.entityType === 'image') {
				const dblImage = item as ImageWithStats;
				const folderImages = getImagesByFolder(currentFolderId);
				const imageItems = folderImages.map(imageWithStatsToImageItem);
				const viewerIndex = imageItems.findIndex((it: ImageItem) => it.id === dblImage.id);
				openViewer(imageItems, Math.max(0, viewerIndex));
			} else {
				// Para otros tipos, por ahora solo loguear
				// TODO: Implementar viewers específicos para video, audio, documentos, etc.
				logger.info(`📋 Entidad ${item.entityType} seleccionada: ${item.name}`);
			}
		},
		[currentFolderId, getImagesByFolder, openViewer]
	);

	const handleForceRefresh = useCallback(async () => {
		if (!currentFolderId || isRetrying) {
			return;
		}

		// Usar función externa si está disponible
		if (externalOnRefreshFolder) {
			externalOnRefreshFolder();
			return;
		}

		setInternalIsRetrying(true);
		logger.info('🔄 Forzando recarga de imágenes');
		try {
			// Usar getState para obtener la función de forma estable
			const { loadImages } = useImageStore.getState();
			await loadImages({ folderId: currentFolderId, refresh: true });
		} catch (refreshError) {
			logger.error('❌ Error al forzar recarga:', refreshError);
		} finally {
			setInternalIsRetrying(false);
		}
	}, [currentFolderId, isRetrying, externalOnRefreshFolder]);

	// Hook para reindexar carpeta
	const reindexFolderMutation = useReindexFolder();

	const handleScanFolder = useCallback(async () => {
		if (!currentFolderId || isRetrying) {
			logger.warn('⚠️ No hay carpeta seleccionada para escanear o ya hay una operación en curso');
			return;
		}

		// Usar función externa si está disponible
		if (externalOnScanFolder) {
			externalOnScanFolder();
			return;
		}

		setInternalIsRetrying(true);
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
			setInternalIsRetrying(false);
		}
	}, [currentFolderId, isRetrying, externalOnScanFolder, reindexFolderMutation.mutateAsync]);

	// Resetear estado cuando cambia la carpeta
	useEffect(() => {
		setInternalIsRetrying(false);
	}, []);

	// ------------------------------------------------------------------
	// Estado de carga de imágenes por carpeta (mover ANTES de returns)
	// ------------------------------------------------------------------
	// NOTA IMPORTANTE:
	// Anteriormente este bloque (folderState + useEffect para carga inicial)
	// estaba DESPUÉS de varios returns condicionales (folder no seleccionada,
	// loading, error). Eso hacía que en el primer render (loading=true) se
	// devolviera antes de registrar este useEffect, pero en renderes
	// subsiguientes (loading=false) SÍ se registraba, alterando el orden de
	// hooks y provocando el error: "Rendered more hooks than during the previous render".
	// Para cumplir las Rules of Hooks todos los hooks deben ejecutarse en el
	// mismo orden en cada render. Por eso movemos este bloque antes de los
	// returns y añadimos las comprobaciones dentro del propio efecto.

	const folderState = currentFolderId ? folderLoadState?.[currentFolderId] : undefined;
	const folderLoaded = Boolean(folderState?.loaded);
	const folderCurrentlyLoading = Boolean(folderState?.loading);

	useEffect(() => {
		if (!currentFolderId) {
			return;
		}
		// Evitar disparar mientras la metadata básica de la carpeta aún carga
		if (isFolderLoading) {
			return;
		}
		if (folderLoaded) {
			return;
		}
		if (folderCurrentlyLoading) {
			return;
		}
		logger.info('🚀 Disparando carga inicial de carpeta', { currentFolderId });
		fetchImages({ folderId: currentFolderId });
	}, [currentFolderId, folderLoaded, folderCurrentlyLoading, fetchImages, isFolderLoading]);

	// Unificar renderizado para que siempre exista un contenedor estable que los tests puedan localizar.
	// Objetivo: garantizar presencia de [data-testid="file-browser"] incluso en loading / error / vacío.

	// Usar React.ReactElement para evitar dependencia directa de namespace JSX en este archivo
	let content: React.ReactElement;
	let showFileBrowser = true;

	if (!currentFolderId) {
		logger.warn('⚠️ No hay carpeta seleccionada');
		content = buildEmptySelectionState();
		showFileBrowser = false;
	} else if (isFolderLoading) {
		// Montar FileBrowser ya en loading para exponer toolbar/testids; mostrará spinner interno
		content = (
			<FileBrowser
				entityType="any"
				filterId={currentFolderId}
				filterType="folder"
				onItemClick={handleImageSelect}
				onItemDoubleClick={handleImageDoubleClick}
			/>
		);
		showFileBrowser = true;
	} else if (folderError) {
		logger.error('❌ Error al cargar carpeta:', folderError);
		content = buildErrorState();
		showFileBrowser = false;
	} else {
		// Siempre mostrar FileBrowser, que maneja sus propios estados de loading/empty
		content = (
			<FileBrowser
				entityType="any"
				filterId={currentFolderId}
				filterType="folder"
				onItemClick={handleImageSelect}
				onItemDoubleClick={handleImageDoubleClick}
			/>
		);
		showFileBrowser = true;
	}

	const showPerfPanel = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debugPerf');

	return (
		<BaseContentView showHeader={false}>
			<div className="relative h-full">
				{showFileBrowser ? (
					content
				) : (
					// Placeholder consistente con el mismo test id mientras no se monta FileBrowser.
					<div
						className="flex h-full w-full flex-col overflow-hidden"
						data-placeholder={!showFileBrowser}
						data-testid="file-browser"
					>
						<main
							className="flex h-full w-full flex-col overflow-hidden bg-background"
							data-testid="file-browser-container"
						>
							<div
								className="flex h-full w-full flex-col items-center justify-center"
								data-testid="file-browser-placeholder"
								style={{ display: showFileBrowser ? 'none' : 'flex' }}
							>
								{content}
							</div>
							{showFileBrowser ? null : null}
						</main>
					</div>
				)}
				{showPerfPanel && (
					<div className="pointer-events-auto absolute right-2 bottom-2 z-50 max-w-[220px]">
						<PerformanceMetricsPanel autoUpdateMs={2500} />
					</div>
				)}
			</div>
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
