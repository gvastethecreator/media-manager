import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { existsSync } from 'fs'
import { mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    // Crear una carpeta de prueba
    const testPath = join(process.cwd(), 'test-folder');

    if (!existsSync(testPath)) {
      await mkdir(testPath, { recursive: true });
    }

    // Crear una entrada en la base de datos
    const folder = await prisma.folder.create({
      data: {
        name: 'test-folder',
        path: testPath,
        isWatched: false,
        totalFiles: 0,
        totalSize: 0,
        lastIndexed: new Date()
      }
    });

    return new NextResponse(JSON.stringify({
      success: true,
      folder,
      message: 'Carpeta de prueba creada correctamente'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creando carpeta de prueba:', error);
    return new NextResponse(JSON.stringify({
      error: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}