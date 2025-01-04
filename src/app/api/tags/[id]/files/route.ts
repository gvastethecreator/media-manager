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

    // Verificar que la etiqueta existe
    const tag = await prisma.tag.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        color: true,
        files: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!tag) {
      return NextResponse.json(
        { error: "Etiqueta no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si el archivo ya tiene la etiqueta
    const isFileTagged = tag.files.some((file) => file.id === fileId);

    if (isFileTagged) {
      return NextResponse.json(
        { error: "El archivo ya tiene esta etiqueta" },
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

    // Agregar la etiqueta al archivo
    await prisma.tag.update({
      where: { id },
      data: {
        files: {
          connect: { id: fileId },
        },
      },
    });

    // Retornar la información de la etiqueta
    return NextResponse.json({
      success: true,
      tag: {
        id: tag.id,
        name: tag.name,
        color: tag.color,
      },
    });
  } catch (error) {
    console.error("Error adding tag to file:", error);
    return NextResponse.json(
      { error: "Error al agregar etiqueta al archivo" },
      { status: 500 }
    );
  }
}