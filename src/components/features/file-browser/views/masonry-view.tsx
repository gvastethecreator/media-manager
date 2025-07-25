/**
 * @file Vista masonry usando TanStack Virtual
 * @module components/features/file-browser/views/masonry-view
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import React, { memo, useMemo, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/migration';

interface MasonryViewProps {
  items: AnyEntityWithStats[];
  itemSize: number;
  selectedIds: string[];
  containerWidth: number;
  onItemClick: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
  onItemDoubleClick: (item: AnyEntityWithStats) => void;
}

export const MasonryView = memo<MasonryViewProps>(function MasonryView({
  items,
  itemSize,
  selectedIds,
  containerWidth,
  onItemClick,
  onItemDoubleClick,
}) {
  const parentRef = useRef<any>(null);
  const [containerHeight, setContainerHeight] = useState<number>(600);

  // Efecto para medir y establecer altura del contenedor
  useEffect(() => {
    if (parentRef.current) {
      const scrollAreaViewport = parentRef.current.closest('[data-radix-scroll-area-viewport]');
      if (scrollAreaViewport) {
        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const height = entry.contentRect.height;
            if (height > 0) {
              setContainerHeight(height - 48); // Restar padding
            }
          }
        });
        observer.observe(scrollAreaViewport);
        return () => observer.disconnect();
      } else {
        // Fallback: usar el viewport más cercano
        const viewport = parentRef.current.closest('.flex-1, .h-full');
        if (viewport) {
          setContainerHeight(viewport.clientHeight - 48);
        }
      }
    }
  }, []);

  // Para masonry, usamos una aproximación simplificada con alturas variables
  const { columns, columnWidth, gap, padding } = useMemo(() => {
    const minWidth = Math.max(itemSize || 200, 150); // Mínimo absoluto de 150px
    const gapSize = 16;
    const paddingSize = 24;
    const availableWidth = Math.max(containerWidth - paddingSize * 2, minWidth);

    // Calcular columnas de forma más precisa
    const cols = Math.max(1, Math.floor((availableWidth + gapSize) / (minWidth + gapSize)));
    const actualColumnWidth = Math.floor((availableWidth - gapSize * (cols - 1)) / cols);

    return {
      columns: cols,
      columnWidth: actualColumnWidth,
      gap: gapSize,
      padding: paddingSize,
    };
  }, [containerWidth, itemSize]);

  // Función para estimar altura del item (simulando masonry)
  const getItemHeight = (index: number): number => {
    // Simular alturas variables para efecto masonry
    const heights = [200, 250, 180, 300, 220, 160, 280, 190];
    return heights[index % heights.length];
  };

  // Configurar virtualizador
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: getItemHeight,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="w-full overflow-auto"
      style={{
        height: `${containerHeight}px`,
        contain: 'strict',
        padding: `${padding}px`,
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index];
          const isSelected = selectedIds.includes(item.id);
          const columnIndex = virtualItem.index % columns;
          const itemHeight = getItemHeight(virtualItem.index);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: Math.min(virtualItem.index * 0.02, 0.3),
                duration: 0.3,
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: `${columnIndex * (columnWidth + gap)}px`,
                width: `${columnWidth}px`,
                height: `${itemHeight}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className={cn(
                'relative cursor-pointer transition-all duration-200',
                'bg-card border rounded-lg p-4 hover:shadow-lg',
                isSelected && 'ring-2 ring-primary bg-primary/5'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onItemClick(item, e);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onItemDoubleClick(item);
              }}
            >
              <div className="h-full flex flex-col">
                <div className="flex-1 flex items-center justify-center bg-muted rounded mb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">
                      {(item.name || item.id || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-sm font-medium text-center mb-1">
                  {item.name || item.id || 'Unknown'}
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {'entityType' in item ? item.entityType : 'unknown'} •
                  {'stats' in item && item.stats && typeof item.stats === 'object' && 'imageCount' in item.stats ? item.stats.imageCount : 0} imágenes
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
