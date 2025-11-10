/**
 * @file Adaptadores Promise ↔ Effect
 * @module lib/effect/utils/adapt-promise
 * @description Utilidades para convertir entre Promises y Effects
 * Útil para migración incremental de código existente
 */

import { Effect, Exit, Either } from 'effect';

/**
 * Convierte una Promise a un Effect
 * Útil para integrar código legacy basado en Promises
 * 
 * @param promise - Función que retorna una Promise
 * @param mapError - Función opcional para mapear errores a tipos específicos
 * 
 * @example
 * ```typescript
 * // Uso básico
 * const effect = fromPromise(() => fetch('/api/users'));
 * 
 * // Con mapeo de errores
 * const effect = fromPromise(
 *   () => fetch('/api/users'),
 *   (e) => new NetworkError({ cause: e })
 * );
 * ```
 */
export const fromPromise = <A, E = Error>(
	promise: () => Promise<A>,
	mapError?: (error: unknown) => E
): Effect.Effect<A, E> =>
	Effect.tryPromise({
		try: promise,
		catch: mapError || ((e) => new Error(String(e)) as E),
	});

/**
 * Convierte una Promise que nunca falla a un Effect
 * Útil cuando estamos seguros de que la Promise no lanzará errores
 * 
 * @example
 * ```typescript
 * const effect = fromPromiseSuccess(() =>
 *   Promise.resolve({ id: "123", name: "Tag" })
 * );
 * ```
 */
export const fromPromiseSuccess = <A>(promise: () => Promise<A>): Effect.Effect<A> => Effect.promise(promise);

/**
 * Ejecuta un Effect como Promise para integrarlo con código legacy
 * 
 * @example
 * ```typescript
 * // En un handler Express
 * async function handler(req, res) {
 *   const result = await toPromise(myEffect);
 *   res.json(result);
 * }
 * ```
 */
export const toPromise = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect);

/**
 * Ejecuta un Effect como Promise pero captura el Exit completo
 * Útil cuando necesitas información sobre cómo terminó el Effect
 * 
 * @example
 * ```typescript
 * import { Exit } from "effect";
 * 
 * const exit = await toPromiseExit(myEffect);
 * if (Exit.isSuccess(exit)) {
 *   console.log('Success:', exit.value);
 * } else {
 *   console.error('Failed:', exit.cause);
 * }
 * ```
 */
export const toPromiseExit = async <A, E>(effect: Effect.Effect<A, E>) => {
	const { Exit } = await import('effect');
	return Effect.runPromise(Effect.exit(effect)) as Promise<Exit.Exit<A, E>>;
};

/**
 * Ejecuta un Effect y retorna Either (sin lanzar excepciones)
 * 
 * @example
 * ```typescript
 * import { Either } from "effect";
 * 
 * const result = await toPromiseEither(myEffect);
 * if (Either.isRight(result)) {
 *   console.log('Success:', result.right);
 * } else {
 *   console.error('Error:', result.left);
 * }
 * ```
 */
export const toPromiseEither = async <A, E>(effect: Effect.Effect<A, E>) => {
	const { Either } = await import('effect');
	return Effect.runPromise(Effect.either(effect)) as Promise<Either.Either<A, E>>;
};

/**
 * Convierte una función async a una función que retorna Effects
 * 
 * @example
 * ```typescript
 * // Función legacy
 * async function fetchUser(id: string) {
 *   const res = await fetch(`/api/users/${id}`);
 *   return res.json();
 * }
 * 
 * // Convertir a Effect
 * const fetchUserEffect = promisify(fetchUser);
 * const effect = fetchUserEffect("123");
 * ```
 */
export const promisify =
	<Args extends unknown[], A>(fn: (...args: Args) => Promise<A>) =>
	(...args: Args): Effect.Effect<A, Error> =>
		fromPromise(() => fn(...args));

/**
 * Ejecuta múltiples Promises en paralelo y retorna un Effect
 * 
 * @example
 * ```typescript
 * const effects = allFromPromises([
 *   () => fetch('/api/tags'),
 *   () => fetch('/api/images'),
 *   () => fetch('/api/folders')
 * ]);
 * 
 * const [tags, images, folders] = await Effect.runPromise(effects);
 * ```
 */
export const allFromPromises = <A>(promises: Array<() => Promise<A>>): Effect.Effect<A[], Error> =>
	Effect.all(promises.map((p) => fromPromise(p)), { concurrency: 'unbounded' });

/**
 * Ejecuta múltiples Promises en secuencia (una tras otra)
 * 
 * @example
 * ```typescript
 * const result = await Effect.runPromise(
 *   allFromPromisesSeq([
 *     () => updateDatabase(),
 *     () => invalidateCache(),
 *     () => notifyWebhook()
 *   ])
 * );
 * ```
 */
export const allFromPromisesSeq = <A>(promises: Array<() => Promise<A>>): Effect.Effect<A[], Error> =>
	Effect.all(promises.map((p) => fromPromise(p)), { concurrency: 1 });
