/**
 * @file API route para resetear configuración de perfil
 * @module app/api/profiles/[id]/settings/reset
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { resetProfileSettings } from '@/app/actions/system';

/**
 * Manejador para POST - Restablece la configuración de un perfil
 * a los valores globales
 */
export async function POST(_request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
	try {
		const profileId = params.id;

		if (!profileId) {
			return NextResponse.json({ error: 'ID de perfil no proporcionado' }, { status: 400 });
		}

		await resetProfileSettings(profileId);

		return NextResponse.json(
			{ success: true, message: 'Configuración del perfil restablecida a valores globales' },
			{
				status: 200,
				headers: {
					'Cache-Control': 'no-store, max-age=0',
				},
			}
		);
	} catch (error) {
		console.error('Error al resetear configuración de perfil:', error);

		return NextResponse.json({ error: 'Error al restablecer la configuración del perfil' }, { status: 500 });
	}
}
