import { QueryClient } from '@tanstack/react-query';
import { FAVORITE_QUERY_KEY, invalidateFavoriteQueries } from '@/lib/api/favorite-cache';

it('invalidates the entire canonical favorite cache without touching unrelated queries', async () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData([...FAVORITE_QUERY_KEY, 'profile', 'test', 'list'], ['favorite']);
	queryClient.setQueryData(['folders', 'list'], ['folder']);

	await invalidateFavoriteQueries(queryClient);

	expect(queryClient.getQueryState([...FAVORITE_QUERY_KEY, 'profile', 'test', 'list'])?.isInvalidated).toBe(true);
	expect(queryClient.getQueryState(['folders', 'list'])?.isInvalidated).toBe(false);
});
