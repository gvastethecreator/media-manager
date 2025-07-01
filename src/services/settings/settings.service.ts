/**
 * @file Servicio para operaciones con configuración
 * @module services/settings
 */

import { createSettingsError } from '@/app/actions/system/settings.errors';
import { getPrismaClient } from '@/lib/database/db';
import { serverLogger } from '@/lib/logger/server-logger';
import { deserializeSettings, mergeSettings, serializeSettings } from '@/transformers/settings';
import { settingsSchema } from '@/transformers/settings/schema';
import type { Settings } from '@/types/settings';

// Logger específico para el servicio de configuración
const logger = serverLogger.withContext('SettingsService');

/**
 * Interfaz para operaciones de configuración global
 */
export interface SettingsService {
	/**
	 * Obtiene la configuración global del sistema
	 */
	getSystemSettings(): Promise<Settings>;

	/**
	 * Actualiza la configuración global del sistema
	 */
	updateSystemSettings(data: Partial<Settings>): Promise<Settings>;

	/**
	 * Resetea la configuración global a valores predeterminados
	 */
	resetSystemSettings(): Promise<Settings>;

	/**
	 * Obtiene la configuración de un perfil específico
	 */
	getProfileSettings(profileId: string): Promise<Settings | null>;

	/**
	 * Actualiza la configuración de un perfil específico
	 */
	updateProfileSettings(profileId: string, data: Partial<Settings>): Promise<Settings>;

	/**
	 * Resetea la configuración de un perfil a los valores globales
	 */
	resetProfileSettings(profileId: string): Promise<void>;
}

/**
 * Convierte Record<string, unknown> a object para Prisma
 */
function toInputJsonValue(data: Record<string, unknown>): object {
	return JSON.parse(JSON.stringify(data));
}

/**
 * Crea el objeto de datos predeterminados para la configuración
 */
async function createDefaultSettingsData(): Promise<Record<string, unknown>> {
	return {
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
			shareUsageData: false,
			storeCookies: true,
			storeHistory: true,
		},
		advanced: {
			apiKey: null,
			devMode: false,
			experimentalFeatures: false,
		},
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
		const prisma = await getPrismaClient();

		// Obtener el perfil activo o usar un valor por defecto
		let profileId = 'default-profile';
		try {
			const activeProfile = await prisma.profile.findFirst({
				where: { isActive: true },
			});
			if (activeProfile) {
				profileId = activeProfile.id;
			}
		} catch {
			logger.warn('⚠️ No se pudo obtener perfil activo, usando perfil por defecto');
		}

		await prisma.settings.upsert({
			where: { id: 'default' },
			update: {},
			create: {
				id: 'default',
				data: toInputJsonValue(defaultData),
				profileId,
			},
		});

		// Deserializar y devolver
		return deserializeSettings(defaultData);
	} catch (error) {
		logger.error('❌ Error al crear configuración predeterminada:', error);

		// Si ya existe, intentar actualizar
		if (error instanceof Error && error.message.includes('Unique constraint failed')) {
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
			const prisma = await getPrismaClient();
			const settings = await prisma.settings.findUnique({
				where: { id: 'default' },
			});

			if (!settings || !settings.data) {
				logger.info('ℹ️ No se encontró configuración global, creando valores predeterminados');
				// Si no existe, crear una configuración por defecto
				return createDefaultSettings();
			}

			// Deserializar configuración al formato de la aplicación
			return deserializeSettings(settings.data as Record<string, unknown>);
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

			// Fusionar con los nuevos datos
			const updatedSettings = mergeSettings(currentSettings, data);

			// Validar la configuración actualizada
			const validationResult = settingsSchema.safeParse(updatedSettings);

			if (!validationResult.success) {
				logger.error('❌ Datos de configuración inválidos:', validationResult.error);
				throw createSettingsError('Datos de configuración inválidos', 'VALIDATION_FAILED', validationResult.error);
			}

			// Serializar para almacenamiento
			const serializedData = serializeSettings(validationResult.data);
			const prisma = await getPrismaClient();

			// Obtener el perfil activo o usar un valor por defecto
			let profileId = 'default-profile';
			try {
				const activeProfile = await prisma.profile.findFirst({
					where: { isActive: true },
				});
				if (activeProfile) {
					profileId = activeProfile.id;
				}
			} catch {
				logger.warn('⚠️ No se pudo obtener perfil activo, usando perfil por defecto');
			}

			await prisma.settings.upsert({
				where: { id: 'default' },
				update: {
					data: toInputJsonValue(serializedData),
				},
				create: {
					id: 'default',
					data: toInputJsonValue(serializedData),
					profileId,
				},
			});

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
			const prisma = await getPrismaClient();

			// Obtener el perfil activo o usar un valor por defecto
			let profileId = 'default-profile';
			try {
				const activeProfile = await prisma.profile.findFirst({
					where: { isActive: true },
				});
				if (activeProfile) {
					profileId = activeProfile.id;
				}
			} catch {
				logger.warn('⚠️ No se pudo obtener perfil activo, usando perfil por defecto');
			}

			await prisma.settings.upsert({
				where: { id: 'default' },
				update: {
					data: toInputJsonValue(defaultData),
				},
				create: {
					id: 'default',
					data: toInputJsonValue(defaultData),
					profileId,
				},
			});

			logger.info('✅ Configuración global reseteada exitosamente');

			return deserializeSettings(defaultData);
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
			const prisma = await getPrismaClient();
			const profile = await prisma.profile.findUnique({
				where: { id: profileId },
				include: {
					settings: true,
				},
			});

			if (!profile) {
				logger.warn(`⚠️ Perfil no encontrado: ${profileId}`);
				return null;
			}

			if (!profile.settings || !profile.settings.data) {
				logger.info(`ℹ️ Perfil ${profileId} no tiene configuración específica, usando configuración global`);
				return await this.getSystemSettings();
			}

			return deserializeSettings(profile.settings.data as Record<string, unknown>);
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
			const prisma = await getPrismaClient();

			// Verificar que el perfil existe
			const profile = await prisma.profile.findUnique({
				where: { id: profileId },
			});

			if (!profile) {
				throw createSettingsError(`Perfil no encontrado: ${profileId}`, 'PROFILE_NOT_FOUND');
			}

			// Obtener configuración actual del perfil (o global si no tiene específica)
			const currentSettings = (await this.getProfileSettings(profileId)) || (await this.getSystemSettings());

			// Fusionar con los nuevos datos
			const updatedSettings = mergeSettings(currentSettings, data);

			// Validar la configuración actualizada
			const validationResult = settingsSchema.safeParse(updatedSettings);

			if (!validationResult.success) {
				logger.error('❌ Datos de configuración inválidos:', validationResult.error);
				throw createSettingsError('Datos de configuración inválidos', 'VALIDATION_FAILED', validationResult.error);
			}

			// Serializar para almacenamiento
			const serializedData = serializeSettings(validationResult.data);

			// Actualizar o crear configuración específica del perfil
			await prisma.settings.upsert({
				where: { profileId },
				update: {
					data: toInputJsonValue(serializedData),
				},
				create: {
					id: `profile-${profileId}`,
					data: toInputJsonValue(serializedData),
					profileId,
				},
			});

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
			const prisma = await getPrismaClient();

			// Verificar que el perfil existe
			const profile = await prisma.profile.findUnique({
				where: { id: profileId },
			});

			if (!profile) {
				throw createSettingsError(`Perfil no encontrado: ${profileId}`, 'PROFILE_NOT_FOUND');
			}

			// Eliminar configuración específica del perfil (volverá a usar la global)
			await prisma.settings.deleteMany({
				where: { profileId },
			});

			logger.info(`✅ Configuración del perfil ${profileId} reseteada exitosamente`);
		} catch (error) {
			logger.error(`❌ Error al resetear configuración del perfil ${profileId}:`, error);
			throw createSettingsError('No se pudo resetear la configuración del perfil', 'RESET_PROFILE_FAILED', error);
		}
	},
};
