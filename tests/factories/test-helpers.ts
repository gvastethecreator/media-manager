/**
 * @file Shared Test Helpers for Effect-TS Services
 * @module tests/factories/test-helpers
 * @description Common utilities for testing Effect-TS service methods
 */

import { Effect } from 'effect';

/**
 * Run an Effect and expect success. Throws if the Effect fails.
 */
export async function expectSuccess<E, A>(
	effect: Effect.Effect<A, E, never>
): Promise<A> {
	const either = await Effect.runPromise(Effect.either(effect));
	if (either._tag === 'Right') {
		return either.right;
	}
	throw new Error(
		`Expected success but got failure: ${JSON.stringify(either.left)}`
	);
}

/**
 * Run an Effect and expect a specific tagged error. Throws if the Effect succeeds
 * or if the error doesn't match the expected tag.
 */
export async function expectError<E, A>(
	effect: Effect.Effect<A, E, never>,
	expectedTag?: string
): Promise<E> {
	const either = await Effect.runPromise(Effect.either(effect));
	if (either._tag === 'Left') {
		if (expectedTag !== undefined) {
			const error = either.left as any;
			if (error._tag !== expectedTag) {
				throw new Error(
					`Expected error tag "${expectedTag}" but got "${error._tag}"`
				);
			}
		}
		return either.left;
	}
	throw new Error('Expected failure but got success');
}

/**
 * Generate a unique test ID with an optional prefix.
 * Uses crypto.randomUUID() for uniqueness.
 */
export function generateTestId(prefix: string = 'test'): string {
	return `${prefix}-${crypto.randomUUID()}`;
}
