/**
 * @file Express Routes para Metadata usando Effect
 * @module server/routes/metadata.effect
 * @description Rutas REST para metadatos implementadas con Effect-TS
 * @created 2026-02-02 - Migración desde metadata.ts
 */

import { Context, Data, Effect, Layer } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import * as MetadataService from '@/services/metadata/metadata.service';

// ==========================================
// 1. Definir errores tipados
// ==========================================

export class MetadataNotFound extends Data.TaggedError('MetadataNotFound')<{
	readonly id: string;
}> {}

export class MetadataValidationError extends Data.TaggedError('MetadataValidationError')<{
	readonly message: string;
}> {}

export class MetadataUpdateFailed extends Data.TaggedError('MetadataUpdateFailed')<{
	readonly id: string;
	readonly message: string;
}> {}

// ==========================================
// 2. Crear servicio Effect
// ==========================================

export interface MetadataServiceInterface {
	readonly updateMetadata: (
		id: string,
		data: Record<string, unknown>
	) => Effect.Effect<NonNullable<unknown>, MetadataNotFound | MetadataUpdateFailed>;
	readonly updateMultipleMetadata: (
		updates: { id: string; data: Record<string, unknown> }[]
	) => Effect.Effect<{ updated: number; errors: { id: string; error: string }[] }, MetadataUpdateFailed>;
}

export class MetadataServiceTag extends Context.Tag('MetadataService')<
	MetadataServiceTag,
	MetadataServiceInterface
>() {}

// ==========================================
// 3. Implementar Live Layer
// ==========================================

export const MetadataServiceLive = Layer.succeed(
	MetadataServiceTag,
	MetadataServiceTag.of({
		updateMetadata: (id: string, data: Record<string, unknown>) =>
			Effect.tryPromise({
				try: async () => {
					const updatedMetadata = await MetadataService.updateMetadata(id, data);
					if (!updatedMetadata) {
						throw new MetadataNotFound({ id });
					}
					return updatedMetadata;
				},
				catch: (error) => {
					if (error instanceof MetadataNotFound) {
						return error;
					}
					return new MetadataUpdateFailed({
						id,
						message: error instanceof Error ? error.message : 'Error desconocido',
					});
				},
			}),

		updateMultipleMetadata: (updates: { id: string; data: Record<string, unknown> }[]) =>
			Effect.tryPromise({
				try: async () => {
					return await MetadataService.updateMultipleMetadata(updates);
				},
				catch: (error) =>
					new MetadataUpdateFailed({
						id: 'batch',
						message: error instanceof Error ? error.message : 'Error en actualización masiva',
					}),
			}),
	})
);

// ==========================================
// 4. Crear Router Express
// ==========================================

const router = express.Router();

/**
 * PUT /metadata/:id - Actualizar metadatos por su ID
 */
router.put(
	'/:id',
	effectHandler((req, res) => {
		const { id } = req.params;
		const data = req.body;

		if (!data) {
			res.status(400).json({ error: 'Los datos de metadata son requeridos' });
			return Effect.succeed(undefined);
		}

		return Effect.gen(function* () {
			const service = yield* MetadataServiceTag;
			return yield* service.updateMetadata(id, data);
		}).pipe(Effect.provide(MetadataServiceLive));
	})
);

/**
 * PUT /metadata/bulk-update - Actualizar metadata en lote
 */
router.put(
	'/bulk-update',
	effectHandler((req, res) => {
		const { updates } = req.body;

		if (!(updates && Array.isArray(updates))) {
			res.status(400).json({
				error: 'El campo "updates" (un array de objetos con id y data) es requerido',
			});
			return Effect.succeed(undefined);
		}

		return Effect.gen(function* () {
			const service = yield* MetadataServiceTag;
			return yield* service.updateMultipleMetadata(updates);
		}).pipe(Effect.provide(MetadataServiceLive));
	})
);

export default router;
export { router as metadataEffectRouter };
