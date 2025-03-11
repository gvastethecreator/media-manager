import { activateProfile } from '@/app/actions/profiles/profile.actions';
import { NextResponse } from 'next/server';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
	try {
		await activateProfile(params.id);
		return new NextResponse(null, { status: 204 });
	} catch (error) {
		console.error('Error activando perfil:', error);
		return new NextResponse(JSON.stringify({ message: 'Error al activar el perfil' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}
}
