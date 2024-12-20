'use client';

import { MainToolbar } from "@/components/core/navigation/toolbar/main-toolbar";
import { NavigationBar } from "@/components/core/navigation/breadcrumbs/breadcrumbs";
import { ViewContainer } from "@/components/features/views/view-container";
import { ViewType } from "@/components/features/views/types";
import { useFilesStore } from "@/store/files";
import { useUIStore } from "@/store/ui";
import { useColumns } from "@/store/columns";
import { useSearchStore } from "@/store/search";

interface MainContentProps {
  className?: string;
  currentView: ViewType;
  currentPath: string[];
  isResizing: boolean;
}

export function MainContent({
  className,
  currentView,
  currentPath,
  isResizing,
}: MainContentProps) {
  const {
    view,
    zoomLevel,
    isRightPanelCollapsed,
    toggleRightPanel,
    setView,
    setZoomLevel,
  } = useUIStore();

  const {
    sortBy,
    sortOrder,
    setSorting,
  } = useFilesStore();

  const { columns, setColumns } = useColumns();
  const { setSearchQuery } = useSearchStore();

  return (
    <div className={className}>
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <NavigationBar 
          path={currentPath} 
          onNavigate={() => {}}
          onSearch={() => setSearchQuery("")}
          onDateSelect={() => {}}
        />
      </div>
      <MainToolbar
        view={view}
        onViewChange={setView}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={setSorting}
        columns={columns}
        onColumnsChange={setColumns}
      />
      <div className="flex-1 overflow-hidden">
        <ViewContainer
          currentView={currentView}
          isResizing={isResizing}
        />
      </div>
    </div>
  );
}
