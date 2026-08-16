/**
 * @file Hook for grid view configuration
 * @module hooks/use-grid-view-config
 */

import { useMemo } from 'react';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { useViewConfiguration } from './use-view-configuration';

export interface GridLayout {
	columns: number;
	gap: number;
	itemHeight: number;
	itemSize: number;
	padding: number;
}

export interface GridViewConfig {
	adaptiveColumns: boolean;
	animationDelay: number;
	animationDuration: number;
	aspectRatio: number;
	compactMode: boolean;
	enableAnimations: boolean;
	hoverEffects: boolean;
	maxItemSize: number;
	minItemSize: number;
	responsiveBreakpoints: {
		sm: number;
		md: number;
		lg: number;
		xl: number;
	};
	showSelectionIndicators: boolean;
}

export interface HoverOverlayConfig {
	animationDuration: number;
	enabled: boolean;
	opacity: number;
	position: 'top' | 'bottom' | 'center';
	showActions: boolean;
	showMetadata: boolean;
	showPreview: boolean;
}

export interface LabelConfig {
	fontSize: 'xs' | 'sm' | 'md';
	maxLines: number;
	position: 'none' | 'bottom' | 'overlay' | 'tooltip';
	showDate: boolean;
	showExtension: boolean;
	showFullName: boolean;
	showSize: boolean;
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
	const preferredItemSize = useViewOptionsStore((s) => s.itemSize);

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
		return (containerWidth: number, _itemCount: number): GridLayout => {
			if (!containerWidth || containerWidth <= 0) {
				return {
					columns: 1,
					itemSize: config.minItemSize,
					itemHeight: config.minItemSize * (typeof config.aspectRatio === 'number' ? config.aspectRatio : 1),
					gap: 16,
					padding: 16,
				};
			}

			const gap = 16;
			const padding = 16;
			const availableWidth = containerWidth - padding * 2;

			// Calculate optimal item size based on container width
			let itemSize = config.minItemSize;
			let columns = 1;

			// Preferencia del usuario desde el store (clamp entre min/max)
			const targetSize = Math.max(config.minItemSize, Math.min(preferredItemSize, config.maxItemSize));

			if (config.adaptiveColumns) {
				// Calculate columns based on breakpoints and available width
				// Primero estimar columnas en base al tamaño objetivo del usuario
				columns = Math.max(1, Math.floor((availableWidth + gap) / (targetSize + gap)));
				columns = Math.min(columns, 8);

				// Calcular tamaño resultante con ese número de columnas (clamp a min/max)
				itemSize = (availableWidth - gap * (columns - 1)) / columns;
				itemSize = Math.max(config.minItemSize, Math.min(itemSize, config.maxItemSize));
			} else {
				// Fixed item size, calculate columns
				itemSize = targetSize;
				columns = Math.floor(availableWidth / (itemSize + gap));
				columns = Math.max(1, columns);
			}

			const itemHeight = itemSize * (typeof config.aspectRatio === 'number' ? config.aspectRatio : 1);

			return {
				columns,
				itemSize,
				itemHeight,
				gap,
				padding,
			};
		};
	}, [config, preferredItemSize]);

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
			if (!config.hoverEffects) {
				return null;
			}
			const overlayConfig = gridConfig?.hoverOverlay;
			return {
				...DEFAULT_HOVER_OVERLAY_CONFIG,
				...overlayConfig,
			};
		};
	}, [config.hoverEffects, gridConfig?.hoverOverlay]);

	const getLabelConfig = useMemo(() => {
		return (): LabelConfig => {
			const rawPosition = (gridConfig as any)?.labelConfig?.position as string | undefined;
			const normalizedPosition =
				rawPosition === 'top' ? 'tooltip' : (rawPosition as LabelConfig['position'] | undefined);
			return {
				...DEFAULT_LABEL_CONFIG,
				...(gridConfig?.labelConfig as Partial<LabelConfig> | undefined),
				position: normalizedPosition ?? DEFAULT_LABEL_CONFIG.position,
			};
		};
	}, [gridConfig, gridConfig?.labelConfig]);

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
