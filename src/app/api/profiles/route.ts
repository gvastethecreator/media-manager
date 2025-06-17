import { NextResponse } from 'next/server';
import { createProfile, getProfiles } from '@/app/actions/profiles/profile.actions';

export async function GET() {
	try {
		const profiles = await getProfiles();
		return NextResponse.json(profiles);
	} catch (error) {
		console.error('Error en la ruta API de perfiles:', error);
		return new NextResponse(JSON.stringify({ message: 'Error al obtener perfiles' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const profile = await createProfile(body);
		return NextResponse.json(profile, { status: 201 });
	} catch (error) {
		console.error('Error creando perfil:', error);
		return new NextResponse(JSON.stringify({ message: 'Error al crear el perfil' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}
}
