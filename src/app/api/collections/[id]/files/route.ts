import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const body = await request.json();
    const fileId = body.fileId;

    if (!fileId) {
      return NextResponse.json(
        { error: "ID de archivo no proporcionado" },
        { status: 400 }
      );
    }

    // Verificar que la colección existe
    const collection = await prisma.collection.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        emoji: true,
        color: true,
        files: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Colección no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si el archivo ya está en la colección
    const isFileInCollection = collection.files.some(
      (file) => file.id === fileId
    );

    if (isFileInCollection) {
      return NextResponse.json(
        { error: "El archivo ya está en la colección" },
        { status: 400 }
      );
    }

    // Verificar que el archivo existe
    const file = await prisma.image.findUnique({
      where: { id: fileId },
      select: { id: true },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Archivo no encontrado" },
        { status: 404 }
      );
    }

    // Agregar el archivo a la colección
    await prisma.collection.update({
      where: { id },
      data: {
        files: {
          connect: { id: fileId },
        },
      },
    });

    // Retornar la información de la colección
    return NextResponse.json({
      success: true,
      collection: {
        id: collection.id,
        name: collection.name,
        emoji: collection.emoji,
        color: collection.color,
      },
    });
  } catch (error) {
    console.error("Error adding file to collection:", error);
    return NextResponse.json(
      { error: "Error al agregar archivo a la colección" },
      { status: 500 }
    );
  }
}
