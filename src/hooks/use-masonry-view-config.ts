/**
 * @file Hook for masonry view configuration
 * @module hooks/use-masonry-view-config
 */

import { useMemo } from 'react';
import type { AnyEntityWithStats } from '@/types/entities';
import { useViewConfiguration } from './use-view-configuration';

export interface MasonryLayoutItem {
	item: AnyEntityWithStats;
	x: number;
	y: number;
	width: number;
	height: number;
	aspectRatio: number;
}

export interface MasonryLayoutResult {
	items: MasonryLayoutItem[];
	columns: number;
	totalHeight: number;
	balance: {
		balanceFactor: number;
		heightDifference: number;
	};
}

export interface MasonrySpacing {
	gap: number;
	padding: number;
}

export interface MasonryOptimization {
	algorithm: 'balanced' | 'shortest' | 'random';
	enableBalancing: boolean;
	maxHeightDifference: number;
	rebalanceThreshold: number;
}

export interface MasonryViewConfig {
	columnWidth: number;
	minColumns: number;
	maxColumns: number;
	adaptiveColumns: boolean;
	spacing: MasonrySpacing;
	optimization: MasonryOptimization;
	showShadows: boolean;
	roundedCorners: boolean;
	showSelectionIndicators: boolean;
	hoverEffects: boolean;
	animationsEnabled: boolean;
	animationDuration: number;
	aspectRatioVariation: {
		enabled: boolean;
		minRatio: number;
		maxRatio: number;
	};
	responsiveBreakpoints: {
		sm: number;
		md: number;
		lg: number;
		xl: number;
	};
}

const DEFAULT_CONFIG: MasonryViewConfig = {
	columnWidth: 250,
	minColumns: 1,
	maxColumns: 8,
	adaptiveColumns: true,
	spacing: {
		gap: 16,
		padding: 16,
	},
	optimization: {
		algorithm: 'balanced',
		enableBalancing: true,
		maxHeightDifference: 100,
		rebalanceThreshold: 0.2,
	},
	showShadows: true,
	roundedCorners: true,
	showSelectionIndicators: true,
	hoverEffects: true,
	animationsEnabled: true,
	animationDuration: 300,
	aspectRatioVariation: {
		enabled: true,
		minRatio: 0.7,
		maxRatio: 1.8,
	},
	responsiveBreakpoints: {
		sm: 640,
		md: 768,
		lg: 1024,
		xl: 1280,
	},
};

export function useMasonryViewConfig() {
	const { currentConfig } = useViewConfiguration('masonry');

	// Merge with current configuration if available
	const config = useMemo(() => {
		const masonryConfig = currentConfig?.specific?.type === 'masonry' ? currentConfig.specific.config : undefined;
		return {
			...DEFAULT_CONFIG,
			...masonryConfig,
			spacing: {
				...DEFAULT_CONFIG.spacing,
				...masonryConfig?.spacing,
			},
			optimization: {
				...DEFAULT_CONFIG.optimization,
				...masonryConfig?.optimization,
			},
			aspectRatioVariation: {
				...DEFAULT_CONFIG.aspectRatioVariation,
				// No usar masonryConfig?.aspectRatioVariation ya que no existe en MasonryViewConfig oficial
			},
		};
	}, [currentConfig]);

	// Calculate number of columns based on container width
	const calculateColumns = useMemo(() => {
		return (containerWidth: number): number => {
			if (!containerWidth || containerWidth <= 0) {
				return config.minColumns;
			}

			const availableWidth = containerWidth - config.spacing.padding * 2;
			const columnsFromWidth = Math.floor(availableWidth / (config.columnWidth + config.spacing.gap));

			let columns = Math.max(config.minColumns, columnsFromWidth);
			columns = Math.min(columns, config.maxColumns);

			// Responsive adjustments
			if (config.adaptiveColumns) {
				if (containerWidth < config.responsiveBreakpoints.sm) {
					columns = Math.min(columns, 1);
				} else if (containerWidth < config.responsiveBreakpoints.md) {
					columns = Math.min(columns, 2);
				} else if (containerWidth < config.responsiveBreakpoints.lg) {
					columns = Math.min(columns, 4);
				}
			}

			return columns;
		};
	}, [config]);

	// Generate aspect ratio for an item
	const getItemAspectRatio = useMemo(() => {
		return (item: AnyEntityWithStats, _index: number): number => {
			if (!config.aspectRatioVariation.enabled) {
				return 1.2; // Default aspect ratio
			}

			// Use item properties to generate consistent aspect ratios
			const seed = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
			const normalized = (seed % 100) / 100;

			const { minRatio, maxRatio } = config.aspectRatioVariation;
			return minRatio + normalized * (maxRatio - minRatio);
		};
	}, [config.aspectRatioVariation]);

	// Calculate layout using the specified algorithm
	const calculateLayout = useMemo(() => {
		return (items: AnyEntityWithStats[], containerWidth: number): MasonryLayoutResult => {
			const columns = calculateColumns(containerWidth);
			const availableWidth = containerWidth - config.spacing.padding * 2;
			const itemWidth = (availableWidth - config.spacing.gap * (columns - 1)) / columns;

			// Initialize column heights
			const columnHeights = new Array(columns).fill(0);
			const layoutItems: MasonryLayoutItem[] = [];

			items.forEach((item, index) => {
				const aspectRatio = getItemAspectRatio(item, index);
				const itemHeight = itemWidth / aspectRatio;

				// Choose column based on algorithm
				let columnIndex: number;

				switch (config.optimization.algorithm) {
					case 'shortest':
						columnIndex = columnHeights.indexOf(Math.min(...columnHeights));
						break;
					case 'random':
						columnIndex = Math.floor(Math.random() * columns);
						break;
					default:
						// Find the column that would result in the best balance
						columnIndex = findBestColumn(columnHeights, itemHeight, config.optimization.maxHeightDifference);
						break;
				}

				const x = columnIndex * (itemWidth + config.spacing.gap);
				const y = columnHeights[columnIndex];

				layoutItems.push({
					item,
					x,
					y,
					width: itemWidth,
					height: itemHeight,
					aspectRatio,
				});

				// Update column height
				columnHeights[columnIndex] += itemHeight + config.spacing.gap;
			});

			// Calculate balance metrics
			const maxHeight = Math.max(...columnHeights);
			const minHeight = Math.min(...columnHeights);
			const heightDifference = maxHeight - minHeight;
			const balanceFactor = 1 - heightDifference / maxHeight;

			return {
				items: layoutItems,
				columns,
				totalHeight: maxHeight,
				balance: {
					balanceFactor,
					heightDifference,
				},
			};
		};
	}, [config, calculateColumns, getItemAspectRatio]);

	return {
		config,
		calculateLayout,
		calculateColumns,
		getItemAspectRatio,
	};
}

// Helper function to find the best column for balanced layout
function findBestColumn(columnHeights: number[], itemHeight: number, maxHeightDifference: number): number {
	const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));

	// If adding to the shortest column keeps us within the max difference, use it
	const newHeight = columnHeights[shortestColumnIndex] + itemHeight;
	const maxCurrentHeight = Math.max(...columnHeights);

	if (newHeight - Math.min(...columnHeights.filter((_, i) => i !== shortestColumnIndex)) <= maxHeightDifference) {
		return shortestColumnIndex;
	}

	// Otherwise, find the column that minimizes the maximum height difference
	let bestColumn = shortestColumnIndex;
	let bestBalance = Number.POSITIVE_INFINITY;

	for (let i = 0; i < columnHeights.length; i++) {
		const testHeights = [...columnHeights];
		testHeights[i] += itemHeight;

		const maxHeight = Math.max(...testHeights);
		const minHeight = Math.min(...testHeights);
		const balance = maxHeight - minHeight;

		if (balance < bestBalance) {
			bestBalance = balance;
			bestColumn = i;
		}
	}

	return bestColumn;
}
