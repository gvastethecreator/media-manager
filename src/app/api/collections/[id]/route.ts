import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { images: true }
        },
        images: {
          select: { size: true }
        }
      }
    })

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...collection,
      filters: JSON.parse(collection.filters)
    })
  } catch (error) {
    console.error('Error getting collection:', error)
    return NextResponse.json(
      { error: 'Error getting collection' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const updateData = { ...data }
    
    if (data.filters) {
      updateData.filters = JSON.stringify(data.filters)
    }

    const collection = await prisma.collection.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({
      ...collection,
      filters: JSON.parse(collection.filters)
    })
  } catch (error) {
    console.error('Error updating collection:', error)
    return NextResponse.json(
      { error: 'Error updating collection' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.collection.delete({
      where: { id: params.id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting collection:', error)
    return NextResponse.json(
      { error: 'Error deleting collection' },
      { status: 500 }
    )
  }
}
