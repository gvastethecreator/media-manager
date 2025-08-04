import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImperativePanelHandle } from 'react-resizable-panels';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { FileViewer } from '@/components/features/file-viewer/file-viewer';
import { NavPanel } from '@/components/navigation/navigation-panel';
import { RightPanel } from '@/components/panels/right-panel/right-panel';
import { ViewToolbar } from '@/components/toolbar/main-toolbar';
import { NavigationTransition } from '@/components/transitions/ViewTransition';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useReindexFolder } from '@/lib/api/folders';
import { toastService } from '@/lib/ui/toast';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useFolderStore } from '@/store/entities/folder';
import { useImageStore } from '@/store/entities/image';

export const MainLayout = memo(function MainLayout() {
	const location = useLocation();
	const params = useParams<{ id: string }>();
	const { isVisible } = useDetailsPanel();

	const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
	// Inicializar con false para coincidir con el valor por defecto del store (isVisible: true -> !isVisible = false)
	// Esto evita problemas de hidratación con Zustand persist
	const [isRightCollapsed, setIsRightCollapsed] = useState(false);

	const [isLeftAnimating, setIsLeftAnimating] = useState(false);
	const [isRightAnimating, setIsRightAnimating] = useState(false);

	// Obtener datos de los stores para el ViewToolbar
	const { getSortedImages, getImagesByFolder } = useImageStore();
	const { selectedFolderId } = useFolderStore();

	// Hook para reindexar carpeta
	const reindexFolderMutation = useReindexFolder();

	// Obtener el folderId actual según la ruta
	const currentFolderId = useMemo(() => {
		const currentView = location.pathname.split('/')[1] || 'gallery';
		if (currentView === 'folders' && params.id) {
			return params.id;
		}
		return null;
	}, [location.pathname, params.id]);

	// Calcular los IDs de elementos disponibles según la vista actual
	const allItemIds = useMemo(() => {
		const currentView = location.pathname.split('/')[1] || 'gallery';

		switch (currentView) {
			case 'folders':
				if (currentFolderId) {
					return getImagesByFolder(currentFolderId).map((img: any) => img.id);
				}
				return [];
			case 'all-images':
			case 'gallery':
				return getSortedImages().map((img: any) => img.id);
			default:
				return [];
		}
	}, [location.pathname, currentFolderId, getSortedImages, getImagesByFolder]);

	// Funciones para acciones de carpeta
	const handleScanFolder = useCallback(async () => {
		if (!currentFolderId) return;

		try {
			toastService.info('Escaneando carpeta...');
			await reindexFolderMutation.mutateAsync(currentFolderId);
			toastService.success('Carpeta escaneada correctamente');
		} catch (error) {
			console.error('Error al escanear carpeta:', error);
			toastService.error('Error al escanear la carpeta');
		}
	}, [currentFolderId, reindexFolderMutation]);

	const handleRefreshFolder = useCallback(async () => {
		if (!currentFolderId) return;

		try {
			toastService.info('Recargando carpeta...');
			await reindexFolderMutation.mutateAsync(currentFolderId);
			toastService.success('Carpeta recargada correctamente');
		} catch (error) {
			console.error('Error al recargar carpeta:', error);
			toastService.error('Error al recargar la carpeta');
		}
	}, [currentFolderId, reindexFolderMutation]);

	// Referencias para controlar los paneles programáticamente
	const leftPanelRef = useRef<ImperativePanelHandle>(null);
	const rightPanelRef = useRef<ImperativePanelHandle>(null);

	// Sincronizar el estado del panel derecho con el store
	useEffect(() => {
		setIsRightCollapsed(!isVisible);
	}, [isVisible]);

	// Handlers para sincronizar con los componentes resizable
	const handleLeftPanelCollapse = (collapsed: boolean) => {
		setIsLeftCollapsed(collapsed);
	};

	const handleRightPanelCollapse = (collapsed: boolean) => {
		setIsRightCollapsed(collapsed);
	};

	const toggleLeftPanel = () => {
		if (leftPanelRef.current) {
			setIsLeftAnimating(true); // Activar animaciones solo para botón
			if (isLeftCollapsed) {
				leftPanelRef.current.expand();
				setIsLeftCollapsed(false); // Actualizar estado inmediatamente
			} else {
				leftPanelRef.current.collapse();
				setIsLeftCollapsed(true); // Actualizar estado inmediatamente
			}
			// Desactivar animaciones después de completar
			setTimeout(() => setIsLeftAnimating(false), 350);
		}
	};

	const toggleRightPanel = () => {
		if (rightPanelRef.current) {
			setIsRightAnimating(true); // Activar animaciones solo para botón
			if (isRightCollapsed) {
				rightPanelRef.current.expand();
				setIsRightCollapsed(false); // Actualizar estado inmediatamente
			} else {
				rightPanelRef.current.collapse();
				setIsRightCollapsed(true); // Actualizar estado inmediatamente
			}
			// Desactivar animaciones después de completar
			setTimeout(() => setIsRightAnimating(false), 350);
		}
	};

	return (
		<div className="h-screen w-full flex bg-background text-foreground">
			<ResizablePanelGroup direction="horizontal" className="h-full">
				{/* Panel de navegación izquierdo */}
				<ResizablePanel
					ref={leftPanelRef}
					defaultSize={20}
					minSize={15}
					maxSize={35}
					collapsedSize={2}
					collapsible={true}
					onCollapse={() => handleLeftPanelCollapse(true)}
					onExpand={() => handleLeftPanelCollapse(false)}
					className="border-r border-border"
				>
					<NavPanel isCollapsed={isLeftCollapsed} onToggleCollapse={toggleLeftPanel} isAnimating={isLeftAnimating} />
				</ResizablePanel>

				<ResizableHandle withHandle />

				{/* Panel central con toolbar y view container */}
				<ResizablePanel defaultSize={55} minSize={30} className="flex flex-col">
					<div className="h-full flex flex-col bg-background">
						{/* Toolbar superior */}
						<div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">
							<ViewToolbar
								isLeftPanelCollapsed={isLeftCollapsed}
								toggleLeftPanelCollapse={toggleLeftPanel}
								isRightPanelCollapsed={isRightCollapsed}
								toggleRightPanelCollapse={toggleRightPanel}
								isRightPanelVisible={true}
								allItemIds={allItemIds}
								currentFolderId={currentFolderId || undefined}
								onScanFolder={handleScanFolder}
								onRefreshFolder={handleRefreshFolder}
								isRetrying={reindexFolderMutation.isPending}
							/>
						</div>{' '}
						{/* Contenido principal */}
						<NavigationTransition className="flex-1 min-h-0 bg-background">
							<Outlet />
						</NavigationTransition>
					</div>
				</ResizablePanel>

				{/* Panel de detalles derecho - siempre presente */}
				<ResizableHandle withHandle />
				<ResizablePanel
					ref={rightPanelRef}
					defaultSize={25}
					minSize={20}
					maxSize={50}
					collapsedSize={0}
					collapsible={true}
					onCollapse={() => handleRightPanelCollapse(true)}
					onExpand={() => handleRightPanelCollapse(false)}
					className="border-l border-border"
				>
					{!isRightCollapsed && (
						<RightPanel
							isCollapsed={isRightCollapsed}
							onToggleCollapse={toggleRightPanel}
							isAnimating={isRightAnimating}
						/>
					)}
				</ResizablePanel>
			</ResizablePanelGroup>

			{/* FileViewer global - modal overlay */}
			<FileViewer />
		</div>
	);
});
