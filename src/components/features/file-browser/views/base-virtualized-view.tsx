/**
 * @file Componente base para vistas virtualizadas con detección mejorada de altura
 * @module components/features/file-browser/views/base-virtualized-view
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';

interface UseVirtualizedContainerProps {
  initialHeight?: number;
  minHeight?: number;
  paddingTop?: number;
  paddingBottom?: number;
}

interface VirtualizedContainerDimensions {
  containerHeight: number;
  containerWidth: number;
  isReady: boolean;
}

const logger = clientLogger.withContext('BaseVirtualizedView');

/**
 * Hook personalizado para manejar la detección de dimensiones del contenedor
 * con ResizeObserver y fallbacks robustos
 */
export function useVirtualizedContainer({
  initialHeight = 600,
  minHeight = 400,
  paddingTop = 0,
  paddingBottom = 0,
}: UseVirtualizedContainerProps = {}): [
    React.RefObject<HTMLDivElement | null>,
    VirtualizedContainerDimensions
  ] {
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(initialHeight);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const measurementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateDimensions = useCallback((element: Element) => {
    const rect = element.getBoundingClientRect();
    const newHeight = Math.max(rect.height - paddingTop - paddingBottom, minHeight);
    const newWidth = rect.width;

    if (newHeight !== containerHeight || newWidth !== containerWidth) {
      logger.debug('📏 Actualizando dimensiones del contenedor:', {
        height: `${containerHeight}px → ${newHeight}px`,
        width: `${containerWidth}px → ${newWidth}px`,
      });

      setContainerHeight(newHeight);
      setContainerWidth(newWidth);

      if (!isReady && newHeight > 0 && newWidth > 0) {
        setIsReady(true);
        logger.info('✅ Contenedor virtualizado listo:', { height: newHeight, width: newWidth });
      }
    }
  }, [containerHeight, containerWidth, isReady, minHeight, paddingTop, paddingBottom]);

  const measureContainer = useCallback(() => {
    if (!parentRef.current) return;

    const element = parentRef.current;

    // Buscar el viewport de ScrollArea más cercano
    const scrollAreaViewport = element.closest('[data-radix-scroll-area-viewport]') as Element;
    const targetElement = scrollAreaViewport || element.parentElement || element;

    updateDimensions(targetElement);
  }, [updateDimensions]);

  useEffect(() => {
    if (!parentRef.current) return;

    const element = parentRef.current;

    // Buscar el viewport de ScrollArea más cercano
    const scrollAreaViewport = element.closest('[data-radix-scroll-area-viewport]') as Element;
    const targetElement = scrollAreaViewport || element.parentElement || element;

    // Medición inicial después de un pequeño delay para permitir que el DOM se estabilice
    measurementTimeoutRef.current = setTimeout(() => {
      updateDimensions(targetElement);
    }, 50);

    // Configurar ResizeObserver para cambios dinámicos
    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const adjustedHeight = Math.max(height - paddingTop - paddingBottom, minHeight);

        if (width > 0 && adjustedHeight > 0) {
          if (adjustedHeight !== containerHeight || width !== containerWidth) {
            logger.debug('🔄 ResizeObserver detectó cambio:', {
              height: `${containerHeight}px → ${adjustedHeight}px`,
              width: `${containerWidth}px → ${width}px`,
            });

            setContainerHeight(adjustedHeight);
            setContainerWidth(width);

            if (!isReady) {
              setIsReady(true);
              logger.info('✅ Contenedor virtualizado listo (ResizeObserver)');
            }
          }
        }
      }
    });

    resizeObserverRef.current.observe(targetElement);

    // Fallback con requestAnimationFrame si ResizeObserver no funciona inmediatamente
    const rafId = requestAnimationFrame(() => {
      updateDimensions(targetElement);
    });

    return () => {
      if (measurementTimeoutRef.current) {
        clearTimeout(measurementTimeoutRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      cancelAnimationFrame(rafId);
    };
  }, [paddingTop, paddingBottom, minHeight, updateDimensions, containerHeight, containerWidth, isReady]);

  return [
    parentRef,
    {
      containerHeight,
      containerWidth,
      isReady,
    },
  ];
}

/**
 * Props base para todos los componentes de vista virtualizada
 */
export interface BaseVirtualizedViewProps<T> {
  items: T[];
  itemSize: number;
  selectedIds: string[];
  containerWidth: number;
  onItemClick: (item: T, e: React.MouseEvent) => void;
  onItemDoubleClick: (item: T) => void;
}

/**
 * Componente wrapper que proporciona estilos base y prevención de overlapping
 */
interface VirtualizedContainerProps {
  children: React.ReactNode;
  height: number;
  width: number;
  padding?: number | { top?: number; bottom?: number; left?: number; right?: number };
  className?: string;
  isReady?: boolean;
}

export const VirtualizedContainer = React.forwardRef<HTMLDivElement, VirtualizedContainerProps>(
  function VirtualizedContainer({
    children,
    height,
    width,
    padding = 16,
    className = '',
    isReady = true,
  }, ref) {
    const paddingObj = typeof padding === 'number'
      ? { top: padding, bottom: padding, left: padding, right: padding }
      : { top: 0, bottom: 0, left: 0, right: 0, ...padding };

    if (!isReady) {
      return (
        <div
          ref={ref}
          className={`flex items-center justify-center text-muted-foreground ${className}`}
          style={{
            height: `${height}px`,
            width: `${width}px`,
            padding: `${paddingObj.top}px ${paddingObj.right}px ${paddingObj.bottom}px ${paddingObj.left}px`,
          }}
        >
          <div className="animate-pulse">Preparando vista...</div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`relative ${className}`}
        style={{
          height: `${height}px`,
          width: `${width}px`,
          contain: 'strict',
          padding: `${paddingObj.top}px ${paddingObj.right}px ${paddingObj.bottom}px ${paddingObj.left}px`,
          overflow: 'hidden', // Prevenir overlapping
        }}
      >
        {children}
      </div>
    );
  }
);
