'use client';

import { getNavigationData } from '@/app/actions/nav.actions';
import { FileViewer } from '@/components/features/file-viewer/file-viewer';
import { NavPanel } from '@/components/panels/nav/nav-panel';
import { NavPanelSkeleton } from '@/components/panels/nav/nav-panel-skeleton';
import { RightPanel } from '@/components/panels/right-panel';
import { ViewToolbar } from '@/components/toolbar/view-toolbar';
import { ResizablePanel, ResizablePanelGroup, ResizablePanelHandle } from '@/components/ui/resizable';
import { ViewContainer } from '@/components/views/view-container';
import { useImageViewer } from '@/store/image-viewer.store';
import { ImageItem } from '@/types/file-item';
import type * as React from 'react';
import { Suspense, useEffect, useState } from 'react';

interface MainLayoutProps {
	children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
	const [isResizing, setIsResizing] = useState(false);
	const { isOpen, images, currentIndex, closeViewer } = useImageViewer();
	const [navData, setNavData] = useState<Awaited<ReturnType<typeof getNavigationData>> | null>(null);

	// Cargar datos de navegación
	useEffect(() => {
		getNavigationData().then(setNavData);
	}, []);

	return (
		<main className="flex h-screen">
			<ResizablePanelGroup
				direction="horizontal"
				className="h-full"
				onDragStart={() => setIsResizing(true)}
				onDragEnd={() => setIsResizing(false)}
			>
				{/* Panel Izquierdo - Default 20% */}
				<ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-background/95">
					<Suspense fallback={<NavPanelSkeleton />}>{navData && <NavPanel initialData={navData} />}</Suspense>
				</ResizablePanel>

				<ResizablePanelHandle withHandle />

				{/* Contenido Principal - Default 60% */}
				<ResizablePanel defaultSize={60} minSize={40} className="h-full w-full">
					<div className="flex flex-col h-full">
						<ViewToolbar />
						<ViewContainer isResizing={isResizing} />
						<div className="flex-1 overflow-auto">{children}</div>
					</div>
				</ResizablePanel>

				<ResizablePanelHandle withHandle />

				{/* Panel Derecho - Default 20% */}
				<ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-background/95">
					<RightPanel />
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
		</main>
	);
}
