/**
 * @file Express Adapter para Effect
 * @module lib/effect/adapters/express
 * @description Helpers para integrar Effect en Express routes
 * @created 2025-10-11 - Fase 1 Effect Implementation
 */

import { Effect } from 'effect';
import type { NextFunction, Request, Response } from 'express';
import type { RequestHandler } from 'express-serve-static-core';
import { serverLogger } from '@/lib/logger/server-logger';
import { runPromise } from '../runtime/runtime';

const logger = serverLogger.withContext('ExpressAdapter');

/**
 * Tipo para errores con status HTTP
 */
export interface HttpError {
	readonly details?: unknown;
	readonly message: string;
	readonly status: number;
}

/**
 * Mapea errores de Effect a status HTTP
 */
export const errorToHttpStatus = (error: unknown): HttpError => {
	// 1. Si es un error con _tag (Data.TaggedError)
	if (error && typeof error === 'object' && '_tag' in error) {
		const taggedError = error as any;

		switch (taggedError._tag) {
			case 'TagNotFound':
			case 'ImageNotFound':
			case 'VideoNotFound':
			case 'AudioNotFound':
			case 'FolderNotFound':
			case 'ImageFileNotFound':
			case 'VideoFileNotFound':
			case 'AudioFileNotFound':
				return {
					status: 404,
					message: taggedError.displayMessage || taggedError.message || 'Resource not found',
					details: taggedError,
				};

			case 'TagNameConflict':
			case 'ValidationError':
			case 'TagValidationError':
			case 'ImageValidationError':
			case 'VideoValidationError':
			case 'AudioValidationError':
			case 'FolderValidationError':
			case 'FolderMaxDepthExceededError':
				return {
					status: 400,
					message: taggedError.displayMessage || taggedError.message || 'Validation error',
					details: taggedError,
				};

			case 'TagHasRelationsError':
			case 'ImageHasRelationsError':
			case 'VideoHasRelationsError':
			case 'AudioHasRelationsError':
			case 'ImageHashConflict':
			case 'VideoHashConflict':
			case 'AudioHashConflict':
			case 'FolderPathConflict':
			case 'FolderNameConflict':
			case 'FolderHasChildrenError':
			case 'FolderHasContentError':
			case 'FolderCircularReferenceError':
				return {
					status: 409,
					message: taggedError.displayMessage || taggedError.message || 'Conflict - resource has relations',
					details: taggedError,
				};

			case 'TagDatabaseError':
			case 'DatabaseError':
			case 'ImageDatabaseError':
			case 'VideoDatabaseError':
			case 'AudioDatabaseError':
			case 'ImageThumbnailError':
			case 'VideoThumbnailError':
			case 'ImageMetadataError':
			case 'VideoMetadataError':
			case 'ImageProcessingError':
			case 'VideoProcessingError':
			case 'AudioProcessingError':
			case 'ImageRelationError':
			case 'VideoRelationError':
			case 'AudioRelationError':
			case 'ImageUnknownError':
			case 'VideoUnknownError':
			case 'AudioUnknownError':
			case 'FolderDatabaseError':
			case 'FolderUnknownError':
				return {
					status: 500,
					message: 'Database error occurred',
					details: taggedError,
				};

			default:
				logger.warn(`Unhandled tagged error: ${taggedError._tag}`, { error: taggedError });
				return {
					status: 500,
					message: taggedError.displayMessage || taggedError.message || 'Internal server error',
					details: taggedError,
				};
		}
	}

	// 2. Si es un FiberFailure (error de runtime de Effect), intentamos extraer información del nombre o stack
	if (error instanceof Error) {
		// Detectar FolderNotFound envuelto en FiberFailure
		if (error.name.includes('FolderNotFound') || error.message.includes('FolderNotFound')) {
			return {
				status: 404,
				message: 'Folder not found',
				details: { name: error.name, message: error.message },
			};
		}

		return {
			status: 500,
			message: error.message,
			details: { name: error.name, stack: error.stack },
		};
	}

	// 3. Error desconocido
	return {
		status: 500,
		message: 'Unknown error occurred',
		details: error,
	};
};

/**
 * Wrapper para ejecutar un Effect en un Express handler
 *
 * @example
 * ```typescript
 * router.get('/:id', effectHandler((req, res) =>
 *   Effect.gen(function*() {
 *     const tagService = yield* TagService;
 *     const tag = yield* tagService.getById(req.params.id);
 *     return { data: tag };
 *   })
 * ));
 * ```
 */
export const effectHandler = <A, E>(
	fn: (req: Request, res: Response) => Effect.Effect<A, E, never>,
	options?: {
		/** Handler de éxito personalizado */
		onSuccess?: (data: A, res: Response) => void;
		/** Handler de error personalizado */
		onError?: (error: E, res: Response) => void;
	}
): RequestHandler => {
	const handler = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const effect = fn(req, res);

			// Ejecutar el Effect
			const result = await runPromise(effect);

			// Handler de éxito
			if (options?.onSuccess) {
				options.onSuccess(result, res);
			} else {
				// Comportamiento por defecto: enviar JSON
				if (!res.headersSent) {
					res.json(result);
				}
			}
		} catch (error) {
			// Handler de error
			if (options?.onError) {
				options.onError(error as E, res);
			} else {
				// Comportamiento por defecto: mapear a HTTP status
				const httpError = errorToHttpStatus(error);

				logger.error(`Error en handler: ${httpError.message}`, {
					status: httpError.status,
					path: req.path,
					method: req.method,
					error: httpError.details,
				});

				if (!res.headersSent) {
					res.status(httpError.status).json({
						error: httpError.message,
						...(process.env.NODE_ENV === 'development' && { details: httpError.details }),
					});
				}
			}
		}
	};
	return handler as RequestHandler;
};

/**
 * Middleware para agregar Effect runtime a Request
 *
 * @example
 * ```typescript
 * app.use(withEffectRuntime());
 *
 * router.get('/:id', async (req, res) => {
 *   const tag = await req.runEffect(
 *     Effect.gen(function*() {
 *       const service = yield* TagService;
 *       return yield* service.getById(req.params.id);
 *     })
 *   );
 *   res.json(tag);
 * });
 * ```
 */
export const withEffectRuntime = () => {
	return (req: Request, res: Response, next: NextFunction) => {
		// Agregar método runEffect al request
		(req as any).runEffect = <A, E>(effect: Effect.Effect<A, E, never>) => {
			return runPromise(effect);
		};
		next();
	};
};

/**
 * Helper para ejecutar Effect con manejo de errores y logging automático
 */
export const runEffectForExpress = async <A, E>(
	effect: Effect.Effect<A, E, never>,
	res: Response,
	options?: {
		successStatus?: number;
		onSuccess?: (data: A) => unknown;
	}
): Promise<void> => {
	try {
		const result = await runPromise(effect);

		const responseData = options?.onSuccess ? options.onSuccess(result) : result;
		const status = options?.successStatus || 200;

		if (!res.headersSent) {
			res.status(status).json(responseData);
		}
	} catch (error) {
		const httpError = errorToHttpStatus(error);

		logger.error(`Effect execution failed: ${httpError.message}`, {
			status: httpError.status,
			error: httpError.details,
		});

		if (!res.headersSent) {
			res.status(httpError.status).json({
				error: httpError.message,
				...(process.env.NODE_ENV === 'development' && { details: httpError.details }),
			});
		}
	}
};

/**
 * Type augmentation para Express Request con runEffect
 */
import 'express';

declare module 'express' {
	interface Request {
		runEffect<A, E, R>(effect: Effect.Effect<A, E, R>): Promise<A>;
	}
}
