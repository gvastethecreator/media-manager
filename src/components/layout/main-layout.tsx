"use client";

import { NavPanel } from "@/components/panels/nav/nav-panel";
import { RightPanel } from "@/components/panels/right-panel";
import { ViewContainer } from "@/components/views/view-container";
import { ViewToolbar } from "@/components/toolbar/view-toolbar";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useState } from "react";
import { AdvancedImageViewer } from "@/components/features/file-viewer/components/advanced-file-viewer";
import { useImageViewer } from "@/store/image-viewer";

export function MainLayout() {
	const [isResizing, setIsResizing] = useState(false);
	const { isOpen, images, currentIndex, closeViewer } = useImageViewer();

	return (
		<>
			<ResizablePanelGroup
				direction="horizontal"
				className="h-full"
				onDragStart={() => setIsResizing(true)}
				onDragEnd={() => setIsResizing(false)}
			>
				{/* Panel Izquierdo - Default 20% */}
				<ResizablePanel
					defaultSize={20}
					minSize={15}
					maxSize={30}
					className="bg-background/95"
				>
					<NavPanel />
				</ResizablePanel>

				<ResizableHandle withHandle />

				{/* Contenido Principal - Default 60% */}
				<ResizablePanel defaultSize={60} minSize={40} className="h-full w-full">
					<div className="flex flex-col h-full">
						<ViewToolbar />
						<ViewContainer isResizing={isResizing} />
					</div>
				</ResizablePanel>
				<ResizableHandle withHandle />

				{/* Panel Derecho - Default 20% */}
				<ResizablePanel
					defaultSize={20}
					minSize={15}
					maxSize={30}
					className="bg-background/95"
				>
					<RightPanel />
				</ResizablePanel>
			</ResizablePanelGroup>

			<AdvancedImageViewer
				images={images}
				initialIndex={currentIndex}
				isOpen={isOpen}
				onClose={closeViewer}
			/>
		</>
	);
}
