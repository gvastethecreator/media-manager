/**
 * @file Serializers para Settings - Transformación de datos para almacenamiento
 * @module transformers/settings/serializers
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { deserializeJsonField, serializeJsonField } from '@/lib/utils/transformers/common';
import type { Settings } from '@/types/settings';

const logger = serverLogger.withContext('SettingsSerializers');

/**
 * Transforma los datos de configuración desde su formato de almacenamiento a formato de aplicación
 */
export function fromStorageSettings<T>(settingsData: T): T {
	logger.debug('🔄 Transformando configuración desde almacenamiento a aplicación', { settingsData });

	if (!settingsData) {
		return settingsData;
	}

	// Deserializar campos JSON si existen
	const deserializedSettings = deserializeSettingsJson(settingsData);

	return deserializedSettings;
}

/**
 * Transforma los datos de configuración desde formato de aplicación a formato de almacenamiento
 */
export function toStorageSettings<T>(settingsData: T): T {
	logger.debug('🔄 Transformando configuración desde aplicación a almacenamiento', { settingsData });

	if (!settingsData) {
		return settingsData;
	}

	// Serializar campos JSON
	return serializeSettingsJson(settingsData);
}

/**
 * Deserializa campos JSON en la configuración
 */
export function deserializeSettingsJson<T>(settingsData: T): T {
	if (!settingsData) {
		return settingsData;
	}

	try {
		const data = { ...(settingsData as object) } as Record<string, unknown>;

		// Deserializar campos específicos que son JSON almacenados como string
		if ('customization' in data && typeof data.customization === 'string') {
			data.customization = deserializeJsonField(data.customization as string, {});
		}

		// Deserializar configuraciones avanzadas almacenadas como JSON
		if ('advanced' in data && typeof data.advanced === 'string') {
			data.advanced = deserializeJsonField(data.advanced as string, {});
		}

		return data as unknown as T;
	} catch (error) {
		logger.error('❌ Error deserializando JSON de configuración:', error);
		return settingsData;
	}
}

/**
 * Serializa campos a JSON en la configuración
 */
export function serializeSettingsJson<T>(settingsData: T): T {
	if (!settingsData) {
		return settingsData;
	}

	try {
		const data = { ...(settingsData as object) } as Record<string, unknown>;

		// Serializar campos específicos que deben almacenarse como JSON string
		if ('customization' in data && typeof data.customization === 'object') {
			data.customization = serializeJsonField(data.customization, '{}');
		}

		// Serializar configuraciones avanzadas como JSON
		if ('advanced' in data && typeof data.advanced === 'object') {
			data.advanced = serializeJsonField(data.advanced, '{}');
		}

		return data as unknown as T;
	} catch (error) {
		logger.error('❌ Error serializando JSON de configuración:', error);
		return settingsData;
	}
}

/**
 * Combina dos objetos de configuración, aplicando los valores del segundo sobre el primero
 */
export function mergeSettingsData(base: Partial<Settings>, override: Partial<Settings>): Settings {
	logger.debug('🔄 Combinando datos de configuración', { base, override });

	const merged: Settings = {
		appearance: {
			theme: override.appearance?.theme ?? base.appearance?.theme ?? 'system',
			fontSize: override.appearance?.fontSize ?? base.appearance?.fontSize ?? 16,
			language: override.appearance?.language ?? base.appearance?.language ?? 'es',
			reducedAnimations: override.appearance?.reducedAnimations ?? base.appearance?.reducedAnimations ?? false,
			highContrast: override.appearance?.highContrast ?? base.appearance?.highContrast ?? false,
		},
		notifications: {
			enabled: override.notifications?.enabled ?? base.notifications?.enabled ?? true,
			email: override.notifications?.email ?? base.notifications?.email ?? false,
			desktop: override.notifications?.desktop ?? base.notifications?.desktop ?? false,
			frequency: override.notifications?.frequency ?? base.notifications?.frequency ?? 'daily',
		},
		privacy: {
			shareUsageData: override.privacy?.shareUsageData ?? base.privacy?.shareUsageData ?? false,
			storeCookies: override.privacy?.storeCookies ?? base.privacy?.storeCookies ?? true,
			storeHistory: override.privacy?.storeHistory ?? base.privacy?.storeHistory ?? true,
		},
		advanced: {
			apiKey: override.advanced?.apiKey ?? base.advanced?.apiKey ?? null,
			devMode: override.advanced?.devMode ?? base.advanced?.devMode ?? false,
			experimentalFeatures: override.advanced?.experimentalFeatures ?? base.advanced?.experimentalFeatures ?? false,
		},
		version: override.version ?? base.version ?? '1.0.0',
		lastUpdate: override.lastUpdate ?? base.lastUpdate ?? new Date(),
		system: {
			platform: override.system?.platform ?? base.system?.platform ?? 'web',
			version: override.system?.version ?? base.system?.version ?? '1.0.0',
		},
	};

	logger.debug('✅ Configuración combinada exitosamente', { merged });
	return merged;
}

/**
 * Normaliza la configuración aplicando valores por defecto para campos faltantes
 */
export function normalizeSettings(settings: Partial<Settings>): Settings {
	logger.debug('🔄 Normalizando configuración', { settings });

	return mergeSettingsData({}, settings);
}

/**
 * Prepara los datos de configuración para ser enviados al cliente
 */
export function sanitizeSettingsForClient(settings: Settings): Settings {
	logger.debug('🔄 Sanitizando configuración para cliente', { settings });

	// Crear una copia para no modificar el original
	const sanitized = { ...settings };

	// Remover información sensible como API keys
	if (sanitized.advanced.apiKey) {
		sanitized.advanced = {
			...sanitized.advanced,
			apiKey: sanitized.advanced.apiKey ? '***masked***' : null,
		};
	}

	return sanitized;
}
