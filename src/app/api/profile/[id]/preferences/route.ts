import { updateProfile } from '@/app/actions/profiles/profile.actions';
import { validateProfilePreferences } from '@/lib/utils/profile/profile-utils';
import { NextResponse } from 'next/server';

// PATCH /api/profile/[id]/preferences - Actualizar preferencias de un perfil
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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
