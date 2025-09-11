import { useCallback, useEffect } from 'react';
import { PerformanceMetricsPanel } from '@/components/debug/performance-metrics-panel';
import { FileBrowser } from '@/components/features/file-browser';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useUIStore } from '@/store/ui.store';
import type { AnyEntityWithStats } from '@/types/entities';

// Logger para depuración
const logger = clientLogger.withContext('FolderContentView');

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

	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();

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

	const handleImageSelect = useCallback(
		(item: AnyEntityWithStats) => {
			logger.info(`🖱️ Entidad seleccionada: ${item.name} (tipo: ${item.entityType})`);
			setSelectedItems([item]);
			setDetailsPanelVisible(true);
		},
		[setSelectedItems, setDetailsPanelVisible]
	);
	// Render: siempre montar FileBrowser para asegurar disponibilidad de toolbar/viewport
	// - Cuando no hay folderId aún, se monta con filterId undefined (estado vacío pero listo)
	const content = <FileBrowser filterId={currentFolderId ?? undefined} onItemClick={handleImageSelect} />;

	const showPerfPanel = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debugPerf');

	return (
		<BaseContentView showHeader={false}>
			<div className="relative h-full">
				{content}
				{showPerfPanel && (
					<div
						className="pointer-events-auto absolute right-2 bottom-2 z-50 max-w-[220px]"
						data-testid="perf-panel-container"
					>
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
