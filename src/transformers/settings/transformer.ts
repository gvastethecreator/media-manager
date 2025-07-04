/**
 * @file Transformer principal para Settings
 * @module transformers/settings/transformer
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { handleTransformerError } from '@/lib/utils/transformers/errors';
import type { Settings } from '@/types/settings';
import { fromDbToSettings, fromSettingsToDbInsert, fromSettingsUpdateToDb } from './mappers';
import { fromStorageSettings, toStorageSettings, normalizeSettings, sanitizeSettingsForClient } from './serializers';
import { validateSettings, validateSettingsUpdate, safeValidateSettings } from './validators';

const logger = serverLogger.withContext('SettingsTransformer');

/**
 * Transformador principal para configuración del sistema
 */
export class SettingsTransformer {
	/**
	 * Transforma datos de la base de datos a objeto Settings de la aplicación
	 */
	static fromDatabase(dbData: any): Settings {
		try {
			logger.debug('🔄 Transformando Settings desde DB', { dbData });
			
			if (!dbData) {
				throw new Error('Datos de DB requeridos para transformar Settings');
			}

			// Convertir desde formato de base de datos
			const settings = fromDbToSettings(dbData);
			
			// Aplicar transformaciones de deserialización
			const processed = fromStorageSettings(settings);
			
			// Validar resultado
			const validated = validateSettings(processed);
			
			logger.debug('✅ Settings transformados desde DB exitosamente', { validated });
			return validated;
		} catch (error) {
			logger.error('❌ Error transformando Settings desde DB:', error);
			throw handleTransformerError(error as Error);
		}
	}

	/**
	 * Prepara objeto Settings para insertar en la base de datos
	 */
	static toDatabase(settings: Settings, profileId: string): any {
		try {
			logger.debug('🔄 Transformando Settings para DB insert', { settings, profileId });
			
			if (!settings) {
				throw new Error('Objeto Settings requerido');
			}

			// Validar entrada
			const validated = validateSettings(settings);
			
			// Aplicar transformaciones de serialización
			const serialized = toStorageSettings(validated);
			
			// Convertir a formato de base de datos
			const dbData = fromSettingsToDbInsert(serialized, profileId);
			
			logger.debug('✅ Settings transformados para DB exitosamente', { dbData });
			return dbData;
		} catch (error) {
			logger.error('❌ Error transformando Settings para DB:', error);
			throw handleTransformerError(error as Error);
		}
	}

	/**
	 * Prepara datos parciales de Settings para actualizar en la base de datos
	 */
	static toUpdateDatabase(updateData: Partial<Settings>): any {
		try {
			logger.debug('🔄 Transformando actualización de Settings para DB', { updateData });
			
			if (!updateData || Object.keys(updateData).length === 0) {
				return {};
			}

			// Validar datos de actualización
			const validated = validateSettingsUpdate(updateData);
			
			// Convertir a formato de base de datos
			const dbData = fromSettingsUpdateToDb(validated);
			
			logger.debug('✅ Actualización de Settings transformada para DB exitosamente', { dbData });
			return dbData;
		} catch (error) {
			logger.error('❌ Error transformando actualización de Settings para DB:', error);
			throw handleTransformerError(error as Error);
		}
	}

	/**
	 * Normaliza configuración aplicando valores por defecto
	 */
	static normalize(settings: Partial<Settings>): Settings {
		try {
			logger.debug('🔄 Normalizando Settings', { settings });
			
			const normalized = normalizeSettings(settings);
			const validated = validateSettings(normalized);
			
			logger.debug('✅ Settings normalizados exitosamente', { validated });
			return validated;
		} catch (error) {
			logger.error('❌ Error normalizando Settings:', error);
			throw handleTransformerError(error as Error);
		}
	}

	/**
	 * Prepara configuración para ser enviada al cliente (sanitizada)
	 */
	static forClient(settings: Settings): Settings {
		try {
			logger.debug('🔄 Preparando Settings para cliente', { settings });
			
			// Validar entrada
			const validated = validateSettings(settings);
			
			// Sanitizar datos sensibles
			const sanitized = sanitizeSettingsForClient(validated);
			
			logger.debug('✅ Settings preparados para cliente exitosamente', { sanitized });
			return sanitized;
		} catch (error) {
			logger.error('❌ Error preparando Settings para cliente:', error);
			throw handleTransformerError(error as Error);
		}
	}

	/**
	 * Validación segura que devuelve éxito/error sin lanzar excepciones
	 */
	static safeParse(data: unknown): { success: true; data: Settings } | { success: false; error: string } {
		try {
			logger.debug('🔍 Validación segura de Settings', { data });
			
			return safeValidateSettings(data);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.warn('⚠️ Error en validación segura de Settings:', { error: errorMessage });
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Combina configuración base con configuración de override
	 */
	static merge(base: Settings, override: Partial<Settings>): Settings {
		try {
			logger.debug('🔄 Combinando configuraciones', { base, override });
			
			// Validar configuración base
			const validatedBase = validateSettings(base);
			
			// Validar configuración override
			const validatedOverride = validateSettingsUpdate(override);
			
			// Combinar usando el serializador
			const merged = normalizeSettings({
				...validatedBase,
				...validatedOverride,
				appearance: {
					...validatedBase.appearance,
					...validatedOverride.appearance,
				},
				notifications: {
					...validatedBase.notifications,
					...validatedOverride.notifications,
				},
				privacy: {
					...validatedBase.privacy,
					...validatedOverride.privacy,
				},
				advanced: {
					...validatedBase.advanced,
					...validatedOverride.advanced,
				},
			});
			
			logger.debug('✅ Configuraciones combinadas exitosamente', { merged });
			return merged;
		} catch (error) {
			logger.error('❌ Error combinando configuraciones:', error);
			throw handleTransformerError(error as Error);
		}
	}
}
