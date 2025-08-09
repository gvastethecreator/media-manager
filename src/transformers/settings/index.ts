/**
 * @file Transformadores para datos de configuración
 * @module transformers/settings
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 */

// ===== EXPORTACIONES PRINCIPALES =====

// Mappers para conversión de datos
export * from './mappers';
// Schemas para definición de tipos
export * from './schema';
// Serializers para procesamiento de datos
export * from './serializers';
// Transformer principal
export * from './transformer';
// Validators para validación con Zod
export * from './validators';

// ===== FUNCIONES DE COMPATIBILIDAD LEGACY =====

import { TransformerError } from '@/lib/errors/transformer-error';
import { serverLogger } from '@/lib/logger/server-logger';
import type { Settings } from '@/types/settings';
import { deserializeSettingsJson, serializeSettingsJson } from './serializers';
import { forClient, normalize } from './transformer';
import { validateSettings as validateSettingsInternal } from './validators';

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

		version: processed.version,
		lastUpdate: processed.lastUpdate,
		system: processed.system,
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
		// Asegurar bloque requerido por schema
		fileBrowser: {
			...(base as any).fileBrowser,
			...(override as any).fileBrowser,
		},
		version: override.version ?? base.version,
		lastUpdate: override.lastUpdate ?? base.lastUpdate,
		system: {
			...base.system,
			...override.system,
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
export function deserializeSettingsJsonLegacy<T>(settingsData: T): T {
	_logger.warn('⚠️ Usando función legacy deserializeSettingsJson, migrar a serializers');
	try {
		return deserializeSettingsJson(settingsData);
	} catch (error) {
		throw TransformerError.wrap(error as Error, {
			operation: 'deserializeSettingsJsonLegacy',
			message: 'Error deserializando configuración JSON',
		});
	}
}

/**
 * @deprecated Usar serializeSettingsJson() desde serializers.ts
 * Serializa campos a JSON en la configuración
 */
export function serializeSettingsJsonLegacy<T>(settingsData: T): T {
	_logger.warn('⚠️ Usando función legacy serializeSettingsJson, migrar a serializers');
	try {
		return serializeSettingsJson(settingsData);
	} catch (error) {
		throw TransformerError.wrap(error as Error, {
			operation: 'serializeSettingsJsonLegacy',
			message: 'Error serializando configuración JSON',
		});
	}
}

/**
 * @deprecated Usar validateSettings() desde validators.ts
 * Valida los datos de configuración
 */
export function validateSettingsLegacy<T>(settingsData: T): T {
	_logger.warn('⚠️ Usando función legacy validateSettings, migrar a validators');
	try {
		return validateSettingsInternal(settingsData as any) as T;
	} catch (error) {
		throw TransformerError.wrap(error as Error, {
			operation: 'validateSettingsLegacy',
			message: 'Error validando configuración',
		});
	}
}

/**
 * @deprecated Usar funciones específicas desde transformer.ts, serializers.ts y validators.ts
 * Compatibilidad para código existente
 */
export const SettingsTransformer = {
	deserializeJson: deserializeSettingsJsonLegacy,
	serializeJson: serializeSettingsJsonLegacy,
	validate: validateSettingsLegacy,
};
