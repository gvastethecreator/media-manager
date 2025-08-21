/**
 * @file Hook for progressive loading of items based on user preferences
 * @module components/features/file-browser/hooks/use-progressive-loading
 * @description Manages progressive rendering of items respecting itemsPerBatch and enableProgressiveLoading config
 */

import type { AnyEntityWithStats } from '@/types/migration';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface ProgressiveConfig {
	enabled: boolean;
	itemsPerBatch: number;
}

interface UseProgressiveLoadingProps {
	items: AnyEntityWithStats[];
	interfaceConfig?: {
		progressive?: ProgressiveConfig;
	};
}

interface UseProgressiveLoadingReturn {
	displayedItems: AnyEntityWithStats[];
	canLoadMore: boolean;
	loadMore: () => void;
	isLoadingMore: boolean;
	currentBatch: number;
	totalBatches: number;
	loadingProgress: number;
}

const DEFAULT_ITEMS_PER_BATCH = 50;

/**
 * Hook that manages progressive loading of items based on user preferences
 */
export function useProgressiveLoading({
	items,
	interfaceConfig,
}: UseProgressiveLoadingProps): UseProgressiveLoadingReturn {
	// Configuration from preferences
	const enabled = interfaceConfig?.progressive?.enabled ?? true;
	const itemsPerBatch = interfaceConfig?.progressive?.itemsPerBatch ?? DEFAULT_ITEMS_PER_BATCH;

	// State
	const [currentBatch, setCurrentBatch] = useState(1);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Calculate displayed items
	const displayedItems = useMemo(() => {
		if (!enabled) {
			// If progressive loading is disabled, show all items
			return items;
		}

		// Show items up to current batch
		const itemsToShow = currentBatch * itemsPerBatch;
		return items.slice(0, itemsToShow);
	}, [items, enabled, currentBatch, itemsPerBatch]);

	// Calculate metadata
	const totalBatches = Math.ceil(items.length / itemsPerBatch);
	const canLoadMore = enabled && currentBatch < totalBatches;
	const loadingProgress = enabled ? (currentBatch / totalBatches) * 100 : 100;

	// Load more function
	const loadMore = useCallback(() => {
		if (!canLoadMore || isLoadingMore) {
			return;
		}

		setIsLoadingMore(true);

		// Clear any existing timeout
		if (loadingTimeoutRef.current) {
			clearTimeout(loadingTimeoutRef.current);
		}

		// Simulate loading delay for better UX
		loadingTimeoutRef.current = setTimeout(() => {
			setCurrentBatch((prev) => Math.min(prev + 1, totalBatches));
			setIsLoadingMore(false);
		}, 100);
	}, [canLoadMore, isLoadingMore, totalBatches]);

	// Reset batch when items change
	useEffect(() => {
		setCurrentBatch(1);
		setIsLoadingMore(false);

		// Clear any pending timeouts
		if (loadingTimeoutRef.current) {
			clearTimeout(loadingTimeoutRef.current);
			loadingTimeoutRef.current = null;
		}
		// Dependemos de items para resetear; Biome puede sugerir menos deps pero es correcto incluirlo
	}, [items]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (loadingTimeoutRef.current) {
				clearTimeout(loadingTimeoutRef.current);
			}
		};
	}, []);

	return {
		displayedItems,
		canLoadMore,
		loadMore,
		isLoadingMore,
		currentBatch,
		totalBatches,
		loadingProgress,
	};
}
