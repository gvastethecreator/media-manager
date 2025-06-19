/**
 * @file Server Actions para perfiles de usuario
 * @module app/actions/profiles
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createActionError, createEntityErrorObject } from '@/lib/errors/server-errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { profileService } from '@/services/profile/profile.service';
import type {
	CreateProfileInput,
	ProfileExtended,
	ProfileFilters,
	ProfilePaginationOptions,
	UpdateProfileInput,
} from '@/types/entities/profile';

const profileLogger = serverLogger.withContext('ProfileActions');
const REVALIDATE_PATHS = ['/settings', '/profiles', '/profiles/[id]', '/'] as const;

const revalidateProfilePaths = async () => {
	REVALIDATE_PATHS.forEach(revalidatePath);
	profileLogger.info('🔄 Rutas de perfiles revalidadas');
};

export async function getProfiles(
	filters?: ProfileFilters,
	pagination?: ProfilePaginationOptions
): Promise<ProfileExtended[]> {
	try {
		profileLogger.info('👥 Obteniendo perfiles', { filters, pagination });
		return await profileService.getProfiles(filters, pagination);
	} catch (error) {
		throw createActionError(error, 'No se pudieron obtener los perfiles');
	}
}

export async function getProfile(id: string): Promise<ProfileExtended> {
	try {
		profileLogger.info(`🔍 Obteniendo perfil: ${id}`);
		const profile = await profileService.getProfileById(id);
		if (!profile) {
			throw createEntityErrorObject('Profile', id, 'NOT_FOUND');
		}
		return profile;
	} catch (error) {
		throw createActionError(error, `No se pudo obtener el perfil ${id}`);
	}
}

export async function createProfile(data: CreateProfileInput): Promise<ProfileExtended> {
	try {
		profileLogger.info('📝 Creando nuevo perfil', { name: data.name });
		const newProfile = await profileService.createProfile(data);
		await revalidateProfilePaths();
		return newProfile;
	} catch (error) {
		throw createActionError(error, 'No se pudo crear el perfil');
	}
}

export async function updateProfile(id: string, data: UpdateProfileInput): Promise<ProfileExtended> {
	try {
		profileLogger.info(`🔄 Actualizando perfil: ${id}`);
		const updatedProfile = await profileService.updateProfile(id, data);
		await revalidateProfilePaths();
		return updatedProfile;
	} catch (error) {
		throw createActionError(error, `No se pudo actualizar el perfil ${id}`);
	}
}

export async function deleteProfile(id: string): Promise<void> {
	try {
		profileLogger.info(`🗑️ Eliminando perfil: ${id}`);
		await profileService.deleteProfile(id);
		await revalidateProfilePaths();
	} catch (error) {
		throw createActionError(error, `No se pudo eliminar el perfil ${id}`);
	}
}

export async function activateProfile(id: string): Promise<ProfileExtended> {
	try {
		profileLogger.info(`🔔 Activando perfil: ${id}`);
		const profile = await profileService.setActiveProfile(id);
		await revalidateProfilePaths();
		return profile;
	} catch (error) {
		throw createActionError(error, `No se pudo activar el perfil ${id}`);
	}
}

export async function getActiveProfile(): Promise<ProfileExtended | null> {
	try {
		profileLogger.info('🔍 Obteniendo perfil activo');
		return await profileService.getActiveProfile();
	} catch (error) {
		throw createActionError(error, 'No se pudo obtener el perfil activo');
	}
}
