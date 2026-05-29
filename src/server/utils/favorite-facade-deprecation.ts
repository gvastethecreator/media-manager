import type { Response } from 'express';
import type { FavoriteEntityType } from '@/types/entities/favorite';

const FAVORITE_TOGGLE_SUCCESSOR = '/api/favorites/toggle';
const FAVORITE_TOGGLE_SUNSET = 'Wed, 31 Dec 2026 23:59:59 GMT';

export function markFavoriteToggleFacadeDeprecated(res: Response, entityType: FavoriteEntityType): void {
	res.setHeader('Deprecation', 'true');
	res.setHeader('Sunset', FAVORITE_TOGGLE_SUNSET);
	res.setHeader(
		'Link',
		`<${FAVORITE_TOGGLE_SUCCESSOR}>; rel="successor-version"; title="Canonical favorite toggle endpoint for ${entityType}"`
	);
	res.setHeader('X-Canonical-Favorite-Toggle', FAVORITE_TOGGLE_SUCCESSOR);
}