import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Obtener la información del archivo
    const file = await prisma.image.findUnique({
      where: { id },
      select: {
        path: true,
        thumbnail: true,
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Archivo no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el archivo físico
    try {
      await unlink(file.path);
    } catch (error) {
      console.warn("Error deleting physical file:", error);
    }

    // Eliminar la miniatura si existe
    if (file.thumbnail) {
      try {
        await unlink(file.thumbnail);
      } catch (error) {
        console.warn("Error deleting thumbnail:", error);
      }
    }

    // Eliminar el registro de la base de datos y sus relaciones
    await prisma.image.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Error al eliminar el archivo" },
      { status: 500 }
    );
  }
}