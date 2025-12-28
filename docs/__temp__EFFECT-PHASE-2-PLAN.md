# 📊 Fase 2: Validation & Schemas - Plan Detallado

**Fecha:** 11 de octubre de 2025  
**Duración estimada:** 3-4 días  
**Prerequisitos:** Fase 1 completada (TagService piloto funcional)  
**Objetivo:** Centralizar y estandarizar validación usando @effect/schema

---

## 🎯 Objetivos de la Fase 2

### Objetivos Principales
1. ✅ **Centralizar schemas comunes** reutilizables en toda la app
2. ✅ **Migrar validación Zod → Effect Schema** incrementalmente
3. ✅ **Estandarizar validación HTTP** en Express middleware
4. ✅ **Crear transformers tipados** para conversiones DB ↔ DTO ↔ View
5. ✅ **Documentar patrones** de validación y transformación

### Beneficios Esperados
- 🔒 **Type-safety mejorado**: Validación runtime + compile-time unificada
- 📦 **Reutilización**: Schemas compartidos evitan duplicación
- 🎨 **Consistencia**: Mismo estilo de validación en todos los servicios
- 🐛 **Debugging**: Errores de validación más descriptivos
- 🧪 **Testing**: Schemas testables independientemente

---

## 📋 Tareas Detalladas

### Tarea 1: Centralizar Schemas Comunes
**Prioridad:** ALTA | **Duración:** 2-3 horas

#### Archivos a Crear
- `src/lib/effect/schemas/common.ts`
- `src/lib/effect/schemas/primitives.ts`
- `src/lib/effect/schemas/index.ts` (barrel export)

#### Implementación

**common.ts:**
```typescript
import { Schema } from '@effect/schema';

// ============= ID Types =============
export const UUID = Schema.UUID.annotations({
	identifier: 'UUID',
	title: 'Universally Unique Identifier',
	description: 'UUID v4 format',
});

export const Slug = Schema.String.pipe(
	Schema.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	Schema.minLength(1),
	Schema.maxLength(100)
).annotations({
	identifier: 'Slug',
	title: 'URL-safe identifier',
	description: 'Lowercase alphanumeric with hyphens',
	examples: ['my-folder', 'vacation-2024'],
});

// ============= Pagination =============
export class PaginationInput extends Schema.Class<PaginationInput>('PaginationInput')({
	page: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive()).annotations({
		description: 'Page number (1-indexed)',
		default: 1,
	})),
	pageSize: Schema.optional(Schema.Number.pipe(
		Schema.int(),
		Schema.positive(),
		Schema.lessThanOrEqualTo(100)
	).annotations({
		description: 'Items per page (max 100)',
		default: 20,
	})),
}) {}

export class PaginationMeta extends Schema.Class<PaginationMeta>('PaginationMeta')({
	page: Schema.Number,
	pageSize: Schema.Number,
	total: Schema.Number,
	totalPages: Schema.Number,
	hasNextPage: Schema.Boolean,
	hasPreviousPage: Schema.Boolean,
}) {}

export class PaginatedResult<ItemSchema extends Schema.Schema.Any> extends Schema.Class<PaginatedResult<ItemSchema>>('PaginatedResult')({
	items: Schema.Array(Schema.Any),
	meta: PaginationMeta,
}) {
	static make = <A>(itemSchema: Schema.Schema<A, any, never>) => 
		Schema.Struct({
			items: Schema.Array(itemSchema),
			meta: PaginationMeta,
		});
}

// ============= Sorting =============
export class SortOptions extends Schema.Class<SortOptions>('SortOptions')({
	orderBy: Schema.optional(Schema.String),
	orderDirection: Schema.optional(Schema.Literal('asc', 'desc')),
}) {}

// ============= Date Ranges =============
export class DateRange extends Schema.Class<DateRange>('DateRange')({
	from: Schema.optional(Schema.DateFromString),
	to: Schema.optional(Schema.DateFromString),
}) {}

// ============= Search =============
export class SearchOptions extends Schema.Class<SearchOptions>('SearchOptions')({
	query: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
	fields: Schema.optional(Schema.Array(Schema.String)),
}) {}
```

**primitives.ts:**
```typescript
import { Schema } from '@effect/schema';

// ============= Strings =============
export const NonEmptyString = Schema.String.pipe(
	Schema.minLength(1),
	Schema.trim()
).annotations({
	identifier: 'NonEmptyString',
	title: 'Non-empty string',
});

export const NonEmptyTrimmedString = Schema.String.pipe(
	Schema.trim(),
	Schema.minLength(1)
).annotations({
	identifier: 'NonEmptyTrimmedString',
	description: 'String that is trimmed and non-empty after trim',
});

// ============= Numbers =============
export const PositiveInt = Schema.Number.pipe(
	Schema.int(),
	Schema.positive()
).annotations({
	identifier: 'PositiveInt',
	title: 'Positive integer',
});

export const NonNegativeInt = Schema.Number.pipe(
	Schema.int(),
	Schema.nonNegative()
).annotations({
	identifier: 'NonNegativeInt',
	title: 'Non-negative integer (>= 0)',
});

export const Percentage = Schema.Number.pipe(
	Schema.greaterThanOrEqualTo(0),
	Schema.lessThanOrEqualTo(100)
).annotations({
	identifier: 'Percentage',
	title: 'Percentage (0-100)',
});

// ============= Colors =============
export const HexColor = Schema.String.pipe(
	Schema.pattern(/^#[0-9A-Fa-f]{6}$/)
).annotations({
	identifier: 'HexColor',
	title: 'Hex color code',
	description: 'RGB color in #RRGGBB format',
	examples: ['#FF5733', '#3498db'],
});

export const HexColorWithAlpha = Schema.String.pipe(
	Schema.pattern(/^#[0-9A-Fa-f]{8}$/)
).annotations({
	identifier: 'HexColorWithAlpha',
	title: 'Hex color with alpha',
	description: 'RGBA color in #RRGGBBAA format',
});

// ============= URLs & Paths =============
export const HttpUrl = Schema.String.pipe(
	Schema.pattern(/^https?:\/\/.+/)
).annotations({
	identifier: 'HttpUrl',
	title: 'HTTP/HTTPS URL',
});

export const AbsoluteFilePath = Schema.String.pipe(
	Schema.minLength(1)
).annotations({
	identifier: 'AbsoluteFilePath',
	title: 'Absolute file path',
	description: 'OS-agnostic absolute path',
});

// ============= Media =============
export const ImageMimeType = Schema.Literal(
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml'
).annotations({
	identifier: 'ImageMimeType',
	title: 'Supported image MIME type',
});

export const VideoMimeType = Schema.Literal(
	'video/mp4',
	'video/webm',
	'video/ogg',
	'video/quicktime'
).annotations({
	identifier: 'VideoMimeType',
	title: 'Supported video MIME type',
});

// ============= Entity Status =============
export const EntityStatus = Schema.Literal(
	'active',
	'archived',
	'deleted'
).annotations({
	identifier: 'EntityStatus',
	title: 'Entity lifecycle status',
});

// ============= Timestamps =============
export class TimestampFields extends Schema.Class<TimestampFields>('TimestampFields')({
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
}) {}

export class SoftDeleteFields extends Schema.Class<SoftDeleteFields>('SoftDeleteFields')({
	deletedAt: Schema.optional(Schema.NullOr(Schema.DateFromSelf)),
}) {}
```

#### Checklist de Implementación
- [ ] Crear `common.ts` con schemas de paginación, sorting, date ranges
- [ ] Crear `primitives.ts` con validaciones de tipos básicos
- [ ] Crear barrel export `index.ts`
- [ ] Agregar JSDoc completo con ejemplos
- [ ] Validar que compila sin errores TypeScript

---

### Tarea 2: Schemas de Validación Primitivos
**Prioridad:** ALTA | **Duración:** 1-2 horas

Ya cubierto en Tarea 1 (`primitives.ts`).

---

### Tarea 3: Migrar Schemas Zod → Effect Schema
**Prioridad:** MEDIA | **Duración:** 3-4 horas

#### Análisis de Schemas Zod Existentes

**Archivos a revisar:**
```bash
# Buscar todos los schemas Zod
grep -r "z\." src/ --include="*.ts" | grep -v node_modules
```

#### Estrategia de Migración

1. **Identificar schemas Zod más usados** (priorizar por frecuencia)
2. **Crear versión Effect paralela** en mismo archivo
3. **Mantener Zod temporalmente** para backward compatibility
4. **Migrar consumers gradualmente**

#### Ejemplo de Migración

**Antes (Zod):**
```typescript
// src/types/entities/image/types.ts
export const ImageSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1),
	path: z.string(),
	mimeType: z.string(),
	width: z.number().int().positive(),
	height: z.number().int().positive(),
	// ...
});
```

**Después (Effect + Zod coexistiendo):**
```typescript
// src/types/entities/image/types.ts
import { Schema } from '@effect/schema';
import { z } from 'zod';

// Legacy Zod (mantener temporalmente)
export const ImageSchemaZod = z.object({
	id: z.string().uuid(),
	name: z.string().min(1),
	// ...
});

// NEW: Effect Schema
export class Image extends Schema.Class<Image>('Image')({
	id: Schema.UUID,
	name: NonEmptyTrimmedString,
	path: AbsoluteFilePath,
	mimeType: ImageMimeType,
	width: PositiveInt,
	height: PositiveInt,
	// ...
}) {}

// Mantener type inference para compatibilidad
export type Image = typeof ImageSchemaZod._type; // Legacy
export type ImageEffect = Schema.Schema.Type<typeof Image>; // Effect
```

#### Prioridades de Migración
1. **Image** (más usado, crítico)
2. **Folder** (jerarquía, relaciones)
3. **Album** (colecciones)
4. **Video** (similar a Image)
5. Resto según necesidad

---

### Tarea 4: Middleware de Validación Express
**Prioridad:** ALTA | **Duración:** 2-3 horas

#### Archivo a Crear
`src/lib/effect/middleware/validation.middleware.ts`

#### Implementación

```typescript
import { Effect, pipe } from 'effect';
import { Schema } from '@effect/schema';
import type { Request, Response, NextFunction } from 'express';
import { TagValidationError } from '@/services/tag/tag-errors.effect';

/**
 * Opciones para validación middleware
 */
export interface ValidationOptions {
	/** Si debe abortar en primer error o acumular todos */
	readonly abortEarly?: boolean;
	/** Handler custom para errores de validación */
	readonly onError?: (errors: Schema.ParseIssue[]) => void;
}

/**
 * Valida request body usando Effect Schema
 */
export const validateBody = <A, I, R>(
	schema: Schema.Schema<A, I, R>,
	options?: ValidationOptions
) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const effect = pipe(
			Effect.try({
				try: () => Schema.decodeUnknownSync(schema)(req.body),
				catch: (error) => ({
					type: 'ValidationError' as const,
					field: 'body',
					message: String(error),
					issues: Schema.TreeFormatter.formatErrorSync(error as any),
				}),
			})
		);

		try {
			req.body = await Effect.runPromise(effect);
			next();
		} catch (error: any) {
			res.status(400).json({
				error: 'Validation Error',
				field: error.field,
				message: error.message,
				details: error.issues,
			});
		}
	};
};

/**
 * Valida request params usando Effect Schema
 */
export const validateParams = <A, I, R>(
	schema: Schema.Schema<A, I, R>
) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			req.params = Schema.decodeUnknownSync(schema)(req.params);
			next();
		} catch (error: any) {
			res.status(400).json({
				error: 'Invalid URL parameters',
				details: Schema.TreeFormatter.formatErrorSync(error),
			});
		}
	};
};

/**
 * Valida query params usando Effect Schema
 */
export const validateQuery = <A, I, R>(
	schema: Schema.Schema<A, I, R>
) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			req.query = Schema.decodeUnknownSync(schema)(req.query);
			next();
		} catch (error: any) {
			res.status(400).json({
				error: 'Invalid query parameters',
				details: Schema.TreeFormatter.formatErrorSync(error),
			});
		}
	};
};

/**
 * Valida múltiples partes del request a la vez
 */
export const validate = <
	BodySchema extends Schema.Schema.Any,
	ParamsSchema extends Schema.Schema.Any,
	QuerySchema extends Schema.Schema.Any
>(config: {
	body?: BodySchema;
	params?: ParamsSchema;
	query?: QuerySchema;
}) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (config.body) {
				req.body = Schema.decodeUnknownSync(config.body)(req.body);
			}
			if (config.params) {
				req.params = Schema.decodeUnknownSync(config.params)(req.params);
			}
			if (config.query) {
				req.query = Schema.decodeUnknownSync(config.query)(req.query);
			}
			next();
		} catch (error: any) {
			res.status(400).json({
				error: 'Validation Error',
				details: Schema.TreeFormatter.formatErrorSync(error),
			});
		}
	};
};
```

#### Uso en Routes

```typescript
// src/server/routes/tags.effect.ts
import { validateBody, validateParams } from '@/lib/effect/middleware/validation.middleware';
import { TagCreate, TagUpdate } from '@/services/tag/tag-schemas';

// POST /api/tags - con validación automática
router.post('/',
	validateBody(TagCreate),  // ✅ Valida antes del handler
	effectHandler((req, res) =>
		Effect.gen(function*() {
			const service = yield* TagService;
			// req.body ya está validado y tipado como TagCreate
			return yield* service.create(req.body);
		}).pipe(Effect.provide(TagServiceLive))
	)
);

// PUT /api/tags/:id - validar body y params
router.put('/:id',
	validate({
		params: Schema.Struct({ id: Schema.UUID }),
		body: TagUpdate,
	}),
	effectHandler((req, res) => {
		// req.params.id y req.body ya validados
	})
);
```

---

### Tarea 5: Transformers con Schema.transform
**Prioridad:** MEDIA | **Duración:** 2-3 horas

#### Archivos a Crear
- `src/transformers/tag/transformers.effect.ts`
- `src/transformers/image/transformers.effect.ts`
- `src/transformers/folder/transformers.effect.ts`

#### Implementación Tag Transformer

```typescript
// src/transformers/tag/transformers.effect.ts
import { Schema, pipe } from '@effect/schema';
import { Tag, TagWithStats, TagPreview } from '@/services/tag/tag-schemas';

/**
 * Transforma Tag DB → TagPreview (vista minimal)
 */
export const TagToPreview = Schema.transform(
	Tag,
	TagPreview,
	{
		decode: (tag) => ({
			id: tag.id,
			name: tag.name,
			color: tag.color,
			emoji: tag.emoji,
		}),
		encode: (preview) => {
			throw new Error('TagPreview no se puede convertir a Tag completo');
		},
	}
);

/**
 * Enriquece Tag con stats → TagWithStats
 */
export const enrichTagWithStats = (imageCount: number) =>
	Schema.transform(
		Tag,
		TagWithStats,
		{
			decode: (tag) => ({
				...tag,
				imageCount,
			}),
			encode: (withStats) => {
				const { imageCount, ...tag } = withStats;
				return tag;
			},
		}
	);

/**
 * Batch transformer: array de Tags → array de TagPreviews
 */
export const tagsToPreviewList = Schema.transform(
	Schema.Array(Tag),
	Schema.Array(TagPreview),
	{
		decode: (tags) => tags.map(TagToPreview.decode),
		encode: (previews) => {
			throw new Error('Cannot convert previews back to full tags');
		},
	}
);
```

#### Uso en Servicios

```typescript
// src/services/tag/tag.service.effect.ts
import { enrichTagWithStats, TagToPreview } from '@/transformers/tag/transformers.effect';

const getByIdWithStats = (id: string): Effect.Effect<TagWithStats, TagError> =>
	Effect.gen(function*() {
		const tag = yield* getById(id);
		const imageCount = yield* getImageCount(id);
		
		// Aplicar transformer para enriquecer
		return enrichTagWithStats(imageCount).decode(tag);
	});

const getAllPreviews = (): Effect.Effect<TagPreview[], TagError> =>
	Effect.gen(function*() {
		const tags = yield* getAll();
		
		// Transformar lista a previews
		return tags.map(TagToPreview.decode);
	});
```

---

### Tarea 6: Schemas de Error Responses HTTP
**Prioridad:** MEDIA | **Duración:** 1-2 horas

#### Archivo a Crear
`src/lib/effect/schemas/http-errors.ts`

#### Implementación

```typescript
import { Schema } from '@effect/schema';

/**
 * Detalle de error de validación
 */
export class ValidationErrorDetail extends Schema.Class<ValidationErrorDetail>('ValidationErrorDetail')({
	field: Schema.String,
	message: Schema.String,
	value: Schema.optional(Schema.Unknown),
}) {}

/**
 * Error genérico de API
 */
export class ErrorResponse extends Schema.Class<ErrorResponse>('ErrorResponse')({
	error: Schema.String,
	message: Schema.String,
	statusCode: Schema.Number,
	timestamp: Schema.DateFromString,
	path: Schema.optional(Schema.String),
}) {}

/**
 * Error de validación (400)
 */
export class ValidationErrorResponse extends ErrorResponse.extend<ValidationErrorResponse>('ValidationErrorResponse')({
	details: Schema.Array(ValidationErrorDetail),
}) {
	static make(field: string, message: string, path?: string): ValidationErrorResponse {
		return new ValidationErrorResponse({
			error: 'Validation Error',
			message: `Invalid ${field}: ${message}`,
			statusCode: 400,
			timestamp: new Date().toISOString() as any,
			path,
			details: [{ field, message }],
		});
	}
}

/**
 * Error de recurso no encontrado (404)
 */
export class NotFoundErrorResponse extends ErrorResponse.extend<NotFoundErrorResponse>('NotFoundErrorResponse')({
	resourceType: Schema.String,
	resourceId: Schema.String,
}) {
	static make(resourceType: string, resourceId: string, path?: string): NotFoundErrorResponse {
		return new NotFoundErrorResponse({
			error: 'Not Found',
			message: `${resourceType} with ID ${resourceId} not found`,
			statusCode: 404,
			timestamp: new Date().toISOString() as any,
			path,
			resourceType,
			resourceId,
		});
	}
}

/**
 * Error de conflicto (409)
 */
export class ConflictErrorResponse extends ErrorResponse.extend<ConflictErrorResponse>('ConflictErrorResponse')({
	conflictType: Schema.String,
	conflictingValue: Schema.String,
}) {}

/**
 * Error interno del servidor (500)
 */
export class InternalErrorResponse extends ErrorResponse.extend<InternalErrorResponse>('InternalErrorResponse')({
	errorId: Schema.optional(Schema.UUID),
	stack: Schema.optional(Schema.String),
}) {}
```

#### Integración en Express Adapter

```typescript
// src/lib/effect/adapters/express.adapter.ts
import { ValidationErrorResponse, NotFoundErrorResponse, ConflictErrorResponse } from '@/lib/effect/schemas/http-errors';
import { TagNotFound, TagNameConflict, TagValidationError } from '@/services/tag/tag-errors.effect';

const mapErrorToResponse = (error: unknown, path: string): [number, object] => {
	// Effect errors
	if (error instanceof TagNotFound) {
		const response = NotFoundErrorResponse.make('Tag', error.tagId, path);
		return [404, response];
	}
	
	if (error instanceof TagNameConflict) {
		const response = new ConflictErrorResponse({
			error: 'Conflict',
			message: `Tag name '${error.name}' already exists`,
			statusCode: 409,
			timestamp: new Date().toISOString() as any,
			path,
			conflictType: 'duplicate_name',
			conflictingValue: error.name,
		});
		return [409, response];
	}
	
	if (error instanceof TagValidationError) {
		const response = ValidationErrorResponse.make(error.field, error.message, path);
		return [400, response];
	}
	
	// Generic error
	return [500, {
		error: 'Internal Server Error',
		message: String(error),
		statusCode: 500,
		timestamp: new Date().toISOString(),
	}];
};
```

---

### Tarea 7: Actualizar TagService con Validaciones
**Prioridad:** ALTA | **Duración:** 1-2 horas

#### Cambios en tag.service.effect.ts

**Antes:**
```typescript
const create = (input: TagCreate): Effect.Effect<Tag, TagError> =>
	Effect.gen(function*() {
		// Validación implícita con decodeUnknownSync
		const validated = Schema.decodeUnknownSync(TagCreate)(input);
		// ...
	});
```

**Después:**
```typescript
const create = (input: TagCreate): Effect.Effect<Tag, TagError> =>
	Effect.gen(function*() {
		// Validación explícita con manejo de errores Effect-style
		const validated = yield* Effect.try({
			try: () => Schema.decodeUnknownSync(TagCreate)(input),
			catch: (error) => new TagValidationError({
				field: 'input',
				message: Schema.TreeFormatter.formatErrorSync(error as any),
			}),
		});
		
		// Check duplicados
		const existing = yield* Effect.tryPromise({
			try: () => db.select().from(tags).where(eq(tags.name, validated.name)),
			catch: (error) => fromUnknownError('create:checkDuplicate', error),
		});
		
		if (existing.length > 0) {
			return yield* Effect.fail(new TagNameConflict({
				name: validated.name,
				existingTagId: existing[0].id,
			}));
		}
		
		// Create
		// ...
	});
```

---

### Tarea 8: Tests Unitarios de Schemas
**Prioridad:** MEDIA | **Duración:** 2-3 horas

#### Archivos a Crear
- `tests/unit/schemas/common.test.ts`
- `tests/unit/schemas/primitives.test.ts`
- `tests/unit/schemas/tag-schemas.test.ts`

#### Ejemplo: common.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { Schema } from '@effect/schema';
import { UUID, Slug, PaginationInput, HexColor } from '@/lib/effect/schemas';

describe('Common Schemas', () => {
	describe('UUID', () => {
		it('should validate valid UUIDs', () => {
			const valid = '550e8400-e29b-41d4-a716-446655440000';
			expect(() => Schema.decodeUnknownSync(UUID)(valid)).not.toThrow();
		});
		
		it('should reject invalid UUIDs', () => {
			const invalid = 'not-a-uuid';
			expect(() => Schema.decodeUnknownSync(UUID)(invalid)).toThrow();
		});
	});
	
	describe('Slug', () => {
		it('should validate valid slugs', () => {
			const valid = 'my-folder-name';
			expect(() => Schema.decodeUnknownSync(Slug)(valid)).not.toThrow();
		});
		
		it('should reject slugs with uppercase', () => {
			const invalid = 'My-Folder';
			expect(() => Schema.decodeUnknownSync(Slug)(invalid)).toThrow();
		});
		
		it('should reject slugs with spaces', () => {
			const invalid = 'my folder';
			expect(() => Schema.decodeUnknownSync(Slug)(invalid)).toThrow();
		});
	});
	
	describe('PaginationInput', () => {
		it('should use defaults when not provided', () => {
			const result = Schema.decodeUnknownSync(PaginationInput)({});
			expect(result.page).toBeUndefined(); // Optional
			expect(result.pageSize).toBeUndefined();
		});
		
		it('should reject negative page numbers', () => {
			expect(() => 
				Schema.decodeUnknownSync(PaginationInput)({ page: -1 })
			).toThrow();
		});
		
		it('should reject pageSize > 100', () => {
			expect(() => 
				Schema.decodeUnknownSync(PaginationInput)({ pageSize: 101 })
			).toThrow();
		});
	});
	
	describe('HexColor', () => {
		it('should validate valid hex colors', () => {
			const valid = '#FF5733';
			expect(() => Schema.decodeUnknownSync(HexColor)(valid)).not.toThrow();
		});
		
		it('should reject colors without #', () => {
			const invalid = 'FF5733';
			expect(() => Schema.decodeUnknownSync(HexColor)(invalid)).toThrow();
		});
		
		it('should reject short hex codes', () => {
			const invalid = '#FFF';
			expect(() => Schema.decodeUnknownSync(HexColor)(invalid)).toThrow();
		});
	});
});
```

---

### Tarea 9: Documentar Patrones de Validación
**Prioridad:** ALTA | **Duración:** 2-3 horas

#### Archivo a Crear
`docs/EFFECT-PHASE-2-VALIDATION-PATTERNS.md`

#### Contenido (outline)

1. **Introducción a @effect/schema**
   - Beneficios vs Zod
   - API básica
   - Patterns comunes

2. **Schemas Comunes Disponibles**
   - common.ts: Paginación, sorting, etc.
   - primitives.ts: Tipos básicos validados
   - Cuándo usar cada uno

3. **Validación en Servicios**
   - Pattern: Effect.try + Schema.decode
   - Manejo de errores de validación
   - Composición de validaciones

4. **Validación en Express Routes**
   - Middleware validateBody/Params/Query
   - Integración con effectHandler
   - Responses de error estandarizados

5. **Transformers**
   - Schema.transform basics
   - DB → DTO → View pipelines
   - Batch transformations

6. **Testing de Schemas**
   - Unit tests de validación
   - Property-based testing (futuro)

7. **Antipatrones a Evitar**
   - ❌ No usar Schema.decodeUnknownSync sin try/catch
   - ❌ No duplicar validaciones en service + route
   - ❌ No crear schemas muy específicos (reutilizar common)

8. **Migración desde Zod**
   - Guía paso a paso
   - Coexistencia temporal
   - Checklist de migración

---

### Tarea 10: Validar con E2E Tests
**Prioridad:** ALTA | **Duración:** 1-2 horas

#### Escenarios a Testear

1. **Validación exitosa**: Request válido → 200 + data correcta
2. **Validación body fallida**: Body inválido → 400 + detalles de error
3. **Validación params fallida**: UUID inválido → 400 + error específico
4. **Validación query fallida**: Pagination inválida → 400
5. **Transformers funcionando**: Response tiene formato transformado correcto

#### Tests E2E a Ejecutar

```bash
# Con feature flag Effect activado
USE_EFFECT_TAGS=true bun run test:e2e

# Comparar con legacy (debe tener mismo comportamiento)
USE_EFFECT_TAGS=false bun run test:e2e
```

#### Casos Edge a Validar
- Strings vacíos cuando se requiere NonEmptyString
- Números negativos cuando se requiere PositiveInt
- UUIDs malformados
- Colores hex inválidos
- Paginación fuera de rango (page < 1, pageSize > 100)

---

## 📊 Métricas de Éxito Fase 2

### Cobertura
- ✅ Schemas comunes: 10+ schemas reutilizables creados
- ✅ Primitivos: 15+ validadores de tipos básicos
- ✅ Migración Zod: Al menos 3 schemas principales migrados (Tag, Image, Folder)
- ✅ Middleware: 3 validators (body, params, query)
- ✅ Transformers: Al menos 2 entities con transformers (Tag, Image)
- ✅ Tests: 80%+ cobertura de schemas comunes

### Calidad
- ✅ 0 errores TypeScript en todos los archivos nuevos
- ✅ Documentación completa con ejemplos
- ✅ E2E tests pasando con validaciones activas
- ✅ Paridad funcional legacy vs Effect (mismos errores, mismo comportamiento)

### Performance
- ⚠️ Validación no debe agregar > 5ms de latency por request
- ⚠️ Memory footprint schemas < 1MB adicional

---

## 🚀 Próximos Pasos Post-Fase 2

### Fase 2.5: Refinamientos (Opcional)
- Agregar más schemas específicos de dominio
- Implementar custom error messages más descriptivos
- Crear helpers de transformación avanzados
- Property-based testing con fast-check

### Fase 3: Servicios Complejos
- Migrar ImageService (más complejo que Tag)
- Migrar FolderService (relaciones jerárquicas)
- Implementar transacciones con Effect
- Batching y caching con Effect.Deferred

---

## 🔗 Referencias

- [Effect Schema Docs](https://effect.website/docs/schema/introduction)
- [Schema Transformations](https://effect.website/docs/schema/transformations)
- [Schema Validation](https://effect.website/docs/schema/validation)
- Fase 1 Summary: `docs/EFFECT-PHASE-1-SUMMARY.md`
- Plan Maestro: `docs/EFFECT-IMPLEMENTATION-PLAN.md`

---

## 🔧 Patrones Críticos Descubiertos (Fase 3 - AlbumService)

### 1. Drizzle-Effect Integration Pattern

**Problema:** Drizzle con driver `libsql` (Turso) usa queries "thenable" con ejecución lazy.

```typescript
// ❌ INCORRECTO - Retorna thenable, no Promise
const result = yield* Effect.tryPromise({
  try: () => db.select().from(albums).where(eq(albums.id, id))
});

// ✅ CORRECTO - Fuerza resolución con async/await explícito
const result = yield* Effect.tryPromise({
  try: async () => await db.select().from(albums).where(eq(albums.id, id)),
  catch: (error) => fromUnknownError('getById', error),
});
```

**Razón:** Los query builders de Drizzle tienen `.then()` pero no son verdaderas Promises hasta que se esperan. Effect.tryPromise necesita Promises reales, no "thenables".

**Patrón aplicado en:** `album.service.effect.ts` - todas las operaciones de DB (14 métodos)

---

### 2. Test Environment Detection

**Problema:** `tests/setup.ts` define `window` globalmente para jsdom, rompiendo detección de servidor.

```typescript
// ❌ INCORRECTO - Falla en tests porque jsdom define window
if (typeof window === 'undefined') {
  // Usa DB real (servidor/test)
} else {
  // Usa mock (browser)
}

// ✅ CORRECTO - Detecta servidor o test environment
const isServerOrTest = typeof process !== 'undefined' && 
  (typeof window === 'undefined' || 
   process.env.NODE_ENV === 'test' || 
   typeof (globalThis as any).Bun !== 'undefined');

if (isServerOrTest) {
  // Usa DB real
} else {
  // Usa mock (browser)
}
```

**Aplicado en:** `src/lib/drizzle/index.ts` línea ~170

**Impacto:** Tests ahora usan SQLite real en lugar de mock, asegurando comportamiento correcto.

---

### 3. ID Schema Validation (nanoid vs UUID)

**Problema:** Schema UUID estricto rechazaba IDs de nanoid (formato diferente).

```typescript
// ❌ INCORRECTO - UUID requiere formato xxxx-xxxx-xxxx-xxxx
export const Album = Schema.Struct({
  id: UUID,  // Error: "Expected UUID, actual 'juO3ZL-S7P3gZe_xoqQl-'"
  name: NonEmptyString,
  // ...
});

// ✅ CORRECTO - ID genérico acepta nanoid (21 chars alphanumeric)
export const ID = Schema.String.pipe(
  Schema.minLength(1),
  Schema.maxLength(30)
).annotations({
  identifier: 'ID',
  title: 'Entity Identifier',
  description: 'Unique identifier (nanoid format)',
});

export const Album = Schema.Struct({
  id: ID,  // Acepta nanoid: "juO3ZL-S7P3gZe_xoqQl-"
  name: NonEmptyString,
  // ...
});
```

**Aplicado en:**
- `src/lib/effect/schemas/common.ts` - nueva definición ID
- `src/lib/effect/schemas/entities.ts` - todos los IDs cambiados de UUID a ID

**Nota:** UUID se mantiene para casos que lo requieran específicamente, pero la mayoría de entidades usan nanoid.

---

### 4. TaggedError Best Practices

**Problema:** Campos opcionales en TaggedError causaban getters que retornaban strings vacíos.

```typescript
// ❌ INCORRECTO - message opcional no existe en instancia si no se provee
export class AlbumNotFound extends Data.TaggedError('AlbumNotFound')<{
  readonly albumId: string;
  readonly message?: string;  // Opcional
}> {
  get displayMessage(): string {
    // Si message no se proveyó, this.message es undefined
    // pero ?? fallback puede fallar en algunos casos
    return this.message ?? `Album no encontrado: ${this.albumId}`;
  }
}

// ✅ CORRECTO - Solo campos requeridos, sin opcionales en getters
export class AlbumNotFound extends Data.TaggedError('AlbumNotFound')<{
  readonly albumId: string;  // Solo requerido
}> {
  get displayMessage(): string {
    // Acceso directo a campo requerido
    return `Album no encontrado: ${this.albumId}`;
  }
}
```

**Regla:** Usar solo campos **requeridos** en TaggedError. Si necesitas mensajes custom, hacerlos requeridos o no usarlos en getters.

**Aplicado en:** `src/services/album/album-errors.effect.ts` - 3 clases corregidas (AlbumNotFound, AlbumNameConflict, AlbumHasRelationsError)

---

### 5. Schema Validation Pattern

**Problema:** Schema.decodeUnknownSync es síncrono, no necesita tryPromise.

```typescript
// ❌ INCORRECTO - decodeUnknownSync no es async
const validated = yield* Effect.tryPromise({
  try: () => Schema.decodeUnknownSync(Album)(dbResult),
  catch: (error) => new ValidationError(...)
});

// ✅ CORRECTO - Usar Effect.try para operaciones síncronas
const validated = yield* Effect.try({
  try: () => Schema.decodeUnknownSync(Album)(dbResult),
  catch: (error) => new AlbumValidationError({
    field: 'album',
    message: 'Error al validar datos del álbum',
    value: dbResult,
  }),
});
```

**Patrón:**
- `Effect.tryPromise` → Operaciones **asíncronas** (DB queries, HTTP requests)
- `Effect.try` → Operaciones **síncronas** (validación, parsing, transformación)

---

### 6. Test Cleanup Pattern

**Importante:** Limpiar datos entre tests para evitar colisiones.

```typescript
describe('AlbumService Effect', () => {
  afterEach(async () => {
    // Limpiar todos los álbumes después de cada test
    await db.delete(albums);
  });

  test('should create album', async () => {
    const result = await runEffect(
      Effect.gen(function* () {
        const service = yield* AlbumService;
        return yield* service.create({ name: 'Test' });
      })
    );
    
    expect(result.name).toBe('Test');
  });
});
```

**Aplicado en:** `album.service.effect.test.ts` - `afterEach` hook limpia tablas

---

### 7. Default Values en Drizzle Schema

**Problema:** Schema sin default function genera IDs null.

```typescript
// ❌ INCORRECTO - ID manual requerido
export const albums = sqliteTable('albums', {
  id: text('id').primaryKey(),  // Usuario debe proveer ID
  // ...
});

// ✅ CORRECTO - ID autogenerado con nanoid
import { nanoid } from 'nanoid';

export const albums = sqliteTable('albums', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  // ...
});
```

**Aplicado en:** `src/lib/drizzle/schema/organization/albums.ts`

**Verificación:** Tests crean álbumes sin especificar ID, generan automáticamente como "juO3ZL-S7P3gZe_xoqQl-"

---

### 8. Effect Test Helpers

**Pattern:** Helpers reutilizables para correr Effects en tests.

```typescript
// Helper para success cases
const runEffect = <A, E>(effect: Effect.Effect<A, E, AlbumService>, timeout = 5000) =>
  Effect.runPromise(
    Effect.provide(effect, AlbumServiceLive).pipe(
      Effect.timeout(timeout)
    )
  );

// Helper para error cases
const runEffectExpectFailure = <A, E>(effect: Effect.Effect<A, E, AlbumService>) =>
  Effect.runPromiseExit(Effect.provide(effect, AlbumServiceLive));

// Uso
test('should create album', async () => {
  const album = await runEffect(
    Effect.gen(function* () {
      const service = yield* AlbumService;
      return yield* service.create({ name: 'Test' });
    })
  );
  expect(album.name).toBe('Test');
});

test('should fail on duplicate name', async () => {
  const exit = await runEffectExpectFailure(
    Effect.gen(function* () {
      const service = yield* AlbumService;
      yield* service.create({ name: 'Duplicate' });
      yield* service.create({ name: 'Duplicate' }); // Falla aquí
    })
  );
  expect(Exit.isFailure(exit)).toBe(true);
});
```

**Aplicado en:** `album.service.effect.test.ts` - 20 tests usando estos helpers

---

## 📊 Resultados Fase 3 - AlbumService

### Tests
- ✅ **20/20 tests passing** (100% success rate)
- ✅ **61 expect() calls** - Todas las aserciones exitosas
- ✅ **Coverage: 94.00%** líneas en archivos Effect
- ✅ **3.26s execution time** - Performance óptima

### Archivos Creados
1. `src/services/album/album-errors.effect.ts` (182 líneas)
   - 6 tipos de error usando Data.TaggedError
   - displayMessage getters con campos requeridos
   
2. `src/services/album/album.service.effect.ts` (765 líneas)
   - 14 operaciones: CRUD, batch, relations, stats
   - Patrón Effect.gen con yield*
   - Drizzle async/await explícito
   
3. `src/services/album/__tests__/album.service.effect.test.ts` (580 líneas)
   - Suite comprehensiva: CRUD, validación, errores, batch
   - Test helpers reutilizables
   - Cleanup automático con afterEach

### Issues Resueltos
1. ✅ Drizzle thenable queries → async/await explícito
2. ✅ Test environment detection → isServerOrTest pattern
3. ✅ UUID validation → Custom ID type para nanoid
4. ✅ TaggedError displayMessage → Solo campos requeridos
5. ✅ Schema validation → Effect.try para síncronos
6. ✅ Auto-generated IDs → $defaultFn(() => nanoid())
7. ✅ Test cleanup → afterEach hook

### Lecciones Aprendidas
- **Drizzle libsql** requiere tratamiento especial (no es ORM tradicional)
- **Test environment** necesita detección robusta (jsdom define window)
- **Validación de IDs** debe ser flexible (no asumir UUID)
- **TaggedError** solo debe usar campos requeridos en getters
- **Testing Effect** requiere helpers específicos (runPromise vs runPromiseExit)

---

**Última actualización:** 2025-10-11  
**Status:** ✅ FASE 3 COMPLETADA - AlbumService 100% funcional  
**Siguiente:** FolderService usando patrones descubiertos

☄️☄️☄️☄️
