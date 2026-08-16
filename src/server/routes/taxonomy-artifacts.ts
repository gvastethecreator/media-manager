import { Effect, Either } from 'effect';
import { type NextFunction, Router, type Response } from 'express';
import { z } from 'zod';
import { errorToHttpStatus } from '@/lib/effect/adapters/express.adapter';
import { runPromiseEither } from '@/lib/effect/runtime/runtime';
import { getAuthorizedRootRegistry, sendRootAuthorizationError } from '@/server/security/authorized-root-request';
import { RootAuthorizationError } from '@/server/security/authorized-roots';
import { preserveJsonResponseTextFields, sanitizeJsonResponses } from '@/server/security/sanitize-public-payload';
import {
	assertTaxonomyEntityRootPermissions,
	assertTaxonomyRootPermissions,
	type TaxonomyRootPermission,
} from '@/server/security/taxonomy-root-authorization';
import { ArtifactConflictError, ArtifactValidationError } from '@/services/taxonomy/file-backed/file-backed.service';
import type { FavoriteWriteTransaction } from '@/services/favorite/favorite-write-transaction';
import { PromptService, PromptServiceLive } from '@/services/prompt/prompt.service.effect';
import {
	NoteService,
	NoteServiceLive,
	WildcardService,
	WildcardServiceLive,
} from '@/services/secondary/secondary-services.effect';
import {
	authorizedTaxonomyRootIds,
	createFileBackedWildcardArtifact,
	deleteTaxonomyArtifactWithEntity,
	readAndReconcileTaxonomyArtifact,
	rebuildTaxonomyArtifactIndex,
	relocateTaxonomyArtifact,
	saveTaxonomyArtifactWithEntity,
	searchTaxonomyArtifacts,
	TaxonomyArtifactServiceError,
} from '@/services/taxonomy/file-backed/taxonomy-artifact.service';

const router = Router();
router.use(sanitizeJsonResponses);
router.use(
	preserveJsonResponseTextFields(
		'body',
		'category',
		'children',
		'color',
		'content',
		'description',
		'emoji',
		'indexedBody',
		'indexedSummary',
		'indexedTitle',
		'metadata',
		'name',
		'parameters',
		'purpose',
		'summary',
		'title'
	)
);

const entityTypeSchema = z.enum(['prompt', 'note', 'wildcard']);
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
		canonicalKey: z.enum(['subject', 'context', 'tone', 'style', 'constraints']).optional(),
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
		type: z.enum(['text', 'number', 'boolean', 'date', 'enum_token']),
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
		restoreMissing: z.boolean().optional(),
	})
	.strict();
const relocateSchema = z.object({ expectedHash: hashSchema, fileName: z.string().min(4).max(131) }).strict();
const deleteSchema = z.object({ deleteMissing: z.boolean().optional(), expectedHash: hashSchema }).strict();
const rebuildSchema = z.object({ entityType: entityTypeSchema.optional() }).strict();
const createFileBackedWildcardSchema = z
	.object({
		body: z.string().max(2 * 1024 * 1024),
		metadata: metadataSchema,
		operational: operationalSchema.optional(),
		rootId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/),
	})
	.strict();
const ARTIFACT_READ_PERMISSIONS = ['read', 'index'] as const satisfies readonly TaxonomyRootPermission[];
const ARTIFACT_WRITE_PERMISSIONS = ['read', 'index', 'write'] as const satisfies readonly TaxonomyRootPermission[];
const ARTIFACT_DELETE_PERMISSIONS = [
	'read',
	'index',
	'write',
	'delete',
] as const satisfies readonly TaxonomyRootPermission[];

function sendArtifactError(response: Response, error: unknown): boolean {
	if (sendRootAuthorizationError(response, error)) return true;
	if (error instanceof z.ZodError || error instanceof ArtifactValidationError) {
		response.status(400).json({ code: 'ARTIFACT_VALIDATION', message: 'El contrato del artefacto no es válido.' });
		return true;
	}
	if (error instanceof ArtifactConflictError) {
		response.status(409).json({ code: 'ARTIFACT_CONFLICT', message: error.message, retryable: false });
		return true;
	}
	if (error instanceof TaxonomyArtifactServiceError) {
		response.status(error.status).json({ code: error.code, message: error.message, retryable: false });
		return true;
	}
	return false;
}

function parseTarget(params: Record<string, string>): { entityId: string; entityType: 'note' | 'prompt' | 'wildcard' } {
	return {
		entityId: entityIdSchema.parse(params.id),
		entityType: entityTypeSchema.parse(params.entityType),
	};
}

function authorizeArtifactTarget(permissions: readonly TaxonomyRootPermission[], authorizeBodyRoot = false) {
	return async (
		req: {
			app: { locals: Record<string, unknown> };
			body?: Record<string, unknown>;
			params: Record<string, string>;
		},
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const target = parseTarget(req.params);
			const registry = getAuthorizedRootRegistry(req);
			await assertTaxonomyEntityRootPermissions(registry, target.entityType, target.entityId, permissions);
			if (authorizeBodyRoot && typeof req.body?.rootId === 'string') {
				assertTaxonomyRootPermissions(registry, req.body.rootId, permissions);
			}
			next();
		} catch (error) {
			if (error instanceof RootAuthorizationError && error.status === 404) {
				res.status(404).json({ code: 'ARTIFACT_NOT_FOUND', message: 'Artefacto no encontrado.' });
				return;
			}
			if (!sendArtifactError(res, error)) next(error);
		}
	};
}

function authorizeArtifactRootBody(permissions: readonly TaxonomyRootPermission[]) {
	return (
		req: { app: { locals: Record<string, unknown> }; body?: Record<string, unknown> },
		res: Response,
		next: NextFunction
	): void => {
		try {
			if (typeof req.body?.rootId === 'string') {
				assertTaxonomyRootPermissions(getAuthorizedRootRegistry(req), req.body.rootId, permissions);
			}
			next();
		} catch (error) {
			if (!sendArtifactError(res, error)) next(error);
		}
	};
}

async function deleteEntity(
	entityType: 'note' | 'prompt' | 'wildcard',
	entityId: string,
	beforeDelete?: (transaction: FavoriteWriteTransaction) => Promise<void>
): Promise<void> {
	const execute = async <E>(effect: Effect.Effect<void, E, never>): Promise<void> => {
		const outcome = await runPromiseEither(effect);
		if (Either.isRight(outcome)) return;

		const mapped = errorToHttpStatus(outcome.left);
		throw new TaxonomyArtifactServiceError(
			mapped.code ?? 'ARTIFACT_ENTITY_DELETE_FAILED',
			mapped.message,
			mapped.status
		);
	};

	switch (entityType) {
		case 'prompt':
			await execute(
				Effect.gen(function* () {
					const service = yield* PromptService;
					yield* service.deleteFileBacked(entityId, beforeDelete);
				}).pipe(Effect.provide(PromptServiceLive))
			);
			break;
		case 'note':
			await execute(
				Effect.gen(function* () {
					const service = yield* NoteService;
					yield* service.deleteFileBacked(entityId, beforeDelete);
				}).pipe(Effect.provide(NoteServiceLive))
			);
			break;
		case 'wildcard':
			await execute(
				Effect.gen(function* () {
					const service = yield* WildcardService;
					yield* service.deleteFileBacked(entityId, beforeDelete);
				}).pipe(Effect.provide(WildcardServiceLive))
			);
			break;
	}
}

router.get('/search', async (req, res, next: NextFunction) => {
	try {
		const query = z.string().trim().min(1).max(512).parse(req.query.q);
		const entityType = req.query.entityType === undefined ? undefined : entityTypeSchema.parse(req.query.entityType);
		const result = await searchTaxonomyArtifacts({
			authorizedRootIds: authorizedTaxonomyRootIds(getAuthorizedRootRegistry(req)),
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

router.post('/rebuild', async (req, res, next: NextFunction) => {
	try {
		const input = rebuildSchema.parse(req.body ?? {});
		const result = await rebuildTaxonomyArtifactIndex(getAuthorizedRootRegistry(req), input.entityType);
		res.json(result);
	} catch (error) {
		if (!sendArtifactError(res, error)) next(error);
	}
});

router.post(
	'/wildcard',
	authorizeArtifactRootBody(ARTIFACT_WRITE_PERMISSIONS),
	async (req, res, next: NextFunction) => {
		try {
			const input = createFileBackedWildcardSchema.parse(req.body);
			const result = await createFileBackedWildcardArtifact(getAuthorizedRootRegistry(req), input);
			res.status(201).json(result);
		} catch (error) {
			if (!sendArtifactError(res, error)) next(error);
		}
	}
);

router.get(
	'/:entityType/:id',
	authorizeArtifactTarget(ARTIFACT_READ_PERMISSIONS),
	async (req, res, next: NextFunction) => {
		try {
			const target = parseTarget(req.params);
			const result = await readAndReconcileTaxonomyArtifact(
				getAuthorizedRootRegistry(req),
				target.entityType,
				target.entityId
			);
			if (!result) {
				res.status(404).json({ code: 'ARTIFACT_NOT_FOUND', message: 'Artefacto no encontrado.' });
				return;
			}
			res.json(result);
		} catch (error) {
			if (!sendArtifactError(res, error)) next(error);
		}
	}
);

router.put(
	'/:entityType/:id',
	authorizeArtifactTarget(ARTIFACT_WRITE_PERMISSIONS, true),
	async (req, res, next: NextFunction) => {
		try {
			const target = parseTarget(req.params);
			const input = saveSchema.parse(req.body);
			const result = await saveTaxonomyArtifactWithEntity(getAuthorizedRootRegistry(req), { ...input, ...target });
			res.json(result);
		} catch (error) {
			if (!sendArtifactError(res, error)) next(error);
		}
	}
);

router.patch(
	'/:entityType/:id/location',
	authorizeArtifactTarget(ARTIFACT_WRITE_PERMISSIONS),
	async (req, res, next: NextFunction) => {
		try {
			const target = parseTarget(req.params);
			const input = relocateSchema.parse(req.body);
			const result = await relocateTaxonomyArtifact(getAuthorizedRootRegistry(req), { ...input, ...target });
			res.json(result);
		} catch (error) {
			if (!sendArtifactError(res, error)) next(error);
		}
	}
);

router.delete(
	'/:entityType/:id',
	authorizeArtifactTarget(ARTIFACT_DELETE_PERMISSIONS),
	async (req, res, next: NextFunction) => {
		try {
			const target = parseTarget(req.params);
			const input = deleteSchema.parse(req.body);
			await deleteTaxonomyArtifactWithEntity(getAuthorizedRootRegistry(req), { ...input, ...target }, (beforeDelete) =>
				deleteEntity(target.entityType, target.entityId, beforeDelete)
			);
			res.status(204).end();
		} catch (error) {
			if (!sendArtifactError(res, error)) next(error);
		}
	}
);

export default router;
export { router as taxonomyArtifactsRouter };
