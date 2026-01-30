/**
 * @file Transformation Utilities
 * @module lib/effect/schemas/transformations
 * @description Utilidades para transformaciones y conversiones entre tipos Effect (versión simplificada)
 * @created 2025-10-11 - Fase 2 Effect Implementation
 * @note Este archivo contiene transformaciones básicas. Para transformaciones avanzadas,
 *       consultar la documentación de @effect/schema en https://effect.website/docs/schema
 */

import { Schema } from '@effect/schema';

// ============= NOTA IMPORTANTE =============
// Las transformaciones avanzadas de Effect Schema requieren `strict: true` en las opciones.
// Por simplicidad, este archivo se enfoca en schemas básicos que funcionan sin transformaciones complejas.
// Para transformaciones custom, usar Schema.transformOrFail o Schema.transform con configuración explícita.

// ============= Transform Helpers =============

/**
 * Transforma un string a número entero
 */
export const StringToInt = Schema.NumberFromString.pipe(Schema.int()).annotations({
	identifier: 'StringToInt',
	title: 'Parse string to integer',
});

/**
 * Transforma un string a boolean
 */
export const StringToBoolean = Schema.String.pipe(
	Schema.transform(Schema.Boolean, {
		decode: (s) => {
			const lower = s.toLowerCase();
			if (lower === 'true' || lower === '1' || lower === 'yes') return true;
			if (lower === 'false' || lower === '0' || lower === 'no') return false;
			throw new Error(`Cannot convert "${s}" to boolean`);
		},
		encode: (b) => b.toString(),
	})
).annotations({
	identifier: 'StringToBoolean',
	title: 'Parse string to boolean',
});

/**
 * Transforma comma-separated string a array
 */
export const CommaSeparatedToArray = Schema.String.pipe(
	Schema.transform(Schema.Array(Schema.String), {
		decode: (s) =>
			s
				.split(',')
				.map((item) => item.trim())
				.filter(Boolean),
		encode: (arr) => arr.join(','),
		strict: true,
	})
).annotations({
	identifier: 'CommaSeparatedToArray',
	title: 'Parse comma-separated string to array',
	examples: [['tag1,tag2,tag3']],
});

/**
 * Transforma JSON string a objeto
 */
export const JSONStringToObject = Schema.String.pipe(
	Schema.transform(Schema.Unknown, {
		decode: (s) => {
			try {
				return JSON.parse(s);
			} catch {
				throw new Error(`Invalid JSON: ${s}`);
			}
		},
		encode: (obj) => JSON.stringify(obj),
	})
).annotations({
	identifier: 'JSONStringToObject',
	title: 'Parse JSON string to object',
});

// ============= Nullable Transforms =============

/**
 * Transforma empty string a null
 */
export const EmptyStringToNull = Schema.String.pipe(
	Schema.transform(Schema.NullOr(Schema.String), {
		decode: (s) => (s.trim() === '' ? null : s),
		encode: (n) => (n === null ? '' : n),
	})
).annotations({
	identifier: 'EmptyStringToNull',
	title: 'Convert empty string to null',
});

/**
 * Transforma undefined a null para serialización
 */
export const UndefinedToNull = <A, I, R>(schema: Schema.Schema<A, I, R>) =>
	Schema.Union(
		schema,
		Schema.Undefined.pipe(
			Schema.transform(Schema.Null, {
				decode: () => null,
				encode: () => undefined,
			})
		)
	);

// ============= Array Transforms =============

/**
 * Asegura que el valor sea un array (envuelve en array si no lo es)
 * @note Usa strict: false debido a la complejidad de tipos genéricos de Effect Schema
 */
export const ensureArray = <A, I, R>(itemSchema: Schema.Schema<A, I, R>) =>
	Schema.Union(
		Schema.Array(itemSchema),
		itemSchema.pipe(
			Schema.transform(Schema.Array(itemSchema), {
				strict: false,
				decode: (item) => [item],
				encode: (arr) => arr[0],
			})
		)
	);

/**
 * Filtra valores null/undefined de un array
 * @note Usa strict: false debido a la complejidad de tipos genéricos de Effect Schema
 */
export const compactArray = <A, I, R>(itemSchema: Schema.Schema<A, I, R>) =>
	Schema.Array(Schema.NullOr(Schema.UndefinedOr(itemSchema))).pipe(
		Schema.transform(Schema.Array(itemSchema), {
			strict: false,
			decode: (arr) => arr.filter((item): item is A => item != null),
			encode: (arr) => arr,
		})
	);

// ============= Date Transforms =============

/**
 * Transforma timestamp (ms) a Date
 */
export const TimestampToDate = Schema.Number.pipe(
	Schema.int(),
	Schema.positive(),
	Schema.transform(Schema.Date, {
		strict: false,
		decode: (timestamp) => new Date(timestamp),
		encode: (_toI, toA) => toA.getTime(),
	})
).annotations({
	identifier: 'TimestampToDate',
	title: 'Convert Unix timestamp (ms) to Date',
});

/**
 * Transforma ISO string flexible (acepta Date también)
 */
export const FlexibleDateFromString = Schema.Union(
	Schema.Date,
	Schema.DateFromString,
	Schema.String.pipe(
		Schema.transform(Schema.Date, {
			strict: false,
			decode: (s) => {
				const date = new Date(s);
				if (Number.isNaN(date.getTime())) {
					throw new Error(`Invalid date string: ${s}`);
				}
				return date;
			},
			encode: (_toI, toA) => toA.toISOString(),
		})
	)
).annotations({
	identifier: 'FlexibleDateFromString',
	title: 'Parse flexible date input (Date, ISO string, or date string)',
});

// ============= Object Transforms =============

/**
 * Omite propiedades con valores undefined
 * @note Usa strict: false debido a la complejidad de tipos genéricos de Effect Schema
 */
export const omitUndefined = <Fields extends Schema.Struct.Fields>(fields: Fields) =>
	Schema.Struct(fields).pipe(
		Schema.transform(Schema.Struct(fields), {
			strict: false,
			decode: (obj) => {
				const result: any = {};
				for (const [key, value] of Object.entries(obj)) {
					if (value !== undefined) {
						result[key] = value;
					}
				}
				return result;
			},
			encode: (obj) => obj,
		})
	);

/**
 * Convierte propiedades a camelCase
 */
export const toCamelCase = (str: string): string => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

/**
 * Convierte propiedades a snake_case
 */
export const toSnakeCase = (str: string): string => str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

/**
 * Transform DB snake_case keys to camelCase
 */
export const dbKeysToJS = <A extends Record<string, unknown>>(obj: A): any => {
	const result: any = {};
	for (const [key, value] of Object.entries(obj)) {
		result[toCamelCase(key)] = value;
	}
	return result;
};

/**
 * Transform JS camelCase keys to DB snake_case
 */
export const jsKeysToDb = <A extends Record<string, unknown>>(obj: A): any => {
	const result: any = {};
	for (const [key, value] of Object.entries(obj)) {
		result[toSnakeCase(key)] = value;
	}
	return result;
};

// ============= Default Value Helpers =============

/**
 * Aplica un valor por defecto si el campo es null/undefined
 * @note Usa strict: false debido a la complejidad de tipos genéricos de Effect Schema
 */
export const withDefault = <A, I, R>(schema: Schema.Schema<A, I, R>, defaultValue: A) =>
	Schema.NullOr(Schema.UndefinedOr(schema)).pipe(
		Schema.transform(schema, {
			strict: false,
			decode: (value) => value ?? defaultValue,
			encode: (value) => value,
		})
	);

/**
 * Coalesce: usa el primer valor no-null
 */
export const coalesce = <A, I, R>(...schemas: Schema.Schema<A, I, R>[]): Schema.Schema<A, I, R> => {
	if (schemas.length === 0) {
		throw new Error('coalesce requires at least one schema');
	}
	if (schemas.length === 1) {
		return schemas[0];
	}

	return Schema.Union(...schemas) as Schema.Schema<A, I, R>;
};

// ============= Trim & Sanitize =============

/**
 * Trim whitespace de strings
 */
export const TrimmedString = Schema.String.pipe(
	Schema.transform(Schema.String, {
		strict: true,
		decode: (s) => s.trim(),
		encode: (s) => s,
	})
);

/**
 * Lowercase string
 */
export const LowercaseString = Schema.String.pipe(
	Schema.transform(Schema.String, {
		strict: true,
		decode: (s) => s.toLowerCase(),
		encode: (s) => s,
	})
);

/**
 * Uppercase string
 */
export const UppercaseString = Schema.String.pipe(
	Schema.transform(Schema.String, {
		strict: true,
		decode: (s) => s.toUpperCase(),
		encode: (s) => s,
	})
);

/**
 * Slug-safe string (lowercase, trim, replace spaces/special chars with hyphens)
 */
export const SlugString = Schema.String.pipe(
	Schema.transform(Schema.String, {
		strict: true,
		decode: (s) =>
			s
				.toLowerCase()
				.trim()
				.replace(/[^\w\s-]/g, '')
				.replace(/[\s_]+/g, '-')
				.replace(/^-+|-+$/g, ''),
		encode: (s) => s,
	})
).annotations({
	identifier: 'SlugString',
	title: 'URL-safe slug string',
	examples: ['my-awesome-post', 'hello-world-2024'],
});

// ============= Validation Combinators =============

/**
 * Valida que un string no esté vacío después de trim
 */
export const NonEmptyTrimmedString = TrimmedString.pipe(
	Schema.minLength(1, {
		message: () => 'String cannot be empty or whitespace-only',
	})
);

/**
 * Email validado y normalizado (lowercase, trim)
 */
export const NormalizedEmail = Schema.String.pipe(
	Schema.transform(Schema.String, {
		strict: true,
		decode: (s) => s.trim().toLowerCase(),
		encode: (s) => s,
	}),
	Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
		message: () => 'Invalid email format',
	})
).annotations({
	identifier: 'NormalizedEmail',
	title: 'Normalized and validated email',
});

/**
 * URL validado
 */
export const ValidURL = Schema.String.pipe(
	Schema.filter(
		(s) => {
			try {
				new URL(s);
				return true;
			} catch {
				return false;
			}
		},
		{
			message: () => 'Invalid URL format',
		}
	)
).annotations({
	identifier: 'ValidURL',
	title: 'Validated URL string',
});

// ============= Export All =============

export {
	// Re-export commonly used Schema utilities
	Schema,
};
