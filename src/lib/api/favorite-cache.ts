import type { QueryClient } from '@tanstack/react-query';
import { queryClient as applicationQueryClient } from '@/lib/web/react-query';

export const FAVORITE_QUERY_KEY = ['favorites'] as const;

/**
 * Invalida en un solo lugar listas, detalles y checks derivados del Favorite canónico.
 * Los clientes imperativos usan el QueryClient de la aplicación; los hooks pueden
 * inyectar el cliente de su provider para conservar aislamiento en pruebas.
 */
export function invalidateFavoriteQueries(queryClient: QueryClient = applicationQueryClient): Promise<void> {
	return queryClient.invalidateQueries({ queryKey: FAVORITE_QUERY_KEY });
}
