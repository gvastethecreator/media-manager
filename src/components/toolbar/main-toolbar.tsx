import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Settings } from 'lucide-react';
import { memo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ViewType } from '@/components/views/types';
import { useDebouncedViewMode } from '@/hooks/use-debounced-view-mode';
import { useFolder } from '@/lib/api/folders';
import { useDetailsPanel } from '@/store/details-panel.store';
import { ViewBreadcrumbs } from '../navigation/breadcrumbs';

export interface ViewToolbarProps {
	// Props adicionales para integración con file-browser
	allItemIds?: string[];
	currentFolderId?: string;
	isLeftPanelCollapsed?: boolean;
	isRetrying?: boolean;
	isRightPanelCollapsed?: boolean;
	onRefreshFolder?: () => Promise<void>;
	onScanFolder?: () => Promise<void>;
	toggleLeftPanelCollapse?: () => void;
	toggleRightPanelCollapse?: () => void;
	// Nota: Las acciones específicas de carpeta (scan, refresh) están en file-browser-toolbar.tsx
}

export const ViewToolbar = memo<ViewToolbarProps>(function ViewToolbarInner({
	isRightPanelCollapsed,
	toggleRightPanelCollapse,
	isLeftPanelCollapsed,
	toggleLeftPanelCollapse,
	// Props adicionales (reservadas para uso futuro)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	allItemIds,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	currentFolderId,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	isRetrying,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onRefreshFolder,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onScanFolder,
}) {
	const location = useLocation();
	const params = useParams<{ id: string }>();
	const currentView = location.pathname.split('/')[1] || '';

	// ⚠️ Importante: el param `id` existe en múltiples rutas (/folders/:id, /characters/:id, ...).
	// Solo debemos tratarlo como folderId cuando realmente estemos en una ruta de folders.
	const isFoldersRoute = location.pathname.startsWith('/folders');
	const folderId = isFoldersRoute ? (params.id ?? '') : '';

	// Obtener información de la carpeta solo cuando aplique (enabled internamente por folderId)
	const { data: folderData } = useFolder(folderId);

	// Crear versión debounced del setViewMode para mejorar performance
	const { setViewMode: setViewModeDebounced } = useDebouncedViewMode();

	// Usar claves reales del store del panel derecho
	const { showInterfaceSettings, setShowInterfaceSettings } = useDetailsPanel();

	// ========================================================================
	// FUNCIONES MOVIDAS A file-browser-toolbar.tsx - REMOVIDAS PARA LIBERAR ESPACIO
	// ========================================================================

	const renderContextActions = () => {
		// Acciones contextuales específicas por vista pueden agregarse aquí
		// Por ahora, las acciones principales están en file-browser-toolbar.tsx
		switch (currentView) {
			case 'collection-content':
				// Acciones para colección (ej: editar, compartir)
				return null;
			case 'folder-content':
				// Acciones para carpeta (ej: scan, refresh) están en file-browser-toolbar
				return null;
			default:
				return null;
		}
	};

	return (
		<div className="flex h-9 min-w-0 items-center justify-between border-b border-border bg-secondary p-2">
			{/* Lado izquierdo: Botón colapsar panel izquierdo + breadcrumbs */}
			<div className="flex min-w-0 items-center gap-2 overflow-hidden">
				{/* Botón de colapsar panel izquierdo */}
				{toggleLeftPanelCollapse && (
					<Button
						className="h-7 w-7 hover:bg-accent"
						onClick={toggleLeftPanelCollapse}
						size="icon"
						title={isLeftPanelCollapsed ? 'Open left panel' : 'Close left panel'}
						variant="ghost"
					>
						{isLeftPanelCollapsed ? (
							<PanelLeftOpen className="h-3.5 w-3.5" />
						) : (
							<PanelLeftClose className="h-3.5 w-3.5" />
						)}
					</Button>
				)}

				{/* Breadcrumbs */}
				<ViewBreadcrumbs
					currentItem={
						isFoldersRoute && folderData
							? {
									id: folderData.id,
									name: folderData.name,
									emoji: (folderData as any).emoji,
									description: (folderData as any).description,
									totalSize: (folderData as any).stats?.totalSize,
									_count: { images: (folderData as any)._count?.images },
									breadcrumbs: (folderData as any).stats?.breadcrumbs ?? [],
								}
							: undefined
					}
					currentView={currentView as ViewType}
				/>
			</div>

			{/* Centro: Acciones contextuales específicas por vista */}
			<div className="flex items-center gap-2">{renderContextActions()}</div>

			{/* Lado derecho */}
			<div className="flex items-center gap-0.5">
				{/* Botón de configuracion para file browser , esconder si no esta usando file browser  */}
				<Button
					className="h-7 px-2 hover:bg-accent"
					onClick={() => setShowInterfaceSettings(!showInterfaceSettings)}
					size="sm"
					title="Configuraciones de interfaz"
					variant={showInterfaceSettings ? 'default' : 'ghost'}
				>
					<Settings className="h-3.5 w-3.5" />
				</Button>

				{/* Botón de colapsar panel derecho */}
				{toggleRightPanelCollapse && (
					<Button
						className="h-7 w-7 hover:bg-accent"
						onClick={toggleRightPanelCollapse}
						size="icon"
						title={isRightPanelCollapsed ? 'Open right panel' : 'Close right panel'}
						variant="ghost"
					>
						{isRightPanelCollapsed ? (
							<PanelRightOpen className="h-3.5 w-3.5" />
						) : (
							<PanelRightClose className="h-3.5 w-3.5" />
						)}
					</Button>
				)}
			</div>
		</div>
	);
});
