'use client';

import { getNavigationData } from '@/app/actions/navigation/nav.actions';
import { FileViewer } from '@/components/features/file-viewer/file-viewer';
import { NavPanel } from '@/components/panels/nav/nav-panel';
import { RightPanel } from '@/components/panels/right-panel';
import { ViewToolbar } from '@/components/toolbar/main-toolbar';
import { ResizablePanel, ResizablePanelGroup, ResizablePanelHandle } from '@/components/ui/resizable';
import { ViewContainer } from '@/components/views/view-container';
import { useImageViewer } from '@/store/image-viewer.store';
import type * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

export function MainLayout() {
	const [isResizing, setIsResizing] = useState(false);
	const { isOpen, images, currentIndex, closeViewer } = useImageViewer();
	const [navData, setNavData] = useState<Awaited<ReturnType<typeof getNavigationData>> | null>(null);
	const contentWrapperRef = useRef<HTMLDivElement>(null);

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

	return (
		<div className="flex h-screen w-full">
			<ResizablePanelGroup direction="horizontal" className="h-full w-full">
				<ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-background-primary">
					{navData && <NavPanel initialData={navData} />}
				</ResizablePanel>

				<ResizablePanelHandle
					withHandle
					className="cursor-col-resize focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
									className="absolute inset-0 w-full h-full bg-background-secondary/50"
									style={{
										backdropFilter: 'blur(2px)',
										WebkitBackdropFilter: 'blur(2px)',
									}}
								/>
							)}
						</div>
					</div>
				</ResizablePanel>

				<ResizablePanelHandle
					withHandle
					className="cursor-col-resize focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					onDragging={handleDragging}
				/>

				<ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-background-primary">
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
		</div>
	);
}
