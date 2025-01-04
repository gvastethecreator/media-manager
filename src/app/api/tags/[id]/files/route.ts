import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const tagId = params.id;

    if (!data?.fileId || typeof data.fileId !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ID de archivo no proporcionado o inválido",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { fileId } = data;

    // Verificar que el tag existe
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
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
      return new Response(
        JSON.stringify({
          success: false,
          error: "Tag no encontrado",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Verificar si el archivo ya tiene el tag
    const isFileTagged = tag.files.some((file) => file.id === fileId);

    if (isFileTagged) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "El archivo ya tiene este tag",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Verificar que el archivo existe
    const file = await prisma.image.findUnique({
      where: { id: fileId },
      select: { id: true },
    });

    if (!file) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Archivo no encontrado",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Agregar el tag al archivo
    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: {
        files: {
          connect: { id: fileId },
        },
      },
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: {
            files: true,
          },
        },
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        tag: {
          ...updatedTag,
          count: updatedTag._count.files,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error adding tag to file:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al agregar etiqueta al archivo",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}