'use client';

import { FileViewer } from '@/components/features/file-viewer/file-viewer';
import { getNavigationData } from '@/components/navigation/actions/navigation.actions';
import { NavPanel } from '@/components/navigation/navigation-panel';
import { ViewToolbar } from '@/components/toolbar/main-toolbar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ViewContainer } from '@/components/views/view-container';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { cn } from '@/lib/utils';
import { useImageViewer } from '@/store/image-viewer.store';
import { useCallback, useEffect, useRef, useState } from 'react';

// Estilos para el panel colapsado
import './nav-panel-collapsed.css';

export function MainLayout() {
	const [isResizing, setIsResizing] = useState(false);
	const { isOpen, images, currentIndex, closeViewer } = useImageViewer();
	const [navData, setNavData] = useState<Awaited<ReturnType<typeof getNavigationData>> | null>(null);
	const contentWrapperRef = useRef<HTMLDivElement>(null);
	const navPanelRef = useRef<React.ElementRef<typeof ResizablePanel>>(null);

	// Estado para el panel colapsable
	const [isNavPanelCollapsed, setIsNavPanelCollapsed] = useLocalStorage('nav-panel-collapsed', false);
	const [navPanelSize, setNavPanelSize] = useLocalStorage('nav-panel-size', 20);

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

	// Mantener el tamaño del panel al redimensionar
	const handleNavPanelResize = useCallback(
		(size: number) => {
			if (size > 0) {
				setNavPanelSize(size);
			}
		},
		[setNavPanelSize]
	);

	return (
		<div className="flex h-screen w-full bg-background">
			<ResizablePanelGroup direction="horizontal" className="h-full w-full">
				<ResizablePanel
					ref={navPanelRef}
					defaultSize={navPanelSize}
					minSize={isNavPanelCollapsed ? 0 : 15}
					maxSize={30}
					className={cn('bg-background-primary', isNavPanelCollapsed && 'min-w-[60px] max-w-[60px]')}
					style={{
						transition: isResizing ? 'none' : 'all 0.3s ease-in-out',
					}}
					collapsible
					collapsedSize={4}
					isCollapsed={isNavPanelCollapsed}
					onCollapse={handleNavPanelCollapse}
					onExpand={handleNavPanelExpand}
					onResize={handleNavPanelResize}
				>
					{navData && (
						<NavPanel
							initialData={navData}
							isCollapsed={isNavPanelCollapsed}
							onToggleCollapse={() => (isNavPanelCollapsed ? handleNavPanelExpand() : handleNavPanelCollapse())}
						/>
					)}
				</ResizablePanel>

				<ResizableHandle
					withHandle
					className={cn(
						'cursor-col-resize focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
						isNavPanelCollapsed ? 'nav-panel-collapsed-handle' : ''
					)}
					onDragging={handleDragging}
				/>

				<ResizablePanel defaultSize={60} minSize={40} className="h-full w-full">
					<div className="flex flex-col h-full">
						<ViewToolbar />
						<div ref={contentWrapperRef} className="flex-1 relative resize-container">
							<div
								className="absolute inset-0 w-full h-full view-container-transition"
								style={{
									opacity: isResizing ? 0 : 1,
									visibility: isResizing ? 'hidden' : 'visible',
								}}
							>
								<ViewContainer />
							</div>

							{isResizing && (
								<div
									className="absolute inset-0 w-full h-full"
									style={{
										backdropFilter: 'blur(2px)',
										WebkitBackdropFilter: 'blur(2px)',
									}}
								/>
							)}
						</div>
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>

			<FileViewer
				images={images.map((img) => ({
					...img,
					parsedMetadata: img.metadata ? JSON.parse(img.metadata) : undefined,
				}))}
				initialIndex={currentIndex}
				isOpen={isOpen}
				onClose={closeViewer}
			/>
		</div>
	);
}
