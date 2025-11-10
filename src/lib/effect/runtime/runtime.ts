/**
 * @file Runtime personalizado de Effect para el proyecto
 * @module lib/effect/runtime
 * @description Configura el runtime de Effect integrándose con el logger existente del proyecto
 */

import { Effect, Logger, Runtime, Exit, Either } from 'effect';
import { serverLogger } from '@/lib/logger/server-logger';

/**
 * Logger de Effect que delega al logger existente del proyecto
 * Mantiene consistencia en el logging entre código Effect y no-Effect
 */
const AppLogger = Logger.make(({ message, logLevel }) => {
	const msg = String(message);

	// Comparar con valores numéricos de LogLevel
	if (logLevel._tag === 'Fatal' || logLevel._tag === 'Error') {
		serverLogger.error(msg);
	} else if (logLevel._tag === 'Warning') {
		serverLogger.warn(msg);
	} else if (logLevel._tag === 'Info') {
		serverLogger.info(msg);
	} else if (logLevel._tag === 'Debug' || logLevel._tag === 'Trace') {
		serverLogger.debug(msg);
	}
	// None: no logging
});

/**
 * Layer que reemplaza el logger por defecto de Effect con nuestro AppLogger
 */
export const LoggerLive = Logger.replace(Logger.defaultLogger, AppLogger);

/**
 * Runtime customizado del proyecto
 * Usa el runtime por defecto con el logger personalizado aplicado vía Layer
 */
export const AppRuntime = Runtime.defaultRuntime;

/**
 * Helper para ejecutar Effects como Promises usando el runtime del proyecto
 * 
 * @example
 * ```typescript
 * const result = await runPromise(
 *   Effect.succeed(42)
 * );
 * ```
 */
export const runPromise = <A, E>(effect: Effect.Effect<A, E, never>): Promise<A> =>
	Runtime.runPromise(AppRuntime)(effect);

/**
 * Helper para ejecutar Effects síncronamente usando el runtime del proyecto
 * ⚠️ IMPORTANTE: Solo usar con Effects que no contengan operaciones async
 * 
 * @example
 * ```typescript
 * const result = runSync(
 *   Effect.succeed(42)
 * );
 * ```
 */
export const runSync = <A, E>(effect: Effect.Effect<A, E, never>): A => Runtime.runSync(AppRuntime)(effect);

/**
 * Helper para ejecutar Effects con callback para el resultado
 * Útil para integración con código no-Effect
 * 
 * @example
 * ```typescript
 * import { Exit } from "effect";
 * 
 * runCallback(myEffect, (exit) => {
 *   if (Exit.isSuccess(exit)) {
 *     console.log('Success:', exit.value);
 *   } else {
 *     console.error('Failed:', exit.cause);
 *   }
 * });
 * ```
 */
export const runCallback = <A, E>(effect: Effect.Effect<A, E, never>, callback: (exit: Exit.Exit<A, E>) => void): void => {
	Runtime.runCallback(AppRuntime)(effect, {
		onExit: callback,
	});
};

/**
 * Helper para ejecutar Effects y retornar un Either (Left = error, Right = success)
 * Útil cuando se quiere manejar el resultado sin lanzar excepciones
 * 
 * @example
 * ```typescript
 * import { Either } from "effect";
 * 
 * const result = await runPromiseEither(myEffect);
 * if (Either.isRight(result)) {
 *   console.log('Success:', result.right);
 * } else {
 *   console.error('Error:', result.left);
 * }
 * ```
 */
export const runPromiseEither = <A, E>(effect: Effect.Effect<A, E, never>): Promise<Either.Either<A, E>> =>
	Runtime.runPromise(AppRuntime)(Effect.either(effect));
