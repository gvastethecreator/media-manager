import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: params.id }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error getting profile:', error)
    return NextResponse.json(
      { error: 'Error getting profile' },
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
    const profile = await prisma.profile.update({
      where: { id: params.id },
      data
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Error updating profile' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // No permitir eliminar el último perfil activo
    const activeProfiles = await prisma.profile.count({
      where: { isActive: true }
    })

    const profileToDelete = await prisma.profile.findUnique({
      where: { id: params.id }
    })

    if (activeProfiles === 1 && profileToDelete?.isActive) {
      return NextResponse.json(
        { error: 'Cannot delete the last active profile' },
        { status: 400 }
      )
    }

    await prisma.profile.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting profile:', error)
    return NextResponse.json(
      { error: 'Error deleting profile' },
      { status: 500 }
    )
  }
}
