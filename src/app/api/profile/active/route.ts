import { activateProfile, getActiveProfile as getActiveProfileAction } from '@/app/actions/profiles/profile.actions';
import { NextResponse } from 'next/server';

// GET /api/profile/active - Obtener el perfil activo
export async function GET() {
        try {
                const profile = await getActiveProfileAction();
                if (!profile) {
                        return NextResponse.json({ error: 'No hay perfil activo' }, { status: 404 });
                }
                return NextResponse.json(profile);
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

                const profile = await activateProfile(id);
                return NextResponse.json(profile);
        } catch (error) {
                console.error('Error actualizando perfil activo:', error);
                return NextResponse.json({ error: 'Error actualizando perfil activo' }, { status: 500 });
        }
}
