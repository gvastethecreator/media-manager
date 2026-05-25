/**
 * @file File3D service adapter — delega al servicio Effect-TS canónico.
 * @module services/file3d/file3d.service
 * @deprecated Usar `file3d.service.effect.ts` directamente con `Effect.runPromise`.
 */

import { Effect } from 'effect';
import { File3DService, File3DServiceLive } from './file3d.service.effect';
import type { File3DCreateInput } from '@/types/entities/file3d';

const run = <A, E>(effect: Effect.Effect<A, E, File3DService>) =>
	Effect.runPromise(effect.pipe(Effect.provide(File3DServiceLive)));

export async function createFile3D(input: File3DCreateInput) {
	return run(Effect.gen(function* () {
		const svc = yield* File3DService;
		return yield* svc.create(input as any);
	}));
}

export async function getFile3DByHash(hash: string) {
	return run(Effect.gen(function* () {
		const svc = yield* File3DService;
		return yield* svc.getByHash(hash);
	}));
}

export async function getFile3Ds(filters?: Record<string, unknown>) {
	return run(Effect.gen(function* () {
		const svc = yield* File3DService;
		return yield* svc.getAll(filters as any);
	}));
}

export async function updateFile3D(id: string, input: any) {
	return run(Effect.gen(function* () {
		const svc = yield* File3DService;
		return yield* svc.update(id, input);
	}));
}
