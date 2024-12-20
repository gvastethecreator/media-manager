import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Desactivar todos los perfiles
    await prisma.profile.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    // Activar el perfil seleccionado
    const profile = await prisma.profile.update({
      where: { id: params.id },
      data: { isActive: true }
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error activating profile:', error)
    return NextResponse.json(
      { error: 'Error activating profile' },
      { status: 500 }
    )
  }
}
