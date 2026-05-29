import type { Response } from 'express';
import { errorToHttpStatus } from '@/lib/effect/adapters/express.adapter';

/**
 * Envía error HTTP homogéneo para handlers de contenido binario.
 */
export function sendEffectHttpError(res: Response, error: unknown): void {
	const httpError = errorToHttpStatus(error);
	res.status(httpError.status).json({
		error: httpError.message,
		...(process.env.NODE_ENV === 'development' && { details: httpError.details }),
	});
}
