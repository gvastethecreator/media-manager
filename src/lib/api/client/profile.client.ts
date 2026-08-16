/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para perfiles de usuario.
 */
import type { ProfileExtended } from '@/types/entities/profile';
import { unwrapArrayResponse } from './pagination';

const API_BASE_PATH = '/api/profiles';

export async function getActiveProfileFromApi(): Promise<ProfileExtended | null> {
	const response = await fetch(`${API_BASE_PATH}/active`);
	if (!response.ok) {
		if (response.status === 404) {
			return null;
		}
		throw new Error('Could not get active profile');
	}
	return response.json();
}

export async function getProfilesFromApi(): Promise<ProfileExtended[]> {
	const response = await fetch(API_BASE_PATH);
	if (!response.ok) {
		throw new Error('Could not get profiles');
	}
	const result = await response.json();
	return unwrapArrayResponse<ProfileExtended>(result);
}
