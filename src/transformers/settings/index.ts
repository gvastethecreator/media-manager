/**
 * @file Transformadores para datos de configuración
 * @module transformers/settings
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 */

// ===== EXPORTACIONES PRINCIPALES =====

// Mappers para conversión de datos
export * from './mappers';

// Serializers para procesamiento de datos
export * from './serializers';

// Validators para validación con Zod
export * from './validators';

// Schemas para definición de tipos
export * from './schema';

// Transformer principal
export * from './transformer';

// ===== FUNCIONES DE COMPATIBILIDAD LEGACY =====

import { serverLogger } from '@/lib/logger/server-logger';
import { handleTransformerError } from '@/lib/utils/transformers/errors';
import type { Settings } from '@/types/settings';
import { serializers } from './internal';
import { normalize, forClient } from './transformer';

const _logger = serverLogger.withContext('SettingsTransformer:legacy');

/**
 * @deprecated Usar normalize() desde transformer.ts
 * Transforma los datos raw de configuración a una estructura tipada
 */
export function deserializeSettings(rawData: Record<string, unknown>): Settings {
	_logger.warn('⚠️ Usando función legacy deserializeSettings, migrar a normalize()');
	return normalize(rawData as Partial<Settings>);
}

/**
 * @deprecated Usar forClient() desde transformer.ts  
 * Transforma la estructura tipada de configuración a un formato raw
 */
export function serializeSettings(settings: Settings): Record<string, unknown> {
	_logger.warn('⚠️ Usando función legacy serializeSettings, migrar a forClient()');
	
	const processed = forClient(settings);
	return {
		theme: processed.appearance.theme,
		fontSize: processed.appearance.fontSize,
		language: processed.appearance.language,
		reducedAnimations: processed.appearance.reducedAnimations,
		highContrast: processed.appearance.highContrast,

		notificationsEnabled: processed.notifications.enabled,
		emailNotifications: processed.notifications.email,
		desktopNotifications: processed.notifications.desktop,
		notificationFrequency: processed.notifications.frequency,

		shareUsageData: processed.privacy.shareUsageData,
		storeCookies: processed.privacy.storeCookies,
		storeHistory: processed.privacy.storeHistory,

		apiKey: processed.advanced.apiKey,
		devMode: processed.advanced.devMode,
		experimentalFeatures: processed.advanced.experimentalFeatures,
	};
}

/**
 * @deprecated Usar merge() desde transformer.ts
 * Fusiona dos objetos de configuración, priorizando los valores del segundo
 */
export function mergeSettings(base: Settings, override: Partial<Settings>): Settings {
	_logger.warn('⚠️ Usando función legacy mergeSettings, migrar a merge()');
	
	return {
		appearance: {
			...base.appearance,
			...override.appearance,
		},
		notifications: {
			...base.notifications,
			...override.notifications,
		},
		privacy: {
			...base.privacy,
			...override.privacy,
		},
		advanced: {
			...base.advanced,
			...override.advanced,
		},
	};
}

/**
 * @deprecated Implementar lógica específica de comparación
 * Verifica si hay diferencias entre dos objetos de configuración
 */
export function hasSettingsChanged(oldSettings: Settings, newSettings: Settings): boolean {
	_logger.warn('⚠️ Usando función legacy hasSettingsChanged, considerar reimplementar');
	
	// Comparar appearance
	if (
		oldSettings.appearance.theme !== newSettings.appearance.theme ||
		oldSettings.appearance.fontSize !== newSettings.appearance.fontSize ||
		oldSettings.appearance.language !== newSettings.appearance.language ||
		oldSettings.appearance.reducedAnimations !== newSettings.appearance.reducedAnimations ||
		oldSettings.appearance.highContrast !== newSettings.appearance.highContrast
	) {
		return true;
	}

	// Comparar notifications
	if (
		oldSettings.notifications.enabled !== newSettings.notifications.enabled ||
		oldSettings.notifications.email !== newSettings.notifications.email ||
		oldSettings.notifications.desktop !== newSettings.notifications.desktop ||
		oldSettings.notifications.frequency !== newSettings.notifications.frequency
	) {
		return true;
	}

	// Comparar privacy
	if (
		oldSettings.privacy.shareUsageData !== newSettings.privacy.shareUsageData ||
		oldSettings.privacy.storeCookies !== newSettings.privacy.storeCookies ||
		oldSettings.privacy.storeHistory !== newSettings.privacy.storeHistory
	) {
		return true;
	}

	// Comparar advanced
	if (
		oldSettings.advanced.apiKey !== newSettings.advanced.apiKey ||
		oldSettings.advanced.devMode !== newSettings.advanced.devMode ||
		oldSettings.advanced.experimentalFeatures !== newSettings.advanced.experimentalFeatures
	) {
		return true;
	}

	return false;
}

/**
 * @deprecated Usar deserializeSettingsJson() desde serializers.ts
 * Deserializa campos JSON en la configuración
 */
export function deserializeSettingsJson<T>(settingsData: T): T {
	_logger.warn('⚠️ Usando función legacy deserializeSettingsJson, migrar a serializers');
	try {
		return serializers.deserializeSettingsJson(settingsData);
	} catch (error) {
		throw handleTransformerError(error as Error);
	}
}

/**
 * @deprecated Usar serializeSettingsJson() desde serializers.ts
 * Serializa campos a JSON en la configuración
 */
export function serializeSettingsJson<T>(settingsData: T): T {
	_logger.warn('⚠️ Usando función legacy serializeSettingsJson, migrar a serializers');
	try {
		return serializers.serializeSettingsJson(settingsData);
	} catch (error) {
		throw handleTransformerError(error as Error);
	}
}

/**
 * @deprecated Usar validateSettings() desde validators.ts
 * Valida los datos de configuración
 */
export function validateSettings<T>(settingsData: T): T {
	_logger.warn('⚠️ Usando función legacy validateSettings, migrar a validators');
	try {
		return serializers.validateSettings(settingsData);
	} catch (error) {
		throw handleTransformerError(error as Error);
	}
}

/**
 * @deprecated Usar funciones específicas desde transformer.ts, serializers.ts y validators.ts
 * Compatibilidad para código existente
 */
export const SettingsTransformer = {
	deserializeJson: deserializeSettingsJson,
	serializeJson: serializeSettingsJson,
	validate: validateSettings,
};
