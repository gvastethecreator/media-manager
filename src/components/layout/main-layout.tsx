import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImperativePanelHandle } from 'react-resizable-panels';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { FileViewer } from '@/components/features/file-viewer/file-viewer';
import { NavPanel } from '@/components/navigation/navigation-panel';
import { RightPanel } from '@/components/panels/right-panel';
import { ViewToolbar } from '@/components/toolbar/main-toolbar';
import { NavigationTransition } from '@/components/transitions/ViewTransition';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useReindexFolder } from '@/lib/api/folders';
import { toastService } from '@/lib/ui/toast';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useFolderStore } from '@/store/entities/folder';
import { useImageStore } from '@/store/entities/image';
import { useUIStore } from '@/store/ui.store';

const MainLayoutComponent = memo(function MainLayoutImpl() {
	const location = useLocation();
	const params = useParams<{ id: string }>();
	const { isVisible } = useDetailsPanel();
	const { isRightPanelCollapsed: uiPanelCollapsed } = useUIStore();

	const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
	// Inicializar con false para coincidir con el valor por defecto del store (isVisible: true -> !isVisible = false)
	// Esto evita problemas de hidratación con Zustand persist
	const [isRightCollapsed, setIsRightCollapsed] = useState(false);

	const [isLeftAnimating, setIsLeftAnimating] = useState(false);
	const [isRightAnimating, setIsRightAnimating] = useState(false);

	// Obtener datos de los stores para el ViewToolbar
	const { getSortedImages, getImagesByFolder } = useImageStore();
	const { selectedFolderId } = useFolderStore();

	// Determinar qué vistas no necesitan toolbar ni panel derecho
	const viewsWithoutToolbarAndPanel = useMemo(
		() => [
			'', // Ruta raíz (dashboard)
			'settings',
			'development',
		],
		[]
	);

	const currentView = useMemo(() => {
		const pathSegments = location.pathname.split('/');
		return pathSegments[1] || '';
	}, [location.pathname]);

	const shouldHideToolbarAndPanel = useMemo(
		() => viewsWithoutToolbarAndPanel.includes(currentView),
		[viewsWithoutToolbarAndPanel, currentView]
	);

	// Hook para reindexar carpeta
	const reindexFolderMutation = useReindexFolder();

	// Obtener el folderId actual según la ruta
	const currentFolderId = useMemo(() => {
		if (currentView === 'folders' && params.id) {
			return params.id;
		}
		return null;
	}, [currentView, params.id]);

	// Calcular los IDs de elementos disponibles según la vista actual
	const allItemIds = useMemo(() => {
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
	}, [currentView, currentFolderId, getSortedImages, getImagesByFolder]);

	// Funciones para acciones de carpeta
	const handleScanFolder = useCallback(async () => {
		if (!currentFolderId) {
			return;
		}

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
		if (!currentFolderId) {
			return;
		}

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

	// Sincronizar visibilidad del details panel con el estado del
	useEffect(() => {
		console.log('📋 MainLayout: Sincronizando isVisible:', isVisible);
		setIsRightCollapsed(!isVisible);
	}, [isVisible]);

	// Sincronizar store UI con el panel físico
	useEffect(() => {
		console.log('🔄 MainLayout: Sincronizando UI store panel collapsed:', uiPanelCollapsed);
		if (rightPanelRef.current) {
			if (uiPanelCollapsed) {
				console.log('📐 MainLayout: Colapsando panel físico');
				rightPanelRef.current.collapse();
			} else {
				console.log('📐 MainLayout: Expandiendo panel físico');
				rightPanelRef.current.expand();
			}
		}
	}, [uiPanelCollapsed]); // Handlers para sincronizar con los componentes resizable
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
			// Usar requestAnimationFrame para mejor rendimiento
			requestAnimationFrame(() => {
				setTimeout(() => setIsLeftAnimating(false), 350);
			});
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
			// Usar requestAnimationFrame para mejor rendimiento
			requestAnimationFrame(() => {
				setTimeout(() => setIsRightAnimating(false), 350);
			});
		}
	};

	return (
		<div className="flex h-screen w-full bg-background text-foreground">
			<ResizablePanelGroup className="h-full" direction="horizontal">
				{/* Panel de navegación izquierdo */}
				<ResizablePanel
					className="border-border border-r"
					collapsedSize={2}
					collapsible={true}
					defaultSize={20}
					maxSize={35}
					minSize={15}
					onCollapse={() => handleLeftPanelCollapse(true)}
					onExpand={() => handleLeftPanelCollapse(false)}
					ref={leftPanelRef}
				>
					<NavPanel isAnimating={isLeftAnimating} isCollapsed={isLeftCollapsed} onToggleCollapse={toggleLeftPanel} />
				</ResizablePanel>

				<ResizableHandle withHandle />

				{/* Panel central con toolbar y view container */}
				<ResizablePanel className="flex flex-col" defaultSize={shouldHideToolbarAndPanel ? 80 : 50} minSize={30}>
					<div className="flex h-full flex-col bg-background">
						{/* Toolbar superior - solo mostrar en vistas que lo necesiten */}
						{!shouldHideToolbarAndPanel && (
							<div className="border-border border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">
								<ViewToolbar
									allItemIds={allItemIds}
									currentFolderId={currentFolderId || undefined}
									isLeftPanelCollapsed={isLeftCollapsed}
									isRetrying={reindexFolderMutation.isPending}
									isRightPanelCollapsed={isRightCollapsed}
									onRefreshFolder={handleRefreshFolder}
									onScanFolder={handleScanFolder}
									toggleLeftPanelCollapse={toggleLeftPanel}
									toggleRightPanelCollapse={toggleRightPanel}
								/>
							</div>
						)}
						{/* Contenido principal */}
						<NavigationTransition className="min-h-0 flex-1 bg-background">
							<Outlet />
						</NavigationTransition>
					</div>
				</ResizablePanel>

				{/* Panel de detalles derecho - solo mostrar en vistas que lo necesiten */}
				{!shouldHideToolbarAndPanel && (
					<>
						<ResizableHandle withHandle />
						<ResizablePanel
							className="border-border border-l"
							collapsedSize={0}
							collapsible={true}
							defaultSize={30}
							maxSize={55}
							minSize={25}
							onCollapse={() => handleRightPanelCollapse(true)}
							onExpand={() => handleRightPanelCollapse(false)}
							ref={rightPanelRef}
						>
							{!isRightCollapsed && (
								<RightPanel
									isAnimating={isRightAnimating}
									isCollapsed={isRightCollapsed}
									onToggleCollapse={toggleRightPanel}
								/>
							)}
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>

			{/* FileViewer global - modal overlay */}
			<FileViewer />
		</div>
	);
});

export const MainLayout = MainLayoutComponent;
