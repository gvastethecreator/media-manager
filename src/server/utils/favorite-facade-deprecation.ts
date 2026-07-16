import type { RequestHandler } from 'express';

const FAVORITE_TOGGLE_SUCCESSOR = '/api/favorites/toggle';
const FAVORITE_TOGGLE_SUNSET = 'Wed, 31 Dec 2026 23:59:59 GMT';

const RETIRED_FAVORITE_ROUTE_PATTERNS = [
	/^\/api\/(?:folders|images|tags|albums|collections|characters|places|concepts|prompts|audio|videos|groups|wildcards|notes|properties|world-items|file3ds|json-files|documents)\/[^/]+\/favorite\/?$/,
	/^\/api\/(?:images|audio|videos)\/batch\/favorite\/?$/,
	/^\/api\/folders\/[^/]+\/toggle-favorite\/?$/,
];

export const retireFavoriteToggleFacades: RequestHandler = (req, res, next): void => {
	const pathname = req.originalUrl.split('?')[0];
	if (!RETIRED_FAVORITE_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname))) {
		next();
		return;
	}

	res.setHeader('Deprecation', 'true');
	res.setHeader('Sunset', FAVORITE_TOGGLE_SUNSET);
	res.setHeader('Link', `<${FAVORITE_TOGGLE_SUCCESSOR}>; rel="successor-version"`);
	res.setHeader('X-Canonical-Favorite-Toggle', FAVORITE_TOGGLE_SUCCESSOR);
	res.setHeader('Cache-Control', 'no-store');
	res.status(410).json({
		error: 'Esta fachada de favoritos fue retirada',
		successor: FAVORITE_TOGGLE_SUCCESSOR,
	});
};
