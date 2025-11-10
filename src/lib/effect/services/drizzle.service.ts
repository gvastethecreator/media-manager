/**
 * @file Servicio de Drizzle como Effect Service
 * @module lib/effect/services/drizzle
 * @description Wrapper de Drizzle ORM como servicio de Effect para dependency injection
 */

import { Context, Effect, Layer } from 'effect';
import { db } from '@/lib/drizzle';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';

/**
 * Tipo de la instancia de Drizzle DB
 */
export type DrizzleDB = typeof db;

/**
 * Tipo para transacciones de Drizzle
 */
export type DrizzleTx = SQLiteTransaction<
	'async',
	any,
	Record<string, never>,
	ExtractTablesWithRelations<Record<string, never>>
>;

/**
 * Error cuando una transacción falla
 */
export class TransactionError extends Error {
	readonly _tag = 'TransactionError';
	constructor(message: string, readonly cause?: unknown) {
		super(message);
		this.name = 'TransactionError';
	}
}

/**
 * Servicio de Drizzle con operaciones type-safe
 * 
 * @example
 * ```typescript
 * const program = Effect.gen(function*() {
 *   const drizzle = yield* DrizzleService;
 *   const result = yield* drizzle.query((db) =>
 *     db.select().from(tags).where(eq(tags.id, "123"))
 *   );
 *   return result;
 * });
 * ```
 */
export class DrizzleService extends Context.Tag('DrizzleService')<
	DrizzleService,
	{
		/**
		 * Instancia raw de Drizzle DB
		 * Usar para operaciones directas cuando sea necesario
		 */
		readonly db: DrizzleDB;

		/**
		 * Ejecuta una query dentro de un Effect
		 * Envuelve automáticamente errores en Effect
		 * 
		 * @param fn - Función que recibe la DB y retorna una Promise
		 */
		readonly query: <A>(fn: (db: DrizzleDB) => Promise<A>) => Effect.Effect<A, Error>;

		/**
		 * Ejecuta múltiples operaciones en una transacción
		 * Si alguna falla, toda la transacción se revierte
		 * 
		 * @param fn - Función que recibe la transacción y retorna un Effect
		 */
		readonly transaction: <A, E, R>(
			fn: (tx: DrizzleTx) => Effect.Effect<A, E, R>
		) => Effect.Effect<A, E | TransactionError, R>;
	}
>() {}

/**
 * Implementación del servicio Drizzle
 */
const make = (): {
	readonly db: DrizzleDB;
	readonly query: <A>(fn: (db: DrizzleDB) => Promise<A>) => Effect.Effect<A, Error>;
	readonly transaction: <A, E, R>(fn: (tx: DrizzleTx) => Effect.Effect<A, E, R>) => Effect.Effect<A, E | TransactionError, R>;
} => ({
	db,

	query: <A>(fn: (db: DrizzleDB) => Promise<A>) =>
		Effect.tryPromise({
			try: () => fn(db),
			catch: (error) => new Error(`Query failed: ${String(error)}`),
		}),

	transaction: <A, E>(fn: (tx: DrizzleTx) => Effect.Effect<A, E, never>) =>
		Effect.tryPromise({
			try: async () => {
				const result = await db.transaction(async (tx: any) => {
					// Ejecutar el Effect dentro de la transacción
					// Convertir el Effect a Promise para que Drizzle lo pueda manejar
					const effectResult = await Effect.runPromise(
						fn(tx as DrizzleTx).pipe(Effect.catchAll((error) => Effect.fail(error)))
					);
					return effectResult;
				});
				return result;
			},
			catch: (error) => new TransactionError('Transaction failed', error) as E | TransactionError,
		}),
});

/**
 * Layer que proporciona el servicio Drizzle
 * 
 * @example
 * ```typescript
 * const program = Effect.gen(function*() {
 *   const drizzle = yield* DrizzleService;
 *   return yield* drizzle.query((db) => db.select().from(tags));
 * });
 * 
 * // Ejecutar con el layer
 * const result = await Effect.runPromise(
 *   program.pipe(Effect.provide(DrizzleLive))
 * );
 * ```
 */
export const DrizzleLive = Layer.succeed(DrizzleService, make());

/**
 * Helper para queries simples sin necesidad de acceder al servicio completo
 * 
 * @example
 * ```typescript
 * const tags = await runQuery((db) =>
 *   db.select().from(tags).where(eq(tags.isFavorite, true))
 * );
 * ```
 */
export const runQuery = <A>(fn: (db: DrizzleDB) => Promise<A>): Effect.Effect<A, Error, DrizzleService> =>
	Effect.gen(function* () {
		const drizzle = yield* DrizzleService;
		return yield* drizzle.query(fn);
	});

/**
 * Helper para ejecutar operaciones en transacción
 * 
 * @example
 * ```typescript
 * const result = await runTransaction((tx) =>
 *   Effect.gen(function*() {
 *     yield* Effect.promise(() => tx.insert(tags).values({...}));
 *     yield* Effect.promise(() => tx.update(images).set({...}));
 *     return "success";
 *   })
 * );
 * ```
 */
export const runTransaction = <A, E, R>(
	fn: (tx: DrizzleTx) => Effect.Effect<A, E, R>
): Effect.Effect<A, E | TransactionError, DrizzleService | R> =>
	Effect.gen(function* () {
		const drizzle = yield* DrizzleService;
		return yield* drizzle.transaction(fn);
	});
