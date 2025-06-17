'use client';

import { EmptyState } from '@/components/core/data-display';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import type { FileItem } from '@/types/file-item';
import { FileText } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { ContextMenuAction } from './context-menu/types';
import { useFilteredData } from './hooks/use-filtered-data';
import { fileItemsToImageItems } from './utils/file-converters';
import { CardsView } from './views/cards-view';
import { GridView } from './views/grid-view';
import { ListView } from './views/list-view';
import { MasonryView } from './views/masonry-view';

interface FileBrowserV2Props {
  items: FileItem[];
  onItemSelect?: (item: FileItem) => void;
  onItemDoubleClick?: (item: FileItem) => void;
  className?: string;
  isLoading?: boolean;
}

export const FileBrowserV2 = memo<FileBrowserV2Props>(function FileBrowserV2({
  items,
  onItemSelect,
  onItemDoubleClick,
  className,
  isLoading = false,
}) {
  // Estados
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // Stores
  const viewMode = useViewOptionsStore((state) => state.viewMode);
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const toggleSelection = useSelectionStore((state) => state.toggleSelection);
  const setSelection = useSelectionStore((state) => state.setSelection);
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  const { setItems: setDetailsPanelItems, setVisible: setDetailsPanelVisible } = useDetailsPanel();
  const openViewer = useFileViewerStore((state) => state.openViewer);

  // Filtrar y ordenar datos
  const filteredItems = useFilteredData(items);

  // Manejador de click en item
  const handleItemClick = useCallback((item: FileItem, e: React.MouseEvent) => {
    if (!item || !item.id) return;

    // Teclas modificadoras
    const ctrlKey = e.ctrlKey || e.metaKey;
    const shiftKey = e.shiftKey;

    if (ctrlKey) {
      // Selección múltiple con Ctrl/Cmd
      toggleSelection(item.id);
    } else if (shiftKey && selectedIds.length > 0) {
      // Selección de rango con Shift
      const lastSelectedId = selectedIds[selectedIds.length - 1];
      const lastIndex = filteredItems.findIndex(i => i.id === lastSelectedId);
      const currentIndex = filteredItems.findIndex(i => i.id === item.id);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = filteredItems.slice(start, end + 1).map(i => i.id);
        setSelection(rangeIds);
      }
    } else {
      // Selección simple
      const alreadySelected = selectedIds.includes(item.id);
      if (alreadySelected && selectedIds.length === 1) {
        clearSelection();
      } else {
        setSelection([item.id]);
      }
    }

    // Callback externo
    onItemSelect?.(item);
  }, [filteredItems, selectedIds, toggleSelection, setSelection, clearSelection, onItemSelect]);

  // Manejador de doble click
  const handleItemDoubleClick = useCallback((item: FileItem) => {
    if (!item || !item.id) return;

    // Convertir FileItems a ImageItems usando la utilidad
    const images = fileItemsToImageItems(filteredItems);

    // Encontrar el índice del elemento actual
    const index = filteredItems.findIndex(file => file.id === item.id);
    if (index !== -1) {
      // Usar el store para abrir el visor
      openViewer(images, index);
    }

    // Propagar el evento si es necesario
    onItemDoubleClick?.(item);
  }, [filteredItems, onItemDoubleClick, openViewer]);

  // Manejador de acciones del menú contextual
  const handleContextAction = useCallback((action: ContextMenuAction, item: FileItem) => {
    // Implementar acciones del menú contextual
    console.log(`Acción ${action} en item ${item.id}`);
  }, []);

  // Actualizar panel de detalles cuando cambia la selección
  useEffect(() => {
    if (selectedIds.length > 0) {
      const selectedItems = filteredItems.filter(item => selectedIds.includes(item.id));
      if (selectedItems.length > 0) {
        setDetailsPanelItems(selectedItems);
        setDetailsPanelVisible(true);
      }
    } else {
      setDetailsPanelVisible(false);
    }
  }, [selectedIds, filteredItems, setDetailsPanelItems, setDetailsPanelVisible]);

  // Renderizado condicional según el modo de vista
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="aspect-square">
              <Skeleton className="h-full w-full" />
            </div>
          ))}
        </div>
      );
    }

    if (filteredItems.length === 0) {
      return (
        <EmptyState
          title="No hay archivos"
          description="No se encontraron archivos que coincidan con los criterios de búsqueda."
          icon={FileText}
        />
      );
    }

    const viewProps = {
      items: filteredItems,
      onItemClick: handleItemClick,
      onItemDoubleClick: handleItemDoubleClick,
      onContextAction: handleContextAction,
      className,
    };

    return (
      <AnimatePresence mode="wait">
        {viewMode === 'grid' && <GridView key="grid-view" {...viewProps} />}
        {viewMode === 'list' && <ListView key="list-view" {...viewProps} />}
        {viewMode === 'cards' && <CardsView key="cards-view" {...viewProps} />}
        {viewMode === 'masonry' && <MasonryView key="masonry-view" {...viewProps} />}
      </AnimatePresence>
    );
  };

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)} ref={containerRef}>
      {renderContent()}
    </div>
  );
});