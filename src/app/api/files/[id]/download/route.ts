import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import mime from "mime-types";

export async function GET(
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
        name: true,
        metadata: true,
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Archivo no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el archivo existe
    const fileStat = await stat(file.path);
    if (!fileStat.isFile()) {
      return NextResponse.json(
        { error: "Archivo no encontrado en el sistema" },
        { status: 404 }
      );
    }

    // Crear stream de lectura
    const fileStream = createReadStream(file.path);

    // Determinar el tipo MIME
    let metadata = {};
    try {
      metadata = file.metadata ? JSON.parse(file.metadata) : {};
    } catch (e) {
      console.warn("Error parsing metadata:", e);
    }

    const mimeType =
      metadata.mimeType || mime.lookup(file.path) || "application/octet-stream";

    // Actualizar estadísticas de descarga
    await prisma.imageStats.upsert({
      where: { imageId: id },
      update: {
        downloads: {
          increment: 1,
        },
      },
      create: {
        imageId: id,
        downloads: 1,
        views: 0,
      },
    });

    // Configurar headers para la descarga
    const headers = new Headers();
    headers.set("Content-Type", mimeType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(file.name)}"`
    );
    headers.set("Content-Length", fileStat.size.toString());

    return new NextResponse(fileStream as any, {
      headers,
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      { error: "Error al descargar el archivo" },
      { status: 500 }
    );
  }
}