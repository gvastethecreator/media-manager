'use client';

import { FileViewer } from '@/components/features/file-viewer/file-viewer';
import { getNavigationData } from '@/components/navigation/actions/navigation.actions';
import { NavPanel } from '@/components/navigation/navigation-panel';
import { RightPanel } from '@/components/panels/right-panel/right-panel';
import { ViewToolbar } from '@/components/toolbar/main-toolbar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ViewContainer } from '@/components/views/view-container';
import { useLocalStorage } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useImageViewer } from '@/store/image-viewer.store';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Estilos para el panel colapsado
import './nav-panel-collapsed.css';
import './right-panel-collapsed.css';

// Interfaces para tipado
interface PanelSizes {
	nav: number;
	content: number;
	right: number;
}

// Constantes para configuración
const PANEL_CONFIG = {
	nav: {
		minSize: 2,
		maxSize: 30,
		collapsedSize: 2,
		defaultSize: 20,
	},
	right: {
		minSize: 2,
		maxSize: 30,
		collapsedSize: 2,
		defaultSize: 20,
	},
} as const;

// Estilos estáticos memoizados fuera del componente
const _RESIZING_OVERLAY_STYLE = {
	backdropFilter: 'blur(2px)',
	WebkitBackdropFilter: 'blur(2px)',
};

// Componente para el panel central completamente separado
const CentralPanel = React.memo(function CentralPanel({
	defaultSize,
	isResizing,
	toolbar,
	children,
}: {
	defaultSize: number;
	isResizing: boolean;
	toolbar: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		// ⚠️ Es crucial mantener estas clases para que los grids virtualizados (FileBrowser, etc.) funcionen correctamente
		<ResizablePanel
			defaultSize={defaultSize}
			minSize={40}
			className="h-full w-full min-h-0 min-w-0 flex-1 flex flex-col"
		>
			<div className="flex flex-col h-full w-full min-h-0 min-w-0 flex-1 overflow-hidden">
				{toolbar}
				{/* ⚠️ CLAVE: Mantener siempre montado el contenido para evitar desmontajes de FileBrowser */}
				<div className="flex-1 min-h-0 min-w-0 w-full h-full overflow-hidden resize-container">
					<div
						className={`h-full w-full min-h-0 min-w-0 flex-1 view-container-transition ${isResizing ? 'pointer-events-none' : ''}`}
					>
						{children}
					</div>
				</div>
			</div>
		</ResizablePanel>
	);
});

// Componente memoizado para manejar el panel de navegación
const _NavigationPanel = React.memo(function NavigationPanel({
	panelRef,
	defaultSize,
	minSize,
	maxSize,
	style,
	collapsedSize,
	isCollapsed,
	onCollapse,
	onExpand,
	onResize,
	className,
	children,
}: {
	panelRef?: React.RefObject<React.ElementRef<typeof ResizablePanel>> | null;
	defaultSize: number;
	minSize: number;
	maxSize: number;
	style: React.CSSProperties;
	collapsedSize: number;
	isCollapsed: boolean;
	onCollapse: () => void;
	onExpand: () => void;
	onResize: (size: number) => void;
	className: string;
	children: React.ReactNode;
}) {
	return (
		<ResizablePanel
			ref={panelRef || undefined}
			defaultSize={defaultSize}
			minSize={minSize}
			maxSize={maxSize}
			className={className}
			style={style}
			collapsible
			collapsedSize={collapsedSize}
			isCollapsed={isCollapsed}
			onCollapse={onCollapse}
			onExpand={onExpand}
			onResize={onResize}
		>
			{children}
		</ResizablePanel>
	);
});

// Componente memoizado para el handle
const ResizerHandle = React.memo(function ResizerHandle({
	className,
	onDragging,
}: {
	className: string;
	onDragging: (isDragging: boolean) => void;
}) {
	return <ResizableHandle withHandle className={className} onDragging={onDragging} />;
});

// Componentes memoizados para reducir renderizados
const MemoizedNavPanel = React.memo(NavPanel);
const MemoizedRightPanel = React.memo(RightPanel);
const MemoizedViewContainer = React.memo(ViewContainer);
const MemoizedViewToolbar = React.memo(ViewToolbar);

export function MainLayout() {
	const [isResizing, setIsResizing] = useState(false);
	const { isOpen, images, currentIndex, closeViewer } = useImageViewer();
	const [navData, setNavData] = useState<Awaited<ReturnType<typeof getNavigationData>> | null>(null);
	const _navPanelRef = useRef(null);
	const _rightPanelRef = useRef(null);
	const { isVisible } = useDetailsPanel();

	// Estado para los paneles colapsables
	const [isNavPanelCollapsed, setIsNavPanelCollapsed] = useLocalStorage('nav-panel-collapsed', false);
	const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useLocalStorage('right-panel-collapsed', false);
	const [navPanelSize, setNavPanelSize] = useLocalStorage('nav-panel-size', 20);
	const [rightPanelSize, setRightPanelSize] = useLocalStorage('right-panel-size', 30);

	// Variable para throttle
	const lastResizeTimeRef = useRef(0);
	const resizeThrottleMs = 16; // Aproximadamente 60fps

	// Cargar datos de navegación
	useEffect(() => {
		let isMounted = true;

		const loadNavData = async () => {
			try {
				const data = await getNavigationData();

				if (isMounted) {
					setNavData(data);
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('❌ [MainLayout] Error cargando datos de navegación:', error);
			}
		};

		// Carga inicial inmediata
		loadNavData();

		// Refresco adicional después de 2 segundos para capturar datos que se cargan más tarde
		const refreshTimer = setTimeout(() => {
			if (isMounted) {
				loadNavData();
			}
		}, 2000);

		return () => {
			isMounted = false;
			clearTimeout(refreshTimer);
		};
	}, []);

	// Manejador para el estado de arrastre con throttling
	const handleDragging = useCallback(
		(isDragging: boolean) => {
			const now = Date.now();

			// Si es un cambio de estado (inicio/fin) o si ha pasado suficiente tiempo desde el último evento
			if (isDragging !== isResizing || now - lastResizeTimeRef.current >= resizeThrottleMs) {
				lastResizeTimeRef.current = now;

				// Solo actualizamos el estado si hay un cambio real
				if (isDragging !== isResizing) {
					setIsResizing(isDragging);
				}

				// Aplicar o quitar clase al body para prevenir selección de texto
				// Esto no causa rerenderizados
				if (isDragging) {
					document.body.classList.add('resize-active');
				} else {
					document.body.classList.remove('resize-active');
				}
			}
		},
		[isResizing]
	);

	// Manejar colapso y expansión del panel de navegación
	const handleNavPanelCollapse = useCallback(() => {
		setIsNavPanelCollapsed(true);
	}, [setIsNavPanelCollapsed]);

	const handleNavPanelExpand = useCallback(() => {
		setIsNavPanelCollapsed(false);
	}, [setIsNavPanelCollapsed]);

	// Función para alternar el colapso del panel de navegación
	const toggleNavPanelCollapse = useCallback(() => {
		setIsNavPanelCollapsed((prev) => !prev);
	}, [setIsNavPanelCollapsed]);

	// Funciones para el panel derecho
	const handleRightPanelCollapse = useCallback(() => {
		setIsRightPanelCollapsed(true);
	}, [setIsRightPanelCollapsed]);

	const handleRightPanelExpand = useCallback(() => {
		setIsRightPanelCollapsed(false);
	}, [setIsRightPanelCollapsed]);

	// Función para alternar el colapso del panel derecho
	const toggleRightPanelCollapse = useCallback(() => {
		setIsRightPanelCollapsed((prev) => !prev);
	}, [setIsRightPanelCollapsed]);

	// Mantener el tamaño de los paneles al redimensionar
	const handleNavPanelResize = useCallback(
		(size: number) => {
			if (size > 0) {
				setNavPanelSize(size);
			}
		},
		[setNavPanelSize]
	);

	const handleRightPanelResize = useCallback(
		(size: number) => {
			if (size > 0) {
				setRightPanelSize(size);
			}
		},
		[setRightPanelSize]
	);

	// Escuchar cambios en localStorage para actualizar el estado de los paneles
	useEffect(() => {
		const handleStorageChange = () => {
			const rightPanelCollapsed = localStorage.getItem('right-panel-collapsed') === 'true';
			const navPanelCollapsed = localStorage.getItem('nav-panel-collapsed') === 'true';

			// Solo actualizamos si hay un cambio real
			if (rightPanelCollapsed !== isRightPanelCollapsed) {
				setIsRightPanelCollapsed(rightPanelCollapsed);
			}

			if (navPanelCollapsed !== isNavPanelCollapsed) {
				setIsNavPanelCollapsed(navPanelCollapsed);
			}
		};

		// Escuchar el evento storage
		window.addEventListener('storage', handleStorageChange);

		// Limpiar el evento al desmontar
		return () => {
			window.removeEventListener('storage', handleStorageChange);
		};
	}, [isRightPanelCollapsed, setIsRightPanelCollapsed, isNavPanelCollapsed, setIsNavPanelCollapsed]);

	// Optimizar el cálculo de tamaños por defecto
	const defaultSizes = useMemo<PanelSizes>(() => {
		const nav = isNavPanelCollapsed ? PANEL_CONFIG.nav.collapsedSize : navPanelSize;
		// Siempre incluir el panel derecho en el cálculo
		const right = isRightPanelCollapsed ? PANEL_CONFIG.right.collapsedSize : rightPanelSize;
		const content = 100 - nav - right;

		return {
			nav,
			content,
			right,
		};
	}, [isNavPanelCollapsed, navPanelSize, isRightPanelCollapsed, rightPanelSize]);

	// Crear estilos de los paneles sólo cuando sus dependencias realmente cambien
	const navPanelStyleDeps = useMemo(() => [isResizing, isNavPanelCollapsed], [isResizing, isNavPanelCollapsed]);

	const rightPanelStyleDeps = useMemo(() => [isResizing, isRightPanelCollapsed], [isResizing, isRightPanelCollapsed]);

	// Optimizar los estilos de los paneles
	const navPanelStyle = useMemo(
		() => ({
			transition: isResizing ? 'none' : 'all 0.2s ease-in-out',
			minWidth: isNavPanelCollapsed ? '35px' : undefined,
			maxWidth: isNavPanelCollapsed ? '35px' : undefined,
		}),
		[isResizing, isNavPanelCollapsed, ...navPanelStyleDeps]
	);

	const rightPanelStyle = useMemo(
		() => ({
			transition: isResizing ? 'none' : 'all 0.2s ease-in-out',
			minWidth: isRightPanelCollapsed ? '35px' : undefined,
			maxWidth: isRightPanelCollapsed ? '35px' : undefined,
		}),
		[isResizing, isRightPanelCollapsed, ...rightPanelStyleDeps]
	);

	// Datos de imagen procesados para evitar procesarlos en cada renderizado
	const processedImages = useMemo(() => {
		if (!images.length) return [];
		return images.map((img) => {
			const metadata = img.metadata ? JSON.parse(img.metadata) : {};
			return {
				...img,
				parsedMetadata: metadata,
			};
		});
	}, [images]);

	// Props memoizados para componentes
	const navPanelProps = useMemo(
		() => ({
			isCollapsed: isNavPanelCollapsed,
			onToggleCollapse: toggleNavPanelCollapse,
		}),
		[isNavPanelCollapsed, toggleNavPanelCollapse]
	);

	const rightPanelProps = useMemo(
		() => ({
			isCollapsed: isRightPanelCollapsed,
			onToggleCollapse: toggleRightPanelCollapse,
		}),
		[isRightPanelCollapsed, toggleRightPanelCollapse]
	);

	const viewToolbarProps = useMemo(
		() => ({
			isRightPanelCollapsed,
			toggleRightPanelCollapse,
			isRightPanelVisible: true, // El panel derecho siempre está visible
		}),
		[isRightPanelCollapsed, toggleRightPanelCollapse]
	);

	// Callback para manejar el layout
	const handleLayout = useCallback(
		(sizes: number[]) => {
			// Persistir los tamaños al cambiar el layout
			const [nav, _content, right] = sizes;
			if (nav && !isNavPanelCollapsed) {
				// Lotes las actualizaciones para reducir rerenderiazados
				requestAnimationFrame(() => {
					setNavPanelSize(nav);
				});
			}
			if (right && !isRightPanelCollapsed) {
				requestAnimationFrame(() => {
					setRightPanelSize(right);
				});
			}
		},
		[isNavPanelCollapsed, isRightPanelCollapsed, setNavPanelSize, setRightPanelSize]
	);

	// Clases memoizadas para el ResizableHandle
	const navHandleClassName = useMemo(
		() =>
			cn(
				'cursor-col-resize focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
				isNavPanelCollapsed ? 'nav-panel-collapsed-handle' : ''
			),
		[isNavPanelCollapsed]
	);

	const rightHandleClassName = useMemo(
		() =>
			cn(
				'cursor-col-resize focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
				isRightPanelCollapsed ? 'right-panel-collapsed-handle' : ''
			),
		[isRightPanelCollapsed]
	);

	const navPanelClassName = useMemo(
		() => cn('bg-background-primary transition-all', isNavPanelCollapsed && 'min-w-[35px] max-w-[35px]'),
		[isNavPanelCollapsed]
	);

	const rightPanelClassName = useMemo(
		() => cn('bg-background-primary transition-all', isRightPanelCollapsed && 'min-w-[35px] max-w-[35px]'),
		[isRightPanelCollapsed]
	);

	// Optimización usando renderización condicional completa
	const renderViewContent = useMemo(() => {
		// Renderizar siempre el contenido, FileBrowser maneja internamente el estado de isResizing
		return <MemoizedViewContainer isResizing={isResizing} />;
	}, [isResizing]);

	return (
		<div className="flex h-screen w-full bg-background">
			<ResizablePanelGroup direction="horizontal" className="h-full w-full" onLayout={handleLayout}>
				{/* Panel de navegación */}
				<ResizablePanel
					defaultSize={defaultSizes.nav}
					minSize={isNavPanelCollapsed ? PANEL_CONFIG.nav.collapsedSize : PANEL_CONFIG.nav.minSize}
					maxSize={PANEL_CONFIG.nav.maxSize}
					className={navPanelClassName}
					style={navPanelStyle}
					collapsible
					collapsedSize={PANEL_CONFIG.nav.collapsedSize}
					isCollapsed={isNavPanelCollapsed}
					onCollapse={handleNavPanelCollapse}
					onExpand={handleNavPanelExpand}
					onResize={handleNavPanelResize}
				>
					{/* Panel de navegación real con datos */}
					{!isResizing && navData && (
						<MemoizedNavPanel
							key={`navpanel-${navData.folders?.length || 0}-${navData.collections?.length || 0}`}
							initialData={navData}
							isCollapsed={isNavPanelCollapsed}
							onToggleCollapse={toggleNavPanelCollapse}
						/>
					)}
				</ResizablePanel>

				{/* Separador para panel de navegación */}
				<ResizerHandle className={navHandleClassName} onDragging={handleDragging} />

				{/* Panel central optimizado */}
				<CentralPanel
					defaultSize={defaultSizes.content}
					isResizing={isResizing}
					toolbar={<MemoizedViewToolbar {...viewToolbarProps} />}
				>
					{renderViewContent}
				</CentralPanel>

				{/* Panel derecho siempre visible */}
				<ResizerHandle className={rightHandleClassName} onDragging={handleDragging} />
				<ResizablePanel
					defaultSize={defaultSizes.right}
					minSize={isRightPanelCollapsed ? PANEL_CONFIG.right.collapsedSize : PANEL_CONFIG.right.minSize}
					maxSize={PANEL_CONFIG.right.maxSize}
					className={rightPanelClassName}
					style={rightPanelStyle}
					collapsible
					collapsedSize={PANEL_CONFIG.right.collapsedSize}
					isCollapsed={isRightPanelCollapsed}
					onCollapse={handleRightPanelCollapse}
					onExpand={handleRightPanelExpand}
					onResize={handleRightPanelResize}
				>
					{/* Solo renderizamos RightPanel cuando no estamos redimensionando */}
					{!isResizing && <MemoizedRightPanel {...rightPanelProps} />}
				</ResizablePanel>
			</ResizablePanelGroup>

			{isOpen && !isResizing && (
				<FileViewer
					images={processedImages.map((img) => ({
						id: img.id,
						name: img.name,
						path: img.path,
						type: img.type,
						size: img.size,
						mimeType: img.mimeType,
						metadata: img.metadata,
						processingStatus: img.processingStatus,
						createdAt: img.createdAt,
						updatedAt: img.updatedAt,
						errorMessage: img.errorMessage,
						src: img.path,
						alt: img.name,
						width: img.parsedMetadata?.dimensions?.width || 800,
						height: img.parsedMetadata?.dimensions?.height || 600,
						thumbnail: '',
					}))}
					initialIndex={currentIndex}
					isOpen={isOpen}
					onClose={closeViewer}
				/>
			)}
		</div>
	);
}
