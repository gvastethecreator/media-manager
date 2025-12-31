/**
 * @file Express Validation Middleware
 * @module server/middleware/validation
 * @description Middleware para validar request body, query params y route params usando Effect Schema
 * @created 2025-10-11 - Fase 2 Effect Implementation
 */

import { Schema } from '@effect/schema';
import { Effect } from 'effect';
import type { NextFunction, Request, Response } from 'express';

/**
 * Error de validación HTTP
 */
export type ValidationError = {
	_tag: 'ValidationError';
	message: string;
	field?: string;
	details: unknown;
	timestamp: Date;
};

/**
 * Crea un ValidationError a partir de ParseError
 */
const toValidationError = (error: unknown, source: string): ValidationError => ({
	_tag: 'ValidationError',
	message: `Validation failed for ${source}`,
	details: error,
	timestamp: new Date(),
});

/**
 * Middleware para validar request body
 *
 * @example
 * ```typescript
 * router.post('/',
 *   validateBody(TagCreate),
 *   async (req, res) => {
 *     // req.body ya está validado y tipado como TagCreate
 *     const tag = req.body;
 *   }
 * );
 * ```
 */
export const validateBody = <A, I>(schema: Schema.Schema<A, I, never>) => {
	const decode = Schema.decodeUnknown(schema);

	return async (req: Request, res: Response, next: NextFunction) => {
		const effect = decode(req.body);

		const result = await Effect.runPromise(Effect.either(effect));

		if (result._tag === 'Left') {
			const error = toValidationError(result.left, 'request body');
			return res.status(400).json({
				error: error.message,
				details: error.details,
				timestamp: error.timestamp.toISOString(),
			});
		}

		// Reemplazar req.body con valor validado
		req.body = result.right;
		next();
	};
};

/**
 * Middleware para validar query params
 *
 * @example
 * ```typescript
 * router.get('/',
 *   validateQuery(PaginationInput),
 *   async (req, res) => {
 *     // req.query ya está validado y tipado como PaginationInput
 *     const { limit, offset } = req.query;
 *   }
 * );
 * ```
 */
export const validateQuery = <A, I>(schema: Schema.Schema<A, I, never>) => {
	const decode = Schema.decodeUnknown(schema);

	return async (req: Request, res: Response, next: NextFunction) => {
		// Convertir query params (siempre strings) a tipos apropiados
		const queryWithTypes = convertQueryTypes(req.query);

		const effect = decode(queryWithTypes);
		const result = await Effect.runPromise(Effect.either(effect));

		if (result._tag === 'Left') {
			const error = toValidationError(result.left, 'query parameters');
			return res.status(400).json({
				error: error.message,
				details: error.details,
				timestamp: error.timestamp.toISOString(),
			});
		}

		// Reemplazar req.query con valor validado
		req.query = result.right as any;
		next();
	};
};

/**
 * Middleware para validar route params
 *
 * @example
 * ```typescript
 * const ParamSchema = Schema.Struct({ id: Schema.UUID });
 *
 * router.get('/:id',
 *   validateParams(ParamSchema),
 *   async (req, res) => {
 *     // req.params.id está validado como UUID
 *     const { id } = req.params;
 *   }
 * );
 * ```
 */
export const validateParams = <A, I>(schema: Schema.Schema<A, I, never>) => {
	const decode = Schema.decodeUnknown(schema);

	return async (req: Request, res: Response, next: NextFunction) => {
		const effect = decode(req.params);
		const result = await Effect.runPromise(Effect.either(effect));

		if (result._tag === 'Left') {
			const error = toValidationError(result.left, 'route parameters');
			return res.status(400).json({
				error: error.message,
				details: error.details,
				timestamp: error.timestamp.toISOString(),
			});
		}

		// Reemplazar req.params con valor validado
		req.params = result.right as any;
		next();
	};
};

/**
 * Convierte query params de string a tipos apropiados
 * Express siempre parsea query como strings, necesitamos convertir a números, booleans, etc.
 */
function convertQueryTypes(query: any): any {
	const result: any = {};

	for (const [key, value] of Object.entries(query)) {
		if (value === undefined || value === null) {
			result[key] = value;
			continue;
		}

		// Si es array, convertir cada elemento
		if (Array.isArray(value)) {
			result[key] = value.map(convertQueryValue);
			continue;
		}

		result[key] = convertQueryValue(value);
	}

	return result;
}

/**
 * Convierte un valor individual de query param
 */
function convertQueryValue(value: any): any {
	if (typeof value !== 'string') {
		return value;
	}

	// Boolean
	if (value === 'true') return true;
	if (value === 'false') return false;

	// Number (solo si parece un número)
	if (/^-?\d+(\.\d+)?$/.test(value)) {
		const num = Number(value);
		if (!Number.isNaN(num)) return num;
	}

	// Mantener como string
	return value;
}

/**
 * Middleware genérico que valida múltiples partes del request
 *
 * @example
 * ```typescript
 * router.post('/:id',
 *   validate({
 *     params: Schema.Struct({ id: Schema.UUID }),
 *     body: TagUpdate,
 *     query: PaginationInput,
 *   }),
 *   async (req, res) => {
 *     // Todos los campos validados
 *   }
 * );
 * ```
 */
export const validate = (options: {
	params?: Schema.Schema.Any;
	body?: Schema.Schema.Any;
	query?: Schema.Schema.Any;
}) => {
	const middlewares: Array<ReturnType<typeof validateParams | typeof validateBody | typeof validateQuery>> = [];

	if (options.params) {
		middlewares.push(validateParams(options.params as any));
	}

	if (options.body) {
		middlewares.push(validateBody(options.body as any));
	}

	if (options.query) {
		middlewares.push(validateQuery(options.query as any));
	}

	// Combinar todos los middlewares en uno
	return async (req: Request, res: Response, next: NextFunction) => {
		for (const middleware of middlewares) {
			await new Promise<void>((resolve, reject) => {
				middleware(req, res, (err?: any) => {
					if (err) reject(err);
					else resolve();
				});
			}).catch((err) => {
				// Si algún middleware falla, retornar el error
				if (!res.headersSent) {
					return res.status(400).json({
						error: 'Validation failed',
						details: err,
					});
				}
			});

			// Si ya se envió respuesta (error de validación), detener
			if (res.headersSent) {
				return;
			}
		}

		next();
	};
};
