"use server";

import { prisma } from "@/lib/prisma";
import type { CharacterCreate, CharacterUpdate } from "@/services/character.service";
import { revalidatePath } from "next/cache";

export async function getCharacters() {
  try {
    const characters = await prisma.character.findMany({
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    const charactersWithStats = await Promise.all(
      characters.map(async (character) => {
        const totalSize = await prisma.image.aggregate({
          where: {
            characters: {
              some: {
                id: character.id,
              },
            },
          },
          _sum: {
            size: true,
          },
        });

        return {
          ...character,
          totalSize: totalSize._sum.size || 0,
        };
      })
    );

    return charactersWithStats;
  } catch (error) {
    console.error("Error al obtener personajes:", error);
    throw new Error("No se pudieron obtener los personajes");
  }
}

export async function getCharacter(id: string) {
  try {
    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (!character) {
      throw new Error("Personaje no encontrado");
    }

    const totalSize = await prisma.image.aggregate({
      where: {
        characters: {
          some: {
            id: character.id,
          },
        },
      },
      _sum: {
        size: true,
      },
    });

    return {
      ...character,
      totalSize: totalSize._sum.size || 0,
    };
  } catch (error) {
    console.error("Error al obtener personaje:", error);
    throw new Error("No se pudo obtener el personaje");
  }
}

export async function createCharacter(data: CharacterCreate) {
  try {
    await prisma.character.create({
      data,
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al crear personaje:", error);
    throw new Error("No se pudo crear el personaje");
  }
}

export async function updateCharacter(id: string, data: CharacterUpdate) {
  try {
    await prisma.character.update({
      where: { id },
      data,
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al actualizar personaje:", error);
    throw new Error("No se pudo actualizar el personaje");
  }
}

export async function deleteCharacter(id: string) {
  try {
    await prisma.character.delete({
      where: { id },
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al eliminar personaje:", error);
    throw new Error("No se pudo eliminar el personaje");
  }
}

export async function getCharacterImages(id: string) {
  try {
    const images = await prisma.image.findMany({
      where: {
        characters: {
          some: {
            id,
          },
        },
      },
    });
    return images;
  } catch (error) {
    console.error("Error al obtener imágenes del personaje:", error);
    throw new Error("No se pudieron obtener las imágenes del personaje");
  }
}

export async function addImageToCharacter(characterId: string, imageId: string) {
  try {
    await prisma.character.update({
      where: { id: characterId },
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
    console.error("Error al agregar imagen al personaje:", error);
    throw new Error("No se pudo agregar la imagen al personaje");
  }
}

export async function removeImageFromCharacter(characterId: string, imageId: string) {
  try {
    await prisma.character.update({
      where: { id: characterId },
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
    console.error("Error al eliminar imagen del personaje:", error);
    throw new Error("No se pudo eliminar la imagen del personaje");
  }
}