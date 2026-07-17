import { Effect } from "effect";
import { type NextFunction, Router, type Response } from "express";
import { z } from "zod";
import { getAuthorizedRootRegistry, sendRootAuthorizationError } from "@/server/security/authorized-root-request";
import { sanitizeJsonResponses } from "@/server/security/sanitize-public-payload";
import { ArtifactConflictError, ArtifactValidationError } from "@/services/taxonomy/file-backed/file-backed.service";
import { PromptService, PromptServiceLive } from "@/services/prompt/prompt.service.effect";
import {
	NoteService,
	NoteServiceLive,
	WildcardService,
	WildcardServiceLive,
} from "@/services/secondary/secondary-services.effect";
import {
	deleteTaxonomyArtifactWithEntity,
	readAndReconcileTaxonomyArtifact,
	rebuildTaxonomyArtifactIndex,
	relocateTaxonomyArtifact,
	saveTaxonomyArtifact,
	searchTaxonomyArtifacts,
	type SaveTaxonomyArtifactInput,
	TaxonomyArtifactServiceError,
} from "@/services/taxonomy/file-backed/taxonomy-artifact.service";

const router = Router();
router.use(sanitizeJsonResponses);

const entityTypeSchema = z.enum(["prompt", "note", "wildcard"]);
const entityIdSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/);
const hashSchema = z.string().regex(/^[0-9a-f]{64}$/);
const parameterValueSchema = z.union([
	z.boolean(),
	z.number().finite(),
	z.string(),
	z.array(z.boolean()).max(100),
	z.array(z.number().finite()).max(100),
	z.array(z.string()).max(100),
]);
const parameterSchema = z
	.object({
		canonicalKey: z.enum(["subject", "context", "tone", "style", "constraints"]).optional(),
		custom: z.boolean(),
		default: parameterValueSchema.optional(),
		description: z.string().trim().min(1).max(1_024).optional(),
		enumTokens: z
			.array(z.string().regex(/^[a-z][a-z0-9_-]{0,63}$/))
			.max(100)
			.optional(),
		example: parameterValueSchema.optional(),
		key: z.string().regex(/^[a-z][a-z0-9_]{0,63}$/),
		multiple: z.boolean().optional(),
		required: z.boolean().optional(),
		type: z.enum(["text", "number", "boolean", "date", "enum_token"]),
	})
	.strict();
const metadataSchema = z
	.object({
		category: z.string().max(128).optional(),
		color: z.string().max(128).optional(),
		emoji: z.string().max(32).optional(),
		parameters: z.array(parameterSchema).max(100).optional(),
		purpose: z.string().max(4_096).optional(),
		summary: z.string().max(4_096).optional(),
		title: z.string().trim().min(1).max(512),
	})
	.strict();
const operationalSchema = z
	.object({
		featuredImage: z.string().max(2_048).nullable().optional(),
		parentId: entityIdSchema.nullable().optional(),
		shortcut: z.string().max(128).nullable().optional(),
	})
	.strict();
const saveSchema = z
	.object({
		body: z.string().max(2 * 1024 * 1024),
		expectedHash: hashSchema.optional(),
		metadata: metadataSchema,
		operational: operationalSchema.optional(),
		rootId: z
			.string()
			.regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/)
			.optional(),
	})
	.strict();
const relocateSchema = z.object({ expectedHash: hashSchema, fileName: z.string().min(4).max(131) }).strict();
const deleteSchema = z.object({ expectedHash: hashSchema }).strict();
const rebuildSchema = z.object({ entityType: entityTypeSchema.optional() }).strict();
const createFileBackedWildcardSchema = z
	.object({
		body: z.string().max(2 * 1024 * 1024),
		metadata: metadataSchema,
		operational: operationalSchema.optional(),
		rootId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/),
	})
	.strict();

function sendArtifactError(response: Response, error: unknown): boolean {
	if (sendRootAuthorizationError(response, error)) return true;
	if (error instanceof z.ZodError || error instanceof ArtifactValidationError) {
		response.status(400).json({ code: "ARTIFACT_VALIDATION", message: "El contrato del artefacto no es válido." });
		return true;
	}
	if (error instanceof ArtifactConflictError) {
		response.status(409).json({ code: "ARTIFACT_CONFLICT", message: error.message, retryable: false });
		return true;
	}
	if (error instanceof TaxonomyArtifactServiceError) {
		response.status(error.status).json({ code: error.code, message: error.message, retryable: false });
		return true;
	}
	return false;
}

function parseTarget(params: Record<string, string>): { entityId: string; entityType: "note" | "prompt" | "wildcard" } {
	return {
		entityId: entityIdSchema.parse(params.id),
		entityType: entityTypeSchema.parse(params.entityType),
	};
}

async function deleteEntity(entityType: "note" | "prompt" | "wildcard", entityId: string): Promise<void> {
	switch (entityType) {
		case "prompt":
			await Effect.runPromise(
				Effect.gen(function* () {
					const service = yield* PromptService;
					yield* service.delete(entityId);
				}).pipe(Effect.provide(PromptServiceLive)),
			);
			break;
		case "note":
			await Effect.runPromise(
				Effect.gen(function* () {
					const service = yield* NoteService;
					yield* service.delete(entityId);
				}).pipe(Effect.provide(NoteServiceLive)),
			);
			break;
		case "wildcard":
			await Effect.runPromise(
				Effect.gen(function* () {
					const service = yield* WildcardService;
					yield* service.delete(entityId);
				}).pipe(Effect.provide(WildcardServiceLive)),
			);
			break;
	}
}

async function createWildcardEntity(
	input: Omit<SaveTaxonomyArtifactInput, "entityId" | "entityType" | "expectedHash"> & { rootId: string },
) {
	return Effect.runPromise(
		Effect.gen(function* () {
			const service = yield* WildcardService;
			return yield* service.create({
				category: input.metadata.category ?? null,
				children: "[]",
				color: input.metadata.color ?? null,
				description: input.metadata.summary ?? null,
				emoji: input.metadata.emoji ?? null,
				featuredImage: input.operational?.featuredImage ?? null,
				name: input.metadata.title,
				parentId: input.operational?.parentId ?? null,
				shortcut: input.operational?.shortcut ?? null,
			});
		}).pipe(Effect.provide(WildcardServiceLive)),
	);
}

async function getWildcardEntity(entityId: string) {
	return Effect.runPromise(
		Effect.gen(function* () {
			const service = yield* WildcardService;
			return yield* service.getById(entityId);
		}).pipe(Effect.provide(WildcardServiceLive)),
	);
}

router.get("/search", async (req, res, next: NextFunction) => {
	try {
		const query = z.string().trim().min(1).max(512).parse(req.query.q);
		const entityType = req.query.entityType === undefined ? undefined : entityTypeSchema.parse(req.query.entityType);
		const result = await searchTaxonomyArtifacts({
			entityType,
			limit: req.query.limit === undefined ? undefined : Number(req.query.limit),
			offset: req.query.offset === undefined ? undefined : Number(req.query.offset),
			query,
		});
		res.json(result);
	} catch (error) {
		if (!sendArtifactError(res, error)) next(error);
	}
});

router.post("/rebuild", async (req, res, next: NextFunction) => {
	try {
		const input = rebuildSchema.parse(req.body ?? {});
		const result = await rebuildTaxonomyArtifactIndex(getAuthorizedRootRegistry(req), input.entityType);
		res.json(result);
	} catch (error) {
		if (!sendArtifactError(res, error)) next(error);
	}
});

router.post("/wildcard", async (req, res, next: NextFunction) => {
	let entityId: string | null = null;
	try {
		const input = createFileBackedWildcardSchema.parse(req.body);
		const entity = await createWildcardEntity(input);
		entityId = entity.id;
		const artifact = await saveTaxonomyArtifact(getAuthorizedRootRegistry(req), {
			...input,
			entityId,
			entityType: "wildcard",
		});
		res.status(201).json({ artifact, entity: await getWildcardEntity(entityId) });
	} catch (error) {
		if (entityId) {
			try {
				await deleteEntity("wildcard", entityId);
			} catch {
				// Recovery tooling can surface any residual inline identity without leaking the original failure.
			}
		}
		if (!sendArtifactError(res, error)) next(error);
	}
});

router.get("/:entityType/:id", async (req, res, next: NextFunction) => {
	try {
		const target = parseTarget(req.params);
		const result = await readAndReconcileTaxonomyArtifact(
			getAuthorizedRootRegistry(req),
			target.entityType,
			target.entityId,
		);
		if (!result) {
			res.status(404).json({ code: "ARTIFACT_NOT_FOUND", message: "Artefacto no encontrado." });
			return;
		}
		res.json(result);
	} catch (error) {
		if (!sendArtifactError(res, error)) next(error);
	}
});

router.put("/:entityType/:id", async (req, res, next: NextFunction) => {
	try {
		const target = parseTarget(req.params);
		const input = saveSchema.parse(req.body);
		const result = await saveTaxonomyArtifact(getAuthorizedRootRegistry(req), { ...input, ...target });
		res.json(result);
	} catch (error) {
		if (!sendArtifactError(res, error)) next(error);
	}
});

router.patch("/:entityType/:id/location", async (req, res, next: NextFunction) => {
	try {
		const target = parseTarget(req.params);
		const input = relocateSchema.parse(req.body);
		const result = await relocateTaxonomyArtifact(getAuthorizedRootRegistry(req), { ...input, ...target });
		res.json(result);
	} catch (error) {
		if (!sendArtifactError(res, error)) next(error);
	}
});

router.delete("/:entityType/:id", async (req, res, next: NextFunction) => {
	try {
		const target = parseTarget(req.params);
		const input = deleteSchema.parse(req.body);
		await deleteTaxonomyArtifactWithEntity(getAuthorizedRootRegistry(req), { ...input, ...target }, () =>
			deleteEntity(target.entityType, target.entityId),
		);
		res.status(204).end();
	} catch (error) {
		if (!sendArtifactError(res, error)) next(error);
	}
});

export default router;
export { router as taxonomyArtifactsRouter };
