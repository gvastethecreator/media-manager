'use server';

import { logger } from '@/lib/logger/logger';
import { prisma } from '@/lib/prisma';
import type { ProfileCreate, ProfileUpdate } from '@/services/profile.service';
import type { Profile } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const profileLogger = logger.withContext('ProfileActions');

const REVALIDATE_PATHS = ['/settings', '/profiles', '/profiles/[id]'] as const;

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	profileLogger.info('🔄 Rutas revalidadas');
};

class ProfileError extends Error {
	constructor(
		message: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'ProfileError';
	}
}

export interface ProfileWithStats extends Profile {
	id: string;
	name: string;
	_count: {
		images: number;
	};
	totalSize: number;
	lastUpdated: Date;
	distribution?: Array<{
		name: string;
		count: number;
	}>;
}

export async function getProfiles() {
	try {
		profileLogger.info('👥 Obteniendo lista de perfiles');
		const profiles = await prisma.profile.findMany();

		// Si no hay ningún perfil activo, activar el primero por defecto
		const activeProfile = profiles.find((p) => p.isActive);
		if (!activeProfile && profiles.length > 0) {
			await activateProfile(profiles[0].id);
			// Volver a obtener los perfiles con el perfil activo
			return prisma.profile.findMany();
		}

		profileLogger.info(`✅ ${profiles.length} perfiles obtenidos`);
		return profiles;
	} catch (error) {
		profileLogger.error('❌ Error al obtener perfiles:', error);
		throw new ProfileError('No se pudieron obtener los perfiles', error);
	}
}

export async function getProfile(id: string) {
	try {
		profileLogger.info('🔍 Obteniendo perfil:', id);
		const profile = await prisma.profile.findUnique({
			where: { id },
		});

		if (!profile) {
			throw new ProfileError('Perfil no encontrado');
		}

		profileLogger.info('✅ Perfil obtenido:', profile.name);
		return profile;
	} catch (error) {
		profileLogger.error('❌ Error al obtener perfil:', error);
		if (error instanceof ProfileError) {
			throw error;
		}
		throw new ProfileError('No se pudo obtener el perfil', error);
	}
}

export async function createProfile(data: ProfileCreate) {
	try {
		profileLogger.info('📝 Creando nuevo perfil:', data.name);

		// Si se está creando el primer perfil o se indica que debe estar activo
		const shouldBeActive = data.isActive === true;

		// Si este perfil será activo, primero desactivamos cualquier otro
		if (shouldBeActive) {
			await prisma.profile.updateMany({
				where: {
					isActive: true,
				},
				data: {
					isActive: false,
				},
			});
		}

		// Luego creamos el perfil con isActive según corresponda
		const profile = await prisma.profile.create({
			data: {
				...data,
				isActive: shouldBeActive,
			},
		});

		profileLogger.info('✅ Perfil creado:', profile.name);
		await revalidateAllPaths();
		return profile;
	} catch (error) {
		profileLogger.error('❌ Error al crear perfil:', error);
		throw new ProfileError('No se pudo crear el perfil', error);
	}
}

export async function updateProfile(id: string, data: ProfileUpdate) {
	try {
		profileLogger.info('📝 Actualizando perfil:', id);
		const profile = await prisma.profile.update({
			where: { id },
			data,
		});
		profileLogger.info('✅ Perfil actualizado:', profile.name);
		await revalidateAllPaths();
		return profile;
	} catch (error) {
		profileLogger.error('❌ Error al actualizar perfil:', error);
		throw new ProfileError('No se pudo actualizar el perfil', error);
	}
}

export async function deleteProfile(id: string) {
	try {
		profileLogger.info('🗑️ Eliminando perfil:', id);
		await prisma.profile.delete({
			where: { id },
		});
		profileLogger.info('✅ Perfil eliminado');
		await revalidateAllPaths();
	} catch (error) {
		profileLogger.error('❌ Error al eliminar perfil:', error);
		throw new ProfileError('No se pudo eliminar el perfil', error);
	}
}

export async function activateProfile(id: string) {
	try {
		profileLogger.info('🔔 Activando perfil:', id);
		// Primero desactivamos todos los perfiles
		await prisma.profile.updateMany({
			where: {
				isActive: true,
			},
			data: {
				isActive: false,
			},
		});

		// Luego activamos el perfil seleccionado
		const profile = await prisma.profile.update({
			where: { id },
			data: {
				isActive: true,
			},
		});

		profileLogger.info('✅ Perfil activado:', profile.name);
		await revalidateAllPaths();
		return profile;
	} catch (error) {
		profileLogger.error('❌ Error al activar perfil:', error);
		throw new ProfileError('No se pudo activar el perfil', error);
	}
}

export async function getActiveProfile() {
	try {
		profileLogger.info('🔍 Obteniendo perfil activo');
		const profile = await prisma.profile.findFirst({
			where: {
				isActive: true,
			},
		});

		if (!profile) {
			throw new ProfileError('No hay perfil activo');
		}

		profileLogger.info('✅ Perfil activo obtenido:', profile.name);
		return profile;
	} catch (error) {
		profileLogger.error('❌ Error al obtener perfil activo:', error);
		if (error instanceof ProfileError) {
			throw error;
		}
		throw new ProfileError('No se pudo obtener el perfil activo', error);
	}
}
