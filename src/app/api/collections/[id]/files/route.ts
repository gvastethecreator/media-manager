import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const collectionId = params.id;

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

    // Verificar que la colección existe
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        images: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!collection) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Colección no encontrada",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Verificar si el archivo ya está en la colección
    const isFileInCollection = collection.images.some(
      (file: any) => file.id === fileId
    );

    if (isFileInCollection) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "El archivo ya está en la colección",
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

    // Agregar el archivo a la colección
    const updatedCollection = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        images: {
          connect: { id: fileId },
        },
      },
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        collection: {
          id: updatedCollection.id,
          name: updatedCollection.name,
          emoji: updatedCollection.emoji,
          color: updatedCollection.color,
          count: updatedCollection._count.images,
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
    console.error("Error adding file to collection:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error al agregar archivo a la colección",
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
