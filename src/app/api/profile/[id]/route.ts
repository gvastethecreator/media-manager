import {
  deleteProfile,
  getProfile,
  updateProfile,
} from '@/app/actions/profiles/profile.actions';
import { NextResponse } from 'next/server';

// GET /api/profile/[id] - Obtener un perfil específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
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
export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
        const id = params.id;

        try {
                await deleteProfile(id);
                return NextResponse.json({ success: true });
        } catch (error) {
                console.error(`Error eliminando perfil ${id}:`, error);
                return NextResponse.json({ error: 'Error eliminando perfil' }, { status: 500 });
        }
}
