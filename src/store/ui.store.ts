import { logger } from '@/lib/logger/logger';
import { produce } from 'immer';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const uiLogger = logger.withContext('UIStore');

export type ViewMode = 'grid' | 'list' | 'masonry' | 'cards' | 'details';
export type ThumbnailSize = 'small' | 'medium' | 'large';
export type ThemeMode = 'light' | 'dark' | 'system';

interface UIState {
	// Estado
	view: ViewMode;
	thumbnailSize: ThumbnailSize;
	zoomLevel: number;
	isSettingsOpen: boolean;
	isRightPanelCollapsed: boolean;
	searchQuery: string;
	theme: ThemeMode;
	showSettings: boolean;
	lastUpdate: number;

	// Acciones
	setView: (view: ViewMode) => void;
	setThumbnailSize: (size: ThumbnailSize) => void;
	setZoomLevel: (level: number) => void;
	toggleSettings: () => void;
	toggleRightPanel: () => void;
	setSearchQuery: (query: string) => void;
	setTheme: (theme: ThemeMode) => void;
	resetState: () => void;
}

// Constantes
const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const DEFAULT_ZOOM = 100;

const initialState = {
	view: 'grid' as ViewMode,
	thumbnailSize: 'medium' as ThumbnailSize,
	zoomLevel: DEFAULT_ZOOM,
	isSettingsOpen: false,
	isRightPanelCollapsed: false,
	searchQuery: '',
	theme: 'system' as ThemeMode,
	showSettings: false,
	lastUpdate: Date.now(),
};

export const useUIStore = create<UIState>()(
	persist(
		(set) => ({
			...initialState,

			setView: (view) => {
				uiLogger.info('🎯 Cambiando vista a:', view);
				set(
					produce((state: UIState) => {
						state.view = view;
						state.lastUpdate = Date.now();
					})
				);
			},

			setThumbnailSize: (thumbnailSize) => {
				uiLogger.info('🖼️ Ajustando tamaño de miniaturas a:', thumbnailSize);
				set(
					produce((state: UIState) => {
						state.thumbnailSize = thumbnailSize;
						// Ajustar zoom según el tamaño de miniatura
						if (thumbnailSize === 'small') {
							state.zoomLevel = 75;
						} else if (thumbnailSize === 'large') {
							state.zoomLevel = 150;
						} else {
							state.zoomLevel = 100;
						}
						state.lastUpdate = Date.now();
					})
				);
			},

			setZoomLevel: (zoomLevel) => {
				uiLogger.info('🔍 Ajustando nivel de zoom a:', zoomLevel);
				set(
					produce((state: UIState) => {
						const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel));
						state.zoomLevel = clampedZoom;
						// Ajustar tamaño de miniatura según el zoom
						if (clampedZoom <= 75) {
							state.thumbnailSize = 'small';
						} else if (clampedZoom >= 150) {
							state.thumbnailSize = 'large';
						} else {
							state.thumbnailSize = 'medium';
						}
						state.lastUpdate = Date.now();
					})
				);
			},

			toggleSettings: () => {
				uiLogger.info('⚙️ Alternando panel de configuración');
				set(
					produce((state: UIState) => {
						state.isSettingsOpen = !state.isSettingsOpen;
						state.lastUpdate = Date.now();
					})
				);
			},

			toggleRightPanel: () => {
				uiLogger.info('📑 Alternando panel derecho');
				set(
					produce((state: UIState) => {
						state.isRightPanelCollapsed = !state.isRightPanelCollapsed;
						state.lastUpdate = Date.now();
					})
				);
			},

			setSearchQuery: (searchQuery) => {
				uiLogger.info('🔎 Actualizando búsqueda:', searchQuery);
				set(
					produce((state: UIState) => {
						state.searchQuery = searchQuery;
						state.lastUpdate = Date.now();
					})
				);
			},

			setTheme: (theme) => {
				uiLogger.info('🎨 Cambiando tema a:', theme);
				set(
					produce((state: UIState) => {
						state.theme = theme;
						state.lastUpdate = Date.now();
					})
				);
			},

			resetState: () => {
				uiLogger.info('🔄 Restaurando estado inicial de UI');
				set({ ...initialState, lastUpdate: Date.now() });
			},
		}),
		{
			name: 'ui-storage',
			partialize: (state) => ({
				view: state.view,
				thumbnailSize: state.thumbnailSize,
				isRightPanelCollapsed: state.isRightPanelCollapsed,
				theme: state.theme,
			}),
		}
	)
);

// Selectores memoizados
export const useViewSettings = () => {
	const { view, thumbnailSize, zoomLevel } = useUIStore();
	return { view, thumbnailSize, zoomLevel };
};

export const usePanelSettings = () => {
	const { isSettingsOpen, isRightPanelCollapsed } = useUIStore();
	return { isSettingsOpen, isRightPanelCollapsed };
};

export const useThemeSetting = () => {
	const { theme } = useUIStore();
	return theme;
};

// Tipos exportados para uso en componentes
export type { UIState };
