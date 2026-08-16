/**
 * @file Express Routes para Prompts usando Effect
 * @module server/routes/prompts.effect
 * @description Rutas REST para Prompts implementadas con Effect-TS
 */

import { Schema } from '@effect/schema';
import { Effect } from 'effect';
import express, { type NextFunction, type Response } from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { PromptCreateInput, PromptUpdateInput } from '@/lib/effect/schemas/entities';
import {
	authorizeMediaAssetParam,
	getAuthorizedRootRegistry,
	sendRootAuthorizationError,
} from '@/server/security/authorized-root-request';
import { RootAuthorizationError } from '@/server/security/authorized-roots';
import { preserveJsonResponseTextFields } from '@/server/security/sanitize-public-payload';
import {
	assertTaxonomyEntityRootPermissions,
	type TaxonomyRootPermission,
} from '@/server/security/taxonomy-root-authorization';
import { PromptService, PromptServiceLive } from '@/services/prompt/prompt.service.effect';
import { PromptValidationError } from '@/services/worldbuilding/worldbuilding-errors.effect';
import { ArtifactConflictError } from '@/services/taxonomy/file-backed/file-backed.service';
import {
	assertInlineTaxonomyMutationAllowed,
	filterAuthorizedTaxonomyEntities,
} from '@/services/taxonomy/file-backed/taxonomy-artifact.service';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';

const router = express.Router();
router.use(
	preserveJsonResponseTextFields(
		'category',
		'color',
		'content',
		'description',
		'emoji',
		'metadata',
		'name',
		'parameters',
		'purpose'
	)
);

async function requireInlinePrompt(req: { params: Record<string, string> }, res: Response, next: NextFunction) {
	try {
		await assertInlineTaxonomyMutationAllowed('prompt', req.params.id);
		next();
	} catch (error) {
		if (error instanceof ArtifactConflictError) {
			res.status(409).json({ code: 'ARTIFACT_FILE_BACKED', message: error.message, retryable: false });
			return;
		}
		next(error);
	}
}

function requireAuthorizedPrompt(permissions: readonly TaxonomyRootPermission[]) {
	return async (
		req: { app: { locals: Record<string, unknown> }; params: Record<string, string> },
		res: Response,
		next: NextFunction
	) => {
		try {
			await assertTaxonomyEntityRootPermissions(getAuthorizedRootRegistry(req), 'prompt', req.params.id, permissions);
			next();
		} catch (error) {
			if (error instanceof RootAuthorizationError && error.status === 404) {
				res.status(404).json({ code: 'PROMPT_NOT_FOUND', message: 'Prompt no encontrado.' });
				return;
			}
			if (!sendRootAuthorizationError(res, error)) next(error);
		}
	};
}

const requireAuthorizedPromptRead = requireAuthorizedPrompt(['read', 'index']);
const requireAuthorizedPromptWrite = requireAuthorizedPrompt(['read', 'index', 'write']);
const requireAuthorizedPromptDelete = requireAuthorizedPrompt(['read', 'index', 'write', 'delete']);

router.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			const {
				search,
				limit = '50',
				offset = '0',
				sortBy = 'createdAt',
				sortOrder = 'desc',
				category,
				onlyFavorites,
			} = req.query;
			const options = {
				search: search as string | undefined,
				limit: sanitizeLimit(limit),
				offset: sanitizeOffset(offset),
				orderBy: (sortBy as 'name' | 'createdAt' | 'updatedAt') || 'createdAt',
				orderDirection: (sortOrder as 'asc' | 'desc') || 'desc',
				category: category as string | undefined,
				onlyFavorites: onlyFavorites === 'true' ? true : undefined,
			};

			const authorized: Array<{ id: string }> = [];
			let rawOffset = 0;
			const chunkSize = 250;
			while (true) {
				const result = yield* promptService.getAll({ ...options, limit: chunkSize, offset: rawOffset });
				authorized.push(
					...(yield* Effect.tryPromise({
						try: () => filterAuthorizedTaxonomyEntities(getAuthorizedRootRegistry(req), 'prompt', result.prompts),
						catch: (error) => error,
					}))
				);
				rawOffset += result.prompts.length;
				if (result.prompts.length < chunkSize) break;
			}
			const data = authorized.slice(options.offset, options.offset + options.limit);
			return {
				data,
				pagination: {
					total: authorized.length,
					limit: options.limit,
					offset: options.offset,
					hasNext: options.offset + options.limit < authorized.length,
					hasPrev: options.offset > 0,
				},
			};
		}).pipe(Effect.provide(PromptServiceLive))
	)
);

router.get(
	'/:id',
	requireAuthorizedPromptRead,
	effectHandler((req) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			return yield* promptService.getById(req.params.id);
		}).pipe(Effect.provide(PromptServiceLive))
	)
);

router.post(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			const input = yield* Schema.decodeUnknown(PromptCreateInput)(req.body).pipe(
				Effect.mapError(() => new PromptValidationError({ field: 'body', message: 'Contrato de Invalid prompt.' }))
			);
			const prompt = yield* promptService.create(input);
			res.status(201);
			return prompt;
		}).pipe(Effect.provide(PromptServiceLive))
	)
);

router.put(
	'/:id',
	requireAuthorizedPromptWrite,
	requireInlinePrompt,
	effectHandler((req) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			const input = yield* Schema.decodeUnknown(PromptUpdateInput)(req.body).pipe(
				Effect.mapError(() => new PromptValidationError({ field: 'body', message: 'Contrato de Invalid prompt.' }))
			);
			return yield* promptService.update(req.params.id, input);
		}).pipe(Effect.provide(PromptServiceLive))
	)
);

router.delete(
	'/:id',
	requireAuthorizedPromptDelete,
	requireInlinePrompt,
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			yield* promptService.delete(req.params.id);
			res.status(204);
			return { success: true };
		}).pipe(Effect.provide(PromptServiceLive))
	)
);

router.post(
	'/:id/images/:imageId',
	requireAuthorizedPromptWrite,
	authorizeMediaAssetParam({ assetType: 'image', idParam: 'imageId', permissions: ['read', 'index', 'write'] }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			yield* promptService.addImage(req.params.id, req.params.imageId);
			res.status(201);
			return { success: true };
		}).pipe(Effect.provide(PromptServiceLive))
	)
);

router.delete(
	'/:id/images/:imageId',
	requireAuthorizedPromptDelete,
	authorizeMediaAssetParam({
		assetType: 'image',
		idParam: 'imageId',
		permissions: ['read', 'index', 'write', 'delete'],
	}),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			yield* promptService.removeImage(req.params.id, req.params.imageId);
			res.status(204);
			return { success: true };
		}).pipe(Effect.provide(PromptServiceLive))
	)
);

export default router;
export { router as promptsRouter, router as promptsEffectRouter };
