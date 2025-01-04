import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Asegurarnos de que tenemos el ID
    const { id } = params;
    if (!id) {
      throw new Error("ID no proporcionado");
    }

    const file = await prisma.image.findUnique({
      where: { id },
      select: { path: true },
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

    // Normalizar la ruta para Windows
    const filePath = process.platform === "win32"
      ? file.path.replace(/\//g, "\\")
      : file.path;

    // Construir el comando según el sistema operativo
    let command;
    if (process.platform === "win32") {
      // En Windows, usamos PowerShell para manejar mejor las rutas
      command = `powershell -Command "explorer.exe /select,'${filePath}'"`;
    } else if (process.platform === "darwin") {
      command = `open -R "${filePath}"`;
    } else {
      command = `xdg-open "${path.dirname(filePath)}"`;
    }

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.warn("Command stderr:", stderr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Ubicación abierta correctamente",
        path: filePath,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error opening file location:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Error al abrir la ubicación del archivo",
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