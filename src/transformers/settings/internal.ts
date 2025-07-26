/**
 * @file Implementaciones internas de transformers para Settings
 * @module transformers/settings/internal
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 * @deprecated Este archivo será reemplazado por la nueva estructura estándar
 */

import { serverLogger } from '../../lib/logger/server-logger';
import { deserializeJsonField, serializeJsonField } from '../../lib/utils/transformers/common';
import { settingsSchema } from '../../types/settings';

const logger = serverLogger.withContext('SettingsTransformer:internal');

// ===== SERIALIZADORES =====

export const serializers = {
	/**
	 * Transforma los datos de configuración desde almacenamiento a formato de aplicación
	 */
	fromStorageSettings<T>(settingsData: T): T {
		logger.debug('🔄 Transformando configuración desde almacenamiento a aplicación', { settingsData });

		if (!settingsData) {
			return settingsData;
		}

		// Deserializar campos JSON si existen
		const deserializedSettings = serializers.deserializeSettingsJson(settingsData);

		// Validar datos
		return serializers.validateSettings(deserializedSettings);
	},

	/**
	 * Transforma los datos de configuración desde formato de aplicación a almacenamiento
	 */
	toStorageSettings<T>(settingsData: T): T {
		logger.debug('🔄 Transformando configuración desde aplicación a almacenamiento', { settingsData });

		if (!settingsData) {
			return settingsData;
		}

		// Serializar campos JSON
		return serializers.serializeSettingsJson(settingsData);
	},

	/**
	 * Deserializa campos JSON en la configuración
	 */
	deserializeSettingsJson<T>(settingsData: T): T {
		if (!settingsData) {
			return settingsData;
		}

		try {
			const data = { ...(settingsData as object) } as Record<string, unknown>;

			// Deserializar campos específicos que son JSON almacenados como string
			if ('customization' in data && typeof data.customization === 'string') {
				data.customization = deserializeJsonField(data.customization as string, {});
			}

			return data as unknown as T;
		} catch (error) {
			logger.error('❌ Error deserializando JSON de configuración:', error);
			return settingsData;
		}
	},

	/**
	 * Serializa campos a JSON en la configuración
	 */
	serializeSettingsJson<T>(settingsData: T): T {
		if (!settingsData) {
			return settingsData;
		}

		try {
			const data = { ...(settingsData as object) } as Record<string, unknown>;

			// Serializar campos específicos que deben almacenarse como JSON string
			if ('customization' in data && typeof data.customization === 'object') {
				data.customization = serializeJsonField(data.customization, '{}');
			}

			return data as unknown as T;
		} catch (error) {
			logger.error('❌ Error serializando JSON de configuración:', error);
			return settingsData;
		}
	},

	/**
	 * Valida los datos de configuración
	 */
	validateSettings<T>(settingsData: T): T {
		if (!settingsData) {
			return settingsData;
		}

		try {
			// Intentar validar con el schema
			const result = settingsSchema.safeParse(settingsData);

			if (!result.success) {
				logger.warn('⚠️ Datos de configuración inválidos:', result.error);
				// Devolver los datos originales en caso de error para no perder información
				return settingsData;
			}

			return result.data as unknown as T;
		} catch (error) {
			logger.error('❌ Error validando configuración:', error);
			return settingsData;
		}
	},
};

// ===== MAPPERS =====

export const mappers = {
	/**
	 * Mapea los datos de configuración para actualizar en la base de datos
	 */
	mapSettingsUpdateToDatabase<T, U>(updateData: T): U {
		logger.debug('🔄 Mapeando actualización de configuración a formato de base de datos', { updateData });

		if (!updateData) {
			return {} as U;
		}

		// Crear una copia para no modificar el original
		const dbData = { ...(updateData as object) } as Record<string, unknown>;

		// Serializar campos JSON
		const serializedData = serializers.serializeSettingsJson(dbData);

		return serializedData as unknown as U;
	},
};
