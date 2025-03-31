/**
 * @file API route para gestión de configuración global
 * @module app/api/system/settings
 */

import { getSystemSettings, updateSystemSettings } from '@/app/actions/system';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Manejador para GET - Obtiene la configuración global del sistema
 */
export async function GET(): Promise<NextResponse> {
  try {
    const settings = await getSystemSettings();

    return NextResponse.json(settings, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error al obtener configuración global:', error);

    return NextResponse.json(
      { error: 'Error al obtener la configuración del sistema' },
      { status: 500 }
    );
  }
}

/**
 * Manejador para PATCH - Actualiza la configuración global del sistema
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.json();
    const updatedSettings = await updateSystemSettings(data);

    return NextResponse.json(updatedSettings, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error al actualizar configuración global:', error);

    return NextResponse.json(
      { error: 'Error al actualizar la configuración del sistema' },
      { status: 500 }
    );
  }
}