/**
 * Cliente de API para personajes (characters).
 */
import type { CharacterWithStats } from '@/types/entities/character';

const API_BASE_PATH = '/api/characters';

export async function toggleCharacterFavoriteInApi(id: string): Promise<CharacterWithStats> {
	const response = await fetch(`${API_BASE_PATH}/${id}/favorite`, {
		method: 'POST',
	});
	if (!response.ok) {
		throw new Error('Error al alternar favorito del personaje');
	}
	return response.json();
}