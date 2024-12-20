import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const profiles = await prisma.profile.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(profiles)
  } catch (error) {
    console.error('Error getting profiles:', error)
    return NextResponse.json(
      { error: 'Error getting profiles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Si es el primer perfil, establecerlo como activo
    const profileCount = await prisma.profile.count()
    const isActive = profileCount === 0

    const profile = await prisma.profile.create({
      data: {
        ...data,
        isActive
      }
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json(
      { error: 'Error creating profile' },
      { status: 500 }
    )
  }
}
