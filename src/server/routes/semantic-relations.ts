import { type NextFunction, Router, type Response } from 'express';
import { z } from 'zod';
import { SEMANTIC_RELATION_ENTITY_TYPES } from '@/lib/drizzle/schema/relations/semantic';
import {
	getAuthorizedRootRegistry,
	resolveAuthorizedFolderById,
	sendRootAuthorizationError,
} from '@/server/security/authorized-root-request';
import { resolveMediaAssetReference } from '@/server/security/media-asset-reference';
import {
	type AuthorizedRootRegistry,
	RootAuthorizationError,
	type RootPermission,
} from '@/server/security/authorized-roots';
import { sanitizeJsonResponses } from '@/server/security/sanitize-public-payload';
import { assertTaxonomyEntityRootPermissions } from '@/server/security/taxonomy-root-authorization';
import {
	createSemanticRelation,
	deleteSemanticRelation,
	getActiveAssetType,
	getSemanticRelation,
	listRelationRoles,
	listSemanticRelations,
	type SemanticRelationEndpoint,
	type SemanticRelationEntityType,
	SemanticRelationError,
	updateSemanticRelation,
} from '@/services/relation/semantic-relation.service';

const router = Router();
router.use(sanitizeJsonResponses);

const entityTypeSchema = z.enum(SEMANTIC_RELATION_ENTITY_TYPES);
const endpointSchema = z
	.object({
		id: z
			.string()
			.min(1)
			.max(192)
			.refine((value) => !value.includes('\0')),
		type: entityTypeSchema,
	})
	.strict();
const relationSchema = z
	.object({
		roleSlug: z
			.string()
			.regex(/^[a-z][a-z0-9_]{0,63}$/)
			.nullable()
			.optional(),
		source: endpointSchema,
		target: endpointSchema,
	})
	.strict();
const idSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/);
const RELATION_INITIAL_READ_PERMISSIONS = ['read'] as const satisfies readonly RootPermission[];
const RELATION_READ_PERMISSIONS = ['read', 'index'] as const satisfies readonly RootPermission[];
const RELATION_WRITE_PERMISSIONS = ['read', 'index', 'write'] as const satisfies readonly RootPermission[];
const RELATION_DELETE_PERMISSIONS = ['read', 'index', 'write', 'delete'] as const satisfies readonly RootPermission[];

function sendRelationError(response: Response, error: unknown): boolean {
	if (sendRootAuthorizationError(response, error)) return true;
	if (error instanceof z.ZodError) {
		response.status(400).json({ code: 'RELATION_VALIDATION', message: 'Contrato de relación no válido.' });
		return true;
	}
	if (error instanceof SemanticRelationError) {
		response.status(error.status).json({ code: error.code, message: error.message, retryable: false });
		return true;
	}
	return false;
}

async function assertAuthorizedEndpoint(
	registry: AuthorizedRootRegistry,
	endpoint: SemanticRelationEndpoint,
	permissions: readonly Exclude<RootPermission, 'export'>[] = RELATION_READ_PERMISSIONS
): Promise<void> {
	if (endpoint.type === 'asset') {
		const assetType = await getActiveAssetType(endpoint.id);
		if (!assetType) throw new SemanticRelationError('RELATION_ENDPOINT_NOT_FOUND', 'Asset no encontrado.', 404);
		for (const permission of permissions) {
			await resolveMediaAssetReference(
				registry,
				{
					assetId: endpoint.id,
					assetType: assetType as 'audio' | 'document' | 'file3d' | 'image' | 'json' | 'video',
				},
				permission
			);
		}
		return;
	}
	if (endpoint.type === 'folder') {
		const request = { app: { locals: { authorizedRootRegistry: registry } } };
		let hasReadAccess = false;
		for (const permission of permissions) {
			try {
				await resolveAuthorizedFolderById(request, endpoint.id, permission);
				if (permission === 'read') hasReadAccess = true;
			} catch (error) {
				if (hasReadAccess && error instanceof RootAuthorizationError && error.code === 'ROOT_PATH_OUTSIDE') {
					throw new RootAuthorizationError('ROOT_PERMISSION_DENIED', 'El media root no concede esta operación.', 403);
				}
				throw error;
			}
		}
		return;
	}
	if (['prompt', 'note', 'wildcard'].includes(endpoint.type)) {
		try {
			await assertTaxonomyEntityRootPermissions(
				registry,
				endpoint.type as 'note' | 'prompt' | 'wildcard',
				endpoint.id,
				permissions
			);
		} catch (error) {
			if (error instanceof RootAuthorizationError && error.status === 404) {
				throw new SemanticRelationError('RELATION_ENDPOINT_NOT_FOUND', 'Entidad relacionada no encontrada.', 404);
			}
			throw error;
		}
	}
}

async function assertAuthorizedRelation(
	registry: AuthorizedRootRegistry,
	relation: { source: SemanticRelationEndpoint; target: SemanticRelationEndpoint },
	permissions: readonly Exclude<RootPermission, 'export'>[] = RELATION_READ_PERMISSIONS
): Promise<void> {
	await Promise.all([
		assertAuthorizedEndpoint(registry, relation.source, permissions),
		assertAuthorizedEndpoint(registry, relation.target, permissions),
	]);
}

async function assertAuthorizedStoredRelation(
	registry: AuthorizedRootRegistry,
	relation: { source: SemanticRelationEndpoint; target: SemanticRelationEndpoint },
	permissions: readonly Exclude<RootPermission, 'export'>[] = RELATION_READ_PERMISSIONS
): Promise<void> {
	try {
		await assertAuthorizedRelation(registry, relation, RELATION_INITIAL_READ_PERMISSIONS);
	} catch (error) {
		if (
			(error instanceof SemanticRelationError && error.code === 'RELATION_ENDPOINT_NOT_FOUND') ||
			error instanceof RootAuthorizationError
		) {
			throw new SemanticRelationError('RELATION_NOT_FOUND', 'Relación semántica no encontrada.', 404);
		}
		throw error;
	}
	if (permissions.length === 1 && permissions[0] === 'read') return;
	await assertAuthorizedRelation(registry, relation, permissions);
}

router.get('/roles', async (_req, res, next: NextFunction) => {
	try {
		res.json({ data: await listRelationRoles() });
	} catch (error) {
		next(error);
	}
});

router.get('/', async (req, res, next: NextFunction) => {
	try {
		const endpoint: SemanticRelationEndpoint = {
			id: endpointSchema.shape.id.parse(req.query.entityId),
			type: entityTypeSchema.parse(req.query.entityType),
		};
		const registry = getAuthorizedRootRegistry(req);
		await assertAuthorizedEndpoint(registry, endpoint);
		const result = await listSemanticRelations(endpoint, {
			authorize: async (relation) => {
				try {
					await assertAuthorizedRelation(registry, relation);
					return true;
				} catch (error) {
					if (error instanceof RootAuthorizationError) return false;
					if (error instanceof SemanticRelationError && error.code === 'RELATION_ENDPOINT_NOT_FOUND') return false;
					throw error;
				}
			},
			limit: req.query.limit === undefined ? undefined : Number(req.query.limit),
			offset: req.query.offset === undefined ? undefined : Number(req.query.offset),
		});
		res.json(result);
	} catch (error) {
		if (!sendRelationError(res, error)) next(error);
	}
});

router.post('/', async (req, res, next: NextFunction) => {
	try {
		const input = relationSchema.parse(req.body);
		await assertAuthorizedRelation(getAuthorizedRootRegistry(req), input, RELATION_WRITE_PERMISSIONS);
		res.status(201).json(await createSemanticRelation(input));
	} catch (error) {
		if (!sendRelationError(res, error)) next(error);
	}
});

router.get('/:id', async (req, res, next: NextFunction) => {
	try {
		const relation = await getSemanticRelation(idSchema.parse(req.params.id));
		await assertAuthorizedStoredRelation(getAuthorizedRootRegistry(req), relation);
		res.json(relation);
	} catch (error) {
		if (!sendRelationError(res, error)) next(error);
	}
});

router.put('/:id', async (req, res, next: NextFunction) => {
	try {
		const id = idSchema.parse(req.params.id);
		const existing = await getSemanticRelation(id);
		const input = relationSchema.parse(req.body);
		const registry = getAuthorizedRootRegistry(req);
		await assertAuthorizedStoredRelation(registry, existing, RELATION_WRITE_PERMISSIONS);
		await assertAuthorizedRelation(registry, input, RELATION_WRITE_PERMISSIONS);
		res.json(await updateSemanticRelation(id, input));
	} catch (error) {
		if (!sendRelationError(res, error)) next(error);
	}
});

router.delete('/:id', async (req, res, next: NextFunction) => {
	try {
		const id = idSchema.parse(req.params.id);
		const relation = await getSemanticRelation(id);
		await assertAuthorizedStoredRelation(getAuthorizedRootRegistry(req), relation, RELATION_DELETE_PERMISSIONS);
		await deleteSemanticRelation(id);
		res.status(204).end();
	} catch (error) {
		if (!sendRelationError(res, error)) next(error);
	}
});

export default router;
export { router as semanticRelationsRouter };
