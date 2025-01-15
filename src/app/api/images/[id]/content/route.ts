import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";
import path from "path";
import sharp from "sharp";
import { FileMetadata } from "@/types/file-item";

const apiLogger = logger.withContext("ImageAPI");

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const image = await prisma.image.findUnique({
      where: { id: params.id },
      select: {
        path: true,
        metadata: true,
      },
    });

    if (!image) {
      return new NextResponse("Imagen no encontrada", { status: 404 });
    }

    // Verificar que el archivo existe
    if (!existsSync(image.path)) {
      return new NextResponse("Archivo no encontrado", { status: 404 });
    }

    // Obtener metadata
    let metadata: FileMetadata = {};
    try {
      metadata = JSON.parse(image.metadata || "{}") as FileMetadata;
    } catch (error) {
      apiLogger.warn("Error parsing metadata:", error);
    }

    // Leer el archivo
    const buffer = await readFile(image.path);

    // Procesar la imagen si es necesario
    const processedBuffer = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF
      .withMetadata() // Preserve metadata
      .toBuffer();

    // Determinar el tipo MIME
    const mimeType = metadata.mimeType || "image/jpeg";

    // Configurar headers
    const headers = new Headers();
    headers.set("Content-Type", mimeType);
    headers.set("Content-Length", processedBuffer.length.toString());
    headers.set("Cache-Control", "public, max-age=31536000"); // 1 año
    headers.set("ETag", `"${params.id}"`);

    // Registrar actividad
    await prisma.activity.create({
      data: {
        type: "IMAGE_VIEW",
        description: "Image viewed",
        imageId: params.id,
      },
    });

    return new NextResponse(processedBuffer, { headers });
  } catch (error) {
    apiLogger.error("Error serving image:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}