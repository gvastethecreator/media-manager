'use client';

import { MainToolbar } from "@/components/core/navigation/toolbar/main-toolbar";
import { Breadcrumbs } from "@/components/core/navigation/breadcrumbs/breadcrumbs";
import { FileView } from "@/components/features/file-management/file-browser/file-browser";
import { EmptyState } from "@/components/core/data-display/empty-state/empty-state";
import { useFilesStore } from "@/store/files";
import { useUIStore } from "@/store/ui";
import { useColumns } from "@/store/columns";
import { useSearchStore } from "@/store/search";
import { RefreshCw, Folder } from "lucide-react";

interface MainContentProps {
  className?: string;
  currentView: string;
  selectedFolderId?: string;
  isLoadingFolder: boolean;
  folderFiles: any[];
  currentItems: any[];
  view: string;
  thumbnailSize: string;
  handleSelectItem: (item: any, event?: React.MouseEvent) => void;
  isResizing: boolean;
  zoomLevel: number;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  toggleRightPanel: () => void;
  isRightPanelCollapsed: boolean;
  sortBy: string;
  sortOrder: string;
  setSorting: (by: string, order: string) => void;
  setSearchQuery: (query: string) => void;
  columns: any[];
  setColumns: (columns: any[]) => void;
  currentPath: string;
  handleBreadcrumbNavigate: (path: string) => void;
}

export function MainContent({
  className,
  currentView,
  selectedFolderId,
  isLoadingFolder,
  folderFiles,
  currentItems,
  view,
  thumbnailSize,
  handleSelectItem,
  isResizing,
  zoomLevel,
  handleZoomIn,
  handleZoomOut,
  toggleRightPanel,
  isRightPanelCollapsed,
  sortBy,
  sortOrder,
  setSorting,
  setSearchQuery,
  columns,
  setColumns,
  currentPath,
  handleBreadcrumbNavigate,
}: MainContentProps) {
  const renderContent = () => {
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
  };

  return (
    <div className={className}>
      <MainToolbar
        view={view}
        onViewChange={() => {}}
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
  );
}
