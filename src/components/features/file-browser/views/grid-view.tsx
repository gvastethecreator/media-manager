/**
 * @file Vista de grid simple usando TanStack Virtual
 * @module components/features/file-browser/views/grid-view
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/migration';
import {
  useVirtualizedContainer,
  VirtualizedContainer,
  type BaseVirtualizedViewProps
} from './base-virtualized-view';

interface GridViewProps extends BaseVirtualizedViewProps<AnyEntityWithStats> { }

export const GridView = memo<GridViewProps>(function GridView({
  items,
  itemSize,
  selectedIds,
  containerWidth,
  onItemClick,
  onItemDoubleClick,
}) {
  const [parentRef, { containerHeight, containerWidth: actualWidth, isReady }] = useVirtualizedContainer({
    paddingTop: 20,
    paddingBottom: 20,
  });

  // Usar el ancho real del contenedor en lugar del prop
  const effectiveWidth = actualWidth || containerWidth;

  // Calcular configuración de la grid con mejor espaciado
  const { columns, cellSize, gap, padding } = useMemo(() => {
    const minCellSize = Math.max(itemSize || 120, 100); // Mínimo absoluto de 100px
    const gapSize = 12;
    const paddingSize = 20;
    const availableWidth = Math.max(effectiveWidth - paddingSize * 2, minCellSize);

    // Calcular columnas de forma más precisa
    const cols = Math.max(1, Math.floor((availableWidth + gapSize) / (minCellSize + gapSize)));
    const actualCellSize = Math.floor((availableWidth - gapSize * (cols - 1)) / cols);

    return {
      columns: cols,
      cellSize: actualCellSize,
      gap: gapSize,
      padding: paddingSize,
    };
  }, [effectiveWidth, itemSize]);

  // Calcular filas necesarias
  const rowCount = Math.ceil(items.length / columns);
  const rowHeight = cellSize + gap; // Tamaño de celda + gap

  // Configurar virtualizador para filas
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 3,
  });

  // Función para obtener items de una fila específica
  const getRowItems = (rowIndex: number): AnyEntityWithStats[] => {
    const startIndex = rowIndex * columns;
    const endIndex = Math.min(startIndex + columns, items.length);
    return items.slice(startIndex, endIndex);
  };

  return (
    <VirtualizedContainer
      ref={parentRef}
      height={containerHeight}
      width={effectiveWidth}
      padding={padding}
      isReady={isReady}
      className="overflow-auto"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowItems = getRowItems(virtualRow.index);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${rowHeight}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap: `${gap}px`,
                  height: `${cellSize}px`,
                }}
              >
                {rowItems.map((item, columnIndex) => {
                  const isSelected = selectedIds.includes(item.id);
                  const itemIndex = virtualRow.index * columns + columnIndex;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: Math.min(itemIndex * 0.01, 0.2),
                        duration: 0.2,
                      }}
                      className={cn(
                        'relative cursor-pointer transition-all duration-200',
                        'bg-card border rounded-lg p-2 hover:shadow-md',
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
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                      }}
                    >
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="w-8 h-8 bg-primary/10 rounded mb-1 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {(item.name || item.id || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs font-medium truncate w-full px-1">
                          {item.name || item.id || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {'stats' in item && item.stats && typeof item.stats === 'object' && 'imageCount' in item.stats ? item.stats.imageCount : 0}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </VirtualizedContainer>
  );
});
