import { Data, Effect } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import * as MetadataService from '@/services/metadata/metadata.service';

class MetadataNotFound extends Data.TaggedError('MetadataNotFound')<{
	readonly id: string;
}> {}

class MetadataUpdateFailed extends Data.TaggedError('MetadataUpdateFailed')<{
	readonly id: string;
	readonly message: string;
}> {}

const router = express.Router();

router.put(
	'/bulk-update',
	effectHandler((req, res) => {
		const updates = req.body?.updates;
		if (!Array.isArray(updates)) {
			res.status(400).json({
				error: 'El campo "updates" (un array de objetos con id y data) es requerido',
			});
			return Effect.succeed(undefined);
		}
		return Effect.tryPromise({
			try: () => MetadataService.updateMultipleMetadata(updates),
			catch: (error) =>
				new MetadataUpdateFailed({
					id: 'batch',
					message: error instanceof Error ? error.message : 'Error en actualización masiva',
				}),
		});
	})
);

router.put(
	'/:id',
	effectHandler((req, res) => {
		const { id } = req.params;
		const data = req.body;
		if (!data) {
			res.status(400).json({ error: 'Los datos de metadata son requeridos' });
			return Effect.succeed(undefined);
		}
		return Effect.tryPromise({
			try: async () => {
				const result = await MetadataService.updateMetadata(id, data);
				if (!result) throw new MetadataNotFound({ id });
				return result;
			},
			catch: (error) =>
				error instanceof MetadataNotFound
					? error
					: new MetadataUpdateFailed({
							id,
							message: error instanceof Error ? error.message : 'Error desconocido',
						}),
		});
	})
);

export default router;
export { router as metadataEffectRouter };
