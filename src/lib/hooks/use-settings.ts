import { create } from 'zustand';

interface SettingsState {
	theme: 'light' | 'dark' | 'system';
	setTheme: (theme: SettingsState['theme']) => void;
	gridSize: number;
	setGridSize: (size: number) => void;
	thumbnailQuality: 'low' | 'medium' | 'high';
	setThumbnailQuality: (quality: SettingsState['thumbnailQuality']) => void;
	autoProcessing: boolean;
	setAutoProcessing: (enabled: boolean) => void;
	cacheSize: number;
	setCacheSize: (size: number) => void;
	systemPreferences: {
		maxConcurrentProcesses: number;
		maxMemoryUsage: number;
		watcherEnabled: boolean;
		debugMode: boolean;
	};
	updateSystemPreferences: (prefs: Partial<SettingsState['systemPreferences']>) => void;
}

export const useSettings = create<SettingsState>((set) => ({
	theme: 'system',
	setTheme: (theme) => set({ theme }),
	gridSize: 200,
	setGridSize: (size) => set({ gridSize: size }),
	thumbnailQuality: 'medium',
	setThumbnailQuality: (quality) => set({ thumbnailQuality: quality }),
	autoProcessing: true,
	setAutoProcessing: (enabled) => set({ autoProcessing: enabled }),
	cacheSize: 1024, // MB
	setCacheSize: (size) => set({ cacheSize: size }),
	systemPreferences: {
		maxConcurrentProcesses: 4,
		maxMemoryUsage: 2048, // MB
		watcherEnabled: true,
		debugMode: false,
	},
	updateSystemPreferences: (prefs) =>
		set((state) => ({
			systemPreferences: {
				...state.systemPreferences,
				...prefs,
			},
		})),
}));
