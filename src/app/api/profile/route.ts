import {
	activateProfile,
	createProfile,
	deleteProfile,
	getActiveProfile as getActiveProfileAction,
	getProfile,
	getProfiles,
	updateProfile,
} from '@/app/actions/profiles/profile.actions';
import { validateProfilePreferences } from '@/lib/utils/profile/profile-utils';
import { NextResponse } from 'next/server';

// GET /api/profile - Obtener todos los perfiles
export async function GET() {
	try {
		const profiles = await getProfiles();
		return NextResponse.json(profiles);
	} catch (error) {
		console.error('Error obteniendo perfiles:', error);
		return NextResponse.json({ error: 'Error obteniendo perfiles' }, { status: 500 });
	}
}

// POST /api/profile - Crear un nuevo perfil
export async function POST(request: Request) {
	try {
		const data = await request.json();
		const profile = await createProfile(data);
		return NextResponse.json(profile, { status: 201 });
	} catch (error) {
		console.error('Error creando perfil:', error);
		return NextResponse.json({ error: 'Error creando perfil' }, { status: 500 });
	}
}

// GET /api/profile/active - Obtener el perfil activo
export async function GET_active() {
	try {
		const profile = await getActiveProfileAction();
		return NextResponse.json(profile);
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

		const profile = await activateProfile(id);
		return NextResponse.json(profile);
	} catch (error) {
		console.error('Error actualizando perfil activo:', error);
		return NextResponse.json({ error: 'Error actualizando perfil activo' }, { status: 500 });
	}
}

// GET /api/profile/[id] - Obtener un perfil específico
export async function GET_id(request: Request, { params }: { params: { id: string } }) {
	const id = params.id;

	try {
		const profile = await getProfile(id);
		return NextResponse.json(profile);
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
		const profile = await updateProfile(id, data);
		return NextResponse.json(profile);
	} catch (error) {
		console.error(`Error actualizando perfil ${id}:`, error);
		return NextResponse.json({ error: 'Error actualizando perfil' }, { status: 500 });
	}
}

// DELETE /api/profile/[id] - Eliminar un perfil
export async function DELETE_id(request: Request, { params }: { params: { id: string } }) {
	const id = params.id;

	try {
		await deleteProfile(id);
		return NextResponse.json({ success: true });
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
		const validatedPreferences = validateProfilePreferences(preferences);
		const profile = await updateProfile(id, validatedPreferences);
		return NextResponse.json(profile);
	} catch (error) {
		console.error(`Error actualizando preferencias del perfil ${id}:`, error);
		return NextResponse.json({ error: 'Error actualizando preferencias del perfil' }, { status: 500 });
	}
}
