/**
 * @file Server Actions para perfiles de usuario
 * @module app/actions/profiles
 */

'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { profileService } from '@/services/profile/profile.service';
import type { ProfileBase, ProfileCreateInput, ProfileUpdateInput } from '@/types/entities/profile/types';
import { toServiceError } from '@/lib/utils/errors/service-errors';
import { revalidatePath } from '@/lib/server/revalidate';

const profileLogger = serverLogger.withContext('ProfileActions');
const REVALIDATE_PATHS = ['/settings', '/profiles', '/profiles/[id]', '/'] as const;

const revalidateProfilePaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	profileLogger.info('🔄 Rutas de perfiles revalidadas');
};

// Función auxiliar para manejar errores
function handleProfileError(error: unknown, defaultMessage: string): never {
	const serviceError = toServiceError(error, {
		message: defaultMessage,
		serviceName: 'ProfileActions',
	});
	throw serviceError;
}

export async function getProfiles(): Promise<ProfileBase[]> {
	try {
		profileLogger.info('👥 Obteniendo perfiles');
		return await profileService.getProfiles();
	} catch (error) {
		handleProfileError(error, 'No se pudieron obtener los perfiles');
	}
}

export async function getProfile(id: string): Promise<ProfileBase> {
	try {
		profileLogger.info(`🔍 Obteniendo perfil: ${id}`);
		const profile = await profileService.getById(id);
		if (!profile) {
			throw new Error(`Perfil con ID ${id} no encontrado`);
		}
		return profile;
	} catch (error) {
		handleProfileError(error, `No se pudo obtener el perfil ${id}`);
	}
}

export async function createProfile(data: ProfileCreateInput): Promise<ProfileBase> {
	try {
		profileLogger.info('📝 Creando nuevo perfil', { name: data.name });
		const newProfile = await profileService.createProfile(data);
		await revalidateProfilePaths();
		return newProfile;
	} catch (error) {
		handleProfileError(error, 'No se pudo crear el perfil');
	}
}

export async function updateProfile(id: string, data: ProfileUpdateInput): Promise<ProfileBase> {
	try {
		profileLogger.info(`🔄 Actualizando perfil: ${id}`);
		const updatedProfile = await profileService.updateProfile(id, data);
		await revalidateProfilePaths();
		return updatedProfile;
	} catch (error) {
		handleProfileError(error, `No se pudo actualizar el perfil ${id}`);
	}
}

export async function deleteProfile(id: string): Promise<void> {
	try {
		profileLogger.info(`🗑️ Eliminando perfil: ${id}`);
		await profileService.delete(id);
		await revalidateProfilePaths();
	} catch (error) {
		handleProfileError(error, `No se pudo eliminar el perfil ${id}`);
	}
}

export async function activateProfile(id: string): Promise<void> {
	try {
		profileLogger.info(`🔔 Activando perfil: ${id}`);
		await profileService.setActiveProfile(id);
		await revalidateProfilePaths();
	} catch (error) {
		handleProfileError(error, `No se pudo activar el perfil ${id}`);
	}
}

export async function getActiveProfile(): Promise<ProfileBase | null> {
	try {
		profileLogger.info('🔍 Obteniendo perfil activo');
		return await profileService.getActiveProfile();
	} catch (error) {
		handleProfileError(error, 'No se pudo obtener el perfil activo');
	}
}
