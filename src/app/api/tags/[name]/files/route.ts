import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const files = await prisma.file.findMany({
      where: {
        tags: {
          some: {
            name: params.name
          }
        }
      },
      include: {
        folder: true,
        collections: true,
        tags: true
      }
    })

    return NextResponse.json(files.map(file => ({
      id: file.id,
      name: file.name,
      path: file.path,
      size: file.size,
      type: file.mimeType,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      collections: file.collections,
      tags: file.tags,
      folder: file.folder
    })))
  } catch (error) {
    console.error('Error fetching tagged files:', error)
    return NextResponse.json({ error: 'Error fetching tagged files' }, { status: 500 })
  }
}
