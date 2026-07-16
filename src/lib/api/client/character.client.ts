/**
 * @deprecated Usa `fetch` directo en vez de `ApiClient` (src/lib/api/client.ts).
 * Migrar a `apiClient.get/post/put/delete` para timeout, logging, y headers consistentes.
 * Ver #1 deepening opportunity en architecture review.
 */

/**
 * Cliente de API para personajes (characters).
 */
import { apiClient } from '@/lib/api/client';
import type { CharacterWithStats } from '@/types/entities/character';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { invalidateFavoriteQueries } from '@/lib/api/favorite-cache';

export async function toggleCharacterFavoriteInApi(id: string): Promise<CharacterWithStats> {
	await apiClient.post('/favorites/toggle', { entityId: id, entityType: FavoriteEntityType.CHARACTER });
	await invalidateFavoriteQueries();
	return apiClient.get<CharacterWithStats>(`/characters/${id}`);
}
