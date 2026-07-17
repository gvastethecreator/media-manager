/**
 * @file Express Routes para Prompts usando Effect
 * @module server/routes/prompts.effect
 * @description Rutas REST para Prompts implementadas con Effect-TS
 */

import { Schema } from "@effect/schema";
import { Effect } from "effect";
import express, { type NextFunction, type Response } from "express";
import { effectHandler } from "@/lib/effect/adapters/express.adapter";
import { PromptCreateInput, PromptUpdateInput } from "@/lib/effect/schemas/entities";
import { authorizeMediaAssetParam } from "@/server/security/authorized-root-request";
import { listFavoriteEntities } from "@/server/utils/favorite-route";
import { PromptService, PromptServiceLive } from "@/services/prompt/prompt.service.effect";
import { ArtifactConflictError } from "@/services/taxonomy/file-backed/file-backed.service";
import { assertInlineTaxonomyMutationAllowed } from "@/services/taxonomy/file-backed/taxonomy-artifact.service";
import { FavoriteEntityType } from "@/types/entities/favorite";
import { sanitizeLimit, sanitizeOffset } from "../utils/pagination";

const router = express.Router();

async function requireInlinePrompt(req: { params: Record<string, string> }, res: Response, next: NextFunction) {
	try {
		await assertInlineTaxonomyMutationAllowed("prompt", req.params.id);
		next();
	} catch (error) {
		if (error instanceof ArtifactConflictError) {
			res.status(409).json({ code: "ARTIFACT_FILE_BACKED", message: error.message, retryable: false });
			return;
		}
		next(error);
	}
}

router.get(
	"/",
	effectHandler((req) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			const {
				search,
				limit = "50",
				offset = "0",
				sortBy = "createdAt",
				sortOrder = "desc",
				category,
				onlyFavorites,
			} = req.query;
			const options = {
				search: search as string | undefined,
				limit: sanitizeLimit(limit),
				offset: sanitizeOffset(offset),
				orderBy: (sortBy as "name" | "createdAt" | "updatedAt") || "createdAt",
				orderDirection: (sortOrder as "asc" | "desc") || "desc",
				category: category as string | undefined,
				onlyFavorites: onlyFavorites === "true" ? true : undefined,
			};

			if (options.onlyFavorites) {
				const favoriteResult = yield* listFavoriteEntities({
					entityType: FavoriteEntityType.PROMPT,
					search: options.search,
					limit: options.limit,
					offset: options.offset,
					sortBy: options.orderBy,
					sortOrder: options.orderDirection,
					getEntityById: (entityId: string) => promptService.getById(entityId),
				});

				return {
					data: favoriteResult.data,
					pagination: {
						total: favoriteResult.total,
						limit: options.limit,
						offset: options.offset,
						hasNext: options.limit + options.offset < favoriteResult.total,
						hasPrev: options.offset > 0,
					},
				};
			}

			const result = yield* promptService.getAll(options);
			return {
				data: result.prompts,
				pagination: {
					total: result.total,
					limit: result.limit,
					offset: result.offset,
					hasNext: result.limit + result.offset < result.total,
					hasPrev: result.offset > 0,
				},
			};
		}).pipe(Effect.provide(PromptServiceLive)),
	),
);

router.get(
	"/:id",
	effectHandler((req) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			return yield* promptService.getById(req.params.id);
		}).pipe(Effect.provide(PromptServiceLive)),
	),
);

router.post(
	"/",
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			const input = yield* Schema.decodeUnknown(PromptCreateInput)(req.body);
			const prompt = yield* promptService.create(input);
			res.status(201);
			return prompt;
		}).pipe(Effect.provide(PromptServiceLive)),
	),
);

router.put(
	"/:id",
	requireInlinePrompt,
	effectHandler((req) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			const input = yield* Schema.decodeUnknown(PromptUpdateInput)(req.body);
			return yield* promptService.update(req.params.id, input);
		}).pipe(Effect.provide(PromptServiceLive)),
	),
);

router.delete(
	"/:id",
	requireInlinePrompt,
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			yield* promptService.delete(req.params.id);
			res.status(204);
			return { success: true };
		}).pipe(Effect.provide(PromptServiceLive)),
	),
);

router.post(
	"/:id/images/:imageId",
	authorizeMediaAssetParam({ assetType: "image", idParam: "imageId", permissions: ["read", "index"] }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const promptService = yield* PromptService;
			yield* promptService.addImage(req.params.id, req.params.imageId);
			res.status(201);
			return { success: true };
		}).pipe(Effect.provide(PromptServiceLive)),
	),
);

export default router;
export { router as promptsRouter, router as promptsEffectRouter };
