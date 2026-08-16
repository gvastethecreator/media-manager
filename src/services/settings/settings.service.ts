/**
 * @file Servicio para operaciones con configuración
 * @module services/settings
 */

import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { profiles, settings } from '@/lib/drizzle/schema/index';
import { createSettingsError } from '@/lib/errors/settings';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	merge as mergeSettingsNew,
	normalize as normalizeSettingsNew,
	fromDatabase as settingsFromDatabase,
	toDatabase as settingsToDatabase,
} from '@/transformers/settings';
import { fileBrowserConfigSchema, settingsSchema } from '@/transformers/settings/schema';
import type { Settings } from '@/types/settings';

// Logger específico para el servicio de configuración
const logger = serverLogger.withContext('SettingsService');

/**
 * Interfaz para operaciones de configuración global
 */
export interface SettingsService {
	/**
	 * Obtiene la configuración de un perfil específico
	 */
	getProfileSettings(profileId: string): Promise<Settings | null>;
	/**
	 * Obtiene la configuración global del sistema
	 */
	getSystemSettings(): Promise<Settings>;

	/**
	 * Resetea la configuración de un perfil a los valores globales
	 */
	resetProfileSettings(profileId: string): Promise<void>;

	/**
	 * Resetea la configuración global a valores predeterminados
	 */
	resetSystemSettings(): Promise<Settings>;

	/**
	 * Actualiza la configuración de un perfil específico
	 */
	updateProfileSettings(profileId: string, data: Partial<Settings>): Promise<Settings>;

	/**
	 * Actualiza la configuración global del sistema
	 */
	updateSystemSettings(data: Partial<Settings>): Promise<Settings>;
}

/**
 * Convierte Record<string, unknown> a string JSON para Drizzle
 */
function toJsonString(data: Record<string, unknown>): string {
	return JSON.stringify(data);
}

/**
 * Crea el objeto de datos predeterminados para la configuración
 */
async function createDefaultSettingsData(): Promise<Record<string, unknown>> {
	// Incluir bloque fileBrowser normalizado para evitar ZodError por campos faltantes
	const fileBrowser = fileBrowserConfigSchema.parse({});
	return {
		appearance: {
			theme: 'system',
			fontSize: 16,
			language: 'en',
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
			shareUsageData: false,
			storeCookies: true,
			storeHistory: true,
		},
		advanced: {
			apiKey: null,
			devMode: false,
			experimentalFeatures: false,
		},
		fileBrowser,
	};
}

/**
 * Crea una configuración por defecto
 * @returns Configuración con valores predeterminados
 */
async function createDefaultSettings(): Promise<Settings> {
	try {
		logger.info('🔧 Creando configuración predeterminada');

		// Crear datos predeterminados
		const defaultData = await createDefaultSettingsData();

		// Obtener el perfil activo o usar un valor por defecto
		let profileId = 'default-profile';
		try {
			const activeProfile = await db.select().from(profiles).where(eq(profiles.isActive, true)).limit(1);

			if (activeProfile.length > 0) {
				profileId = activeProfile[0].id;
			}
		} catch {
			logger.warn('⚠️ No se pudo obtener perfil activo, usando perfil por defecto');
		}

		// Verificar si ya existe la configuración
		const existingSettings = await db.select().from(settings).where(eq(settings.id, 'default')).limit(1);

		if (existingSettings.length > 0) {
			// Actualizar configuración existente con datos normalizados
			const normalized = normalizeSettingsNew(defaultData as any);
			const dbData = settingsToDatabase(normalized, profileId);
			await db
				.update(settings)
				.set({
					data: dbData.data,
					profileId: dbData.profileId,
					theme: dbData.theme,
					language: dbData.language,
				})
				.where(eq(settings.id, 'default'));
		} else {
			// Crear nueva configuración con datos normalizados
			const normalized = normalizeSettingsNew(defaultData as any);
			const dbData = settingsToDatabase(normalized, profileId);
			await db.insert(settings).values({
				id: 'default',
				...dbData,
			});
		}

		// Devolver configuración normalizada
		return normalizeSettingsNew(defaultData as any);
	} catch (error) {
		logger.error('❌ Error al crear configuración predeterminada:', error);

		// Si ya existe, intentar actualizar
		if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
			logger.info('ℹ️ Ya existe una configuración, actualizando a valores predeterminados');
			return settingsService.resetSystemSettings();
		}

		throw createSettingsError('No se pudo crear la configuración predeterminada', 'CREATE_DEFAULT_FAILED', error);
	}
}

/**
 * Implementación del servicio de configuración
 */
export const settingsService: SettingsService = {
	/**
	 * Obtiene la configuración global del sistema
	 */
	async getSystemSettings(): Promise<Settings> {
		logger.debug('📤 Obteniendo configuración global del sistema');

		try {
			// Intentar obtener la configuración existente
			const settingsResult = await db.select().from(settings).where(eq(settings.id, 'default')).limit(1);

			if (settingsResult.length === 0 || !settingsResult[0].data) {
				logger.info('ℹ️ No se encontró configuración global, creando valores predeterminados');
				// Si no existe, crear una configuración por defecto
				return createDefaultSettings();
			}

			// Transformar desde la fila de DB al formato de la aplicación
			return settingsFromDatabase(settingsResult[0]);
		} catch (error) {
			logger.error('❌ Error al obtener la configuración global:', error);
			throw createSettingsError('No se pudo obtener la configuración del sistema', 'GET_FAILED', error);
		}
	},

	/**
	 * Actualiza la configuración global del sistema
	 */
	async updateSystemSettings(data: Partial<Settings>): Promise<Settings> {
		logger.debug('📥 Actualizando configuración global del sistema', { data });

		try {
			// Obtener configuración actual
			const currentSettings = await this.getSystemSettings();

			// Fusionar con los nuevos datos usando transformer moderno
			const updatedSettings = mergeSettingsNew(currentSettings, data);

			// Validar la configuración actualizada
			const validationResult = settingsSchema.safeParse(updatedSettings);

			if (!validationResult.success) {
				logger.error('❌ Datos de configuración inválidos:', validationResult.error);
				throw createSettingsError('Datos de configuración inválidos', 'VALIDATION_FAILED', validationResult.error);
			}

			// Obtener el perfil activo o usar un valor por defecto
			let profileId = 'default-profile';
			try {
				const activeProfile = await db.select().from(profiles).where(eq(profiles.isActive, true)).limit(1);

				if (activeProfile.length > 0) {
					profileId = activeProfile[0].id;
				}
			} catch {
				logger.warn('⚠️ No se pudo obtener perfil activo, usando perfil por defecto');
			}

			// Verificar si ya existe la configuración
			const existingSettings = await db.select().from(settings).where(eq(settings.id, 'default')).limit(1);

			const dbData = settingsToDatabase(validationResult.data, profileId);
			if (existingSettings.length > 0) {
				// Actualizar configuración existente
				await db
					.update(settings)
					.set({
						data: dbData.data,
						profileId: dbData.profileId,
						theme: dbData.theme,
						language: dbData.language,
					})
					.where(eq(settings.id, 'default'));
			} else {
				// Crear nueva configuración
				await db.insert(settings).values({
					id: 'default',
					...dbData,
				});
			}

			logger.info('✅ Configuración global actualizada exitosamente');

			return validationResult.data;
		} catch (error) {
			logger.error('❌ Error al actualizar la configuración global:', error);
			throw createSettingsError('No se pudo actualizar la configuración del sistema', 'UPDATE_FAILED', error);
		}
	},

	/**
	 * Resetea la configuración global a valores predeterminados
	 */
	async resetSystemSettings(): Promise<Settings> {
		logger.debug('🔄 Reseteando configuración global a valores predeterminados');

		try {
			const defaultData = await createDefaultSettingsData();

			// Obtener el perfil activo o usar un valor por defecto
			let profileId = 'default-profile';
			try {
				const activeProfile = await db.select().from(profiles).where(eq(profiles.isActive, true)).limit(1);

				if (activeProfile.length > 0) {
					profileId = activeProfile[0].id;
				}
			} catch {
				logger.warn('⚠️ No se pudo obtener perfil activo, usando perfil por defecto');
			}

			// Verificar si ya existe la configuración
			const existingSettings = await db.select().from(settings).where(eq(settings.id, 'default')).limit(1);

			const normalized = normalizeSettingsNew(defaultData as any);
			const dbData = settingsToDatabase(normalized, profileId);

			if (existingSettings.length > 0) {
				// Actualizar configuración existente
				await db
					.update(settings)
					.set({
						data: dbData.data,
						profileId: dbData.profileId,
						theme: dbData.theme,
						language: dbData.language,
					})
					.where(eq(settings.id, 'default'));
			} else {
				// Crear nueva configuración
				await db.insert(settings).values({
					id: 'default',
					...dbData,
				});
			}

			logger.info('✅ Configuración global reseteada exitosamente');

			return normalized;
		} catch (error) {
			logger.error('❌ Error al resetear la configuración global:', error);
			throw createSettingsError('No se pudo resetear la configuración del sistema', 'RESET_FAILED', error);
		}
	},

	/**
	 * Obtiene la configuración de un perfil específico
	 */
	async getProfileSettings(profileId: string): Promise<Settings | null> {
		logger.debug(`📤 Obteniendo configuración del perfil: ${profileId}`);

		try {
			// Verificar que el perfil existe
			const profile = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);

			if (profile.length === 0) {
				logger.warn(`⚠️ Perfil no encontrado: ${profileId}`);
				return null;
			}

			// Buscar configuración específica del perfil
			const profileSettings = await db.select().from(settings).where(eq(settings.profileId, profileId)).limit(1);

			if (profileSettings.length === 0 || !profileSettings[0].data) {
				logger.info(`ℹ️ Perfil ${profileId} no tiene configuración específica, usando configuración global`);
				return await this.getSystemSettings();
			}

			return settingsFromDatabase(profileSettings[0]);
		} catch (error) {
			logger.error(`❌ Error al obtener configuración del perfil ${profileId}:`, error);
			throw createSettingsError('No se pudo obtener la configuración del perfil', 'GET_PROFILE_FAILED', error);
		}
	},

	/**
	 * Actualiza la configuración de un perfil específico
	 */
	async updateProfileSettings(profileId: string, data: Partial<Settings>): Promise<Settings> {
		logger.debug(`📥 Actualizando configuración del perfil: ${profileId}`, { data });

		try {
			// Verificar que el perfil existe
			const profile = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);

			if (profile.length === 0) {
				throw createSettingsError(`Perfil no encontrado: ${profileId}`, 'PROFILE_NOT_FOUND');
			}

			// Obtener configuración actual del perfil (o global si no tiene específica)
			const currentSettings = (await this.getProfileSettings(profileId)) || (await this.getSystemSettings());

			// Fusionar con los nuevos datos
			const updatedSettings = mergeSettingsNew(currentSettings, data);

			// Validar la configuración actualizada
			const validationResult = settingsSchema.safeParse(updatedSettings);

			if (!validationResult.success) {
				logger.error('❌ Datos de configuración inválidos:', validationResult.error);
				throw createSettingsError('Datos de configuración inválidos', 'VALIDATION_FAILED', validationResult.error);
			}

			const dbData = settingsToDatabase(validationResult.data, profileId);

			// Verificar si ya existe configuración para este perfil
			const existingProfileSettings = await db
				.select()
				.from(settings)
				.where(eq(settings.profileId, profileId))
				.limit(1);

			if (existingProfileSettings.length > 0) {
				// Actualizar configuración existente del perfil
				await db
					.update(settings)
					.set({
						data: dbData.data,
						theme: dbData.theme,
						language: dbData.language,
					})
					.where(eq(settings.profileId, profileId));
			} else {
				// Crear nueva configuración específica del perfil
				await db.insert(settings).values({
					id: `profile-${profileId}`,
					...dbData,
				});
			}

			logger.info(`✅ Configuración del perfil ${profileId} actualizada exitosamente`);

			return validationResult.data;
		} catch (error) {
			logger.error(`❌ Error al actualizar configuración del perfil ${profileId}:`, error);
			throw createSettingsError('No se pudo actualizar la configuración del perfil', 'UPDATE_PROFILE_FAILED', error);
		}
	},

	/**
	 * Resetea la configuración de un perfil a los valores globales
	 */
	async resetProfileSettings(profileId: string): Promise<void> {
		logger.debug(`🔄 Reseteando configuración del perfil: ${profileId}`);

		try {
			// Verificar que el perfil existe
			const profile = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);

			if (profile.length === 0) {
				throw createSettingsError(`Perfil no encontrado: ${profileId}`, 'PROFILE_NOT_FOUND');
			}

			// Eliminar configuración específica del perfil (volverá a usar la global)
			await db.delete(settings).where(eq(settings.profileId, profileId));

			logger.info(`✅ Configuración del perfil ${profileId} reseteada exitosamente`);
		} catch (error) {
			logger.error(`❌ Error al resetear configuración del perfil ${profileId}:`, error);
			throw createSettingsError('No se pudo resetear la configuración del perfil', 'RESET_PROFILE_FAILED', error);
		}
	},
};
