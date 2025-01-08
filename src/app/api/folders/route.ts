import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { existsSync } from 'fs'
import { fsService } from '@/services/fs.server'

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json()

    if (!path) {
      return NextResponse.json({ error: 'PATH_REQUIRED' }, { status: 400 })
    }

    // Validar y normalizar la ruta
    const normalizedPath = fsService.normalizePath(path)
    console.log('Path normalizado:', { original: path, normalized: normalizedPath })

    if (!existsSync(normalizedPath)) {
      return NextResponse.json({ error: 'PATH_NOT_FOUND' }, { status: 404 })
    }

    // Verificar si la carpeta ya existe
    const existingFolder = await prisma.folder.findFirst({
      where: { path: normalizedPath }
    })

    if (existingFolder) {
      return NextResponse.json(
        { error: 'FOLDER_EXISTS', message: 'La carpeta ya está indexada' },
        { status: 409 }
      )
    }

    // Crear carpeta en la base de datos
    const folder = await prisma.folder.create({
      data: {
        path: normalizedPath,
        name: normalizedPath.split('\\').pop() || normalizedPath,
        lastIndexed: new Date()
      }
    })

    console.log('Carpeta creada:', folder)
    return NextResponse.json(folder)

  } catch (error) {
    console.error('Error en POST /api/folders:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const sort = searchParams.get('sort') || 'updatedAt'
    const order = searchParams.get('order') || 'desc'

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { path: { contains: search } }
        ]
      }),
      ...(status && { status })
    }

    const folders = await prisma.folder.findMany({
      where,
      include: {
        _count: {
          select: { images: true }
        }
      },
      orderBy: { [sort]: order }
    })

    return NextResponse.json(folders)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar la conexión a la base de datos
    await prisma.$connect()

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('id')

    if (!folderId) {
      return NextResponse.json(
        { error: 'ID de carpeta no proporcionado' },
        { status: 400 }
      )
    }

    // Verificar que la carpeta existe
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    })

    if (!folder) {
      return NextResponse.json(
        { error: 'Carpeta no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar la carpeta y sus imágenes (en cascada)
    await prisma.folder.delete({
      where: { id: folderId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error en DELETE /api/folders:', error)

    // Verificar si es un error de Prisma
    if (error.code === 'P1001') {
      return NextResponse.json(
        { error: 'Database connection error', details: error.message },
        { status: 503 }
      )
    }

    // Para otros errores de Prisma
    if (error.code?.startsWith('P')) {
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      )
    }

    // Error genérico
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  } finally {
    // Asegurarse de desconectar
    await prisma.$disconnect()
  }
}
