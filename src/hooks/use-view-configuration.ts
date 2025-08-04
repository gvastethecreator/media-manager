/**
 * View Configuration Hook
 *
 * This hook provides a unified interface for managing view configurations
 * across all file browser views. It integrates with the existing settings
 * store for persistence and provides methods for customization.
 */

import { useCallback, useMemo } from 'react';
import { useSettingsStore } from '@/store/settings.store';
import { CardsViewConfig } from '@/types/file-browser/cards-view-config';
import { GridViewConfig } from '@/types/file-browser/grid-view-config';
import { MasonryViewConfig } from '@/types/file-browser/masonry-view-config';
import {
	CommonViewSettings,
	cloneViewConfiguration,
	createDefaultViewConfiguration,
	DEFAULT_COMMON_SETTINGS,
	ListViewSettings,
	mergeViewConfigurations,
	ViewConfiguration,
	ViewPreset,
	ViewSpecificSettings,
	ViewType,
	validateViewConfiguration,
} from '@/types/file-browser/view-configuration';

// Hook interface
export interface UseViewConfigurationReturn {
	// Current configuration
	currentConfiguration: ViewConfiguration;
	currentConfig: ViewConfiguration;

	// Configuration management
	updateConfiguration: (updates: Partial<ViewConfiguration>) => void;
	updateCommonSettings: (settings: Partial<CommonViewSettings>) => void;
	updateSpecificSettings: (settings: Partial<ViewSpecificSettings['config']>) => void;
	updateViewConfig: (updates: Partial<ViewConfiguration>) => void;
	updateGlobalConfig: (updates: any) => void;
	updateEntityConfig: (updates: any) => void;
	resetToDefault: () => void;
	resetConfiguration: () => Promise<boolean>;

	// Preset management
	availablePresets: ViewPreset[];
	applyPreset: (presetId: string) => Promise<boolean>;
	saveAsPreset: (name: string, description?: string) => void;
	deletePreset: (presetId: string) => void;
	getAvailablePresets: () => ViewPreset[];

	// Configuration utilities
	exportConfiguration: (options?: any) => { data: string; timestamp: Date };
	importConfiguration: (configJson: string, options?: any) => Promise<{ success: boolean; errors: string[] }>;
	isDefault: boolean;
	hasUnsavedChanges: boolean;

	// View-specific helpers
	getViewSpecificConfig: <T = any>() => T;
	isConfigurationValid: boolean;
}

// Default presets for each view type
const DEFAULT_PRESETS: Record<ViewType, ViewPreset[]> = {
	list: [
		{
			id: 'list-default',
			name: 'Default List',
			description: 'Standard list view with all columns',
			category: 'default',
			configuration: createDefaultViewConfiguration('list'),
		},
		{
			id: 'list-compact',
			name: 'Compact List',
			description: 'Compact list view with minimal columns',
			category: 'compact',
			configuration: {
				...createDefaultViewConfiguration('list'),
				common: {
					...DEFAULT_COMMON_SETTINGS,
					showMetadata: false,
					showTags: false,
					showStats: false,
				},
				specific: {
					type: 'list',
					config: {
						...createDefaultViewConfiguration('list').specific.config,
						rowHeight: 32,
						compactMode: true,
						showZebraStripes: false,
					} as ListViewSettings,
				},
			},
		},
		{
			id: 'list-detailed',
			name: 'Detailed List',
			description: 'Detailed list view with all metadata',
			category: 'detailed',
			configuration: {
				...createDefaultViewConfiguration('list'),
				common: {
					...DEFAULT_COMMON_SETTINGS,
					showMetadata: true,
					showTags: true,
					showStats: true,
				},
				specific: {
					type: 'list',
					config: {
						...createDefaultViewConfiguration('list').specific.config,
						rowHeight: 56,
						compactMode: false,
					} as ListViewSettings,
				},
			},
		},
	],
	grid: [
		{
			id: 'grid-default',
			name: 'Default Grid',
			description: 'Standard grid view',
			category: 'default',
			configuration: createDefaultViewConfiguration('grid'),
		},
	],
	cards: [
		{
			id: 'cards-default',
			name: 'Default Cards',
			description: 'Standard cards view',
			category: 'default',
			configuration: createDefaultViewConfiguration('cards'),
		},
	],
	masonry: [
		{
			id: 'masonry-default',
			name: 'Default Masonry',
			description: 'Standard masonry view',
			category: 'default',
			configuration: createDefaultViewConfiguration('masonry'),
		},
	],
};

/**
 * Hook for managing view configurations
 */
export function useViewConfiguration(viewType: ViewType): UseViewConfigurationReturn {
	const { settings, updateSettings } = useSettingsStore();

	// Get current configuration from settings or create default
	const currentConfiguration = useMemo(() => {
		const savedConfig = settings?.fileBrowser?.viewConfigurations?.[viewType];

		if (savedConfig) {
			try {
				return validateViewConfiguration(savedConfig);
			} catch (error) {
				console.warn(`Invalid view configuration for ${viewType}, using default:`, error);
			}
		}

		return createDefaultViewConfiguration(viewType);
	}, [settings?.fileBrowser?.viewConfigurations, viewType]);

	// Check if configuration is valid
	const isConfigurationValid = useMemo(() => {
		try {
			validateViewConfiguration(currentConfiguration);
			return true;
		} catch {
			return false;
		}
	}, [currentConfiguration]);

	// Check if current configuration is default
	const isDefault = useMemo(() => {
		const defaultConfig = createDefaultViewConfiguration(viewType);
		return JSON.stringify(currentConfiguration) === JSON.stringify(defaultConfig);
	}, [currentConfiguration, viewType]);

	// Check for unsaved changes (simplified - could be more sophisticated)
	const hasUnsavedChanges = useMemo(() => {
		return currentConfiguration.metadata.lastModified > currentConfiguration.metadata.createdAt + 1000;
	}, [currentConfiguration]);

	// Update configuration
	const updateConfiguration = useCallback(
		(updates: Partial<ViewConfiguration>) => {
			const newConfig = mergeViewConfigurations(currentConfiguration, updates);

			updateSettings({
				fileBrowser: {
					...settings?.fileBrowser,
					viewConfigurations: {
						...settings?.fileBrowser?.viewConfigurations,
						[viewType]: newConfig,
					},
				},
			});
		},
		[currentConfiguration, settings?.fileBrowser, updateSettings, viewType]
	);

	// Update common settings
	const updateCommonSettings = useCallback(
		(commonUpdates: Partial<CommonViewSettings>) => {
			updateConfiguration({
				common: {
					...currentConfiguration.common,
					...commonUpdates,
				},
			});
		},
		[currentConfiguration.common, updateConfiguration]
	);

	// Update view-specific settings
	const updateSpecificSettings = useCallback(
		(specificUpdates: Partial<ViewSpecificSettings['config']>) => {
			updateConfiguration({
				specific: {
					...currentConfiguration.specific,
					config: {
						...currentConfiguration.specific.config,
						...specificUpdates,
					} as any, // Type assertion needed due to union type complexity
				},
			});
		},
		[currentConfiguration.specific, updateConfiguration]
	);

	// Reset to default configuration
	const resetToDefault = useCallback(() => {
		const defaultConfig = createDefaultViewConfiguration(viewType);
		updateConfiguration(defaultConfig);
	}, [updateConfiguration, viewType]);

	// Get available presets
	const availablePresets = useMemo(() => {
		const defaultPresets = DEFAULT_PRESETS[viewType] || [];
		const customPresets = settings?.fileBrowser?.customPresets?.[viewType] || [];
		return [...defaultPresets, ...customPresets] as ViewPreset[];
	}, [settings?.fileBrowser?.customPresets, viewType]);

	// Apply preset
	const applyPreset = useCallback(
		(presetId: string) => {
			const preset = availablePresets.find((p) => p.id === presetId);
			if (preset) {
				updateConfiguration(preset.configuration);
			}
		},
		[availablePresets, updateConfiguration]
	);

	// Save current configuration as preset
	const saveAsPreset = useCallback(
		(name: string, description?: string) => {
			const presetId = `custom-${viewType}-${Date.now()}`;
			const preset: ViewPreset = {
				id: presetId,
				name,
				description: description || '',
				category: 'custom',
				configuration: cloneViewConfiguration(currentConfiguration),
			};

			const customPresets = settings?.fileBrowser?.customPresets || {};
			const viewPresets = customPresets[viewType] || [];

			updateSettings({
				fileBrowser: {
					...settings?.fileBrowser,
					customPresets: {
						...customPresets,
						[viewType]: [...viewPresets, preset],
					},
				},
			});
		},
		[currentConfiguration, settings?.fileBrowser, updateSettings, viewType]
	);

	// Delete custom preset
	const deletePreset = useCallback(
		(presetId: string) => {
			const customPresets = settings?.fileBrowser?.customPresets || {};
			const viewPresets = customPresets[viewType] || [];
			const filteredPresets = viewPresets.filter((p) => p.id !== presetId);

			updateSettings({
				fileBrowser: {
					...settings?.fileBrowser,
					customPresets: {
						...customPresets,
						[viewType]: filteredPresets,
					},
				},
			});
		},
		[settings?.fileBrowser, updateSettings, viewType]
	);

	// Export configuration as JSON
	const exportConfiguration = useCallback(() => {
		return JSON.stringify(currentConfiguration, null, 2);
	}, [currentConfiguration]);

	// Import configuration from JSON
	const importConfiguration = useCallback(
		(configJson: string) => {
			try {
				const config = JSON.parse(configJson);
				const validatedConfig = validateViewConfiguration(config);

				if (validatedConfig.type !== viewType) {
					console.error(`Configuration type mismatch: expected ${viewType}, got ${validatedConfig.type}`);
					return false;
				}

				updateConfiguration(validatedConfig);
				return true;
			} catch (error) {
				console.error('Failed to import configuration:', error);
				return false;
			}
		},
		[updateConfiguration, viewType]
	);

	// Get view-specific configuration with proper typing
	const getViewSpecificConfig = useCallback(<T = any>(): T => {
		return currentConfiguration.specific.config as T;
	}, [currentConfiguration.specific.config]);

	// Additional methods to match interface
	const updateViewConfig = useCallback(
		(updates: Partial<ViewConfiguration>) => {
			updateConfiguration(updates);
		},
		[updateConfiguration]
	);

	const updateGlobalConfig = useCallback(
		(updates: any) => {
			updateConfiguration({
				common: {
					...currentConfiguration.common,
					...updates,
				},
			});
		},
		[currentConfiguration.common, updateConfiguration]
	);

	const updateEntityConfig = useCallback(
		(updates: any) => {
			updateConfiguration({
				...currentConfiguration,
				...updates,
			});
		},
		[currentConfiguration, updateConfiguration]
	);

	const resetConfiguration = useCallback(async (): Promise<boolean> => {
		try {
			resetToDefault();
			return true;
		} catch {
			return false;
		}
	}, [resetToDefault]);

	const applyPresetAsync = useCallback(
		async (presetId: string): Promise<boolean> => {
			try {
				const preset = availablePresets.find((p) => p.id === presetId);
				if (preset) {
					updateConfiguration(preset.configuration);
					return true;
				}
				return false;
			} catch {
				return false;
			}
		},
		[availablePresets, updateConfiguration]
	);

	const getAvailablePresets = useCallback((): ViewPreset[] => {
		return availablePresets as ViewPreset[];
	}, [availablePresets]);

	const exportConfigurationWithOptions = useCallback(
		(options?: any) => {
			const data = exportConfiguration();
			return {
				data,
				timestamp: new Date(),
			};
		},
		[exportConfiguration]
	);

	const importConfigurationAsync = useCallback(
		async (configJson: string, options?: any): Promise<{ success: boolean; errors: string[] }> => {
			try {
				const success = importConfiguration(configJson);
				return {
					success,
					errors: success ? [] : ['Invalid configuration format'],
				};
			} catch (error) {
				return {
					success: false,
					errors: [error instanceof Error ? error.message : 'Unknown error'],
				};
			}
		},
		[importConfiguration]
	);

	return {
		currentConfiguration,
		currentConfig: currentConfiguration,
		updateConfiguration,
		updateCommonSettings,
		updateSpecificSettings,
		updateViewConfig,
		updateGlobalConfig,
		updateEntityConfig,
		resetToDefault,
		resetConfiguration,
		availablePresets,
		applyPreset: applyPresetAsync,
		saveAsPreset,
		deletePreset,
		getAvailablePresets,
		exportConfiguration: exportConfigurationWithOptions,
		importConfiguration: importConfigurationAsync,
		isDefault,
		hasUnsavedChanges,
		getViewSpecificConfig,
		isConfigurationValid,
	};
}

// Convenience hooks for specific view types
export function useListViewConfiguration() {
	return useViewConfiguration('list');
}

export function useGridViewConfiguration() {
	return useViewConfiguration('grid');
}

export function useCardsViewConfiguration() {
	return useViewConfiguration('cards');
}

export function useMasonryViewConfiguration() {
	return useViewConfiguration('masonry');
}

// Export types are already defined above
