import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST(
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
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Archivo no encontrado" },
        { status: 404 }
      );
    }

    // Obtener el directorio del archivo
    const directory = path.dirname(file.path);

    // Comando específico para Windows
    const command = `explorer "${directory}"`;

    // Ejecutar el comando
    await execAsync(command);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error opening file location:", error);
    return NextResponse.json(
      { error: "Error al abrir la ubicación del archivo" },
      { status: 500 }
    );
  }
}