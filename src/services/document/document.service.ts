/**
 * @file Document service adapter — delega al servicio Effect-TS canónico.
 * @module services/document/document.service
 * @deprecated Usar `document.service.effect.ts` directamente con `Effect.runPromise`.
 */

import { Effect } from 'effect';
import { DocumentService, DocumentServiceLive } from './document.service.effect';
import type { DocumentCreateInput } from '@/transformers/document/validators';

const run = <A, E>(effect: Effect.Effect<A, E, DocumentService>) =>
	Effect.runPromise(effect.pipe(Effect.provide(DocumentServiceLive)));

export async function createDocument(input: DocumentCreateInput) {
	return run(Effect.gen(function* () {
		const svc = yield* DocumentService;
		return yield* svc.create(input as any);
	}));
}

export async function getDocumentByHash(hash: string) {
	return run(Effect.gen(function* () {
		const svc = yield* DocumentService;
		return yield* svc.getByHash(hash);
	}));
}

export async function getDocuments(filters?: Record<string, unknown>) {
	return run(Effect.gen(function* () {
		const svc = yield* DocumentService;
		return yield* svc.getAll(filters as any);
	}));
}

export async function updateDocument(id: string, input: any) {
	return run(Effect.gen(function* () {
		const svc = yield* DocumentService;
		return yield* svc.update(id, input);
	}));
}
