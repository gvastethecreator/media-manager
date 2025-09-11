import { Edit, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Settings } from 'lucide-react';
import { memo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ViewType } from '@/components/views/types';
import { useDebouncedViewMode } from '@/hooks/use-debounced-view-mode';
import { useFolder, useFolderName } from '@/lib/api/folders';
import { useDetailsPanel } from '@/store/details-panel.store';
import { ViewBreadcrumbs } from '../navigation/breadcrumbs';

export interface ViewToolbarProps {
	isRightPanelCollapsed?: boolean;
	toggleRightPanelCollapse?: () => void;
	isLeftPanelCollapsed?: boolean;
	toggleLeftPanelCollapse?: () => void;
	allItemIds?: string[]; // IDs de todos los elementos disponibles para selección
	// Props para acciones de carpeta
	currentFolderId?: string;
	onScanFolder?: () => void;
	onRefreshFolder?: () => void;
	isRetrying?: boolean;
}

export const ViewToolbar = memo<ViewToolbarProps>(function ViewToolbarInner({
	isRightPanelCollapsed,
	toggleRightPanelCollapse,
	isLeftPanelCollapsed,
	toggleLeftPanelCollapse,
}) {
	const location = useLocation();
	const params = useParams<{ id: string }>();
	const currentView = location.pathname.split('/')[1] || 'gallery';

	const folderId = params.id;

	// Obtener información de la carpeta si estamos en folder-content view
	const { data: folderData } = useFolder(folderId || '');
	const { data: folderName } = useFolderName(folderId || '');

	// Crear versión debounced del setViewMode para mejorar performance
	const { setViewMode: setViewModeDebounced } = useDebouncedViewMode();

	// Usar claves reales del store del panel derecho
	const { showInterfaceSettings, setShowInterfaceSettings } = useDetailsPanel();

	// ========================================================================
	// FUNCIONES MOVIDAS A file-browser-toolbar.tsx - REMOVIDAS PARA LIBERAR ESPACIO
	// ========================================================================

	const renderContextActions = () => {
		switch (currentView) {
			case 'collection-content':
				return (
					<div className="flex items-center gap-0.5">
						<Button className="h-7 px-2 hover:bg-accent" size="sm" variant="ghost">
							<Edit className="mr-1 h-3.5 w-3.5" />
						</Button>
					</div>
				);
			case 'folder-content':
				return null;
			default:
				return null;
		}
	};

	return (
		<div className="flex h-9 items-center justify-between whitespace-nowrap border-2 border-background bg-secondary p-2">
			{/* Lado izquierdo: Botón colapsar panel izquierdo + breadcrumbs */}
			<div className="flex items-center gap-2">
				{/* Botón de colapsar panel izquierdo */}
				{toggleLeftPanelCollapse && (
					<Button
						className="h-7 w-7 hover:bg-accent"
						onClick={toggleLeftPanelCollapse}
						size="icon"
						title={isLeftPanelCollapsed ? 'Abrir panel izquierdo' : 'Cerrar panel izquierdo'}
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
						currentView === 'folder-content' && folderData
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
						title={isRightPanelCollapsed ? 'Abrir panel derecho' : 'Cerrar panel derecho'}
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
