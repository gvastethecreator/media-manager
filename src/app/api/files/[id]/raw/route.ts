import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      throw new Error("ID no proporcionado");
    }

    const file = await prisma.image.findUnique({
      where: { id },
      select: {
        path: true,
        metadata: true
      },
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

    // Leer el archivo
    const fileBuffer = await fs.readFile(file.path);

    // Determinar el tipo MIME
    const mimeType = file.metadata?.mimeType || "application/octet-stream";

    // Devolver el archivo con el tipo MIME correcto
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${path.basename(file.path)}"`,
      },
    });
  } catch (error) {
    console.error("Error getting raw file:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Error al obtener el archivo",
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