import type { PaginationMode, RenderingMode, ViewMode } from '@/store/ui/view-options.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';

export function useSettingsBindings() {
	const viewMode = useViewOptionsStore((s) => s.viewMode);
	const setViewMode = useViewOptionsStore((s) => s.setViewMode);
	const groupByEntityType = useViewOptionsStore((s) => s.groupByEntityType);
	const toggleGroupByEntityType = useViewOptionsStore((s) => s.toggleGroupByEntityType);
	const includeSubfolders = useViewOptionsStore((s) => s.includeSubfolders);
	const toggleIncludeSubfolders = useViewOptionsStore((s) => s.toggleIncludeSubfolders);
	const useCanvasRendering = useViewOptionsStore((s) => s.useCanvasRendering);
	const setUseCanvasRendering = useViewOptionsStore((s) => s.setUseCanvasRendering);
	const virtualization = useViewOptionsStore((s) => s.virtualization);
	const setVirtualization = useViewOptionsStore((s) => s.setVirtualization);
	const backgroundColor = useViewOptionsStore((s) => s.backgroundColor);
	const setBackgroundColor = useViewOptionsStore((s) => s.setBackgroundColor);
	const pagination = useViewOptionsStore((s) => s.pagination);
	const setPaginationMode = useViewOptionsStore((s) => s.setPaginationMode);
	const setPageSize = useViewOptionsStore((s) => s.setPageSize);
	const infiniteScroll = useViewOptionsStore((s) => s.infiniteScroll);
	const setInfiniteScroll = useViewOptionsStore((s) => s.setInfiniteScroll);
	const toggleInfiniteScrollEnabled = useViewOptionsStore((s) => s.toggleInfiniteScrollEnabled);
	const toggleInfiniteScrollAutoLoad = useViewOptionsStore((s) => s.toggleInfiniteScrollAutoLoad);
	const views = useViewOptionsStore((s) => s.views);
	const setRenderingMode = useViewOptionsStore((s) => s.setRenderingMode);
	const setViewConfig = useViewOptionsStore((s) => s.setViewConfig);
	const setSearchQuery = useViewOptionsStore((s) => s.setSearchQuery);
	const resetFilters = useViewOptionsStore((s) => s.resetFilters);
	const resetAll = useViewOptionsStore((s) => s.resetAll);
	const resetLocalStorage = useViewOptionsStore((s) => s.resetLocalStorage);

	// Settings visuales
	const showThumbnails = useViewOptionsStore((s) => s.showThumbnails);
	const setShowThumbnails = useViewOptionsStore((s) => s.setShowThumbnails);
	const toggleShowThumbnails = useViewOptionsStore((s) => s.toggleShowThumbnails);
	const showMetadata = useViewOptionsStore((s) => s.showMetadata);
	const setShowMetadata = useViewOptionsStore((s) => s.setShowMetadata);
	const toggleShowMetadata = useViewOptionsStore((s) => s.toggleShowMetadata);
	const showTags = useViewOptionsStore((s) => s.showTags);
	const setShowTags = useViewOptionsStore((s) => s.setShowTags);
	const toggleShowTags = useViewOptionsStore((s) => s.toggleShowTags);
	const showStats = useViewOptionsStore((s) => s.showStats);
	const setShowStats = useViewOptionsStore((s) => s.setShowStats);
	const toggleShowStats = useViewOptionsStore((s) => s.toggleShowStats);
	const enableAnimations = useViewOptionsStore((s) => s.enableAnimations);
	const setEnableAnimations = useViewOptionsStore((s) => s.setEnableAnimations);
	const toggleEnableAnimations = useViewOptionsStore((s) => s.toggleEnableAnimations);
	const animationDuration = useViewOptionsStore((s) => s.animationDuration);
	const setAnimationDuration = useViewOptionsStore((s) => s.setAnimationDuration);

	return {
		viewMode,
		setViewMode,
		groupByEntityType,
		toggleGroupByEntityType,
		includeSubfolders,
		toggleIncludeSubfolders,
		useCanvasRendering,
		setUseCanvasRendering,
		virtualization,
		setVirtualization,
		backgroundColor,
		setBackgroundColor,
		pagination,
		setPaginationMode,
		setPageSize,
		infiniteScroll,
		setInfiniteScroll,
		toggleInfiniteScrollEnabled,
		toggleInfiniteScrollAutoLoad,
		views,
		setRenderingMode,
		setViewConfig,
		setSearchQuery,
		resetFilters,
		resetAll,
		resetLocalStorage,
		// Settings visuales
		showThumbnails,
		setShowThumbnails,
		toggleShowThumbnails,
		showMetadata,
		setShowMetadata,
		toggleShowMetadata,
		showTags,
		setShowTags,
		toggleShowTags,
		showStats,
		setShowStats,
		toggleShowStats,
		enableAnimations,
		setEnableAnimations,
		toggleEnableAnimations,
		animationDuration,
		setAnimationDuration,
	};
}

export type { ViewMode, RenderingMode, PaginationMode };
