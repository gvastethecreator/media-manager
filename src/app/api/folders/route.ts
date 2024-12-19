import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { computeHash } from '@/lib/server-utils'
import { getImageMetadata } from '@/lib/image.server'

export async function POST(request: NextRequest) {
  try {
    const { path: folderPath } = await request.json()

    // Verificar si la carpeta ya existe
    const existingFolder = await prisma.folder.findUnique({
      where: { path: folderPath }
    })

    if (existingFolder) {
      return NextResponse.json(
        { error: 'Folder already exists' },
        { status: 400 }
      )
    }

    // Crear la carpeta en la base de datos
    const folder = await prisma.folder.create({
      data: {
        path: folderPath,
        name: folderPath.split('\\').pop() || folderPath,
      }
    })

    // Leer los archivos de la carpeta
    const files = readdirSync(folderPath)
      .map(file => {
        const filePath = join(folderPath, file)
        const stats = statSync(filePath)
        return {
          path: filePath,
          name: file,
          size: stats.size,
          isDirectory: stats.isDirectory()
        }
      })
      .filter(file => !file.isDirectory && /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name))

    // Actualizar estadísticas de la carpeta
    await prisma.folder.update({
      where: { id: folder.id },
      data: {
        totalFiles: files.length,
        totalSize: files.reduce((acc, file) => acc + file.size, 0)
      }
    })

    // Indexar las imágenes
    for (const file of files) {
      try {
        const hash = await computeHash(file.path)
        const metadata = await getImageMetadata(file.path)

        // Limpiar la metadata eliminando valores undefined
        const cleanMetadata = JSON.parse(JSON.stringify(metadata))

        await prisma.image.create({
          data: {
            name: file.name,
            path: file.path,
            hash,
            size: file.size,
            mimeType: `image/${extname(file.path).slice(1)}`,
            metadata: JSON.stringify(cleanMetadata),
            folderId: folder.id,
            isPublic: false,
            width: metadata.dimensions?.width || 0,
            height: metadata.dimensions?.height || 0
          }
        })
      } catch (error) {
        console.error(`Error indexando imagen: ${file.path}`, error)
      }
    }

    return NextResponse.json(folder)
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      { error: 'Error creating folder' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const folders = await prisma.folder.findMany({
      select: {
        id: true,
        name: true,
        path: true,
        isWatched: true,
        totalFiles: true,
        totalSize: true,
        _count: {
          select: {
            images: true
          }
        }
      }
    })

    return NextResponse.json(folders)
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json(
      { error: 'Error fetching folders' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error('Error en DELETE /api/folders:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
