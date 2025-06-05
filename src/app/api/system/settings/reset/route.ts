/**
 * @file API route para resetear configuración global
 * @module app/api/system/settings/reset
 */

import { resetSystemSettings } from '@/app/actions/system';
import { NextResponse } from 'next/server';

/**
 * Manejador para POST - Restablece la configuración global del sistema
 */
export async function POST(): Promise<NextResponse> {
	try {
		const settings = await resetSystemSettings();

		return NextResponse.json(settings, {
			status: 200,
			headers: {
				'Cache-Control': 'no-store, max-age=0',
			},
		});
	} catch (error) {
		console.error('Error al resetear configuración global:', error);

		return NextResponse.json({ error: 'Error al restablecer la configuración del sistema' }, { status: 500 });
	}
}
