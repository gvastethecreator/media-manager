/**
 * @file Hook for grid view configuration
 * @module hooks/use-grid-view-config
 */

import { useMemo } from 'react';
import { useViewConfiguration } from './use-view-configuration';

export interface GridLayout {
  columns: number;
  itemSize: number;
  itemHeight: number;
  gap: number;
  padding: number;
}

export interface GridViewConfig {
  showSelectionIndicators: boolean;
  enableAnimations: boolean;
  animationDuration: number;
  animationDelay: number;
  hoverEffects: boolean;
  compactMode: boolean;
  aspectRatio: number;
  minItemSize: number;
  maxItemSize: number;
  adaptiveColumns: boolean;
  responsiveBreakpoints: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export interface HoverOverlayConfig {
  enabled: boolean;
  showPreview: boolean;
  showActions: boolean;
  showMetadata: boolean;
  position: 'top' | 'bottom' | 'center';
  opacity: number;
  animationDuration: number;
}

export interface LabelConfig {
  position: 'none' | 'bottom' | 'overlay' | 'tooltip';
  showFullName: boolean;
  showExtension: boolean;
  showSize: boolean;
  showDate: boolean;
  maxLines: number;
  fontSize: 'xs' | 'sm' | 'md';
  truncate: boolean;
}

const DEFAULT_CONFIG: GridViewConfig = {
  showSelectionIndicators: true,
  enableAnimations: true,
  animationDuration: 0.2,
  animationDelay: 0.05,
  hoverEffects: true,
  compactMode: false,
  aspectRatio: 1,
  minItemSize: 80,
  maxItemSize: 300,
  adaptiveColumns: true,
  responsiveBreakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
};

const DEFAULT_HOVER_OVERLAY_CONFIG: HoverOverlayConfig = {
  enabled: true,
  showPreview: true,
  showActions: true,
  showMetadata: false,
  position: 'center',
  opacity: 0.9,
  animationDuration: 0.15,
};

const DEFAULT_LABEL_CONFIG: LabelConfig = {
  position: 'bottom',
  showFullName: true,
  showExtension: false,
  showSize: false,
  showDate: false,
  maxLines: 2,
  fontSize: 'sm',
  truncate: true,
};

export function useGridViewConfig() {
  const { currentConfig } = useViewConfiguration('grid');

  // Extract grid config first
  const gridConfig = useMemo(() => {
    return currentConfig?.specific?.type === 'grid' ? currentConfig.specific.config : undefined;
  }, [currentConfig]);

  // Merge with current configuration if available
  const config = useMemo(() => {
    return {
      ...DEFAULT_CONFIG,
      ...gridConfig,
    };
  }, [gridConfig]);

  const calculateLayout = useMemo(() => {
    return (containerWidth: number, itemCount: number): GridLayout => {
      if (!containerWidth || containerWidth <= 0) {
        return {
          columns: 1,
          itemSize: config.minItemSize,
          itemHeight: config.minItemSize * (config.aspectRatio || 1),
          gap: 16,
          padding: 16,
        };
      }

      const gap = 16;
      const padding = 16;
      const availableWidth = containerWidth - (padding * 2);

      // Calculate optimal item size based on container width
      let itemSize = config.minItemSize;
      let columns = 1;

      if (config.adaptiveColumns) {
        // Calculate columns based on breakpoints and available width
        if (containerWidth >= config.responsiveBreakpoints.xl) {
          columns = Math.floor(availableWidth / (config.minItemSize + gap));
        } else if (containerWidth >= config.responsiveBreakpoints.lg) {
          columns = Math.floor(availableWidth / (config.minItemSize * 1.2 + gap));
        } else if (containerWidth >= config.responsiveBreakpoints.md) {
          columns = Math.floor(availableWidth / (config.minItemSize * 1.4 + gap));
        } else {
          columns = Math.floor(availableWidth / (config.minItemSize * 1.6 + gap));
        }

        columns = Math.max(1, Math.min(columns, 8)); // Limit between 1 and 8 columns

        // Calculate actual item size based on columns
        itemSize = (availableWidth - (gap * (columns - 1))) / columns;
        itemSize = Math.max(config.minItemSize, Math.min(itemSize, config.maxItemSize));
      } else {
        // Fixed item size, calculate columns
        columns = Math.floor(availableWidth / (itemSize + gap));
        columns = Math.max(1, columns);
      }

      const itemHeight = itemSize * (config.aspectRatio || 1);

      return {
        columns,
        itemSize,
        itemHeight,
        gap,
        padding,
      };
    };
  }, [config]);

  const calculateItemDimensions = useMemo(() => {
    return (layout: GridLayout) => {
      return {
        width: layout.itemSize,
        height: layout.itemHeight,
      };
    };
  }, []);

  const getHoverOverlayConfig = useMemo(() => {
    return (): HoverOverlayConfig | null => {
      if (!config.hoverEffects) return null;

      const overlayConfig = gridConfig?.hoverOverlay;
      return {
        ...DEFAULT_HOVER_OVERLAY_CONFIG,
        ...overlayConfig,
      };
    };
  }, [config.hoverEffects, currentConfig]);

  const getLabelConfig = useMemo(() => {
    return (): LabelConfig => {
      const labelConfig = gridConfig?.labelConfig;
      return {
        ...DEFAULT_LABEL_CONFIG,
        ...labelConfig,
      };
    };
  }, [currentConfig]);

  const shouldShowAnimation = useMemo(() => {
    return (itemIndex: number): boolean => {
      return config.enableAnimations && itemIndex < 50; // Limit animations to first 50 items
    };
  }, [config.enableAnimations]);

  const getAnimationDelay = useMemo(() => {
    return (itemIndex: number): number => {
      return itemIndex * config.animationDelay;
    };
  }, [config.animationDelay]);

  const getAnimationDuration = useMemo(() => {
    return (): number => {
      return config.animationDuration;
    };
  }, [config.animationDuration]);

  return {
    config,
    calculateLayout,
    calculateItemDimensions,
    getHoverOverlayConfig,
    getLabelConfig,
    shouldShowAnimation,
    getAnimationDelay,
    getAnimationDuration,
  };
}