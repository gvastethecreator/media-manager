/**
 * @file API route para configuración de perfiles
 * @module app/api/profiles/[id]/settings
 */

import { getProfileSettings, updateProfileSettings } from '@/app/actions/system';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Obtiene la configuración de un perfil específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const profileId = params.id;

    if (!profileId) {
      return NextResponse.json(
        { error: 'ID de perfil no proporcionado' },
        { status: 400 }
      );
    }

    const settings = await getProfileSettings(profileId);

    if (!settings) {
      return NextResponse.json(
        { error: `No se encontró perfil con ID: ${profileId}` },
        { status: 404 }
      );
    }

    return NextResponse.json(settings, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error) {
    console.error('Error al obtener configuración de perfil:', error);

    return NextResponse.json(
      { error: 'Error al obtener la configuración del perfil' },
      { status: 500 }
    );
  }
}

/**
 * Actualiza la configuración de un perfil específico
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const profileId = params.id;

    if (!profileId) {
      return NextResponse.json(
        { error: 'ID de perfil no proporcionado' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const updatedSettings = await updateProfileSettings(profileId, data);

    return NextResponse.json(updatedSettings, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error) {
    console.error('Error al actualizar configuración de perfil:', error);

    return NextResponse.json(
      { error: 'Error al actualizar la configuración del perfil' },
      { status: 500 }
    );
  }
}