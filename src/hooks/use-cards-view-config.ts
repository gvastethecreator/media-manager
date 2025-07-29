/**
 * @file Hook for cards view configuration
 * @module hooks/use-cards-view-config
 */

import { useMemo } from 'react';
import { useViewConfiguration } from './use-view-configuration';

export interface CardsLayout {
  columns: number;
  rows: number;
  cardWidth: number;
  cardHeight: number;
  gap: number;
  padding: number;
}

export interface InteractiveConfig {
  enabled: boolean;
  hoverDelay: number;
  showInfoOverlay: boolean;
  showActionButtons: boolean;
  overlayPosition: 'top' | 'bottom' | 'center' | 'auto';
  actionButtons: string[];
}

export interface MetadataConfig {
  showSize: boolean;
  showDate: boolean;
  showType: boolean;
  showTags: boolean;
  showDescription: boolean;
  maxDescriptionLength: number;
}

export interface CardsViewConfig {
  cardStyle: 'default' | 'compact' | 'detailed';
  cardAspectRatio: number;
  minCardWidth: number;
  maxCardWidth: number;
  adaptiveColumns: boolean;
  showShadows: boolean;
  roundedCorners: boolean;
  showSelectionIndicators: boolean;
  animationsEnabled: boolean;
  animationDuration: number;
  interactiveConfig: InteractiveConfig;
  metadataConfig: MetadataConfig;
  responsiveBreakpoints: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

const DEFAULT_CONFIG: CardsViewConfig = {
  cardStyle: 'default',
  cardAspectRatio: 1.2,
  minCardWidth: 160,
  maxCardWidth: 280,
  adaptiveColumns: true,
  showShadows: true,
  roundedCorners: true,
  showSelectionIndicators: true,
  animationsEnabled: true,
  animationDuration: 200,
  interactiveConfig: {
    enabled: true,
    hoverDelay: 300,
    showInfoOverlay: true,
    showActionButtons: true,
    overlayPosition: 'bottom',
    actionButtons: ['preview', 'download', 'share', 'delete'],
  },
  metadataConfig: {
    showSize: true,
    showDate: true,
    showType: true,
    showTags: false,
    showDescription: false,
    maxDescriptionLength: 100,
  },
  responsiveBreakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
};

export function useCardsViewConfig() {
  const { currentConfig } = useViewConfiguration('cards');

  // Merge with current configuration if available
  const config = useMemo(() => {
    const cardsConfig = currentConfig?.specific?.type === 'cards' ? currentConfig.specific.config : undefined;
    return {
      ...DEFAULT_CONFIG,
      ...cardsConfig,
      interactiveConfig: {
        ...DEFAULT_CONFIG.interactiveConfig,
        ...cardsConfig?.interactiveConfig,
      },
      metadataConfig: {
        ...DEFAULT_CONFIG.metadataConfig,
        ...cardsConfig?.metadataConfig,
      },
    };
  }, [currentConfig]);

  const calculateLayout = useMemo(() => {
    return (containerWidth: number, itemCount: number): CardsLayout => {
      if (!containerWidth || containerWidth <= 0) {
        return {
          columns: 1,
          rows: itemCount,
          cardWidth: config.minCardWidth,
          cardHeight: config.minCardWidth * config.cardAspectRatio,
          gap: 16,
          padding: 16,
        };
      }

      const gap = 16;
      const padding = 16;
      const availableWidth = containerWidth - (padding * 2);

      let cardWidth = config.minCardWidth;
      let columns = 1;

      if (config.adaptiveColumns) {
        // Calculate optimal number of columns based on container width
        if (containerWidth >= config.responsiveBreakpoints.xl) {
          columns = Math.floor(availableWidth / (config.minCardWidth + gap));
        } else if (containerWidth >= config.responsiveBreakpoints.lg) {
          columns = Math.floor(availableWidth / (config.minCardWidth * 1.1 + gap));
        } else if (containerWidth >= config.responsiveBreakpoints.md) {
          columns = Math.floor(availableWidth / (config.minCardWidth * 1.2 + gap));
        } else {
          columns = Math.floor(availableWidth / (config.minCardWidth * 1.3 + gap));
        }

        columns = Math.max(1, Math.min(columns, 6)); // Limit between 1 and 6 columns

        // Calculate actual card width based on columns
        cardWidth = (availableWidth - (gap * (columns - 1))) / columns;
        cardWidth = Math.max(config.minCardWidth, Math.min(cardWidth, config.maxCardWidth));
      } else {
        // Fixed card width, calculate columns
        columns = Math.floor(availableWidth / (cardWidth + gap));
        columns = Math.max(1, columns);
      }

      const cardHeight = cardWidth * config.cardAspectRatio;
      const rows = Math.ceil(itemCount / columns);

      return {
        columns,
        rows,
        cardWidth,
        cardHeight,
        gap,
        padding,
      };
    };
  }, [config]);

  const getCardDimensions = useMemo(() => {
    return (layout: CardsLayout) => {
      return {
        width: layout.cardWidth,
        height: layout.cardHeight,
      };
    };
  }, []);

  const shouldShowAnimation = useMemo(() => {
    return (itemIndex: number): boolean => {
      return config.animationsEnabled && itemIndex < 100; // Limit animations to first 100 items
    };
  }, [config.animationsEnabled]);

  const getAnimationDelay = useMemo(() => {
    return (itemIndex: number): number => {
      return itemIndex * 0.02; // 20ms delay between items
    };
  }, []);

  const getAnimationDuration = useMemo(() => {
    return (): number => {
      return config.animationDuration / 1000; // Convert to seconds for framer-motion
    };
  }, [config.animationDuration]);

  return {
    config,
    calculateLayout,
    getCardDimensions,
    shouldShowAnimation,
    getAnimationDelay,
    getAnimationDuration,
  };
}