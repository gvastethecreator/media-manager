import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tag = await prisma.tag.findUnique({
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

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(tag)
  } catch (error) {
    console.error('Error getting tag:', error)
    return NextResponse.json(
      { error: 'Error getting tag' },
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
    const tag = await prisma.tag.update({
      where: { id: params.id },
      data
    })

    return NextResponse.json(tag)
  } catch (error) {
    console.error('Error updating tag:', error)
    return NextResponse.json(
      { error: 'Error updating tag' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.tag.delete({
      where: { id: params.id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { error: 'Error deleting tag' },
      { status: 500 }
    )
  }
}
