import { prisma } from '@/lib/prisma';
import { transformProfile } from '@/transformers/profile/profile-transformers';
import { NextResponse } from 'next/server';

// GET /api/profile/[id] - Obtener un perfil específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
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
export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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
