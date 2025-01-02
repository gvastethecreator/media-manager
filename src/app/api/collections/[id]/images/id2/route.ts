import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; id2: string } }
) {
  try {
    await prisma.collection.update({
      where: { id: params.id },
      data: {
        images: {
          connect: { id: params.id2 }
        }
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error adding image to collection:', error)
    return NextResponse.json(
      { error: 'Error adding image to collection' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; id2: string } }
) {
  try {
    await prisma.collection.update({
      where: { id: params.id },
      data: {
        images: {
          disconnect: { id: params.id2 }
        }
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error removing image from collection:', error)
    return NextResponse.json(
      { error: 'Error removing image from collection' },
      { status: 500 }
    )
  }
}
