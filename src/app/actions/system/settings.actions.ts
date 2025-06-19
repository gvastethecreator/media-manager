/**
 * @file Acciones del servidor para gestionar la configuración del sistema
 * @module app/actions/system/settings
 */

'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { deserializeSettings, mergeSettings, serializeSettings } from '@/transformers/settings';
import type { Settings } from '@/types/settings';
import { settingsSchema } from '@/types/settings';
import { revalidatePath } from 'next/cache';
import { createSettingsError, isSettingsError } from './settings.errors';

// Logger específico para acciones de configuración
const logger = serverLogger.withContext('SettingsActions');

// Rutas que deben ser revalidadas cuando las configuraciones cambian
const REVALIDATE_PATHS = ['/settings', '/profiles', '/'] as const;

/**
 * Revalida todas las rutas relevantes cuando cambian las configuraciones
 */
const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	logger.info('🔄 Rutas relacionadas con configuración revalidadas');
};

/**
 * Respuesta estándar para operaciones de configuración
 */
export interface SettingsResponse {
	success: boolean;
	message: string;
	data?: Settings;
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

		// Guardar en la base de datos
		await prisma.settings.upsert({
			where: { id: 'default' },
			update: {},
			create: {
				id: 'default',
				data: defaultData,
			},
		});

		// Deserializar y devolver
		return deserializeSettings(defaultData);
	} catch (error) {
		logger.error('❌ Error al crear configuración predeterminada:', error);

		// Si ya existe, intentar actualizar
		if (error instanceof Error && error.message.includes('Unique constraint failed')) {
			logger.info('ℹ️ Ya existe una configuración, actualizando a valores predeterminados');
			return resetSystemSettings();
		}

		throw createSettingsError('No se pudo crear la configuración predeterminada', 'CREATE_DEFAULT_FAILED', error);
	}
}

/**
 * Crea el objeto de datos predeterminados para la configuración
 */
export async function createDefaultSettingsData(): Promise<Record<string, unknown>> {
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
 * Obtiene la configuración global del sistema
 */
export async function getSystemSettings(): Promise<Settings> {
	logger.debug('📤 Obteniendo configuración global del sistema');

	try {
		// Intentar obtener la configuración existente
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
}

/**
 * Actualiza la configuración global del sistema
 */
export async function updateSystemSettings(data: Partial<Settings>): Promise<Settings> {
	logger.debug('📥 Actualizando configuración global del sistema', { data });

	try {
		// Obtener configuración actual
		const currentSettings = await getSystemSettings();

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

		// Actualizar en la base de datos
		await prisma.settings.upsert({
			where: { id: 'default' },
			update: {
				data: serializedData,
				updatedAt: new Date(),
			},
			create: {
				id: 'default',
				data: serializedData,
			},
		});

		// Revalidar rutas
		await revalidateAllPaths();

		logger.info('✅ Configuración global actualizada correctamente');

		// Devolver la configuración actualizada
		return validationResult.data;
	} catch (error) {
		logger.error('❌ Error al actualizar la configuración global:', error);

		// Reenviar el error si ya es un SettingsError
		if (isSettingsError(error)) {
			throw error;
		}

		throw createSettingsError('No se pudo actualizar la configuración del sistema', 'UPDATE_FAILED', error);
	}
}

/**
 * Restablece la configuración global a valores predeterminados
 */
export async function resetSystemSettings(): Promise<Settings> {
	logger.debug('🔄 Restableciendo configuración global del sistema');

	try {
		// Crear configuración por defecto
		const defaultSettings = await createDefaultSettingsData();

		// Actualizar en la base de datos
		await prisma.settings.upsert({
			where: { id: 'default' },
			update: {
				data: defaultSettings,
				updatedAt: new Date(),
			},
			create: {
				id: 'default',
				data: defaultSettings,
			},
		});

		// Revalidar rutas
		await revalidateAllPaths();

		logger.info('✅ Configuración global restablecida a valores predeterminados');

		// Devolver la configuración predeterminada deserializada
		return deserializeSettings(defaultSettings);
	} catch (error) {
		logger.error('❌ Error al restablecer la configuración global:', error);
		throw createSettingsError('No se pudo restablecer la configuración del sistema', 'RESET_FAILED', error);
	}
}

/**
 * Obtiene la configuración de un perfil específico
 */
export async function getProfileSettings(profileId: string): Promise<Settings | null> {
	logger.debug('📤 Obteniendo configuración del perfil', { profileId });

	try {
		// Verificar si el perfil existe
		const profile = await prisma.profile.findUnique({
			where: { id: profileId },
		});

		if (!profile) {
			logger.warn('⚠️ Perfil no encontrado', { profileId });
			return null;
		}

		// Buscar configuración específica del perfil
		const settings = await prisma.settings.findUnique({
			where: { id: profileId },
		});

		if (!settings) {
			logger.info('ℹ️ No se encontró configuración para el perfil, usando global', { profileId });
			// Si no tiene configuración específica, devolver la global
			return getSystemSettings();
		}

		// Deserializar configuración al formato de la aplicación
		return deserializeSettings(settings.data as Record<string, unknown>);
	} catch (error) {
		logger.error('❌ Error al obtener la configuración del perfil:', error, { profileId });
		throw createSettingsError(
			`No se pudo obtener la configuración del perfil ${profileId}`,
			'PROFILE_GET_FAILED',
			error
		);
	}
}

/**
 * Actualiza la configuración de un perfil específico
 */
export async function updateProfileSettings(profileId: string, data: Partial<Settings>): Promise<Settings> {
	logger.debug('📥 Actualizando configuración del perfil', { profileId, data });

	try {
		// Verificar si el perfil existe
		const profile = await prisma.profile.findUnique({
			where: { id: profileId },
		});

		if (!profile) {
			logger.warn('⚠️ Perfil no encontrado', { profileId });
			throw createSettingsError(`Perfil ${profileId} no encontrado`, 'PROFILE_NOT_FOUND');
		}

		// Obtener configuración actual del perfil (o global si no tiene)
		const currentSettings = (await getProfileSettings(profileId)) || (await getSystemSettings());

		// Fusionar con los nuevos datos
		const newSettings = mergeSettings(currentSettings, data);

		// Validar la configuración actualizada
		const validationResult = settingsSchema.safeParse(newSettings);

		if (!validationResult.success) {
			logger.error('❌ Datos de configuración inválidos:', validationResult.error);
			throw createSettingsError('Datos de configuración inválidos', 'VALIDATION_FAILED', validationResult.error);
		}

		// Serializar para almacenamiento
		const serializedData = serializeSettings(newSettings);

		// Actualizar en la base de datos
		const _result = await prisma.settings.upsert({
			where: { id: profileId },
			update: {
				data: serializedData,
				updatedAt: new Date(),
			},
			create: {
				id: profileId,
				userId: profileId,
				data: serializedData,
			},
		});

		// Revalidar rutas
		await revalidateAllPaths();

		logger.info('✅ Configuración del perfil actualizada correctamente', { profileId });

		// Devolver la configuración actualizada
		return newSettings;
	} catch (error) {
		logger.error('❌ Error al actualizar la configuración del perfil:', error, { profileId });

		// Reenviar el error si ya es un SettingsError
		if (isSettingsError(error)) {
			throw error;
		}

		throw createSettingsError(
			`No se pudo actualizar la configuración del perfil ${profileId}`,
			'PROFILE_UPDATE_FAILED',
			error
		);
	}
}

/**
 * Restablece la configuración de un perfil a la configuración global
 */
export async function resetProfileSettings(profileId: string): Promise<void> {
	logger.debug('🔄 Restableciendo configuración del perfil a global', { profileId });

	try {
		// Verificar si el perfil existe
		const profile = await prisma.profile.findUnique({
			where: { id: profileId },
		});

		if (!profile) {
			logger.warn('⚠️ Perfil no encontrado', { profileId });
			throw createSettingsError(`Perfil ${profileId} no encontrado`, 'PROFILE_NOT_FOUND');
		}

		// Eliminar configuración específica del perfil
		await prisma.settings
			.delete({
				where: { id: profileId },
			})
			.catch((err) => {
				// Si no existe, ignorar el error
				if (err.code !== 'P2025') {
					// P2025 is Prisma's code for "record to delete does not exist"
					throw err;
				}
			});

		// Revalidar rutas
		await revalidateAllPaths();

		logger.info('✅ Configuración del perfil restablecida a global', { profileId });
	} catch (error) {
		logger.error('❌ Error al restablecer la configuración del perfil:', error, { profileId });

		// Reenviar el error si ya es un SettingsError
		if (isSettingsError(error)) {
			throw error;
		}

		throw createSettingsError(
			`No se pudo restablecer la configuración del perfil ${profileId}`,
			'PROFILE_RESET_FAILED',
			error
		);
	}
}
