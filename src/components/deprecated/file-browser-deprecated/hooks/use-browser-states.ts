import { useMemo } from 'react';
import type { MediaItem } from '../components/media-thumbnail';

export interface UseBrowserStatesOptions {
	isLoading: boolean;
	isRefreshing: boolean;
	error: string | null;
	items: MediaItem[];
	shouldShowPreloader?: boolean;
}

export interface BrowserStatesResult {
	hasRenderableItems: boolean;
	isIdle: boolean;
	isActivelyLoading: boolean;
	showPreloader: boolean;
	showErrorState: boolean;
	showEmptyState: boolean;
	hasBlockingState: boolean;
	shouldRenderContent: boolean;
}

/**
 * Hook para determinar los estados de renderizado del explorador de archivos.
 * Calcula banderas para preloader, error, vacío y contenido.
 */
export function useBrowserStates({
	isLoading,
	isRefreshing,
	error,
	items,
	shouldShowPreloader = false,
}: UseBrowserStatesOptions): BrowserStatesResult {
	const hasRenderableItems = useMemo(() => {
		return items.length > 0;
	}, [items]);

	const isIdle = useMemo(() => {
		return !(isLoading || isRefreshing);
	}, [isLoading, isRefreshing]);

	const isActivelyLoading = useMemo(() => {
		return isLoading || isRefreshing;
	}, [isLoading, isRefreshing]);

	const showPreloader = useMemo(() => {
		return shouldShowPreloader || (isActivelyLoading && !hasRenderableItems);
	}, [shouldShowPreloader, isActivelyLoading, hasRenderableItems]);

	const showErrorState = useMemo(() => {
		return !showPreloader && !!error && !hasRenderableItems;
	}, [showPreloader, error, hasRenderableItems]);

	const showEmptyState = useMemo(() => {
		return !(showPreloader || showErrorState || hasRenderableItems) && isIdle;
	}, [showPreloader, showErrorState, hasRenderableItems, isIdle]);

	const hasBlockingState = useMemo(() => {
		return showPreloader || showErrorState || showEmptyState;
	}, [showPreloader, showErrorState, showEmptyState]);

	const shouldRenderContent = useMemo(() => {
		return !hasBlockingState && hasRenderableItems;
	}, [hasBlockingState, hasRenderableItems]);

	return {
		hasRenderableItems,
		isIdle,
		isActivelyLoading,
		showPreloader,
		showErrorState,
		showEmptyState,
		hasBlockingState,
		shouldRenderContent,
	};
}
