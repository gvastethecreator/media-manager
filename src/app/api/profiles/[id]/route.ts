import { deleteProfile, getProfile, updateProfile } from '@/app/actions/profiles/profile.actions';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
	try {
		const profile = await getProfile(params.id);
		if (!profile) {
			return new NextResponse(JSON.stringify({ message: 'Perfil no encontrado' }), {
				status: 404,
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}
		return NextResponse.json(profile);
	} catch (error) {
		console.error('Error obteniendo perfil específico:', error);
		return new NextResponse(JSON.stringify({ message: 'Error al obtener el perfil' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
	try {
		const body = await request.json();
		const updatedProfile = await updateProfile(params.id, body);
		return NextResponse.json(updatedProfile);
	} catch (error) {
		console.error('Error actualizando perfil:', error);
		return new NextResponse(JSON.stringify({ message: 'Error al actualizar el perfil' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
	try {
		await deleteProfile(params.id);
		return new NextResponse(null, { status: 204 });
	} catch (error) {
		console.error('Error eliminando perfil:', error);
		return new NextResponse(JSON.stringify({ message: 'Error al eliminar el perfil' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}
}
