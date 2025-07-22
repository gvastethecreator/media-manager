import { memo, useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { ImperativePanelHandle } from 'react-resizable-panels';
import { FileViewer } from '@/components/features/file-viewer/file-viewer';
import { NavPanel } from '@/components/navigation/navigation-panel';
import { RightPanel } from '@/components/panels/right-panel/right-panel';
import { ViewToolbar } from '@/components/toolbar/main-toolbar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useDetailsPanel } from '@/store/details-panel.store';

export const MainLayout = memo(function MainLayout() {
	const { isVisible } = useDetailsPanel();
	const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
	const [isRightCollapsed, setIsRightCollapsed] = useState(!isVisible);
	const [isLeftAnimating, setIsLeftAnimating] = useState(false);
	const [isRightAnimating, setIsRightAnimating] = useState(false);

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
					<NavPanel
						isCollapsed={isLeftCollapsed}
						onToggleCollapse={toggleLeftPanel}
						isAnimating={isLeftAnimating}
					/>
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
								allItemIds={[]}
							/>
						</div>						{/* Contenido principal */}
						<div className="flex-1 min-h-0 bg-background p-4">
							<Outlet />
						</div>
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
