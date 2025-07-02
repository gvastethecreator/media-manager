import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import BlurFade from '@/components/ui/blur-fade';
import { clientLogger } from '@/lib/logger/client-logger';
import { useImageViewer } from '@/store/image-viewer.store';
import type { EntityWithStats } from '@/types/migration';
import { FolderIcon } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { useContentView } from './content-view-provider';

const baseLogger = clientLogger.withContext('BaseContentView');

export interface BaseContentViewProps {
	className?: string;
}

const getMetadata = (metadata: string | null) => {
	if (!metadata) {
		return null;
	}
	try {
		return JSON.parse(metadata);
	} catch {
		return null;
	}
};

/**
 * ✅ MIGRADO: BaseContentView ahora usa FileBrowserV2 con EntityWithStats
 * - FileBrowser → FileBrowserV2
 * - FileItem → EntityWithStats
 * - Adaptado para usar el nuevo sistema de stores por entidad
 */
export function BaseContentView({ className }: BaseContentViewProps) {
	const {
		items,
		isLoading,
		error,
		toggleItemSelection,
		currentContainerId,
		containerName,
		setCurrentContainer,
		onItemClick: customItemClickHandler,
		onItemDoubleClick: customItemDoubleClickHandler,
		emptyState = {},
	} = useContentView();

	const { openViewer } = useImageViewer();
	const initialLoadRef = useRef(false);
	const currentContainerIdRef = useRef(currentContainerId);

	// Efecto principal para cargar el contenedor
	useEffect(() => {
		// Si no hay ID o es el mismo que ya procesamos, no hacer nada
		if (!currentContainerId || currentContainerId === currentContainerIdRef.current || !setCurrentContainer) {
			return;
		}

		let mounted = true;
		currentContainerIdRef.current = currentContainerId;

		baseLogger.info('🔄 Iniciando carga de contenedor:', {
			id: currentContainerId,
			containerName,
			isInitialLoad: !initialLoadRef.current,
		});

		const loadContainer = async () => {
			try {
				await setCurrentContainer(currentContainerId);
				if (!mounted) {
					return;
				}

				initialLoadRef.current = true;

				baseLogger.info('✅ Contenedor cargado:', {
					id: currentContainerId,
					name: containerName,
					itemCount: items?.length || 0,
				});
			} catch (error) {
				if (!mounted) {
					return;
				}
				baseLogger.error('❌ Error al cargar contenedor:', {
					id: currentContainerId,
					error: error instanceof Error ? error.message : 'Error desconocido',
				});
			}
		};

		loadContainer();

		return () => {
			mounted = false;
		};
	}, [currentContainerId, containerName, items?.length, setCurrentContainer]);

	// Reset cuando se desmonta el componente
	useEffect(() => {
		return () => {
			initialLoadRef.current = false;
			currentContainerIdRef.current = null;
		};
	}, []);

	const handleItemSelect = useCallback(
		(item: EntityWithStats) => {
			// ✅ MIGRADO: Adaptar para EntityWithStats
			// Usar el manejador personalizado si está disponible
			if (customItemClickHandler) {
				// TODO: Adaptar customItemClickHandler para EntityWithStats
				customItemClickHandler(item as any);
				return;
			}

			// De lo contrario, usar el manejador predeterminado
			if (toggleItemSelection) {
				try {
					toggleItemSelection(item as any, false);
				} catch (error) {
					baseLogger.error('❌ Error al seleccionar item:', {
						itemId: item.id,
						error: error instanceof Error ? error.message : 'Error desconocido',
					});
				}
			}
		},
		[toggleItemSelection, customItemClickHandler]
	);

	const handleItemDoubleClick = useCallback(
		(item: EntityWithStats) => {
			// ✅ MIGRADO: Adaptar para EntityWithStats
			// Usar el manejador personalizado si está disponible
			if (customItemDoubleClickHandler) {
				// TODO: Adaptar customItemDoubleClickHandler para EntityWithStats
				customItemDoubleClickHandler(item as any);
				return;
			}

			// De lo contrario, usar el manejador predeterminado para abrir el visor
			if (!items) {
				return;
			}

			try {
				if (item.type === 'image') {
					// Filtrar solo imágenes del contexto actual
					const imageItems = (items as EntityWithStats[]).filter((i) => i.type === 'image');
					const currentIndex = imageItems.findIndex((i) => i.id === item.id);

					// Convertir EntityWithStats a formato compatible con viewer
					const viewerItems = imageItems.map((img) => ({
						id: img.id,
						name: img.name || '',
						src: img.thumbnailUrl || `/api/images/${img.id}/content`,
						alt: img.name || '',
						width: 'width' in img ? img.width : 0,
						height: 'height' in img ? img.height : 0,
						thumbnail: img.thumbnailUrl || null,
						type: 'image',
						path: img.path || '',
						size: 'size' in img ? img.size : 0,
						mimeType: 'mimeType' in img ? img.mimeType : '',
						metadata: null,
						url: img.thumbnailUrl || `/api/images/${img.id}/content`,
						parsedMetadata: undefined,
					}));

					openViewer(viewerItems, currentIndex);
					baseLogger.info('🖼️ Abriendo visor de imágenes:', {
						itemId: item.id,
						itemIndex: currentIndex,
						totalItems: imageItems.length,
					});
				}
			} catch (error) {
				baseLogger.error('❌ Error al abrir el visor de imágenes:', {
					itemId: item.id,
					error: error instanceof Error ? error.message : 'Error desconocido',
				});
			}
		},
		[items, openViewer, customItemDoubleClickHandler]
	);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (!initialLoadRef.current && isLoading) {
		return <LoadingScreen />;
	}

	if (!items || items.length === 0) {
		return (
			<EmptyState
				icon={emptyState.icon || FolderIcon}
				title={emptyState.title || 'Contenedor vacío'}
				description={emptyState.description || `No se encontraron imágenes en ${containerName || 'este contenedor'}`}
			/>
		);
	}

	return (
		<div className={`h-full w-full flex overflow-hidden ${className || ''}`}>
			<div className="h-full w-full overflow-auto">
				<BlurFade className="h-full w-full overflow-auto" delay={0.5} inView={true}>
					{/* ✅ MIGRADO: FileBrowser → FileBrowserV2 */}
					<FileBrowser
						entityType="image" // Por ahora solo imágenes, expandir según necesidad
						onItemSelect={handleItemSelect}
						onItemDoubleClick={handleItemDoubleClick}
						// TODO: Implementar filtros específicos por contenedor
						filterId={currentContainerId}
						filterType="folder" // Asumir carpeta por defecto
					/>
				</BlurFade>
			</div>
		</div>
	);
}
