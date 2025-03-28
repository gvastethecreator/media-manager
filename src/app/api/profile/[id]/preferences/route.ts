import { prisma } from '@/lib/prisma';
import { validateProfilePreferences } from '@/lib/utils/profile/profile-utils';
import { transformProfile } from '@/transformers/profile/profile-transformers';
import { NextResponse } from 'next/server';

// PATCH /api/profile/[id]/preferences - Actualizar preferencias de un perfil
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
	const id = params.id;

	try {
		const preferences = await request.json();

		// Verificar que el perfil existe
		const profile = await prisma.profile.findUnique({
			where: { id },
		});

		if (!profile) {
			return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
		}

		// Validar y limpiar las preferencias
		const validatedPreferences = validateProfilePreferences(preferences);

		// Actualizar las preferencias específicas
		const updatedProfile = await prisma.profile.update({
			where: { id },
			data: validatedPreferences,
		});

		return NextResponse.json(transformProfile(updatedProfile));
	} catch (error) {
		console.error(`Error actualizando preferencias del perfil ${id}:`, error);
		return NextResponse.json({ error: 'Error actualizando preferencias del perfil' }, { status: 500 });
	}
}
