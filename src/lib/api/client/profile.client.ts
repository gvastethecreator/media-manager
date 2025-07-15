/**
 * Cliente de API para perfiles de usuario.
 */
import type { ProfileExtended } from '@/types/entities/profile';

const API_BASE_PATH = '/api/profiles';

export async function getActiveProfileFromApi(): Promise<ProfileExtended | null> {
	const response = await fetch(`${API_BASE_PATH}/active`);
	if (!response.ok) {
		if (response.status === 404) return null;
		throw new Error('Error al obtener perfil activo');
	}
	return response.json();
}

export async function getProfilesFromApi(): Promise<ProfileExtended[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) throw new Error('Error al obtener perfiles');
	return response.json();
}
