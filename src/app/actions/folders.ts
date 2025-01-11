"use server";

import { prisma } from "@/lib/prisma";
import type { FolderCreate, FolderUpdate } from "@/services/folder.service";
import { revalidatePath } from "next/cache";

export async function getFolders() {
  try {
    const folders = await prisma.folder.findMany({
      include: {
        _count: {
          select: {
            images: true,
            subfolders: true,
          },
        },
        parent: true,
      },
    });

    const foldersWithStats = await Promise.all(
      folders.map(async (folder) => {
        const totalSize = await prisma.image.aggregate({
          where: {
            folderId: folder.id,
          },
          _sum: {
            size: true,
          },
        });

        return {
          ...folder,
          totalSize: totalSize._sum.size || 0,
        };
      })
    );

    return foldersWithStats;
  } catch (error) {
    console.error("Error al obtener carpetas:", error);
    throw new Error("No se pudieron obtener las carpetas");
  }
}

export async function getFolder(id: string) {
  try {
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            images: true,
            subfolders: true,
          },
        },
        parent: true,
      },
    });

    if (!folder) {
      throw new Error("Carpeta no encontrada");
    }

    const totalSize = await prisma.image.aggregate({
      where: {
        folderId: folder.id,
      },
      _sum: {
        size: true,
      },
    });

    return {
      ...folder,
      totalSize: totalSize._sum.size || 0,
    };
  } catch (error) {
    console.error("Error al obtener carpeta:", error);
    throw new Error("No se pudo obtener la carpeta");
  }
}

export async function createFolder(data: FolderCreate) {
  try {
    await prisma.folder.create({
      data,
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al crear carpeta:", error);
    throw new Error("No se pudo crear la carpeta");
  }
}

export async function updateFolder(id: string, data: FolderUpdate) {
  try {
    await prisma.folder.update({
      where: { id },
      data,
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al actualizar carpeta:", error);
    throw new Error("No se pudo actualizar la carpeta");
  }
}

export async function deleteFolder(id: string) {
  try {
    await prisma.folder.delete({
      where: { id },
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al eliminar carpeta:", error);
    throw new Error("No se pudo eliminar la carpeta");
  }
}

export async function getFolderImages(id: string) {
  try {
    const images = await prisma.image.findMany({
      where: {
        folderId: id,
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
    console.error("Error al obtener imágenes de la carpeta:", error);
    throw new Error("No se pudieron obtener las imágenes de la carpeta");
  }
}

export async function getFolderSubfolders(id: string) {
  try {
    const subfolders = await prisma.folder.findMany({
      where: {
        parentId: id,
      },
      include: {
        _count: {
          select: {
            images: true,
            subfolders: true,
          },
        },
      },
    });

    const subfoldersWithStats = await Promise.all(
      subfolders.map(async (folder) => {
        const totalSize = await prisma.image.aggregate({
          where: {
            folderId: folder.id,
          },
          _sum: {
            size: true,
          },
        });

        return {
          ...folder,
          totalSize: totalSize._sum.size || 0,
        };
      })
    );

    return subfoldersWithStats;
  } catch (error) {
    console.error("Error al obtener subcarpetas:", error);
    throw new Error("No se pudieron obtener las subcarpetas");
  }
}

export async function moveFolder(id: string, parentId: string | null) {
  try {
    await prisma.folder.update({
      where: { id },
      data: {
        parentId,
      },
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al mover carpeta:", error);
    throw new Error("No se pudo mover la carpeta");
  }
}

export async function moveImageToFolder(imageId: string, folderId: string) {
  try {
    await prisma.image.update({
      where: { id: imageId },
      data: {
        folderId,
      },
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error al mover imagen:", error);
    throw new Error("No se pudo mover la imagen");
  }
}