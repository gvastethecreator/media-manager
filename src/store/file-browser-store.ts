import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { FileBrowserViewType, ViewConfiguration } from '@/types/file-browser/view-configuration';

interface FileBrowserState {
	currentViewType: FileBrowserViewType;
	enableAnimations: boolean;
	showHiddenFiles: boolean;
	sortBy: string;
	sortDirection: 'asc' | 'desc';
	viewConfigurations: Record<FileBrowserViewType, ViewConfiguration>;
}

interface FileBrowserActions {
	setEnableAnimations: (enable: boolean) => void;
	setShowHiddenFiles: (show: boolean) => void;
	setSortBy: (sortBy: string) => void;
	setSortDirection: (direction: 'asc' | 'desc') => void;
	setViewType: (viewType: FileBrowserViewType) => void;
	toggleSortDirection: () => void;
	updateViewConfiguration: (viewType: FileBrowserViewType, config: ViewConfiguration) => void;
}

type FileBrowserStore = FileBrowserState & FileBrowserActions;

export const useFileBrowserStore = create<FileBrowserStore>()(
	devtools(
		immer((set, _get) => ({
			// State
			currentViewType: 'grid',
			viewConfigurations: {} as Record<FileBrowserViewType, ViewConfiguration>,
			sortBy: 'name',
			sortDirection: 'asc',
			showHiddenFiles: false,
			enableAnimations: true,

			// Actions
			setViewType: (viewType: FileBrowserViewType) => {
				set((state) => {
					state.currentViewType = viewType;
				});
			},

			updateViewConfiguration: (viewType: FileBrowserViewType, config: ViewConfiguration) => {
				set((state) => {
					state.viewConfigurations[viewType] = config;
				});
			},

			setSortBy: (sortBy: string) => {
				set((state) => {
					state.sortBy = sortBy;
				});
			},

			setSortDirection: (direction: 'asc' | 'desc') => {
				set((state) => {
					state.sortDirection = direction;
				});
			},

			toggleSortDirection: () => {
				set((state) => {
					state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
				});
			},

			setShowHiddenFiles: (show: boolean) => {
				set((state) => {
					state.showHiddenFiles = show;
				});
			},

			setEnableAnimations: (enable: boolean) => {
				set((state) => {
					state.enableAnimations = enable;
				});
			},
		})),
		{
			name: 'file-browser-store',
		}
	)
);
