"use client";

import { NavPanel } from "@/components/panels/nav/nav-panel";
import { RightPanel } from "@/components/layout/right-panel";
import { ViewContainer } from "@/components/views/view-container";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useState } from "react";

export function MainLayout() {
	const [isResizing, setIsResizing] = useState(false);

	return (
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
				className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
			>
				<NavPanel />
			</ResizablePanel>

			<ResizableHandle withHandle />

			{/* Contenido Principal - Default 60% */}
			<ResizablePanel defaultSize={60} minSize={40} className="h-full">
				<ViewContainer isResizing={isResizing} />
			</ResizablePanel>

			<ResizableHandle withHandle />

			{/* Panel Derecho - Default 20% */}
			<ResizablePanel
				defaultSize={20}
				minSize={15}
				maxSize={30}
				className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
			>
				<RightPanel />
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
