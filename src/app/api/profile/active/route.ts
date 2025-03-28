import { prisma } from '@/lib/prisma';
import { getActiveProfile } from '@/lib/utils/profile/profile-utils';
import { transformProfile } from '@/transformers/profile/profile-transformers';
import { NextResponse } from 'next/server';

// GET /api/profile/active - Obtener el perfil activo
export async function GET() {
	try {
		const profile = await getActiveProfile();

		if (!profile) {
			return NextResponse.json({ error: 'No hay perfil activo' }, { status: 404 });
		}

		return NextResponse.json(transformProfile(profile));
	} catch (error) {
		console.error('Error obteniendo perfil activo:', error);
		return NextResponse.json({ error: 'Error obteniendo perfil activo' }, { status: 500 });
	}
}

// PUT /api/profile/active - Establecer un perfil como activo
export async function PUT(request: Request) {
	try {
		const { id } = await request.json();

		if (!id) {
			return NextResponse.json({ error: 'ID del perfil es requerido' }, { status: 400 });
		}

		// Verificar que el perfil existe
		const profile = await prisma.profile.findUnique({
			where: { id },
		});

		if (!profile) {
			return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
		}

		// Desactivar todos los perfiles
		await prisma.profile.updateMany({
			where: { isActive: true },
			data: { isActive: false },
		});

		// Activar el perfil solicitado
		const updatedProfile = await prisma.profile.update({
			where: { id },
			data: { isActive: true },
		});

		return NextResponse.json(transformProfile(updatedProfile));
	} catch (error) {
		console.error('Error actualizando perfil activo:', error);
		return NextResponse.json({ error: 'Error actualizando perfil activo' }, { status: 500 });
	}
}
