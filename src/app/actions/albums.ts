"use server";

import { prisma } from "@/lib/prisma";
import type { AlbumCreate, AlbumUpdate } from "@/services/album.service";
import { revalidatePath } from "next/cache";

export async function getAlbums() {
  try {
    const albums = await prisma.album.findMany({
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    const albumsWithStats = await Promise.all(
      albums.map(async (album) => {
        const totalSize = await prisma.image.aggregate({
          where: {
            albums: {
              some: {
                id: album.id,
              },
            },
          },
          _sum: {
            size: true,
          },
        });

        return {
          ...album,
          totalSize: totalSize._sum.size || 0,
        };
      })
    );

    return albumsWithStats;
  } catch (error) {
    console.error("Error al obtener álbumes:", error);
    throw new Error("No se pudieron obtener los álbumes");
  }
}

export async function getAlbum(id: string) {
  try {
    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (!album) {
      throw new Error("Álbum no encontrado");
    }

    const totalSize = await prisma.image.aggregate({
      where: {
        albums: {
          some: {
            id: album.id,
          },
        },
      },
      _sum: {
        size: true,
      },
    });

    return {
      ...album,
      totalSize: totalSize._sum.size || 0,
    };
  } catch (error) {
    console.error("Error al obtener álbum:", error);
    throw new Error("No se pudo obtener el álbum");
  }
}

export async function createAlbum(data: AlbumCreate) {
  try {
    await prisma.album.create({
      data,
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al crear álbum:", error);
    throw new Error("No se pudo crear el álbum");
  }
}

export async function updateAlbum(id: string, data: AlbumUpdate) {
  try {
    await prisma.album.update({
      where: { id },
      data,
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al actualizar álbum:", error);
    throw new Error("No se pudo actualizar el álbum");
  }
}

export async function deleteAlbum(id: string) {
  try {
    await prisma.album.delete({
      where: { id },
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al eliminar álbum:", error);
    throw new Error("No se pudo eliminar el álbum");
  }
}

export async function getAlbumImages(id: string) {
  try {
    const images = await prisma.image.findMany({
      where: {
        albums: {
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
    console.error("Error al obtener imágenes del álbum:", error);
    throw new Error("No se pudieron obtener las imágenes del álbum");
  }
}

export async function addImageToAlbum(albumId: string, imageId: string) {
  try {
    await prisma.album.update({
      where: { id: albumId },
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
    console.error("Error al agregar imagen al álbum:", error);
    throw new Error("No se pudo agregar la imagen al álbum");
  }
}

export async function removeImageFromAlbum(albumId: string, imageId: string) {
  try {
    await prisma.album.update({
      where: { id: albumId },
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
    console.error("Error al eliminar imagen del álbum:", error);
    throw new Error("No se pudo eliminar la imagen del álbum");
  }
}