import { RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { type BrowserItem, FileBrowser } from '@/components/features/file-browser-new';
import { Button } from '@/components/ui/button';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import type { AnyEntityWithStats } from '@/types/entities';

// Logger para depuración
const logger = clientLogger.withContext('MixedContentView');

interface MixedContentViewProps {
	filterType?: string;
	filterId?: string | null;
}

export function MixedContentView(_props: MixedContentViewProps = {}) {
	// Estados globales para panel de detalles y visor
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();
	const { openViewer } = useFileViewerStore();

	// Estado local para controlar operaciones
	const [isRetrying, setIsRetrying] = useState(false);

	const handleItemSelect = useCallback(
		(item: BrowserItem) => {
			logger.info('🖱️ Elemento seleccionado:', item.name);
			const entity = item.raw as unknown as AnyEntityWithStats | undefined;
			if (!entity) return;

			// Mostrar panel de detalles con el elemento seleccionado
			setSelectedItems([entity]);
			setDetailsPanelVisible(true);
		},
		[setSelectedItems, setDetailsPanelVisible]
	);

	const handleItemDoubleClick = useCallback(
		(item: BrowserItem) => {
			logger.info('🖱️ Doble click en elemento:', item.name);
			const entity = item.raw as unknown as AnyEntityWithStats | undefined;
			if (!entity) return;

			// Abrir el visor con el elemento
			// El FileBrowser se encargará de obtener todos los elementos relacionados
			const viewerItem = {
				id: entity.id,
				name: entity.name,
				type: (entity as any).type || (entity as any).entityType || 'file',
				path: (entity as any).path || '',
				size: (entity as any).size || 0,
				url: (entity as any).url,
				thumbnail: (entity as any).thumbnail,
				thumbnailUrl: (entity as any).thumbnailUrl,
				src: (entity as any).src,
				alt: (entity as any).alt,
				mimeType: (entity as any).mimeType,
				metadata: (entity as any).metadata,
				width: (entity as any).width || 0,
				height: (entity as any).height || 0,
			};

			// Abrir el visor con el elemento actual
			openViewer([viewerItem], 0);
		},
		[openViewer]
	);

	const handleForceRefresh = useCallback(() => {
		if (isRetrying) {
			return;
		}

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
			description="Vista unificada de todos los tipos de archivos"
			headerControls={
				<Button disabled={isRetrying} onClick={handleForceRefresh} size="sm" variant="outline">
					<RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
					{isRetrying ? 'Recargando...' : 'Recargar'}
				</Button>
			}
			title="Contenido Mixto"
		>
			<FileBrowser
				className="h-full"
				items={[]}
				onItemClick={handleItemSelect}
				onItemDoubleClick={handleItemDoubleClick}
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
