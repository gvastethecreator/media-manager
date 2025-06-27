/**
 * @file Implementaciones internas de transformers para Settings
 * @module transformers/settings/internal
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { settingsSchema } from '@/types/settings';
import { deserializeJsonField, serializeJsonField } from '@/lib/utils/transformers/common';

const logger = serverLogger.withContext('SettingsTransformer:internal');

// ===== SERIALIZADORES =====

export const serializers = {
	/**
	 * Transforma los datos de configuración de Prisma a su formato para la interfaz de usuario
	 */
	fromPrismaSettings<T>(settingsData: T): T {
		logger.debug('🔄 Transformando configuración de Prisma a UI', { settingsData });

		if (!settingsData) {
			return settingsData;
		}

		// Deserializar campos JSON si existen
		const deserializedSettings = serializers.deserializeSettingsJson(settingsData);

		// Validar datos
		return serializers.validateSettings(deserializedSettings);
	},

	/**
	 * Transforma los datos de configuración de la interfaz de usuario a su formato para Prisma
	 */
	toPrismaSettings<T>(settingsData: T): T {
		logger.debug('🔄 Transformando configuración de UI a Prisma', { settingsData });

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
	 * Mapea los datos de configuración para actualizar en Prisma
	 */
	mapSettingsUpdateToPrisma<T, U>(updateData: T): U {
		logger.debug('🔄 Mapeando actualización de configuración a formato Prisma', { updateData });

		if (!updateData) {
			return {} as U;
		}

		// Crear una copia para no modificar el original
		const prismaData = { ...(updateData as object) } as Record<string, unknown>;

		// Serializar campos JSON
		const serializedData = serializers.serializeSettingsJson(prismaData);

		return serializedData as unknown as U;
	},
};
