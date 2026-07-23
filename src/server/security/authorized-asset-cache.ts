import type { Response } from 'express';

/**
 * Un recurso de media pasa por autorización de root en cada solicitud. No puede
 * publicarse en caches compartidas aunque el byte derivado sea una miniatura.
 */
export function setAuthorizedAssetCacheHeaders(response: Response, mode: 'no-store' | 'revalidate'): void {
	response.setHeader(
		'Cache-Control',
		mode === 'revalidate' ? 'private, max-age=0, must-revalidate' : 'private, no-store'
	);
	response.vary('Cookie');
	response.setHeader('X-Content-Type-Options', 'nosniff');
}
