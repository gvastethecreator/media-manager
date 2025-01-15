"use server";

import { prisma } from "@/lib/prisma";
import type { ProfileCreate, ProfileUpdate } from "@/services/profile.service";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

const profileLogger = logger.withContext('ProfileActions');

const REVALIDATE_PATHS = [
  '/settings',
  '/profiles',
  '/profiles/[id]'
] as const;

const revalidateAllPaths = () => {
  REVALIDATE_PATHS.forEach(path => revalidatePath(path));
  profileLogger.info('🔄 Rutas revalidadas');
};

class ProfileError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'ProfileError';
  }
}

export async function getProfiles() {
  try {
    profileLogger.info('👥 Obteniendo lista de perfiles');
    const profiles = await prisma.profile.findMany();
    profileLogger.info(`✅ ${profiles.length} perfiles obtenidos`);
    return profiles;
  } catch (error) {
    profileLogger.error("❌ Error al obtener perfiles:", error);
    throw new ProfileError("No se pudieron obtener los perfiles", error);
  }
}

export async function getProfile(id: string) {
  try {
    profileLogger.info('🔍 Obteniendo perfil:', id);
    const profile = await prisma.profile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new ProfileError("Perfil no encontrado");
    }

    profileLogger.info('✅ Perfil obtenido:', profile.name);
    return profile;
  } catch (error) {
    profileLogger.error("❌ Error al obtener perfil:", error);
    if (error instanceof ProfileError) throw error;
    throw new ProfileError("No se pudo obtener el perfil", error);
  }
}

export async function createProfile(data: ProfileCreate) {
  try {
    profileLogger.info('📝 Creando nuevo perfil:', data.name);
    const profile = await prisma.profile.create({
      data,
    });
    profileLogger.info('✅ Perfil creado:', profile.name);
    revalidateAllPaths();
    return profile;
  } catch (error) {
    profileLogger.error("❌ Error al crear perfil:", error);
    throw new ProfileError("No se pudo crear el perfil", error);
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
    revalidateAllPaths();
    return profile;
  } catch (error) {
    profileLogger.error("❌ Error al actualizar perfil:", error);
    throw new ProfileError("No se pudo actualizar el perfil", error);
  }
}

export async function deleteProfile(id: string) {
  try {
    profileLogger.info('🗑️ Eliminando perfil:', id);
    await prisma.profile.delete({
      where: { id },
    });
    profileLogger.info('✅ Perfil eliminado');
    revalidateAllPaths();
  } catch (error) {
    profileLogger.error("❌ Error al eliminar perfil:", error);
    throw new ProfileError("No se pudo eliminar el perfil", error);
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
    revalidateAllPaths();
    return profile;
  } catch (error) {
    profileLogger.error("❌ Error al activar perfil:", error);
    throw new ProfileError("No se pudo activar el perfil", error);
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
      throw new ProfileError("No hay perfil activo");
    }

    profileLogger.info('✅ Perfil activo obtenido:', profile.name);
    return profile;
  } catch (error) {
    profileLogger.error("❌ Error al obtener perfil activo:", error);
    if (error instanceof ProfileError) throw error;
    throw new ProfileError("No se pudo obtener el perfil activo", error);
  }
}