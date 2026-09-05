import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '@/lib/api/client';
import { isAuthorizedStatsScopeUnavailable, SystemStatsDisplay } from './system-stats-display';

vi.mock('@/lib/api/navigation', () => ({
	useNavigationStats: () => ({
		data: {
			recentActivity: [],
			topTags: [],
			totalActivities: 4,
			totalAlbums: 0,
			totalCharacters: 0,
			totalCollections: 0,
			totalDownloads: 0,
			totalFavorites: 3,
			totalFolders: 0,
			totalImages: 0,
			totalPlaces: 0,
			totalSize: 0,
			totalTags: 0,
			totalViews: 0,
			totalWorldItems: 2,
		},
		error: null,
		isLoading: false,
	}),
}));

describe('system stats authorized scope state', () => {
	it('treats the retired global aggregate as a scoped empty state, not an operational failure', () => {
		expect(
			isAuthorizedStatsScopeUnavailable(new ApiClientError(410, 'Scope required', {}, 'AUTHORIZED_SCOPE_REQUIRED'))
		).toBe(true);
		expect(isAuthorizedStatsScopeUnavailable(new Error('HTTP 500'))).toBe(false);
		expect(isAuthorizedStatsScopeUnavailable(null)).toBe(false);
	});
});

describe('SystemStatsDisplay labels', () => {
	it('uses English labels for world items, favorites, and activities', () => {
		render(<SystemStatsDisplay />);
		expect(screen.getByText('World items')).toBeInTheDocument();
		expect(screen.getByText('Favorites')).toBeInTheDocument();
		expect(screen.getByText('Activities')).toBeInTheDocument();
		expect(screen.getByText('Library')).toBeInTheDocument();
		expect(screen.queryByText('Objetos del mundo')).not.toBeInTheDocument();
		expect(screen.queryByText('Favoritos')).not.toBeInTheDocument();
	});
});
