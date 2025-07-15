import { memo, useState } from 'react';
import { NavPanel } from '@/components/navigation/navigation-panel';
import { RightPanel } from '@/components/panels/right-panel/right-panel';
import { ViewToolbar } from '@/components/toolbar/main-toolbar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ViewContainer } from '@/components/views/view-container';
import { useDetailsPanel } from '@/store/details-panel.store';

export const MainLayout = memo(function MainLayout() {
	const { isVisible } = useDetailsPanel();
	const [leftPanelSize, setLeftPanelSize] = useState(20); // 20% por defecto
	const [rightPanelSize, setRightPanelSize] = useState(25); // 25% por defecto
	const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
	const [isRightCollapsed, setIsRightCollapsed] = useState(false);

	return (
		<div className="h-screen w-full flex bg-background text-foreground">
			<ResizablePanelGroup direction="horizontal" className="h-full">
				{/* Panel de navegación izquierdo */}
				<ResizablePanel
					defaultSize={leftPanelSize}
					minSize={isLeftCollapsed ? 3 : 15}
					maxSize={isLeftCollapsed ? 3 : 35}
					collapsedSize={3}
					collapsible={true}
					onCollapse={() => setIsLeftCollapsed(true)}
					onExpand={() => setIsLeftCollapsed(false)}
					className="border-r border-border"
				>
					<NavPanel isCollapsed={isLeftCollapsed} onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)} />
				</ResizablePanel>

				<ResizableHandle withHandle />

				{/* Panel central con toolbar y view container */}
				<ResizablePanel defaultSize={isVisible ? 55 : 80} minSize={30} className="flex flex-col">
					<div className="h-full flex flex-col bg-background">
						{/* Toolbar superior */}
						<div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">
							<ViewToolbar
								isRightPanelCollapsed={isRightCollapsed}
								toggleRightPanelCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
								isRightPanelVisible={isVisible}
								allItemIds={[]}
							/>
						</div>

						{/* Contenido principal */}
						<div className="flex-1 min-h-0 bg-background p-4">
							<ViewContainer />
						</div>
					</div>
				</ResizablePanel>

				{/* Panel de detalles derecho - solo visible cuando isVisible es true */}
				{isVisible && (
					<>
						<ResizableHandle withHandle />
						<ResizablePanel
							defaultSize={rightPanelSize}
							minSize={isRightCollapsed ? 3 : 20}
							maxSize={isRightCollapsed ? 3 : 50}
							collapsedSize={3}
							collapsible={true}
							onCollapse={() => setIsRightCollapsed(true)}
							onExpand={() => setIsRightCollapsed(false)}
							className="border-l border-border"
						>
							<RightPanel
								isCollapsed={isRightCollapsed}
								onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
							/>
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>
		</div>
	);
});
