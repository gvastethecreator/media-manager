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

export function MainLayout() {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
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

  const renderContent = useCallback(() => {
    // Si estamos en la vista de carpetas y hay una carpeta seleccionada
    if (currentView === "folders" && selectedFolderId) {
      if (isLoadingFolder) {
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Cargando archivos...</p>
            </div>
          </div>
        );
      }

      if (folderFiles.length === 0) {
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No hay archivos en esta carpeta
              </p>
            </div>
          </div>
        );
      }

      return (
        <FileView
          items={folderFiles}
          viewMode={view}
          thumbnailSize={thumbnailSize}
          onItemSelect={handleSelectItem}
          isResizing={isResizing}
        />
      );
    }

    // Vista por defecto (cuando no hay carpeta seleccionada o estamos en otra vista)
    if (currentItems.length === 0) {
      return <EmptyState type={currentView} />;
    }

    return (
      <FileView
        items={currentItems}
        viewMode={view}
        thumbnailSize={thumbnailSize}
        onItemSelect={handleSelectItem}
        isResizing={isResizing}
      />
    );
  }, [
    currentView,
    selectedFolderId,
    isLoadingFolder,
    folderFiles,
    currentItems,
    view,
    thumbnailSize,
    handleSelectItem,
    isResizing,
  ]);

  // Inicializar la aplicación
  useEffect(() => {
    const init = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        // Dar un pequeño delay para mostrar la pantalla de carga
        setTimeout(() => {
          setIsInitialLoad(false);
        }, 500);
      }
    };

    init();
  }, [initialize]);

  // Si hay error de carga, también salir del estado inicial
  useEffect(() => {
    if (isInitialLoad && !isLoading) {
      setIsInitialLoad(false);
    }
  }, [isLoading, isInitialLoad]);

  if (isInitialLoad) {
    return <LoadingScreen message="Iniciando aplicación..." />;
  }

  return (
    <div className="h-full flex flex-col">
      <AnimatePresence>
        {isLoading && <LoadingScreen message="Cargando vista..." />}
      </AnimatePresence>
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
              <Breadcrumbs path={currentPath} onNavigate={handleBreadcrumbNavigate} />
            </div>
            <div className="flex-1 overflow-hidden relative">
              <div className="h-full overflow-auto">{renderContent()}</div>
              <div className="absolute bottom-4 right-4 bg-background/40 backdrop-blur-[8px] supports-[backdrop-filter]:bg-background/30 border border-border/50 rounded-lg px-3 py-1.5 text-[10px] flex items-center gap-2 shadow-sm transition-all duration-200 hover:bg-background/50">
                <div>
                  {currentView === "folders" && selectedFolderId
                    ? `${folderFiles.length} elementos`
                    : `${currentItems.length} elementos`}
                </div>
                <div className="w-[1px] h-3 bg-border/50"></div>
                <div>Zoom: {zoomLevel}%</div>
              </div>
            </div>
          </div>
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
