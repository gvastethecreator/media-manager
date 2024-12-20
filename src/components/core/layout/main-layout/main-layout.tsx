"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import { LeftPanel } from "@/components/core/layout/left-panel/left-panel";
import { RightPanel } from "@/components/features/file-management/file-details/right-panel";
import { MainToolbar } from "@/components/core/navigation/toolbar/main-toolbar";
import { Breadcrumbs } from "@/components/core/navigation/breadcrumbs/breadcrumbs";
import { FileView } from "@/components/features/file-management/file-browser/file-browser";
import { EmptyState } from "@/components/core/data-display/empty-state/empty-state";
import { useFilesStore } from "@/store/files";
import { useUIStore } from "@/store/ui";
import { useColumns } from "@/store/columns";
import { useSearchStore } from "@/store/search";
import { FileItem } from "@/types/files";
import { LoadingScreen } from "@/components/core/feedback/loading/loading-screen";
import { AnimatePresence } from "framer-motion";
import { RefreshCw, Folder } from "lucide-react";
import { toast } from "sonner";
import { ImageViewer } from "@/components/features/image-viewer/image-viewer";
import { MainContent } from "../main-content/main-content";

export function MainLayout() {
  const [isResizing, setIsResizing] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  const [folderFiles, setFolderFiles] = useState<FileItem[]>([]);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);

  const {
    currentView,
    currentPath,
    currentItems,
    selectedIds,
    sortBy,
    sortOrder,
    setSorting,
    isLoading,
    selectItem,
    deselectItem,
    initialize,
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
  } = useUIStore();

  const { columns, setColumns } = useColumns();
  const { searchQuery, setSearchQuery } = useSearchStore();

  // Convertir el nivel de zoom a un tamaño de thumbnail
  const thumbnailSize = useMemo(() => {
    if (zoomLevel <= 50) return 'small';    // 100px
    if (zoomLevel <= 100) return 'medium';  // 200px
    if (zoomLevel <= 150) return 'large';   // 300px
    return 'xlarge';                        // 400px
  }, [zoomLevel]);

  const handleBreadcrumbNavigate = useCallback((path: string) => {
    // Implementar navegación por breadcrumbs
  }, []);

  const handleSelectItem = useCallback(
    (item: FileItem | null, event?: React.MouseEvent) => {
      if (!item) return;

      if (event?.ctrlKey) {
        if (selectedIds.includes(item.id)) {
          deselectItem(item.id);
        } else {
          selectItem(item.id);
        }
      } else {
        if (selectedIds.length === 1 && selectedIds[0] === item.id) {
          deselectItem(item.id);
        } else {
          selectItem(item.id, true);
        }
      }
    },
    [selectedIds, selectItem, deselectItem]
  );

  const loadFolderFiles = async (folderId: string) => {
    try {
      setIsLoadingFolder(true);
      const response = await fetch(`/api/folders/${folderId}/files`);
      if (!response.ok) {
        throw new Error("Error al cargar los archivos");
      }
      const data = await response.json();
      setFolderFiles(data);
    } catch (error) {
      console.error("Error cargando archivos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los archivos de la carpeta",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFolder(false);
    }
  };

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
    loadFolderFiles(folderId);
  };

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

  return (
    <div className="h-full flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <LeftPanel
          isCollapsed={isLeftPanelCollapsed}
          onToggleCollapse={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          onFolderSelect={handleFolderSelect}
          selectedFolderId={selectedFolderId}
          defaultSize={isLeftPanelCollapsed ? 5 : 25}
          minSize={isLeftPanelCollapsed ? 5 : 15}
          maxSize={isLeftPanelCollapsed ? 5 : 40}
          isResizing={isResizing}
        />
        <ResizableHandle withHandle onDragging={(isDragging) => setIsResizing(isDragging)} />
        <ResizablePanel defaultSize={isRightPanelCollapsed ? 90 : 50} minSize={30} maxSize={90}>
          <MainContent
            className="flex flex-col h-full"
            currentView={currentView}
            selectedFolderId={selectedFolderId}
            isLoadingFolder={isLoadingFolder}
            folderFiles={folderFiles}
            currentItems={currentItems}
            view={view}
            thumbnailSize={thumbnailSize}
            handleSelectItem={handleSelectItem}
            isResizing={isResizing}
            zoomLevel={zoomLevel}
            handleZoomIn={handleZoomIn}
            handleZoomOut={handleZoomOut}
            toggleRightPanel={toggleRightPanel}
            isRightPanelCollapsed={isRightPanelCollapsed}
            sortBy={sortBy}
            sortOrder={sortOrder}
            setSorting={setSorting}
            setSearchQuery={setSearchQuery}
            columns={columns}
            setColumns={setColumns}
            currentPath={currentPath}
            handleBreadcrumbNavigate={handleBreadcrumbNavigate}
          />
        </ResizablePanel>
        <ResizableHandle withHandle onDragging={(isDragging) => setIsResizing(isDragging)} />
        <RightPanel
          selectedItem={selectedItem}
          isCollapsed={isRightPanelCollapsed}
          showSettings={isSettingsOpen}
          onToggleSettings={toggleSettings}
          onToggleCollapse={toggleRightPanel}
          defaultSize={isRightPanelCollapsed ? 5 : 25}
          minSize={isRightPanelCollapsed ? 5 : 15}
          maxSize={isRightPanelCollapsed ? 5 : 40}
          isResizing={isResizing}
        />
      </ResizablePanelGroup>
      <ImageViewer />
    </div>
  );
}
