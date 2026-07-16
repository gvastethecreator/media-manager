/**
 * @file JsonFile service adapter — delega al servicio Effect-TS canónico.
 * @module services/json-file/json-file.service
 * @deprecated Usar `json-file.service.effect.ts` directamente con `Effect.runPromise`.
 */

import { Effect } from 'effect';
import { type CreateJsonFileInput, JsonFileService, JsonFileServiceLive } from './json-file.service.effect';

const run = <A, E>(effect: Effect.Effect<A, E, JsonFileService>) =>
	Effect.runPromise(effect.pipe(Effect.provide(JsonFileServiceLive)));

export async function createJsonFile(input: CreateJsonFileInput) {
	return run(
		Effect.gen(function* () {
			const svc = yield* JsonFileService;
			return yield* svc.create(input);
		})
	);
}

export async function getJsonFileByHash(hash: string) {
	return run(
		Effect.gen(function* () {
			const svc = yield* JsonFileService;
			return yield* svc.getByHash(hash);
		})
	);
}

export async function getJsonFiles(filters?: Record<string, unknown>) {
	return run(
		Effect.gen(function* () {
			const svc = yield* JsonFileService;
			return yield* svc.getAll(filters as any);
		})
	);
}

export async function updateJsonFile(id: string, input: any) {
	return run(
		Effect.gen(function* () {
			const svc = yield* JsonFileService;
			return yield* svc.update(id, input);
		})
	);
}
