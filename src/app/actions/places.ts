"use server";

import { prisma } from "@/lib/prisma";
import type { PlaceCreate, PlaceUpdate } from "@/services/place.service";
import { revalidatePath } from "next/cache";

export async function getPlaces() {
  try {
    const places = await prisma.place.findMany({
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    const placesWithStats = await Promise.all(
      places.map(async (place) => {
        const totalSize = await prisma.image.aggregate({
          where: {
            places: {
              some: {
                id: place.id,
              },
            },
          },
          _sum: {
            size: true,
          },
        });

        return {
          ...place,
          totalSize: totalSize._sum.size || 0,
        };
      })
    );

    return placesWithStats;
  } catch (error) {
    console.error("Error al obtener lugares:", error);
    throw new Error("No se pudieron obtener los lugares");
  }
}

export async function getPlace(id: string) {
  try {
    const place = await prisma.place.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (!place) {
      throw new Error("Lugar no encontrado");
    }

    const totalSize = await prisma.image.aggregate({
      where: {
        places: {
          some: {
            id: place.id,
          },
        },
      },
      _sum: {
        size: true,
      },
    });

    return {
      ...place,
      totalSize: totalSize._sum.size || 0,
    };
  } catch (error) {
    console.error("Error al obtener lugar:", error);
    throw new Error("No se pudo obtener el lugar");
  }
}

export async function createPlace(data: PlaceCreate) {
  try {
    await prisma.place.create({
      data,
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al crear lugar:", error);
    throw new Error("No se pudo crear el lugar");
  }
}

export async function updatePlace(id: string, data: PlaceUpdate) {
  try {
    await prisma.place.update({
      where: { id },
      data,
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al actualizar lugar:", error);
    throw new Error("No se pudo actualizar el lugar");
  }
}

export async function deletePlace(id: string) {
  try {
    await prisma.place.delete({
      where: { id },
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al eliminar lugar:", error);
    throw new Error("No se pudo eliminar el lugar");
  }
}

export async function getPlaceImages(id: string) {
  try {
    const images = await prisma.image.findMany({
      where: {
        places: {
          some: {
            id,
          },
        },
      },
    });
    return images;
  } catch (error) {
    console.error("Error al obtener imágenes del lugar:", error);
    throw new Error("No se pudieron obtener las imágenes del lugar");
  }
}

export async function addImageToPlace(placeId: string, imageId: string) {
  try {
    await prisma.place.update({
      where: { id: placeId },
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
    console.error("Error al agregar imagen al lugar:", error);
    throw new Error("No se pudo agregar la imagen al lugar");
  }
}

export async function removeImageFromPlace(placeId: string, imageId: string) {
  try {
    await prisma.place.update({
      where: { id: placeId },
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
    console.error("Error al eliminar imagen del lugar:", error);
    throw new Error("No se pudo eliminar la imagen del lugar");
  }
}