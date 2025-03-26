'use client';

import { FileViewer } from '@/components/features/file-viewer/file-viewer';
import { getNavigationData } from '@/components/navigation/actions/navigation.actions';
import { NavPanel } from '@/components/navigation/navigation-panel';
import { RightPanel } from '@/components/panels/right-panel/right-panel';
import { ViewToolbar } from '@/components/toolbar/main-toolbar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ViewContainer } from '@/components/views/view-container';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useImageViewer } from '@/store/image-viewer.store';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Estilos para el panel colapsado
import './nav-panel-collapsed.css';
import './right-panel-collapsed.css';

// Componentes memoizados para reducir renderizados
const MemoizedNavPanel = React.memo(NavPanel);
const MemoizedRightPanel = React.memo(RightPanel);
const MemoizedViewContainer = React.memo(ViewContainer);
const MemoizedViewToolbar = React.memo(ViewToolbar);

export function MainLayout() {
	const [isResizing, setIsResizing] = useState(false);
	const { isOpen, images, currentIndex, closeViewer } = useImageViewer();
	const [navData, setNavData] = useState<Awaited<ReturnType<typeof getNavigationData>> | null>(null);
	const contentWrapperRef = useRef<HTMLDivElement>(null);
	const navPanelRef = useRef<React.ElementRef<typeof ResizablePanel>>(null);
	const rightPanelRef = useRef<React.ElementRef<typeof ResizablePanel>>(null);
	const { isVisible } = useDetailsPanel();

	// Estado para los paneles colapsables
	const [isNavPanelCollapsed, setIsNavPanelCollapsed] = useLocalStorage('nav-panel-collapsed', false);
	const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useLocalStorage('right-panel-collapsed', false);
	const [navPanelSize, setNavPanelSize] = useLocalStorage('nav-panel-size', 20);
	const [rightPanelSize, setRightPanelSize] = useLocalStorage('right-panel-size', 30);

	// Cargar datos de navegación
	useEffect(() => {
		getNavigationData().then(setNavData);
	}, []);

	// Manejador para el estado de arrastre
	const handleDragging = useCallback((isDragging: boolean) => {
		setIsResizing(isDragging);

		// Aplicar o quitar clase al body para prevenir selección de texto
		if (isDragging) {
			document.body.classList.add('resize-active');
		} else {
			document.body.classList.remove('resize-active');
		}
	}, []);

	// Manejar colapso y expansión del panel de navegación
	const handleNavPanelCollapse = useCallback(() => {
		setIsNavPanelCollapsed(true);
	}, [setIsNavPanelCollapsed]);

	const handleNavPanelExpand = useCallback(() => {
		setIsNavPanelCollapsed(false);
	}, [setIsNavPanelCollapsed]);

	// Función para alternar el colapso del panel de navegación
	const toggleNavPanelCollapse = useCallback(() => {
		setIsNavPanelCollapsed(prev => !prev);
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
		setIsRightPanelCollapsed(prev => !prev);
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

	// Calcular tamaños por defecto para los paneles usando useMemo para evitar recálculos innecesarios
	const defaultSizes = useMemo(() => {
		const navDefault = isNavPanelCollapsed ? 4 : navPanelSize;
		const rightDefault = isVisible ? (isRightPanelCollapsed ? 4 : rightPanelSize) : 0;
		const centerDefault = 100 - navDefault - (isVisible ? rightDefault : 0);

		return [navDefault, centerDefault, rightDefault];
	}, [isNavPanelCollapsed, navPanelSize, isRightPanelCollapsed, rightPanelSize, isVisible]);

	// Estilos memorizados para evitar recálculos
	const navPanelStyle = useMemo(() => ({
		transition: isResizing ? 'none' : 'all 0.2s ease-in-out',
	}), [isResizing]);

	const rightPanelStyle = useMemo(() => ({
		transition: isResizing ? 'none' : 'all 0.2s ease-in-out',
	}), [isResizing]);

	const contentStyle = useMemo(() => ({
		opacity: isResizing ? 0 : 1,
		visibility: isResizing ? 'hidden' as const : 'visible' as const,
		transition: 'opacity 0.2s ease-in-out'
	}), [isResizing]);

	const resizingOverlayStyle = useMemo(() => ({
		backdropFilter: 'blur(2px)',
		WebkitBackdropFilter: 'blur(2px)',
	}), []);

	// Datos de imagen procesados para evitar procesarlos en cada renderizado
	const processedImages = useMemo(() => {
		return images.map((img) => ({
			...img,
			parsedMetadata: img.metadata ? JSON.parse(img.metadata) : undefined,
		}));
	}, [images]);

	return (
		<div className="flex h-screen w-full bg-background">
			<ResizablePanelGroup direction="horizontal" className="h-full w-full">
				{/* Panel de navegación */}
				<ResizablePanel
					ref={navPanelRef}
					defaultSize={defaultSizes[0]}
					minSize={isNavPanelCollapsed ? 4 : 15}
					maxSize={30}
					className={cn('bg-background-primary transition-all', isNavPanelCollapsed && 'min-w-[60px] max-w-[60px]')}
					style={navPanelStyle}
					collapsible
					collapsedSize={4}
					isCollapsed={isNavPanelCollapsed}
					onCollapse={handleNavPanelCollapse}
					onExpand={handleNavPanelExpand}
					onResize={handleNavPanelResize}
				>
					{navData && (
						<MemoizedNavPanel
							initialData={navData}
							isCollapsed={isNavPanelCollapsed}
							onToggleCollapse={toggleNavPanelCollapse}
						/>
					)}
				</ResizablePanel>

				{/* Separador para panel de navegación */}
				<ResizableHandle
					withHandle
					className={cn(
						'cursor-col-resize focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
						isNavPanelCollapsed ? 'nav-panel-collapsed-handle' : ''
					)}
					onDragging={handleDragging}
				/>

				{/* Panel central */}
				<ResizablePanel
					defaultSize={defaultSizes[1]}
					minSize={50}
					className="h-full w-full"
				>
					<div className="flex flex-col h-full">
						<MemoizedViewToolbar
							isRightPanelCollapsed={isRightPanelCollapsed}
							toggleRightPanelCollapse={toggleRightPanelCollapse}
							isRightPanelVisible={isVisible}
						/>
						<div ref={contentWrapperRef} className="flex-1 relative resize-container">
							<div
								className="absolute inset-0 w-full h-full view-container-transition"
								style={contentStyle}
							>
								<MemoizedViewContainer isResizing={isResizing} />
							</div>

							{isResizing && (
								<div
									className="absolute inset-0 w-full h-full"
									style={resizingOverlayStyle}
								/>
							)}
						</div>
					</div>
				</ResizablePanel>

				{/* Panel derecho (solo se renderiza si está visible) */}
				{isVisible && (
					<>
						<ResizableHandle
							withHandle
							className={cn(
								'cursor-col-resize focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
								isRightPanelCollapsed ? 'right-panel-collapsed-handle' : ''
							)}
							onDragging={handleDragging}
						/>
						<ResizablePanel
							ref={rightPanelRef}
							defaultSize={defaultSizes[2]}
							minSize={isRightPanelCollapsed ? 4 : 20}
							maxSize={40}
							className={cn('bg-background-primary transition-all', isRightPanelCollapsed && 'min-w-[60px] max-w-[60px]')}
							style={rightPanelStyle}
							collapsible
							collapsedSize={4}
							isCollapsed={isRightPanelCollapsed}
							onCollapse={handleRightPanelCollapse}
							onExpand={handleRightPanelExpand}
							onResize={handleRightPanelResize}
						>
							<MemoizedRightPanel isCollapsed={isRightPanelCollapsed} onToggleCollapse={toggleRightPanelCollapse} />
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>

			<FileViewer
				images={processedImages}
				initialIndex={currentIndex}
				isOpen={isOpen}
				onClose={closeViewer}
			/>
		</div>
	);
}
