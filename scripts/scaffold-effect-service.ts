#!/usr/bin/env bun

/**
 * @file Script para crear estructura de nuevo servicio Effect
 * @description Scaffolding automatizado para servicios Effect-TS
 * @usage bun run scripts/scaffold-effect-service.js <entity-name>
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import chalk from 'chalk';

// ============= Helpers =============

const toPascalCase = (str: string): string => {
	return str
		.split(/[-_]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join('');
};

const toKebabCase = (str: string): string => {
	return str
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.replace(/[\s_]+/g, '-')
		.toLowerCase();
};

const toCamelCase = (str: string): string => {
	const pascal = toPascalCase(str);
	return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

// ============= Templates =============

const createErrorsTemplate = (entityName: string, entityPascal: string): string => `/**
 * @file ${entityName} Service Errors con Effect
 * @module services/${entityName}/${entityName}-errors.effect
 * @created ${new Date().toISOString().split('T')[0]}
 */

import { Data } from 'effect';

/**
 * Error base para operaciones de ${entityPascal}
 */
export class ${entityPascal}Error extends Data.TaggedError('${entityPascal}Error')<{
	readonly operation: string;
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * ${entityPascal} no encontrado
 */
export class ${entityPascal}NotFound extends Data.TaggedError('${entityPascal}NotFound')<{
	readonly ${toCamelCase(entityName)}Id: string;
}> {
	get message() {
		return \`${entityPascal} not found: \${this.${toCamelCase(entityName)}Id}\`;
	}
}

/**
 * Error de validación en ${entityPascal}
 */
export class ${entityPascal}ValidationError extends Data.TaggedError('${entityPascal}ValidationError')<{
	readonly field: string;
	readonly message: string;
	readonly value?: unknown;
}> {}

/**
 * Error de base de datos en ${entityPascal}
 */
export class ${entityPascal}DatabaseError extends Data.TaggedError('${entityPascal}DatabaseError')<{
	readonly operation: string;
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Conflicto de nombre de ${entityPascal}
 */
export class ${entityPascal}NameConflict extends Data.TaggedError('${entityPascal}NameConflict')<{
	readonly name: string;
}> {
	get message() {
		return \`${entityPascal} with name "\${this.name}" already exists\`;
	}
}

/**
 * ${entityPascal} tiene relaciones y no puede eliminarse
 */
export class ${entityPascal}HasRelationsError extends Data.TaggedError('${entityPascal}HasRelationsError')<{
	readonly ${toCamelCase(entityName)}Id: string;
	readonly relationCount: number;
}> {
	get message() {
		return \`Cannot delete ${entityName} \${this.${toCamelCase(entityName)}Id}: has \${this.relationCount} related items\`;
	}
}

/**
 * Helper: Convierte error desconocido a ${entityPascal}Error
 */
export const fromUnknownError = (operation: string, error: unknown): ${entityPascal}Error => {
	if (error instanceof ${entityPascal}Error) {
		return error;
	}
	
	return new ${entityPascal}Error({
		operation,
		message: error instanceof Error ? error.message : String(error),
		cause: error,
	});
};
`;

const createSchemasTemplate = (entityName: string, entityPascal: string): string => `/**
 * @file ${entityName} Schemas with Effect Schema
 * @module services/${entityName}/${entityName}-schemas
 * @created ${new Date().toISOString().split('T')[0]}
 */

import { Schema } from 'effect';

/**
 * Schema base para ${entityPascal} (desde DB)
 */
export class ${entityPascal} extends Schema.Class<${entityPascal}>('${entityPascal}')({
	id: Schema.String,
	name: Schema.String,
	description: Schema.NullOr(Schema.String),
	emoji: Schema.String,
	color: Schema.String,
	createdAt: Schema.DateTimeUtc,
	updatedAt: Schema.DateTimeUtc,
}) {}

/**
 * Input para crear ${entityPascal}
 */
export class ${entityPascal}Create extends Schema.Class<${entityPascal}Create>('${entityPascal}Create')({
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
	description: Schema.optional(Schema.String),
	emoji: Schema.String,
	color: Schema.String,
}) {}

/**
 * Input para actualizar ${entityPascal}
 */
export class ${entityPascal}Update extends Schema.Class<${entityPascal}Update>('${entityPascal}Update')({
	id: Schema.String,
	name: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
	description: Schema.optional(Schema.NullOr(Schema.String)),
	emoji: Schema.optional(Schema.String),
	color: Schema.optional(Schema.String),
}) {}

/**
 * Contadores de relaciones
 */
export interface ${entityPascal}Counts {
	images: number;
	videos: number;
	// ... agregar otros contadores según necesidad
}

/**
 * ${entityPascal} con estadísticas
 */
export interface ${entityPascal}WithStats extends Schema.Schema.Type<typeof ${entityPascal}> {
	_count?: ${entityPascal}Counts;
}

/**
 * Opciones para obtener ${entityName}s
 */
export interface Get${entityPascal}sOptions {
	search?: string;
	limit?: number;
	offset?: number;
	orderBy?: 'name' | 'createdAt' | 'updatedAt';
	orderDirection?: 'asc' | 'desc';
}

/**
 * Resultado de obtener ${entityName}s con paginación
 */
export interface Get${entityPascal}sResult {
	${toCamelCase(entityName)}s: ${entityPascal}WithStats[];
	total: number;
	limit: number;
	offset: number;
}
`;

const createServiceTemplate = (entityName: string, entityPascal: string): string => `/**
 * @file ${entityPascal}Service implementado con Effect
 * @module services/${entityName}/${entityName}.service.effect
 * @description Servicio ${entityPascal} con operaciones CRUD usando Effect-TS
 * @created ${new Date().toISOString().split('T')[0]}
 */

import { Context, Effect, Layer, Schema } from 'effect';
import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { ${toCamelCase(entityName)}s } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	${entityPascal},
	${entityPascal}Create,
	${entityPascal}Update,
	${entityPascal}WithStats,
	${entityPascal}Counts,
	Get${entityPascal}sOptions,
	Get${entityPascal}sResult,
} from './${entityName}-schemas';
import {
	${entityPascal}Error,
	${entityPascal}NotFound,
	${entityPascal}NameConflict,
	${entityPascal}DatabaseError,
	${entityPascal}ValidationError,
	${entityPascal}HasRelationsError,
	fromUnknownError,
} from './${entityName}-errors.effect';

// Logger específico
const logger = serverLogger.withContext('${entityPascal}Service.Effect');

// ============= Types =============

/**
 * Interface para el servicio ${entityPascal}Service
 */
export interface ${entityPascal}ServiceInterface {
	readonly getById: (id: string) => Effect.Effect<${entityPascal}WithStats, ${entityPascal}Error>;
	readonly getAll: (options?: Get${entityPascal}sOptions) => Effect.Effect<Get${entityPascal}sResult, ${entityPascal}Error>;
	readonly create: (input: Schema.Schema.Type<typeof ${entityPascal}Create>) => Effect.Effect<${entityPascal}WithStats, ${entityPascal}Error>;
	readonly update: (
		id: string,
		input: Schema.Schema.Type<typeof ${entityPascal}Update>
	) => Effect.Effect<${entityPascal}WithStats, ${entityPascal}Error>;
	readonly delete: (id: string) => Effect.Effect<void, ${entityPascal}Error>;
}

/**
 * Context.Tag para ${entityPascal}Service
 */
export class ${entityPascal}Service extends Context.Tag('${entityPascal}Service')<${entityPascal}Service, ${entityPascal}ServiceInterface>() {}

// ============= Helpers =============

/**
 * Obtiene conteos de relaciones para un ${entityName}
 */
const getRelationsCounts = (${toCamelCase(entityName)}Id: string): Effect.Effect<${entityPascal}Counts, ${entityPascal}Error> =>
	Effect.gen(function* () {
		logger.info(\`📊 Obteniendo conteos para ${entityName}: \${${toCamelCase(entityName)}Id}\`);

		// TODO: Implementar conteos reales según las relaciones de la entidad
		const imageCou nt = 0;
		const videoCount = 0;

		return {
			images: imageCount,
			videos: videoCount,
		};
	});

/**
 * Enriquece un ${entityName} con estadísticas
 */
const enrichWithStats = (${toCamelCase(entityName)}: typeof ${entityPascal}.Type): Effect.Effect<${entityPascal}WithStats, ${entityPascal}Error> =>
	Effect.gen(function* () {
		const counts = yield* getRelationsCounts(${toCamelCase(entityName)}.id);
		
		return {
			...${toCamelCase(entityName)},
			_count: counts,
		};
	});

// ============= Operations =============

/**
 * Obtiene un ${entityName} por ID
 */
const getByIdImpl = (id: string): Effect.Effect<${entityPascal}WithStats, ${entityPascal}Error> =>
	Effect.gen(function* () {
		logger.info(\`🔍 Obteniendo ${entityName}: \${id}\`);

		const raw = yield* Effect.tryPromise({
			try: async () => {
				const result = await db.query.${toCamelCase(entityName)}s.findFirst({
					where: eq(${toCamelCase(entityName)}s.id, id),
				});
				return result;
			},
			catch: (error) => fromUnknownError('getById', error),
		});

		if (!raw) {
			return yield* Effect.fail(new ${entityPascal}NotFound({ ${toCamelCase(entityName)}Id: id }));
		}

		const ${toCamelCase(entityName)} = yield* Schema.decode(${entityPascal})(raw);
		const withStats = yield* enrichWithStats(${toCamelCase(entityName)});

		logger.info(\`✅ ${entityPascal} encontrado: \${withStats.name}\`);
		return withStats;
	});

/**
 * Obtiene todos los ${entityName}s con opciones de filtrado
 */
const getAllImpl = (options?: Get${entityPascal}sOptions): Effect.Effect<Get${entityPascal}sResult, ${entityPascal}Error> =>
	Effect.gen(function* () {
		const {
			search,
			limit = 50,
			offset = 0,
			orderBy = 'createdAt',
			orderDirection = 'desc',
		} = options ?? {};

		logger.info('📋 Obteniendo ${entityName}s:', { search, limit, offset });

		// Construir filtros
		const filters = [];

		if (search) {
			filters.push(
				or(
					like(${toCamelCase(entityName)}s.name, \`%\${search}%\`),
					like(${toCamelCase(entityName)}s.description, \`%\${search}%\`)
				)
			);
		}

		const whereClause = filters.length > 0 ? and(...filters) : undefined;

		// Query principal
		const raw${entityPascal}s = yield* Effect.tryPromise({
			try: async () => {
				return await db.query.${toCamelCase(entityName)}s.findMany({
					where: whereClause,
					limit,
					offset,
					orderBy: orderDirection === 'asc' ? asc(${toCamelCase(entityName)}s[orderBy]) : desc(${toCamelCase(entityName)}s[orderBy]),
				});
			},
			catch: (error) => fromUnknownError('getAll', error),
		});

		// Contar total
		const total = yield* Effect.tryPromise({
			try: async () => {
				const result = await db.select({ count: count() }).from(${toCamelCase(entityName)}s).where(whereClause);
				return result[0]?.count ?? 0;
			},
			catch: (error) => fromUnknownError('getAll:count', error),
		});

		// Enriquecer con stats
		const ${toCamelCase(entityName)}sWithStats = yield* Effect.all(
			raw${entityPascal}s.map((raw) =>
				Effect.gen(function* () {
					const decoded = yield* Schema.decode(${entityPascal})(raw);
					return yield* enrichWithStats(decoded);
				})
			)
		);

		logger.info(\`✅ Encontrados \${${toCamelCase(entityName)}sWithStats.length}/\${total} ${entityName}s\`);

		return {
			${toCamelCase(entityName)}s: ${toCamelCase(entityName)}sWithStats,
			total,
			limit,
			offset,
		};
	});

/**
 * Crea un nuevo ${entityName}
 */
const createImpl = (input: Schema.Schema.Type<typeof ${entityPascal}Create>): Effect.Effect<${entityPascal}WithStats, ${entityPascal}Error> =>
	Effect.gen(function* () {
		logger.info('➕ Creando ${entityName}:', input);

		// Validar input
		const validated = yield* Schema.decode(${entityPascal}Create)(input);

		// Verificar duplicados
		const existing = yield* Effect.tryPromise({
			try: async () => {
				return await db.query.${toCamelCase(entityName)}s.findFirst({
					where: eq(${toCamelCase(entityName)}s.name, validated.name),
				});
			},
			catch: (error) => fromUnknownError('create:checkDuplicate', error),
		});

		if (existing) {
			return yield* Effect.fail(new ${entityPascal}NameConflict({ name: validated.name }));
		}

		// Insertar
		const inserted = yield* Effect.tryPromise({
			try: async () => {
				const result = await db
					.insert(${toCamelCase(entityName)}s)
					.values({
						...validated,
						createdAt: new Date(),
						updatedAt: new Date(),
					})
					.returning();
				return result[0];
			},
			catch: (error) => fromUnknownError('create', error),
		});

		if (!inserted) {
			return yield* Effect.fail(
				new ${entityPascal}DatabaseError({
					operation: 'create',
					message: 'No result returned from insert',
				})
			);
		}

		const ${toCamelCase(entityName)} = yield* Schema.decode(${entityPascal})(inserted);
		const withStats = yield* enrichWithStats(${toCamelCase(entityName)});

		logger.info(\`✅ ${entityPascal} creado: \${withStats.name}\`);
		return withStats;
	});

/**
 * Actualiza un ${entityName} existente
 */
const updateImpl = (
	id: string,
	input: Schema.Schema.Type<typeof ${entityPascal}Update>
): Effect.Effect<${entityPascal}WithStats, ${entityPascal}Error> =>
	Effect.gen(function* () {
		logger.info(\`📝 Actualizando ${entityName}: \${id}\`, input);

		// Verificar existencia
		const exists = yield* Effect.tryPromise({
			try: async () => {
				return await db.query.${toCamelCase(entityName)}s.findFirst({
					where: eq(${toCamelCase(entityName)}s.id, id),
				});
			},
			catch: (error) => fromUnknownError('update:checkExists', error),
		});

		if (!exists) {
			return yield* Effect.fail(new ${entityPascal}NotFound({ ${toCamelCase(entityName)}Id: id }));
		}

		// Actualizar
		const updated = yield* Effect.tryPromise({
			try: async () => {
				const result = await db
					.update(${toCamelCase(entityName)}s)
					.set({
						...input,
						updatedAt: new Date(),
					})
					.where(eq(${toCamelCase(entityName)}s.id, id))
					.returning();
				return result[0];
			},
			catch: (error) => fromUnknownError('update', error),
		});

		if (!updated) {
			return yield* Effect.fail(
				new ${entityPascal}DatabaseError({
					operation: 'update',
					message: 'No result returned from update',
				})
			);
		}

		const ${toCamelCase(entityName)} = yield* Schema.decode(${entityPascal})(updated);
		const withStats = yield* enrichWithStats(${toCamelCase(entityName)});

		logger.info(\`✅ ${entityPascal} actualizado: \${withStats.name}\`);
		return withStats;
	});

/**
 * Elimina un ${entityName}
 */
const deleteImpl = (id: string): Effect.Effect<void, ${entityPascal}Error> =>
	Effect.gen(function* () {
		logger.info(\`🗑️ Eliminando ${entityName}: \${id}\`);

		// Verificar existencia
		const exists = yield* Effect.tryPromise({
			try: async () => {
				return await db.query.${toCamelCase(entityName)}s.findFirst({
					where: eq(${toCamelCase(entityName)}s.id, id),
				});
			},
			catch: (error) => fromUnknownError('delete:checkExists', error),
		});

		if (!exists) {
			return yield* Effect.fail(new ${entityPascal}NotFound({ ${toCamelCase(entityName)}Id: id }));
		}

		// Verificar relaciones
		const counts = yield* getRelationsCounts(id);
		const totalRelations = counts.images + counts.videos;

		if (totalRelations > 0) {
			return yield* Effect.fail(
				new ${entityPascal}HasRelationsError({
					${toCamelCase(entityName)}Id: id,
					relationCount: totalRelations,
				})
			);
		}

		// Eliminar
		yield* Effect.tryPromise({
			try: async () => {
				await db.delete(${toCamelCase(entityName)}s).where(eq(${toCamelCase(entityName)}s.id, id));
			},
			catch: (error) => fromUnknownError('delete', error),
		});

		logger.info(\`✅ ${entityPascal} eliminado: \${id}\`);
	});

// ============= Layer =============

export const ${entityPascal}ServiceLive = Layer.succeed(${entityPascal}Service, {
	getById: getByIdImpl,
	getAll: getAllImpl,
	create: createImpl,
	update: updateImpl,
	delete: deleteImpl,
});
`;

const createTestTemplate = (entityName: string, entityPascal: string): string => `/**
 * @file Tests para ${entityPascal}Service con Effect
 * @module services/${entityName}/__tests__/${entityName}.service.effect.test
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Effect, Either } from 'effect';
import { ${entityPascal}Service, ${entityPascal}ServiceLive } from '../${entityName}.service.effect';
import { ${entityPascal}NotFound, ${entityPascal}NameConflict } from '../${entityName}-errors.effect';
import { db } from '@/lib/drizzle';
import { ${toCamelCase(entityName)}s } from '@/lib/drizzle/schema';

describe('${entityPascal}Service.Effect', () => {
	beforeEach(async () => {
		// Limpiar DB antes de cada test
		await db.delete(${toCamelCase(entityName)}s);
	});

	describe('getById', () => {
		it('should return ${entityName} when found', async () => {
			// Insertar ${entityName} de prueba
			const inserted = await db
				.insert(${toCamelCase(entityName)}s)
				.values({
					name: 'Test ${entityPascal}',
					description: 'Test description',
					emoji: '📦',
					color: '#3b82f6',
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			const testId = inserted[0].id;

			// Ejecutar operación
			const program = Effect.gen(function* () {
				const service = yield* ${entityPascal}Service;
				return yield* service.getById(testId);
			});

			const result = await Effect.runPromise(program.pipe(Effect.provide(${entityPascal}ServiceLive)));

			expect(result.name).toBe('Test ${entityPascal}');
			expect(result._count).toBeDefined();
		});

		it('should fail with ${entityPascal}NotFound when not found', async () => {
			const program = Effect.gen(function* () {
				const service = yield* ${entityPascal}Service;
				return yield* service.getById('nonexistent-id');
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(${entityPascal}ServiceLive), Effect.either)
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe('${entityPascal}NotFound');
				expect((result.left as ${entityPascal}NotFound).${toCamelCase(entityName)}Id).toBe('nonexistent-id');
			}
		});
	});

	describe('getAll', () => {
		it('should return all ${entityName}s', async () => {
			// Insertar varios ${entityName}s
			await db.insert(${toCamelCase(entityName)}s).values([
				{
					name: '${entityPascal} 1',
					description: 'Desc 1',
					emoji: '📦',
					color: '#3b82f6',
				},
				{
					name: '${entityPascal} 2',
					description: 'Desc 2',
					emoji: '📦',
					color: '#3b82f6',
				},
			]);

			const program = Effect.gen(function* () {
				const service = yield* ${entityPascal}Service;
				return yield* service.getAll();
			});

			const result = await Effect.runPromise(program.pipe(Effect.provide(${entityPascal}ServiceLive)));

			expect(result.${toCamelCase(entityName)}s.length).toBe(2);
			expect(result.total).toBe(2);
		});

		it('should search by name', async () => {
			await db.insert(${toCamelCase(entityName)}s).values([
				{ name: 'Alpha', emoji: '📦', color: '#3b82f6' },
				{ name: 'Beta', emoji: '📦', color: '#3b82f6' },
			]);

			const program = Effect.gen(function* () {
				const service = yield* ${entityPascal}Service;
				return yield* service.getAll({ search: 'Alpha' });
			});

			const result = await Effect.runPromise(program.pipe(Effect.provide(${entityPascal}ServiceLive)));

			expect(result.${toCamelCase(entityName)}s.length).toBe(1);
			expect(result.${toCamelCase(entityName)}s[0].name).toBe('Alpha');
		});
	});

	describe('create', () => {
		it('should create ${entityName} successfully', async () => {
			const input = {
				name: 'New ${entityPascal}',
				description: 'New description',
				emoji: '🚀',
				color: '#10b981',
			};

			const program = Effect.gen(function* () {
				const service = yield* ${entityPascal}Service;
				return yield* service.create(input);
			});

			const result = await Effect.runPromise(program.pipe(Effect.provide(${entityPascal}ServiceLive)));

			expect(result.name).toBe('New ${entityPascal}');
			expect(result.id).toBeDefined();
			expect(result._count).toBeDefined();
		});

		it('should fail with ${entityPascal}NameConflict when duplicate', async () => {
			// Insertar ${entityName} existente
			await db.insert(${toCamelCase(entityName)}s).values({
				name: 'Existing',
				emoji: '📦',
				color: '#3b82f6',
			});

			const program = Effect.gen(function* () {
				const service = yield* ${entityPascal}Service;
				return yield* service.create({
					name: 'Existing',
					emoji: '📦',
					color: '#3b82f6',
				});
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(${entityPascal}ServiceLive), Effect.either)
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe('${entityPascal}NameConflict');
			}
		});
	});

	describe('update', () => {
		it('should update ${entityName} successfully', async () => {
			const inserted = await db
				.insert(${toCamelCase(entityName)}s)
				.values({
					name: 'Original Name',
					emoji: '📦',
					color: '#3b82f6',
				})
				.returning();

			const testId = inserted[0].id;

			const program = Effect.gen(function* () {
				const service = yield* ${entityPascal}Service;
				return yield* service.update(testId, {
					id: testId,
					name: 'Updated Name',
				});
			});

			const result = await Effect.runPromise(program.pipe(Effect.provide(${entityPascal}ServiceLive)));

			expect(result.name).toBe('Updated Name');
		});

		it('should fail with ${entityPascal}NotFound when not found', async () => {
			const program = Effect.gen(function* () {
				const service = yield* ${entityPascal}Service;
				return yield* service.update('nonexistent', {
					id: 'nonexistent',
					name: 'New Name',
				});
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(${entityPascal}ServiceLive), Effect.either)
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe('${entityPascal}NotFound');
			}
		});
	});

	describe('delete', () => {
		it('should delete ${entityName} successfully', async () => {
			const inserted = await db
				.insert(${toCamelCase(entityName)}s)
				.values({
					name: 'To Delete',
					emoji: '📦',
					color: '#3b82f6',
				})
				.returning();

			const testId = inserted[0].id;

			const program = Effect.gen(function* () {
				const service = yield* ${entityPascal}Service;
				yield* service.delete(testId);
			});

			await Effect.runPromise(program.pipe(Effect.provide(${entityPascal}ServiceLive)));

			// Verificar que ya no existe
			const check = await db.query.${toCamelCase(entityName)}s.findFirst({
				where: (${toCamelCase(entityName)}s, { eq }) => eq(${toCamelCase(entityName)}s.id, testId),
			});

			expect(check).toBeUndefined();
		});

		it('should fail with ${entityPascal}NotFound when not found', async () => {
			const program = Effect.gen(function* () {
				const service = yield* ${entityPascal}Service;
				yield* service.delete('nonexistent');
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(${entityPascal}ServiceLive), Effect.either)
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe('${entityPascal}NotFound');
			}
		});
	});

});
`;

const createRouteTemplate = (entityName: string, entityPascal: string): string => `/**
 * @file Express routes para ${entityPascal} con Effect
 * @module server/routes/${entityName}.effect
 */

import { Router } from 'express';
import { Effect, Either } from 'effect';
import { ${entityPascal}Service, ${entityPascal}ServiceLive } from '@/services/${entityName}/${entityName}.service.effect';

const router = Router();

// GET /${entityName}s
router.get('/', async (req, res) => {
	const { search, limit, offset, orderBy, orderDirection } = req.query;

	const program = Effect.gen(function* () {
		const service = yield* ${entityPascal}Service;
		return yield* service.getAll({
			search: search as string | undefined,
			limit: limit ? Number(limit) : undefined,
			offset: offset ? Number(offset) : undefined,
			orderBy: orderBy as any,
			orderDirection: orderDirection as any,
		});
	});

	const result = await Effect.runPromise(
		program.pipe(Effect.provide(${entityPascal}ServiceLive), Effect.either)
	);

	if (Either.isLeft(result)) {
		console.error('Error getting ${entityName}s:', result.left);
		res.status(500).json({ error: 'Internal server error' });
		return;
	}

	res.json(result.right);
});

// GET /${entityName}s/:id
router.get('/:id', async (req, res) => {
	const { id } = req.params;

	const program = Effect.gen(function* () {
		const service = yield* ${entityPascal}Service;
		return yield* service.getById(id);
	});

	const result = await Effect.runPromise(
		program.pipe(Effect.provide(${entityPascal}ServiceLive), Effect.either)
	);

	if (Either.isLeft(result)) {
		const error = result.left;

		if (error._tag === '${entityPascal}NotFound') {
			res.status(404).json({ error: error.message });
			return;
		}

		console.error('Error getting ${entityName}:', error);
		res.status(500).json({ error: 'Internal server error' });
		return;
	}

	res.json(result.right);
});

// POST /${entityName}s
router.post('/', async (req, res) => {
	const program = Effect.gen(function* () {
		const service = yield* ${entityPascal}Service;
		return yield* service.create(req.body);
	});

	const result = await Effect.runPromise(
		program.pipe(Effect.provide(${entityPascal}ServiceLive), Effect.either)
	);

	if (Either.isLeft(result)) {
		const error = result.left;

		if (error._tag === '${entityPascal}ValidationError') {
			res.status(400).json({ error: error.message });
			return;
		}

		if (error._tag === '${entityPascal}NameConflict') {
			res.status(409).json({ error: error.message });
			return;
		}

		console.error('Error creating ${entityName}:', error);
		res.status(500).json({ error: 'Internal server error' });
		return;
	}

	res.status(201).json(result.right);
});

// PATCH /${entityName}s/:id
router.patch('/:id', async (req, res) => {
	const { id } = req.params;

	const program = Effect.gen(function* () {
		const service = yield* ${entityPascal}Service;
		return yield* service.update(id, { ...req.body, id });
	});

	const result = await Effect.runPromise(
		program.pipe(Effect.provide(${entityPascal}ServiceLive), Effect.either)
	);

	if (Either.isLeft(result)) {
		const error = result.left;

		if (error._tag === '${entityPascal}NotFound') {
			res.status(404).json({ error: error.message });
			return;
		}

		if (error._tag === '${entityPascal}ValidationError') {
			res.status(400).json({ error: error.message });
			return;
		}

		console.error('Error updating ${entityName}:', error);
		res.status(500).json({ error: 'Internal server error' });
		return;
	}

	res.json(result.right);
});

// DELETE /${entityName}s/:id
router.delete('/:id', async (req, res) => {
	const { id } = req.params;

	const program = Effect.gen(function* () {
		const service = yield* ${entityPascal}Service;
		yield* service.delete(id);
	});

	const result = await Effect.runPromise(
		program.pipe(Effect.provide(${entityPascal}ServiceLive), Effect.either)
	);

	if (Either.isLeft(result)) {
		const error = result.left;

		if (error._tag === '${entityPascal}NotFound') {
			res.status(404).json({ error: error.message });
			return;
		}

		if (error._tag === '${entityPascal}HasRelationsError') {
			res.status(409).json({ error: error.message });
			return;
		}

		console.error('Error deleting ${entityName}:', error);
		res.status(500).json({ error: 'Internal server error' });
		return;
	}

	res.status(204).send();
});

export default router;
`;

// ============= Main =============

const main = async () => {
	const entityArg = process.argv[2];

	if (!entityArg) {
		console.error(chalk.red('❌ Error: Debes proporcionar el nombre de la entidad'));
		console.log(chalk.yellow('Uso: bun run scripts/scaffold-effect-service.js <entity-name>'));
		console.log(chalk.gray('Ejemplo: bun run scripts/scaffold-effect-service.js my-entity'));
		process.exit(1);
	}

	const entityName = toKebabCase(entityArg);
	const entityPascal = toPascalCase(entityArg);

	console.log(chalk.blue(`\n🚀 Creando estructura de servicio Effect para: ${chalk.bold(entityPascal)}\n`));

	// Crear directorios
	const serviceDir = join(process.cwd(), 'src', 'services', entityName);
	const testsDir = join(serviceDir, '__tests__');
	const routesDir = join(process.cwd(), 'src', 'server', 'routes');

	try {
		await mkdir(serviceDir, { recursive: true });
		await mkdir(testsDir, { recursive: true });
		await mkdir(routesDir, { recursive: true });

		console.log(chalk.green(`✅ Creado: ${serviceDir}/`));

		// Crear archivos
		const files = [
			{
				path: join(serviceDir, `${entityName}-errors.effect.ts`),
				content: createErrorsTemplate(entityName, entityPascal),
			},
			{
				path: join(serviceDir, `${entityName}-schemas.ts`),
				content: createSchemasTemplate(entityName, entityPascal),
			},
			{
				path: join(serviceDir, `${entityName}.service.effect.ts`),
				content: createServiceTemplate(entityName, entityPascal),
			},
			{
				path: join(testsDir, `${entityName}.service.effect.test.ts`),
				content: createTestTemplate(entityName, entityPascal),
			},
			{
				path: join(routesDir, `${entityName}.effect.ts`),
				content: createRouteTemplate(entityName, entityPascal),
			},
		];

		for (const file of files) {
			await writeFile(file.path, file.content, 'utf-8');
			console.log(chalk.green(`✅ Creado: ${file.path}`));
		}

		console.log(chalk.green('\n✨ Estructura creada exitosamente!\n'));

		console.log(chalk.cyan('📝 Próximos pasos:\n'));
		console.log(chalk.white(`1. Actualizar schema de Drizzle en ${chalk.gray('src/lib/drizzle/schema/')}`));
		console.log(chalk.white(`2. Implementar operaciones en ${chalk.gray(`${entityName}.service.effect.ts`)}`));
		console.log(chalk.white(`3. Agregar tipos de error custom en ${chalk.gray(`${entityName}-errors.effect.ts`)}`));
		console.log(chalk.white(`4. Definir schemas de validación en ${chalk.gray(`${entityName}-schemas.ts`)}`));
		console.log(chalk.white(`5. Escribir tests en ${chalk.gray(`__tests__/${entityName}.service.effect.test.ts`)}`));
		console.log(chalk.white(`6. Integrar ruta en ${chalk.gray('src/server/index.ts')}:\n`));
		console.log(chalk.gray(`   import ${entityName}Router from './routes/${entityName}.effect';`));
		console.log(chalk.gray(`   app.use('/api/${entityName}s', ${entityName}Router);\n`));
	} catch (error) {
		console.error(chalk.red('❌ Error al crear estructura:'), error);
		process.exit(1);
	}
};

main();
