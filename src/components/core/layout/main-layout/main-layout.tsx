"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import { RightPanel } from "@/components/features/file-management/file-details/right-panel";
import { LeftSidebar } from "@/components/core/layout/left-sidebar/left-sidebar";
import { FileView } from "@/components/features/file-management/file-browser/file-browser";
import { MainToolbar } from "@/components/core/navigation/toolbar/main-toolbar";
import { Breadcrumbs } from "@/components/core/navigation/breadcrumbs/breadcrumbs";
import {
	ResizablePanelGroup,
	ResizablePanel,
	ResizableHandle,
} from "@/components/ui/resizable";
import { useFilesStore } from "@/store/files";
import { useUIStore } from "@/store/ui";
import { EmptyState } from "@/components/core/data-display/empty-state/empty-state";
import { LoadingScreen } from "@/components/core/feedback/loading/loading-screen";
import { AnimatePresence } from "framer-motion";
import { useColumns } from "@/store/columns";

export function MainLayout() {
	const [isInitialLoad, setIsInitialLoad] = useState(true);
	const {
		currentView,
		currentItems,
		currentPath,
		selectedIds,
		setCurrentPath,
		sortBy,
		sortOrder,
		setSorting,
		isLoading,
		selectItem,
		deselectItem,
	} = useFilesStore();

	const {
		view,
		zoomLevel,
		isSettingsOpen,
		isRightPanelCollapsed,
		toggleSettings,
		toggleRightPanel,
		setView,
		setZoomLevel,
		searchQuery,
		setSearchQuery,
		thumbnailSize,
	} = useUIStore();

	const { columns, setColumns } = useColumns();

	useEffect(() => {
		if (!isInitialLoad) return;

		const timer = setTimeout(() => {
			setIsInitialLoad(false);
		}, 500);

		return () => clearTimeout(timer);
	}, [isInitialLoad]);

	const handleBreadcrumbNavigate = useCallback(
		(index: number) => {
			setCurrentPath(currentPath.slice(0, index + 1));
		},
		[currentPath, setCurrentPath]
	);

	const handleSelectItem = useCallback(
		(item: FileItem | null) => {
			if (!item) return;
			if (selectedIds.includes(item.id)) {
				deselectItem(item.id);
			} else {
				selectItem(item.id);
			}
		},
		[selectedIds, selectItem, deselectItem]
	);

	const renderContent = useCallback(() => {
		if (currentItems.length === 0) {
			return <EmptyState type={currentView} />;
		}

		return (
			<FileView
				items={currentItems}
				viewMode={view}
				thumbnailSize={thumbnailSize}
				onItemSelect={handleSelectItem}
			/>
		);
	}, [currentItems, currentView, view, thumbnailSize, handleSelectItem]);

	const selectedItem = useMemo(() => {
		if (selectedIds.length !== 1) return null;
		return currentItems.find((item) => selectedIds.includes(item.id)) || null;
	}, [currentItems, selectedIds]);

	const handleZoomIn = useCallback(() => {
		setZoomLevel(Math.min(zoomLevel + 10, 200));
	}, [zoomLevel, setZoomLevel]);

	const handleZoomOut = useCallback(() => {
		setZoomLevel(Math.max(zoomLevel - 10, 50));
	}, [zoomLevel, setZoomLevel]);

	if (isInitialLoad) {
		return <LoadingScreen message="Iniciando aplicación..." />;
	}

	return (
		<>
			<AnimatePresence>
				{isLoading && <LoadingScreen message="Cargando vista..." />}
			</AnimatePresence>

			<div className="flex h-full">
				<LeftSidebar />
				<ResizablePanelGroup direction="horizontal" className="flex-1">
					<ResizablePanel
						defaultSize={isRightPanelCollapsed ? 95 : 75}
						minSize={isRightPanelCollapsed ? 90 : 30}
						maxSize={isRightPanelCollapsed ? 95 : 85}
					>
						<div className="flex flex-col h-full">
							<MainToolbar
								view={view}
								onViewChange={setView}
								onZoomIn={handleZoomIn}
								onZoomOut={handleZoomOut}
								onToggleRightPanel={toggleRightPanel}
								canZoomIn={zoomLevel < 200}
								canZoomOut={zoomLevel > 50}
								isRightPanelOpen={!isRightPanelCollapsed}
								sortBy={sortBy}
								sortOrder={sortOrder}
								onSortChange={setSorting}
								onSearch={() => setSearchQuery("")}
								columns={columns}
								onColumnsChange={setColumns}
							/>
							<div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
								<Breadcrumbs
									path={currentPath}
									onNavigate={handleBreadcrumbNavigate}
								/>
							</div>
							<div className="flex-1 overflow-hidden relative">
								<div className="h-full overflow-auto">{renderContent()}</div>
								<div className="absolute bottom-4 right-4 bg-background/40 backdrop-blur-[8px] supports-[backdrop-filter]:bg-background/30 border border-border/50 rounded-lg px-3 py-1.5 text-[10px] flex items-center gap-2 shadow-sm transition-all duration-200 hover:bg-background/50">
									<div>{currentItems.length} elementos</div>
									<div className="w-[1px] h-3 bg-border/50"></div>
									<div>Zoom: {zoomLevel}%</div>
								</div>
							</div>
						</div>
					</ResizablePanel>
					<ResizableHandle withHandle />
					<RightPanel
						selectedItem={selectedItem}
						isCollapsed={isRightPanelCollapsed}
						showSettings={isSettingsOpen}
						onToggleSettings={toggleSettings}
						onToggleCollapse={toggleRightPanel}
						defaultSize={isRightPanelCollapsed ? 5 : 25}
						minSize={isRightPanelCollapsed ? 5 : 15}
						maxSize={isRightPanelCollapsed ? 5 : 40}
					/>
				</ResizablePanelGroup>
			</div>
		</>
	);
}
