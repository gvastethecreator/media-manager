import type { Request, Response } from 'express';

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

/**
 * Establece un validador débil para bytes de archivos autorizados. Tamaño y fecha de modificación permiten revalidar
 * sin leer el archivo completo ni compartirlo fuera de la sesión actual.
 */
export function setAuthorizedFileDeliveryHeaders(
	request: Pick<Request, 'fresh'>,
	response: Response,
	file: { mtimeMs: number; size: number }
): boolean {
	setAuthorizedAssetCacheHeaders(response, 'revalidate');
	response.setHeader('ETag', `W/"${file.size.toString(16)}-${Math.trunc(file.mtimeMs).toString(16)}"`);
	return request.fresh;
}
