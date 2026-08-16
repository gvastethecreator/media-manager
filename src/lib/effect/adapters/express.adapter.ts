/**
 * @file Express Adapter para Effect
 * @module lib/effect/adapters/express
 * @description Helpers para integrar Effect en Express routes
 * @created 2025-10-11 - Fase 1 Effect Implementation
 */

import { Effect, Either } from 'effect';
import type { NextFunction, Request, Response } from 'express';
import type { RequestHandler } from 'express-serve-static-core';
import { serverLogger } from '@/lib/logger/server-logger';
import { sanitizePublicPayload } from '@/server/security/sanitize-public-payload';
import { runPromise, runPromiseEither } from '../runtime/runtime';

const logger = serverLogger.withContext('ExpressAdapter');

function isZodLikeError(error: unknown): error is { issues: unknown[]; message?: string; name?: string } {
	return Boolean(
		error &&
		typeof error === 'object' &&
		'name' in error &&
		(error as { name?: string }).name === 'ZodError' &&
		'issues' in error &&
		Array.isArray((error as { issues?: unknown }).issues)
	);
}

/**
 * Tipo para errores con status HTTP
 */
export interface HttpError {
	readonly code?: string;
	readonly details?: unknown;
	readonly message: string;
	readonly status: number;
}

/**
 * Mapea errores de Effect a status HTTP
 */
export const errorToHttpStatus = (error: unknown): HttpError => {
	if (isZodLikeError(error)) {
		return {
			status: 400,
			message: 'Validation error',
			details: error.issues,
		};
	}

	if (error && typeof error === 'object' && 'status' in error) {
		const status = (error as { status?: unknown }).status;
		if (typeof status === 'number' && Number.isInteger(status) && status >= 400 && status <= 599) {
			const code =
				'code' in error && typeof (error as { code?: unknown }).code === 'string'
					? (error as { code: string }).code
					: undefined;
			return {
				code,
				status,
				message:
					error instanceof Error
						? error.message
						: 'message' in error && typeof (error as { message?: unknown }).message === 'string'
							? (error as { message: string }).message
							: 'Request failed',
				details: error,
			};
		}
	}

	// 1. Si es un error con _tag (Data.TaggedError)
	if (error && typeof error === 'object' && '_tag' in error) {
		const taggedError = error as any;

		switch (taggedError._tag) {
			case 'TaxonomyArtifactInlineMutationError':
				return {
					code: 'ARTIFACT_FILE_BACKED',
					status: 409,
					message: taggedError.displayMessage || taggedError.message || 'La entidad es file-backed.',
				};
			case 'PromptNotFound':
				return { code: 'PROMPT_NOT_FOUND', message: 'Prompt no encontrado.', status: 404 };
			case 'NoteNotFound':
			case 'WildcardNotFound':
				return {
					code: 'TAXONOMY_ENTITY_NOT_FOUND',
					message: 'Entidad taxonomy no encontrada.',
					status: 404,
				};
			case 'TagNotFound':
			case 'ImageNotFound':
			case 'VideoNotFound':
			case 'AudioNotFound':
			case 'FolderNotFound':
			case 'ImageFileNotFound':
			case 'VideoFileNotFound':
			case 'AudioFileNotFound':
			case 'FileNotFound':
				return {
					status: 404,
					message: taggedError.displayMessage || taggedError.message || 'Resource not found',
					details: taggedError,
				};

			case 'PromptValidationError':
				return {
					code: 'PROMPT_VALIDATION_ERROR',
					status: 400,
					message: taggedError.displayMessage || taggedError.message || 'Invalid prompt.',
				};
			case 'NoteValidationError':
				return {
					code: 'NOTE_VALIDATION_ERROR',
					status: 400,
					message: taggedError.displayMessage || taggedError.message || 'Invalid note.',
				};
			case 'WildcardValidationError':
				return {
					code: 'WILDCARD_VALIDATION_ERROR',
					status: 400,
					message: taggedError.displayMessage || taggedError.message || 'Invalid wildcard.',
				};
			case 'TagNameConflict':
			case 'ValidationError':
			case 'TagValidationError':
			case 'ImageValidationError':
			case 'VideoValidationError':
			case 'AudioValidationError':
			case 'FolderValidationError':
			case 'FolderMaxDepthExceededError':
			case 'FilePathRequired':
				return {
					status: 400,
					message: taggedError.displayMessage || taggedError.message || 'Validation error',
					details: taggedError,
				};

			case 'TagHasRelationsError':
				return {
					code: 'TAG_HAS_RELATIONS',
					status: 409,
					message:
						taggedError.message ||
						(typeof taggedError.tagId === 'string' && typeof taggedError.relationCount === 'number'
							? `El tag ${taggedError.tagId} no puede ser eliminado porque tiene ${taggedError.relationCount} relaciones activas`
							: 'El tag tiene relaciones activas.'),
				};
			case 'NoteTitleConflict':
				return {
					code: 'NOTE_TITLE_CONFLICT',
					status: 409,
					message: 'A note with that title already exists.',
				};
			case 'PromptNameConflict':
				return {
					code: 'PROMPT_NAME_CONFLICT',
					status: 409,
					message: 'A prompt with that name already exists.',
				};
			case 'WildcardNameConflict':
				return {
					code: 'WILDCARD_NAME_CONFLICT',
					status: 409,
					message: 'A wildcard with that name already exists.',
				};
			case 'PromptHasRelationsError':
				return {
					code: 'PROMPT_HAS_RELATIONS',
					status: 409,
					message: taggedError.displayMessage || taggedError.message || 'El prompt tiene relaciones activas.',
				};
			case 'WildcardHasRelationsError':
				return {
					code: 'WILDCARD_HAS_RELATIONS',
					status: 409,
					message: taggedError.displayMessage || taggedError.message || 'El wildcard tiene relaciones activas.',
				};
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
			case 'PromptDatabaseError':
			case 'PromptUnknownError':
			case 'NoteDatabaseError':
			case 'WildcardDatabaseError':
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
			case 'FileReadError':
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

	// 2. Los defectos del runtime no se reinterpretan como errores de dominio.
	if (error instanceof Error) {
		return {
			status: 500,
			message: 'Internal server error',
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

function publicHttpErrorPayload(error: HttpError): Record<string, unknown> {
	if (error.code) return { code: error.code, message: error.message };
	return {
		error: error.message,
		...(process.env.NODE_ENV === 'development' && { details: error.details }),
	};
}

function respondWithMappedError(
	error: unknown,
	res: Response,
	logMessage: string,
	context: Record<string, unknown> = {}
): void {
	const httpError = errorToHttpStatus(error);

	const logContext = {
		...context,
		status: httpError.status,
		error: httpError.details,
	};
	if (httpError.status >= 500) logger.error(logMessage, logContext);
	else logger.warn(logMessage, logContext);

	if (!res.headersSent) {
		res.status(httpError.status).json(sanitizePublicPayload(publicHttpErrorPayload(httpError)));
	}
}

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
			const outcome = await runPromiseEither(effect);

			if (Either.isLeft(outcome)) {
				if (options?.onError) {
					options.onError(outcome.left, res);
				} else {
					respondWithMappedError(outcome.left, res, 'Effect handler failed', {
						method: req.method,
					});
				}
				return;
			}

			const result = outcome.right;

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
			respondWithMappedError(error, res, 'Effect handler defect', { method: req.method });
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
		const outcome = await runPromiseEither(effect);

		if (Either.isLeft(outcome)) {
			respondWithMappedError(outcome.left, res, 'Effect execution failed');
			return;
		}

		const result = outcome.right;

		const responseData = options?.onSuccess ? options.onSuccess(result) : result;
		const status = options?.successStatus || 200;

		if (!res.headersSent) {
			res.status(status).json(responseData);
		}
	} catch (error) {
		respondWithMappedError(error, res, 'Effect execution defect');
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
