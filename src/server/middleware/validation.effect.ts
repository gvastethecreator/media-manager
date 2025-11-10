/**
 * @file Express Validation Middleware using Effect Schema
 * @module server/middleware/validation.effect
 * @description Middleware para validar request bodies, params y query usando @effect/schema
 * @created 2025-10-11 - Fase 2 Effect Implementation
 */

import { Schema } from '@effect/schema';
import { Effect, Exit } from 'effect';
import type { Request, Response, NextFunction } from 'express';
import { serverLogger } from '@/lib/logger/server-logger';
import { runPromise, runPromiseEither } from '@/lib/effect/runtime/runtime';

const logger = serverLogger.withContext('ValidationMiddleware');

/**
 * Error de validación estructurado
 */
export interface ValidationError {
	_tag: 'ValidationError';
	message: string;
	field: string;
	received: unknown;
	expected: string;
}

/**
 * Valida el body de un request usando un schema Effect
 * 
 * @example
 * ```typescript
 * router.post('/albums',
 *   validateBody(AlbumCreateInput),
 *   async (req, res) => {
 *     // req.body está validado y tipado
 *     const album = await albumService.create(req.body);
 *     res.json(album);
 *   }
 * );
 * ```
 */
export function validateBody<A, I>(schema: Schema.Schema<A, I>) {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			logger.debug('Validando request body', {
				path: req.path,
				method: req.method,
				bodyKeys: Object.keys(req.body || {}),
			});

			const decode = Schema.decodeUnknown(schema);
			const eitherResult = await runPromiseEither(decode(req.body) as Effect.Effect<A, unknown, never>);

			if (eitherResult._tag === 'Left') {
				throw eitherResult.left;
			}

			// Replace body with validated data
			req.body = eitherResult.right;

			logger.debug('Body validado exitosamente', {
				path: req.path,
			});

			next();
		} catch (error) {
			logger.warn('Error de validación en body', {
				path: req.path,
				method: req.method,
				error,
			});

			return res.status(400).json({
				error: 'Validation Error',
				message: 'Request body validation failed',
				details: formatValidationError(error),
			});
		}
	};
}

/**
 * Valida los params de un request usando un schema Effect
 * 
 * @example
 * ```typescript
 * router.get('/albums/:id',
 *   validateParams(Schema.Struct({ id: UUID })),
 *   async (req, res) => {
 *     // req.params.id está validado como UUID
 *     const album = await albumService.getById(req.params.id);
 *     res.json(album);
 *   }
 * );
 * ```
 */
export function validateParams<A, I>(schema: Schema.Schema<A, I>) {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			logger.debug('Validando request params', {
				path: req.path,
				params: req.params,
			});

			const decode = Schema.decodeUnknown(schema);
			const eitherResult = await runPromiseEither(decode(req.params) as Effect.Effect<A, unknown, never>);

			if (eitherResult._tag === 'Left') {
				throw eitherResult.left;
			}

			// Replace params with validated data
			req.params = eitherResult.right as any;

			logger.debug('Params validados exitosamente', {
				path: req.path,
			});

			next();
		} catch (error) {
			logger.warn('Error de validación en params', {
				path: req.path,
				params: req.params,
				error,
			});

			return res.status(400).json({
				error: 'Validation Error',
				message: 'Request params validation failed',
				details: formatValidationError(error),
			});
		}
	};
}

/**
 * Valida la query string de un request usando un schema Effect
 * 
 * @example
 * ```typescript
 * router.get('/albums',
 *   validateQuery(Schema.Struct({
 *     limit: Schema.optional(StringToInt),
 *     offset: Schema.optional(StringToInt),
 *     search: Schema.optional(Schema.String),
 *   })),
 *   async (req, res) => {
 *     // req.query está validado y convertido a tipos correctos
 *     const albums = await albumService.list(req.query);
 *     res.json(albums);
 *   }
 * );
 * ```
 */
export function validateQuery<A, I>(schema: Schema.Schema<A, I>) {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			logger.debug('Validando request query', {
				path: req.path,
				query: req.query,
			});

			const decode = Schema.decodeUnknown(schema);
			const eitherResult = await runPromiseEither(decode(req.query) as Effect.Effect<A, unknown, never>);

			if (eitherResult._tag === 'Left') {
				throw eitherResult.left;
			}

			// Replace query with validated data
			req.query = eitherResult.right as any;

			logger.debug('Query validada exitosamente', {
				path: req.path,
			});

			next();
		} catch (error) {
			logger.warn('Error de validación en query', {
				path: req.path,
				query: req.query,
				error,
			});

			return res.status(400).json({
				error: 'Validation Error',
				message: 'Query string validation failed',
				details: formatValidationError(error),
			});
		}
	};
}

/**
 * Middleware combinado: valida body, params y query
 * 
 * @example
 * ```typescript
 * router.put('/albums/:id',
 *   validate({
 *     params: Schema.Struct({ id: UUID }),
 *     body: AlbumUpdateInput,
 *   }),
 *   async (req, res) => {
 *     const album = await albumService.update(req.params.id, req.body);
 *     res.json(album);
 *   }
 * );
 * ```
 */
export function validate<PSchema extends Schema.Schema.Any, BSchema extends Schema.Schema.Any, QSchema extends Schema.Schema.Any>(options: {
	params?: PSchema;
	body?: BSchema;
	query?: QSchema;
}) {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			// Validate params first
			if (options.params) {
				const decodeParams = Schema.decodeUnknown(options.params);
				const paramsResult = await runPromiseEither(decodeParams(req.params) as Effect.Effect<any, unknown, never>);
				if (paramsResult._tag === 'Left') throw paramsResult.left;
				req.params = paramsResult.right as any;
			}

			// Then validate body
			if (options.body) {
				const decodeBody = Schema.decodeUnknown(options.body);
				const bodyResult = await runPromiseEither(decodeBody(req.body) as Effect.Effect<any, unknown, never>);
				if (bodyResult._tag === 'Left') throw bodyResult.left;
				req.body = bodyResult.right;
			}

			// Finally validate query
			if (options.query) {
				const decodeQuery = Schema.decodeUnknown(options.query);
				const queryResult = await runPromiseEither(decodeQuery(req.query) as Effect.Effect<any, unknown, never>);
				if (queryResult._tag === 'Left') throw queryResult.left;
				req.query = queryResult.right as any;
			}

			logger.debug('Validación completa exitosa', {
				path: req.path,
				method: req.method,
			});

			next();
		} catch (error) {
			logger.warn('Error de validación', {
				path: req.path,
				method: req.method,
				error,
			});

			return res.status(400).json({
				error: 'Validation Error',
				message: 'Request validation failed',
				details: formatValidationError(error),
			});
		}
	};
}

/**
 * Formatea errores de @effect/schema para respuesta HTTP
 */
function formatValidationError(error: unknown): any {
	// Si es un error de schema, extraer información útil
	if (error && typeof error === 'object' && 'issues' in error) {
		const issues = (error as any).issues;
		if (Array.isArray(issues)) {
			return issues.map((issue: any) => ({
				path: issue.path?.join('.') || 'unknown',
				message: issue.message || 'Validation failed',
				expected: issue.expected,
				received: issue.received,
			}));
		}
	}

	// Si es un ParseError de Effect
	if (error && typeof error === 'object' && 'message' in error) {
		return {
			message: (error as Error).message,
		};
	}

	// Fallback
	return {
		message: 'Validation error occurred',
		error: String(error),
	};
}

/**
 * Wrapper para decodificar con logging mejorado
 * Útil para debugging en desarrollo
 */
export async function decodeWithLog<A, I>(
	schema: Schema.Schema<A, I>,
	value: unknown,
	context: string
): Promise<A> {
	logger.debug(`Decodificando ${context}`, { value });
	
	const decode = Schema.decodeUnknown(schema);
	const eitherResult = await runPromiseEither(decode(value) as Effect.Effect<A, unknown, never>);
	
	if (eitherResult._tag === 'Left') {
		logger.error(`Error decodificando ${context}`, { error: eitherResult.left });
		throw eitherResult.left;
	}
	
	logger.debug(`${context} decodificado exitosamente`, { result: eitherResult.right });
	
	return eitherResult.right;
}

/**
 * Helper para validar en servicios (fuera de Express)
 * 
 * @example
 * ```typescript
 * const validatedInput = yield* validateInService(AlbumCreateInput, rawInput);
 * ```
 */
export function validateInService<A, I>(
	schema: Schema.Schema<A, I>,
	value: unknown
): Effect.Effect<A, unknown, never> {
	const decode = Schema.decodeUnknown(schema);
	return decode(value) as Effect.Effect<A, unknown, never>;
}

// ============= Re-exports =============

export { Schema };
