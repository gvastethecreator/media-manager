"use server";

import { prisma } from "@/lib/prisma";
import type { ProfileCreate, ProfileUpdate } from "@/services/profile.service";
import { revalidatePath } from "next/cache";

export async function getProfiles() {
  try {
    const profiles = await prisma.profile.findMany({
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    const profilesWithStats = await Promise.all(
      profiles.map(async (profile) => {
        const totalSize = await prisma.image.aggregate({
          where: {
            profiles: {
              some: {
                id: profile.id,
              },
            },
          },
          _sum: {
            size: true,
          },
        });

        return {
          ...profile,
          totalSize: totalSize._sum.size || 0,
        };
      })
    );

    return profilesWithStats;
  } catch (error) {
    console.error("Error al obtener perfiles:", error);
    throw new Error("No se pudieron obtener los perfiles");
  }
}

export async function getProfile(id: string) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (!profile) {
      throw new Error("Perfil no encontrado");
    }

    const totalSize = await prisma.image.aggregate({
      where: {
        profiles: {
          some: {
            id: profile.id,
          },
        },
      },
      _sum: {
        size: true,
      },
    });

    return {
      ...profile,
      totalSize: totalSize._sum.size || 0,
    };
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    throw new Error("No se pudo obtener el perfil");
  }
}

export async function createProfile(data: ProfileCreate) {
  try {
    await prisma.profile.create({
      data,
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al crear perfil:", error);
    throw new Error("No se pudo crear el perfil");
  }
}

export async function updateProfile(id: string, data: ProfileUpdate) {
  try {
    await prisma.profile.update({
      where: { id },
      data,
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    throw new Error("No se pudo actualizar el perfil");
  }
}

export async function deleteProfile(id: string) {
  try {
    await prisma.profile.delete({
      where: { id },
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al eliminar perfil:", error);
    throw new Error("No se pudo eliminar el perfil");
  }
}

export async function getProfileImages(id: string) {
  try {
    const images = await prisma.image.findMany({
      where: {
        profiles: {
          some: {
            id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        path: true,
        size: true,
        createdAt: true,
        updatedAt: true,
        hash: true,
        width: true,
        height: true,
        metadata: true,
        thumbnail: true,
        type: true,
        folderId: true,
      },
    });
    return images.map(image => ({
      ...image,
      type: "image" as const
    }));
  } catch (error) {
    console.error("Error al obtener imágenes del perfil:", error);
    throw new Error("No se pudieron obtener las imágenes del perfil");
  }
}

export async function addImageToProfile(profileId: string, imageId: string) {
  try {
    await prisma.profile.update({
      where: { id: profileId },
      data: {
        images: {
          connect: {
            id: imageId,
          },
        },
      },
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al agregar imagen al perfil:", error);
    throw new Error("No se pudo agregar la imagen al perfil");
  }
}

export async function removeImageFromProfile(profileId: string, imageId: string) {
  try {
    await prisma.profile.update({
      where: { id: profileId },
      data: {
        images: {
          disconnect: {
            id: imageId,
          },
        },
      },
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al eliminar imagen del perfil:", error);
    throw new Error("No se pudo eliminar la imagen del perfil");
  }
}