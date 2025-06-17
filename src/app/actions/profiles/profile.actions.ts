/**
 * @file Server Actions para perfiles de usuario
 * @module app/actions/profiles
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createEntityErrorObject } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { profileService } from '@/services/profile-service-export';
import {
	type CreateProfileInput,
	type ProfileExtended,
	type ProfileFilters,
	type ProfilePaginationOptions,
	type UpdateProfileInput,
} from '@/types/entities/profile';

// Logger específico para acciones de perfil
const profileLogger = serverLogger.withContext('ProfileActions');

// Rutas que deben ser revalidadas cuando los perfiles cambian
const REVALIDATE_PATHS = ['/settings', '/profiles', '/profiles/[id]', '/'] as const;

/**
 * Función auxiliar para formatear errores sin causar recursión
 */
function formatError(error: unknown) {
	if (error instanceof Error) {
		// Extraer solo lo esencial del error para evitar recursión
		const formattedError = {
			message: error.message,
			name: error.name,
			stack: error.stack?.split('\n').slice(0, 3).join('\n'), // Solo las primeras 3 líneas del stack
		};

		// Añadir código si existe
		if ('code' in error && error.code) {
			Object.assign(formattedError, { code: error.code });
		}

		// Si hay una causa simple, añadirla (sin profundizar)
		if ('cause' in error && error.cause) {
			if (error.cause instanceof Error) {
				Object.assign(formattedError, {
					cause: {
						message: error.cause.message,
						name: error.cause.name,
					},
				});
			} else if (typeof error.cause === 'object') {
				Object.assign(formattedError, {
					cause: { info: 'Causa del error (objeto simplificado)' },
				});
			} else {
				Object.assign(formattedError, {
					cause: { info: String(error.cause) },
				});
			}
		}

		return formattedError;
	}

	return { message: 'Error desconocido', type: typeof error };
}

/**
 * Revalida todas las rutas relevantes cuando cambian los perfiles
 */
const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	profileLogger.info('🔄 Rutas relacionadas con perfiles revalidadas');
};

/**
 * Obtiene todos los perfiles con filtros y paginación opcional
 */
export async function getProfiles(
	filters?: ProfileFilters,
	pagination?: ProfilePaginationOptions
): Promise<ProfileExtended[]> {
	try {
		profileLogger.info('👥 Obteniendo lista de perfiles', { filters, pagination });
		const profiles = await profileService.getProfiles(filters, pagination);

		// Si no hay ningún perfil activo, activar el primero por defecto
		const activeProfile = profiles.find((p) => p.isActive);
		if (!activeProfile && profiles.length > 0) {
			await activateProfile(profiles[0].id);
			return profileService.getProfiles(filters, pagination);
		}

		profileLogger.info(`✅ ${profiles.length} perfiles obtenidos`);
		return profiles;
	} catch (error) {
		profileLogger.error('❌ Error al obtener perfiles:', error);
		throw createEntityErrorObject(
			'ProfileError',
			'No se pudieron obtener los perfiles',
			'GET_FAILED',
			formatError(error)
		);
	}
}

/**
 * Obtiene un perfil por su ID
 */
export async function getProfile(id: string): Promise<ProfileExtended> {
	try {
		profileLogger.info('🔍 Obteniendo perfil:', id);
		const profile = await profileService.getProfileById(id);

		if (!profile) {
			throw createEntityErrorObject('ProfileError', 'Perfil no encontrado', 'NOT_FOUND');
		}

		profileLogger.info('✅ Perfil obtenido:', profile.name);
		return profile;
	} catch (error) {
		profileLogger.error('❌ Error al obtener perfil:', error);
		throw createEntityErrorObject('ProfileError', 'No se pudo obtener el perfil', 'GET_FAILED', formatError(error));
	}
}

/**
 * Crea un nuevo perfil
 */
export async function createProfile(data: CreateProfileInput): Promise<ProfileExtended> {
	try {
		profileLogger.info('📝 Creando nuevo perfil:', data.name);
		const profile = await profileService.createProfile(data);
		profileLogger.info('✅ Perfil creado:', profile.name);
		await revalidateAllPaths();
		return profile;
	} catch (error) {
		profileLogger.error('❌ Error al crear perfil:', error);
		throw createEntityErrorObject('ProfileError', 'No se pudo crear el perfil', 'CREATE_FAILED', formatError(error));
	}
}

/**
 * Actualiza un perfil existente
 */
export async function updateProfile(id: string, data: UpdateProfileInput): Promise<ProfileExtended> {
	try {
		profileLogger.info('📝 Actualizando perfil:', id);
		const profile = await profileService.updateProfile(id, data);
		profileLogger.info('✅ Perfil actualizado:', profile.name);
		await revalidateAllPaths();
		return profile;
	} catch (error) {
		profileLogger.error('❌ Error al actualizar perfil:', error);
		throw createEntityErrorObject(
			'ProfileError',
			'No se pudo actualizar el perfil',
			'UPDATE_FAILED',
			formatError(error)
		);
	}
}

/**
 * Elimina un perfil
 */
export async function deleteProfile(id: string): Promise<void> {
	try {
		profileLogger.info('🗑️ Eliminando perfil:', id);
		await profileService.deleteProfile(id);
		profileLogger.info('✅ Perfil eliminado');
		await revalidateAllPaths();
	} catch (error) {
		profileLogger.error('❌ Error al eliminar perfil:', error);
		throw createEntityErrorObject('ProfileError', 'No se pudo eliminar el perfil', 'DELETE_FAILED', formatError(error));
	}
}

/**
 * Establece un perfil como activo
 */
export async function activateProfile(id: string): Promise<ProfileExtended> {
	try {
		profileLogger.info('🔔 Activando perfil:', id);
		await profileService.setActiveProfile(id);
		const profile = await profileService.getProfileById(id);

		if (!profile) {
			throw createEntityErrorObject('ProfileError', 'Perfil no encontrado después de activación', 'NOT_FOUND');
		}

		profileLogger.info('✅ Perfil activado:', profile.name);
		await revalidateAllPaths();
		return profile;
	} catch (error) {
		profileLogger.error('❌ Error al activar perfil:', error);
		throw createEntityErrorObject(
			'ProfileError',
			'No se pudo activar el perfil',
			'ACTIVATE_FAILED',
			formatError(error)
		);
	}
}

/**
 * Obtiene el perfil activo actual
 */
export async function getActiveProfile(): Promise<ProfileExtended> {
	try {
		profileLogger.info('🔍 Obteniendo perfil activo');
		const profile = await profileService.getActiveProfile();

		if (!profile) {
			throw createEntityErrorObject('ProfileError', 'No hay perfil activo', 'NOT_FOUND');
		}

		profileLogger.info('✅ Perfil activo obtenido:', profile.name);
		return profile;
	} catch (error) {
		profileLogger.error('❌ Error al obtener perfil activo:', error);
		throw createEntityErrorObject(
			'ProfileError',
			'No se pudo obtener el perfil activo',
			'GET_FAILED',
			formatError(error)
		);
	}
}
