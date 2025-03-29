import { prisma } from '@/lib/prisma';
import { getActiveProfile, validateProfilePreferences } from '@/lib/utils/profile/profile-utils';
import { transformProfile, transformProfiles } from '@/transformers/profile/profile-transformers';
import { Language, ThemeMode } from '@/types/entities/profile/types';
import { NextResponse } from 'next/server';

// GET /api/profile - Obtener todos los perfiles
export async function GET() {
	try {
		const profiles = await prisma.profile.findMany({
			orderBy: { createdAt: 'desc' },
		});

		return NextResponse.json(transformProfiles(profiles));
	} catch (error) {
		console.error('Error obteniendo perfiles:', error);
		return NextResponse.json({ error: 'Error obteniendo perfiles' }, { status: 500 });
	}
}

// POST /api/profile - Crear un nuevo perfil
export async function POST(request: Request) {
	try {
		const data = await request.json();

		// Validar datos mínimos
		if (!data.name) {
			return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
		}

		// Valores por defecto
		const profileData = {
			name: data.name,
			description: data.description || '',
			emoji: data.emoji || '👤',
			color: data.color || '#3b82f6',
			theme: data.theme || ThemeMode.SYSTEM,
			language: data.language || Language.SPANISH,
			isActive: data.isActive === true,
		};

		// Si es el primer perfil, marcarlo como activo
		const profileCount = await prisma.profile.count();
		if (profileCount === 0) {
			profileData.isActive = true;
		} else if (profileData.isActive) {
			// Si se está marcando como activo, desactivar los demás
			await prisma.profile.updateMany({
				where: { isActive: true },
				data: { isActive: false },
			});
		}

		// Crear el perfil
		const profile = await prisma.profile.create({
			data: profileData,
		});

		return NextResponse.json(transformProfile(profile));
	} catch (error) {
		console.error('Error creando perfil:', error);
		return NextResponse.json({ error: 'Error creando perfil' }, { status: 500 });
	}
}

// GET /api/profile/active - Obtener el perfil activo
export async function GET_active() {
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
export async function PUT_active(request: Request) {
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

// GET /api/profile/[id] - Obtener un perfil específico
export async function GET_id(request: Request, { params }: { params: { id: string } }) {
	const id = params.id;

	try {
		const profile = await prisma.profile.findUnique({
			where: { id },
		});

		if (!profile) {
			return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
		}

		return NextResponse.json(transformProfile(profile));
	} catch (error) {
		console.error(`Error obteniendo perfil ${id}:`, error);
		return NextResponse.json({ error: 'Error obteniendo perfil' }, { status: 500 });
	}
}

// PUT /api/profile/[id] - Actualizar un perfil
export async function PUT_id(request: Request, { params }: { params: { id: string } }) {
	const id = params.id;

	try {
		const data = await request.json();

		// Verificar que el perfil existe
		const profile = await prisma.profile.findUnique({
			where: { id },
		});

		if (!profile) {
			return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
		}

		// Extraer solo los campos permitidos
		const updateData: Record<string, unknown> = {};

		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.emoji !== undefined) updateData.emoji = data.emoji;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.theme !== undefined) updateData.theme = data.theme;
		if (data.language !== undefined) updateData.language = data.language;

		// Si se está activando, desactivar los demás
		if (data.isActive === true && !profile.isActive) {
			await prisma.profile.updateMany({
				where: { isActive: true },
				data: { isActive: false },
			});
			updateData.isActive = true;
		}

		// Actualizar perfil
		const updatedProfile = await prisma.profile.update({
			where: { id },
			data: updateData,
		});

		return NextResponse.json(transformProfile(updatedProfile));
	} catch (error) {
		console.error(`Error actualizando perfil ${id}:`, error);
		return NextResponse.json({ error: 'Error actualizando perfil' }, { status: 500 });
	}
}

// DELETE /api/profile/[id] - Eliminar un perfil
export async function DELETE_id(request: Request, { params }: { params: { id: string } }) {
	const id = params.id;

	try {
		// Verificar que el perfil existe
		const profile = await prisma.profile.findUnique({
			where: { id },
		});

		if (!profile) {
			return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
		}

		// Verificar que no es el último perfil
		const profileCount = await prisma.profile.count();

		if (profileCount <= 1) {
			return NextResponse.json({ error: 'No se puede eliminar el último perfil' }, { status: 400 });
		}

		// Si el perfil a eliminar es el activo, establecer otro como activo
		if (profile.isActive) {
			const anotherProfile = await prisma.profile.findFirst({
				where: { id: { not: id } },
			});

			if (anotherProfile) {
				await prisma.profile.update({
					where: { id: anotherProfile.id },
					data: { isActive: true },
				});
			}
		}

		// Eliminar el perfil
		await prisma.profile.delete({
			where: { id },
		});

		return NextResponse.json({ success: true, message: 'Perfil eliminado' });
	} catch (error) {
		console.error(`Error eliminando perfil ${id}:`, error);
		return NextResponse.json({ error: 'Error eliminando perfil' }, { status: 500 });
	}
}

// PATCH /api/profile/[id]/preferences - Actualizar preferencias de un perfil
export async function PATCH_preferences(request: Request, { params }: { params: { id: string } }) {
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
