import { NextResponse } from 'next/server';
import { DrizzleRepository } from '@/drizzle/repository';

export async function GET() {
  try {
    // Obtener todos los perfiles
    const profiles = await DrizzleRepository.profiles.getAll();

    return NextResponse.json({
      success: true,
      message: 'Perfiles obtenidos correctamente',
      data: profiles
    });
  } catch (error) {
    console.error('Error al obtener perfiles:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener perfiles',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Crear un nuevo perfil
    const profile = await DrizzleRepository.profiles.create({
      name: body.name || 'Usuario sin nombre',
      emoji: body.emoji,
      color: body.color,
      theme: body.theme,
      language: body.language,
      description: body.description,
      isActive: body.isActive,
    });

    return NextResponse.json({
      success: true,
      message: 'Perfil creado correctamente',
      data: profile
    });
  } catch (error) {
    console.error('Error al crear perfil:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al crear perfil',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}