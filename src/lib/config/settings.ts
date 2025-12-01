import merge from 'lodash/merge';

import { clientLogger } from '@/lib/logger/client-logger';
import type { Settings } from '@/types/settings';

// Clave para almacenar configuraciones en localStorage
const SETTINGS_KEY = 'app-settings';

const DEFAULT_SETTINGS: Settings = {
	appearance: {
		theme: 'system',
		fontSize: 16,
		language: 'es',
		reducedAnimations: false,
		highContrast: false,
	},
	notifications: {
		enabled: true,
		email: false,
		desktop: true,
		frequency: 'daily',
	},
	privacy: {
		shareUsageData: true,
		storeCookies: true,
		storeHistory: true,
	},
	advanced: {
		apiKey: null,
		devMode: false,
		experimentalFeatures: false,
	},
	fileBrowser: {
		defaultViewType: 'grid',
		rememberViewPerFolder: false,
		// legacy slots left undefined intentionally: listView, gridView, cardsView, masonryView, global
		// unified system placeholders
		viewConfigurations: undefined,
		customPresets: undefined,
		folderViewPreferences: undefined,
		accessibility: undefined,
		performance: undefined,
	},
	version: '1.0.0',
	lastUpdate: new Date(),
	system: {
		platform: 'web',
		version: '1.0.0',
	},
};

export function loadSettings(): Settings {
	try {
		const savedSettings = localStorage.getItem(SETTINGS_KEY);
		if (!savedSettings) {
			return DEFAULT_SETTINGS;
		}

		const parsedSettings = JSON.parse(savedSettings);
		return merge(DEFAULT_SETTINGS, parsedSettings);
	} catch (error) {
		clientLogger.error('Error loading settings:', error);
		return DEFAULT_SETTINGS;
	}
}

export function saveSettings(settings: Settings): void {
	try {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
	} catch (error) {
		clientLogger.error('Error saving settings:', error);
	}
}

export function resetSettings(): Settings {
	localStorage.removeItem(SETTINGS_KEY);
	return DEFAULT_SETTINGS;
}

export function updateSettings(settings: Partial<Settings>): Settings {
	const currentSettings = loadSettings();
	const newSettings = merge(currentSettings, settings);
	saveSettings(newSettings);
	return newSettings;
}

export function getSetting<K extends keyof Settings>(key: K): Settings[K] {
	const settings = loadSettings();
	return settings[key];
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
	const settings = loadSettings();
	settings[key] = value;
	saveSettings(settings);
}

// Función para exportar la configuración
export function exportSettings(): string {
	const settings = loadSettings();
	return JSON.stringify(settings, null, 2);
}

// Función para importar la configuración
export function importSettings(jsonString: string): Settings {
	try {
		const importedSettings = JSON.parse(jsonString);
		const mergedSettings = merge(DEFAULT_SETTINGS, importedSettings);
		saveSettings(mergedSettings);
		return mergedSettings;
	} catch (error) {
		clientLogger.error('Error importing settings:', error);
		return DEFAULT_SETTINGS;
	}
}

// Función para migrar la configuración a una nueva versión
export function migrateSettings(settings: Settings): Settings {
	// Aquí puedes agregar lógica para migrar configuraciones antiguas
	// Por ejemplo, si cambias la estructura de la configuración en una nueva versión
	return settings;
}

// Función para validar la configuración
export function validateSettings(settings: unknown): settings is Settings {
	if (!settings || typeof settings !== 'object') {
		return false;
	}

	// Aquí puedes agregar más validaciones según tus necesidades
	const requiredKeys: (keyof Settings)[] = ['version', 'lastUpdate', 'system'];

	return requiredKeys.every((key) => key in settings);
}
