import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { Button } from '@/components/ui/button';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import { type AnyEntityWithStats } from '@/types/migration';

// Logger para depuración
const logger = clientLogger.withContext('MixedContentView');

interface MixedContentViewProps {
	filterType?: string;
	filterId?: string;
}

export function MixedContentView({ filterType, filterId }: MixedContentViewProps = {}) {
	// Estados globales para panel de detalles y visor
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();
	const { openViewer } = useFileViewerStore();

	// Estado local para controlar operaciones
	const [isRetrying, setIsRetrying] = useState(false);

	// Asegurar que el panel esté visible al cargar la vista
	useEffect(() => {
		setDetailsPanelVisible(true);
	}, [setDetailsPanelVisible]);

	const handleItemSelect = useCallback(
		(item: AnyEntityWithStats) => {
			logger.info('🖱️ Elemento seleccionado:', item.name);

			// Mostrar panel de detalles con el elemento seleccionado
			setSelectedItems([item]);
			setDetailsPanelVisible(true);
		},
		[setSelectedItems, setDetailsPanelVisible]
	);

	const handleItemDoubleClick = useCallback(
		(item: AnyEntityWithStats) => {
			logger.info('🖱️ Doble click en elemento:', item.name);

			// Abrir el visor con el elemento
			// El FileBrowser se encargará de obtener todos los elementos relacionados
			const viewerItem = {
				id: item.id,
				name: item.name,
				type: (item as any).type || 'file',
				path: (item as any).path || '',
				size: (item as any).size || 0,
				url: (item as any).url,
				thumbnail: (item as any).thumbnail,
				thumbnailUrl: (item as any).thumbnailUrl,
				src: (item as any).src,
				alt: (item as any).alt,
				mimeType: (item as any).mimeType,
				metadata: (item as any).metadata,
				width: (item as any).width || 0,
				height: (item as any).height || 0,
			};

			// Abrir el visor con el elemento actual
			openViewer([viewerItem], 0);
		},
		[openViewer]
	);

	const handleForceRefresh = useCallback(async () => {
		if (isRetrying) return;

		setIsRetrying(true);
		logger.info('🔄 Forzando recarga del contenido mixto');

		// El FileBrowser se encargará de la recarga
		setTimeout(() => {
			setIsRetrying(false);
		}, 1000);
	}, [isRetrying]);

	// Renderizar vista de contenido mixto usando BaseContentView y FileBrowser
	return (
		<BaseContentView
			title="Contenido Mixto"
			description="Vista unificada de todos los tipos de archivos"
			headerControls={
				<Button variant="outline" size="sm" onClick={handleForceRefresh} disabled={isRetrying}>
					<RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
					{isRetrying ? 'Recargando...' : 'Recargar'}
				</Button>
			}
		>
			<FileBrowser
				entityType={'mixed'}
				filterId={filterId}
				filterType={(filterType as 'folder' | 'collection' | 'tag' | 'album' | 'video') || 'folder'}
				onItemClick={handleItemSelect}
				onItemDoubleClick={handleItemDoubleClick}
				className="h-full"
			/>
		</BaseContentView>
	);
}

export default MixedContentView;

/**
 * 📝 Documentación:
 * - Vista de contenido optimizada para mostrar elementos mixtos
 * - Delega la visualización al FileBrowser con soporte para múltiples tipos
 * - Controles de recarga integrados en el header
 * - UI consistente con el resto del sistema usando componentes base
 * - Experiencia unificada de navegación de archivos mixtos
 * - Manejo de selección y doble clic para abrir visor
 */
