/**
 * Augmentación de tipos para Express
 * Añade tipos personalizados a Request y Response.locals
 */

import { RequestLogger } from '../server/middleware/logging';

declare global {
	namespace Express {
		interface Locals {
			/**
			 * Logger contextual por-request con requestId, método, URL e IP pre-configurados.
			 * Uso recomendado en lugar de console.* o serverLogger directo.
			 *
			 * @example
			 * ```ts
			 * app.get('/api/users', (req, res) => {
			 *   const logger = res.locals.logger;
			 *   logger.info('Obteniendo usuarios', { limit: req.query.limit });
			 *   // ...
			 * });
			 * ```
			 */
			logger: RequestLogger;

			/**
			 * ID único de correlación para la request actual.
			 * Se genera automáticamente o se lee del header 'x-request-id'.
			 * También se devuelve en el header 'X-Request-Id' de la respuesta.
			 */
			requestId: string;
		}
	}
}
