/**
 * @file Mappers para Settings - Conversión entre formatos de datos
 * @module transformers/settings/mappers
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 */

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { settings } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import type { Settings } from '@/types/settings';

const logger = serverLogger.withContext('SettingsMappers');

// Tipos de la base de datos Drizzle
type DbSettings = InferSelectModel<typeof settings>;
type DbSettingsInsert = InferInsertModel<typeof settings>;

/**
 * Convierte datos de la base de datos a objeto Settings de la aplicación
 */
export function fromDbToSettings(dbSettings: DbSettings): Settings {
	logger.debug('🔄 Convirtiendo datos DB a Settings', { dbSettings });

	if (!dbSettings) {
		throw new Error('Datos de configuración de DB requeridos');
	}

	// Parsear el campo data que contiene la configuración en JSON
	let parsedData: any = {};
	try {
		parsedData = JSON.parse(dbSettings.data);
	} catch (error) {
		logger.warn('⚠️ Error parseando data de settings, usando valores por defecto', { error });
		parsedData = {};
	}

	return {
		appearance: {
			theme: (dbSettings.theme as 'light' | 'dark' | 'system') || 'system',
			fontSize: parsedData.fontSize || 16,
			language: (dbSettings.language as 'es' | 'en') || 'es',
			reducedAnimations: Boolean(parsedData.reducedAnimations),
			highContrast: Boolean(parsedData.highContrast),
		},
		notifications: {
			enabled: parsedData.notificationsEnabled !== false,
			email: Boolean(parsedData.emailNotifications),
			desktop: Boolean(parsedData.desktopNotifications),
			frequency: (parsedData.notificationFrequency as 'daily' | 'weekly' | 'monthly') || 'daily',
		},
		privacy: {
			shareUsageData: Boolean(parsedData.shareUsageData),
			storeCookies: Boolean(parsedData.storeCookies),
			storeHistory: Boolean(parsedData.storeHistory),
		},
		advanced: {
			apiKey: parsedData.apiKey || null,
			devMode: Boolean(parsedData.devMode),
			experimentalFeatures: Boolean(parsedData.experimentalFeatures),
		},
		version: parsedData.version || '1.0.0',
		lastUpdate: parsedData.lastUpdate ? new Date(parsedData.lastUpdate) : new Date(),
		system: {
			platform: parsedData.system?.platform || 'web',
			version: parsedData.system?.version || '1.0.0',
		},
	};
}

/**
 * Convierte objeto Settings de la aplicación a formato para insertar en DB
 */
export function fromSettingsToDbInsert(settings: Settings, profileId: string): Omit<DbSettingsInsert, 'id'> {
	logger.debug('🔄 Convirtiendo Settings a formato DB insert', { settings, profileId });

	if (!settings) {
		throw new Error('Objeto Settings requerido');
	}

	// Crear el objeto data con todas las configuraciones excepto theme y language
	const dataObj = {
		fontSize: settings.appearance.fontSize,
		reducedAnimations: settings.appearance.reducedAnimations,
		highContrast: settings.appearance.highContrast,

		notificationsEnabled: settings.notifications.enabled,
		emailNotifications: settings.notifications.email,
		desktopNotifications: settings.notifications.desktop,
		notificationFrequency: settings.notifications.frequency,

		shareUsageData: settings.privacy.shareUsageData,
		storeCookies: settings.privacy.storeCookies,
		storeHistory: settings.privacy.storeHistory,

		apiKey: settings.advanced.apiKey,
		devMode: settings.advanced.devMode,
		experimentalFeatures: settings.advanced.experimentalFeatures,

		version: settings.version,
		lastUpdate: settings.lastUpdate.toISOString(),
		system: settings.system,
	};

	return {
		theme: settings.appearance.theme,
		language: settings.appearance.language,
		data: JSON.stringify(dataObj),
		profileId,
	};
}

/**
 * Convierte datos parciales de Settings a formato para actualizar en DB
 */
export function fromSettingsUpdateToDb(updateData: Partial<Settings>): Partial<Omit<DbSettings, 'id' | 'profileId'>> {
	logger.debug('🔄 Convirtiendo actualización de Settings a formato DB', { updateData });

	if (!updateData) {
		return {};
	}

	const dbUpdate: Partial<Omit<DbSettings, 'id' | 'profileId'>> = {};

	// Actualizar theme y language directamente si existen
	if (updateData.appearance?.theme) {
		dbUpdate.theme = updateData.appearance.theme;
	}
	if (updateData.appearance?.language) {
		dbUpdate.language = updateData.appearance.language;
	}

	// Para el resto de campos, necesitamos reconstruir el objeto data
	// NOTA: En implementación real, se debería leer el data actual y fusionarlo
	const dataObj: any = {};
	let hasDataChanges = false;

	if (updateData.appearance) {
		if (updateData.appearance.fontSize !== undefined) {
			dataObj.fontSize = updateData.appearance.fontSize;
			hasDataChanges = true;
		}
		if (updateData.appearance.reducedAnimations !== undefined) {
			dataObj.reducedAnimations = updateData.appearance.reducedAnimations;
			hasDataChanges = true;
		}
		if (updateData.appearance.highContrast !== undefined) {
			dataObj.highContrast = updateData.appearance.highContrast;
			hasDataChanges = true;
		}
	}

	if (updateData.notifications) {
		if (updateData.notifications.enabled !== undefined) {
			dataObj.notificationsEnabled = updateData.notifications.enabled;
			hasDataChanges = true;
		}
		if (updateData.notifications.email !== undefined) {
			dataObj.emailNotifications = updateData.notifications.email;
			hasDataChanges = true;
		}
		if (updateData.notifications.desktop !== undefined) {
			dataObj.desktopNotifications = updateData.notifications.desktop;
			hasDataChanges = true;
		}
		if (updateData.notifications.frequency !== undefined) {
			dataObj.notificationFrequency = updateData.notifications.frequency;
			hasDataChanges = true;
		}
	}

	if (updateData.privacy) {
		if (updateData.privacy.shareUsageData !== undefined) {
			dataObj.shareUsageData = updateData.privacy.shareUsageData;
			hasDataChanges = true;
		}
		if (updateData.privacy.storeCookies !== undefined) {
			dataObj.storeCookies = updateData.privacy.storeCookies;
			hasDataChanges = true;
		}
		if (updateData.privacy.storeHistory !== undefined) {
			dataObj.storeHistory = updateData.privacy.storeHistory;
			hasDataChanges = true;
		}
	}

	if (updateData.advanced) {
		if (updateData.advanced.apiKey !== undefined) {
			dataObj.apiKey = updateData.advanced.apiKey;
			hasDataChanges = true;
		}
		if (updateData.advanced.devMode !== undefined) {
			dataObj.devMode = updateData.advanced.devMode;
			hasDataChanges = true;
		}
		if (updateData.advanced.experimentalFeatures !== undefined) {
			dataObj.experimentalFeatures = updateData.advanced.experimentalFeatures;
			hasDataChanges = true;
		}
	}

	// Manejar campos adicionales
	if (updateData.version !== undefined) {
		dataObj.version = updateData.version;
		hasDataChanges = true;
	}
	if (updateData.lastUpdate !== undefined) {
		dataObj.lastUpdate = updateData.lastUpdate.toISOString();
		hasDataChanges = true;
	}
	if (updateData.system !== undefined) {
		dataObj.system = updateData.system;
		hasDataChanges = true;
	}

	if (hasDataChanges) {
		dbUpdate.data = JSON.stringify(dataObj);
	}

	return dbUpdate;
}
