import { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PanelImperativeHandle } from 'react-resizable-panels';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { SkipLinks } from '@/components/a11y/skip-links';
import { FileViewer } from '@/components/features/file-viewer/file-viewer';
import { GlobalReindexTerminal } from '@/components/settings/folders/global-reindex-terminal';
import { NavPanel } from '@/components/navigation/navigation-panel';
import { DetailsPanelTransition, NavPanelTransition } from '@/components/panels/panel-transitions';
import { RightPanel } from '@/components/panels/right-panel';
import { ViewToolbar } from '@/components/toolbar/main-toolbar';
import { NavigationTransition } from '@/components/transitions/view-transition';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useReindexFolder } from '@/lib/api/folders';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
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
			await reindexFolderMutation.mutateAsync({ id: currentFolderId });
			toastService.success('Carpeta escaneada correctamente');
		} catch (error) {
			clientLogger.error('Error al escanear carpeta:', error);
			toastService.error('Error al escanear la carpeta');
		}
	}, [currentFolderId, reindexFolderMutation]);

	const handleRefreshFolder = useCallback(async () => {
		if (!currentFolderId) {
			return;
		}

		try {
			toastService.info('Recargando carpeta...');
			await reindexFolderMutation.mutateAsync({ id: currentFolderId });
			toastService.success('Carpeta recargada correctamente');
		} catch (error) {
			clientLogger.error('Error al recargar carpeta:', error);
			toastService.error('Error al recargar la carpeta');
		}
	}, [currentFolderId, reindexFolderMutation]);

	// Referencias para controlar los paneles programáticamente
	const leftPanelRef = useRef<PanelImperativeHandle | null>(null);
	const rightPanelRef = useRef<PanelImperativeHandle | null>(null);

	// Sincronizar visibilidad del details panel con el estado del
	useEffect(() => {
		clientLogger.debug('📋 MainLayout: Sincronizando isVisible:', isVisible);
		setIsRightCollapsed(!isVisible);
	}, [isVisible]);

	// Sincronizar store UI con el panel físico
	useEffect(() => {
		clientLogger.debug('🔄 MainLayout: Sincronizando UI store panel collapsed:', uiPanelCollapsed);
		if (!rightPanelRef.current) {
			return;
		}

		let cancelled = false;
		let timeout: NodeJS.Timeout | null = null;
		let attempt = 0;

		const applyPhysicalState = () => {
			if (cancelled) {
				return;
			}
			const panel = rightPanelRef.current;
			if (!panel) {
				return;
			}
			try {
				if (uiPanelCollapsed) {
					clientLogger.debug('📐 MainLayout: Colapsando panel físico');
					panel.collapse();
				} else {
					clientLogger.debug('📐 MainLayout: Expandiendo panel físico');
					panel.expand();
				}
			} catch (error) {
				// En dev/StrictMode/HMR puede dispararse antes de que el Group se registre
				const message = error instanceof Error ? error.message : String(error);
				clientLogger.warn('⚠️ MainLayout: Error sincronizando panel derecho (retry):', {
					message,
					attempt,
					uiPanelCollapsed,
				});

				const shouldRetry = message.includes('Group') && message.includes('not found');
				if (shouldRetry && attempt < 5) {
					attempt += 1;
					const delay = 50 * attempt;
					if (timeout) {
						clearTimeout(timeout);
					}
					timeout = setTimeout(() => {
						applyPhysicalState();
					}, delay);
				}
			}
		};

		// Primera aplicación: próximo frame para asegurar registro del Group
		requestAnimationFrame(() => {
			applyPhysicalState();
		});

		return () => {
			cancelled = true;
			if (timeout) {
				clearTimeout(timeout);
			}
		};
	}, [uiPanelCollapsed]);

	const handleLeftPanelResize = useCallback((panelSize: { asPercentage: number }) => {
		const collapsed = panelSize.asPercentage <= 0.5;
		setIsLeftCollapsed((prev) => (prev === collapsed ? prev : collapsed));
	}, []);

	const handleRightPanelResize = useCallback((panelSize: { asPercentage: number }) => {
		const collapsed = panelSize.asPercentage <= 0.5;
		setIsRightCollapsed((prev) => (prev === collapsed ? prev : collapsed));
	}, []);

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
		<div className="flex h-screen min-h-0 w-full min-w-0 bg-background text-foreground">
			<SkipLinks />
			<ResizablePanelGroup className="h-full" id="main-layout-v13-final" orientation="horizontal">
				{/* Panel de navegación izquierdo con transiciones */}
				<ResizablePanel
					className={cn('border-border border-r', !isLeftCollapsed && 'is-expanded')}
					collapsedSize="0"
					collapsible={true}
					defaultSize="20"
					id="left-nav"
					minSize="15"
					onResize={handleLeftPanelResize}
					panelRef={leftPanelRef}
				>
					<NavPanelTransition isAnimating={isLeftAnimating} isExpanded={!isLeftCollapsed}>
						<NavPanel isAnimating={isLeftAnimating} isCollapsed={isLeftCollapsed} onToggleCollapse={toggleLeftPanel} />
					</NavPanelTransition>
				</ResizablePanel>

				<ResizableHandle withHandle />

				{/* Panel central con toolbar y view container */}
				<ResizablePanel
					className="flex min-h-0 min-w-0 flex-col overflow-hidden"
					defaultSize={`${shouldHideToolbarAndPanel ? 80 : 55}`}
					id="center"
					minSize="20"
				>
					<div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-background">
						{/* Toolbar superior - solo mostrar en vistas que lo necesiten */}
						{!shouldHideToolbarAndPanel && (
							<div className="border-border border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/95">
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
						{/* Contenido principal - id para SkipLink WCAG 2.4.1 */}
						<NavigationTransition
							aria-label="Contenido principal"
							as="main"
							className="min-h-0 min-w-0 flex-1 overflow-hidden bg-background outline-none focus:outline-none"
							id="main-content"
							tabIndex={-1}
						>
							<Suspense
								fallback={
									<div className="flex h-full w-full items-center justify-center bg-background text-muted-foreground">
										<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
									</div>
								}
							>
								<Outlet />
							</Suspense>
						</NavigationTransition>
					</div>
				</ResizablePanel>

				{/* Panel de detalles derecho con transiciones - solo mostrar en vistas que lo necesiten */}
				{!shouldHideToolbarAndPanel && (
					<>
						<ResizableHandle withHandle />
						<ResizablePanel
							className={cn('border-border border-l', !isRightCollapsed && 'is-expanded')}
							collapsedSize="0"
							collapsible={true}
							defaultSize="25"
							id="right-details"
							minSize="15"
							onResize={handleRightPanelResize}
							panelRef={rightPanelRef}
						>
							<DetailsPanelTransition isAnimating={isRightAnimating} isVisible={!isRightCollapsed}>
								<RightPanel
									isAnimating={isRightAnimating}
									isCollapsed={isRightCollapsed}
									onToggleCollapse={toggleRightPanel}
								/>
							</DetailsPanelTransition>
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>

			{/* FileViewer global - modal overlay */}
			<FileViewer />
			<GlobalReindexTerminal />
		</div>
	);
});

export const MainLayout = MainLayoutComponent;
