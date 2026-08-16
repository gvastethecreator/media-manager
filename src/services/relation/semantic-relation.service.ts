import { and, eq, ne, or, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { albums } from '@/lib/drizzle/schema/organization/albums';
import { collections } from '@/lib/drizzle/schema/organization/collections';
import { folders } from '@/lib/drizzle/schema/organization/folders';
import { groups } from '@/lib/drizzle/schema/organization/groups';
import {
	relationRoleApplicability,
	relationRoleConflicts,
	relationRoles,
	SEMANTIC_RELATION_ENTITY_TYPES,
	semanticRelations,
} from '@/lib/drizzle/schema/relations/semantic';
import { assets } from '@/lib/drizzle/schema/media-core/assets';
import { notes } from '@/lib/drizzle/schema/taxonomy/notes';
import { prompts } from '@/lib/drizzle/schema/taxonomy/prompts';
import { wildcards } from '@/lib/drizzle/schema/taxonomy/wildcards';
import { characters } from '@/lib/drizzle/schema/worldbuilding/characters';
import { concepts } from '@/lib/drizzle/schema/worldbuilding/concepts';
import { places } from '@/lib/drizzle/schema/worldbuilding/places';
import { worldItems } from '@/lib/drizzle/schema/worldbuilding/worldItems';

export type SemanticRelationEntityType = (typeof SEMANTIC_RELATION_ENTITY_TYPES)[number];
export type SemanticRelationFamily = 'asset' | 'organizer' | 'narrative_entity' | 'prompt' | 'note' | 'wildcard';

export interface SemanticRelationEndpoint {
	id: string;
	type: SemanticRelationEntityType;
}

export interface SemanticRelationInput {
	roleSlug?: string | null;
	source: SemanticRelationEndpoint;
	target: SemanticRelationEndpoint;
}

export interface SemanticRelationView {
	createdAt: Date;
	direction: 'forward' | 'inverse';
	id: string;
	label: string | null;
	other: SemanticRelationEndpoint;
	role: null | {
		forwardLabel: string;
		inverseLabel: string;
		isSymmetric: boolean;
		slug: string;
	};
	source: SemanticRelationEndpoint;
	target: SemanticRelationEndpoint;
	updatedAt: Date;
}

type SemanticRelationRow = typeof semanticRelations.$inferSelect;
type RelationRoleRow = typeof relationRoles.$inferSelect;

export class SemanticRelationError extends Error {
	readonly code:
		| 'RELATION_CONFLICT'
		| 'RELATION_CYCLE'
		| 'RELATION_ENDPOINT_NOT_FOUND'
		| 'RELATION_NOT_FOUND'
		| 'RELATION_ROLE_INVALID'
		| 'RELATION_VALIDATION';
	readonly status: number;

	constructor(code: SemanticRelationError['code'], message: string, status: number) {
		super(message);
		this.name = 'SemanticRelationError';
		this.code = code;
		this.status = status;
	}
}

export function semanticRelationFamily(type: SemanticRelationEntityType): SemanticRelationFamily {
	switch (type) {
		case 'asset':
			return 'asset';
		case 'folder':
		case 'album':
		case 'collection':
		case 'group':
			return 'organizer';
		case 'character':
		case 'place':
		case 'concept':
		case 'world_item':
			return 'narrative_entity';
		case 'prompt':
		case 'note':
		case 'wildcard':
			return type;
	}
}

function compareEndpoint(left: SemanticRelationEndpoint, right: SemanticRelationEndpoint): number {
	return compareSqliteBinary(left.type, right.type) || compareSqliteBinary(left.id, right.id);
}

const sqliteBinaryEncoder = new TextEncoder();

/**
 * SQLite's default BINARY collation compares the UTF-8 bytes stored in the database. Keeping the
 * application-side canonicalizer byte-for-byte equivalent prevents a symmetric relation from being
 * accepted by the service and rejected by the storage trigger on hosts with a different locale.
 */
function compareSqliteBinary(left: string, right: string): number {
	const leftBytes = sqliteBinaryEncoder.encode(left);
	const rightBytes = sqliteBinaryEncoder.encode(right);
	const sharedLength = Math.min(leftBytes.length, rightBytes.length);
	for (let index = 0; index < sharedLength; index += 1) {
		if (leftBytes[index] !== rightBytes[index]) return leftBytes[index] - rightBytes[index];
	}
	return leftBytes.length - rightBytes.length;
}

function validateEndpoint(endpoint: SemanticRelationEndpoint): void {
	if (
		!SEMANTIC_RELATION_ENTITY_TYPES.includes(endpoint.type) ||
		!endpoint.id ||
		endpoint.id.length > 192 ||
		endpoint.id.includes('\0')
	) {
		throw new SemanticRelationError('RELATION_VALIDATION', 'El extremo de la relación no es válido.', 400);
	}
}

async function endpointExists(endpoint: SemanticRelationEndpoint): Promise<boolean> {
	switch (endpoint.type) {
		case 'asset':
			return Boolean(
				(
					await db
						.select({ id: assets.id })
						.from(assets)
						.where(and(eq(assets.id, endpoint.id), ne(assets.status, 'deleted')))
						.limit(1)
				)[0]
			);
		case 'folder':
			return Boolean(
				(await db.select({ id: folders.id }).from(folders).where(eq(folders.id, endpoint.id)).limit(1))[0]
			);
		case 'album':
			return Boolean((await db.select({ id: albums.id }).from(albums).where(eq(albums.id, endpoint.id)).limit(1))[0]);
		case 'collection':
			return Boolean(
				(await db.select({ id: collections.id }).from(collections).where(eq(collections.id, endpoint.id)).limit(1))[0]
			);
		case 'group':
			return Boolean((await db.select({ id: groups.id }).from(groups).where(eq(groups.id, endpoint.id)).limit(1))[0]);
		case 'character':
			return Boolean(
				(await db.select({ id: characters.id }).from(characters).where(eq(characters.id, endpoint.id)).limit(1))[0]
			);
		case 'place':
			return Boolean((await db.select({ id: places.id }).from(places).where(eq(places.id, endpoint.id)).limit(1))[0]);
		case 'concept':
			return Boolean(
				(await db.select({ id: concepts.id }).from(concepts).where(eq(concepts.id, endpoint.id)).limit(1))[0]
			);
		case 'world_item':
			return Boolean(
				(await db.select({ id: worldItems.id }).from(worldItems).where(eq(worldItems.id, endpoint.id)).limit(1))[0]
			);
		case 'prompt':
			return Boolean(
				(await db.select({ id: prompts.id }).from(prompts).where(eq(prompts.id, endpoint.id)).limit(1))[0]
			);
		case 'note':
			return Boolean((await db.select({ id: notes.id }).from(notes).where(eq(notes.id, endpoint.id)).limit(1))[0]);
		case 'wildcard':
			return Boolean(
				(await db.select({ id: wildcards.id }).from(wildcards).where(eq(wildcards.id, endpoint.id)).limit(1))[0]
			);
	}
}

async function assertEndpointsExist(source: SemanticRelationEndpoint, target: SemanticRelationEndpoint): Promise<void> {
	const [sourceExists, targetExists] = await Promise.all([endpointExists(source), endpointExists(target)]);
	if (!(sourceExists && targetExists)) {
		throw new SemanticRelationError(
			'RELATION_ENDPOINT_NOT_FOUND',
			'Ambos extremos deben existir y estar activos para guardar la relación.',
			404
		);
	}
}

async function resolveRole(slug: string | null | undefined): Promise<RelationRoleRow | null> {
	if (slug == null) return null;
	if (!/^[a-z][a-z0-9_]{0,63}$/.test(slug)) {
		throw new SemanticRelationError('RELATION_ROLE_INVALID', 'Relation Role no válido.', 400);
	}
	let [role] = await db.select().from(relationRoles).where(eq(relationRoles.slug, slug)).limit(1);
	if (!role) throw new SemanticRelationError('RELATION_ROLE_INVALID', 'Relation Role desconocido.', 400);
	if (role.deprecatedAt) {
		if (!role.replacementSlug) {
			throw new SemanticRelationError('RELATION_ROLE_INVALID', 'Relation Role deprecado sin reemplazo vigente.', 409);
		}
		[role] = await db.select().from(relationRoles).where(eq(relationRoles.slug, role.replacementSlug)).limit(1);
		if (!role || role.deprecatedAt) {
			throw new SemanticRelationError('RELATION_ROLE_INVALID', 'El reemplazo del Relation Role no está vigente.', 409);
		}
	}
	return role;
}

async function assertRoleApplicability(
	role: RelationRoleRow | null,
	source: SemanticRelationEndpoint,
	target: SemanticRelationEndpoint
): Promise<void> {
	if (!role) return;
	const [applicable] = await db
		.select({ roleSlug: relationRoleApplicability.roleSlug })
		.from(relationRoleApplicability)
		.where(
			and(
				eq(relationRoleApplicability.roleSlug, role.slug),
				eq(relationRoleApplicability.sourceFamily, semanticRelationFamily(source.type)),
				eq(relationRoleApplicability.targetFamily, semanticRelationFamily(target.type))
			)
		)
		.limit(1);
	if (!applicable) {
		throw new SemanticRelationError('RELATION_ROLE_INVALID', 'Relation Role fuera de su perímetro aplicable.', 400);
	}
	if (role.slug === 'variant_of') {
		if (source.type !== target.type) {
			throw new SemanticRelationError(
				'RELATION_ROLE_INVALID',
				'variant_of exige extremos del mismo tipo concreto.',
				400
			);
		}
		if (source.type === 'asset') {
			const [sourceAsset, targetAsset] = await Promise.all([
				db.select({ assetType: assets.assetType }).from(assets).where(eq(assets.id, source.id)).limit(1),
				db.select({ assetType: assets.assetType }).from(assets).where(eq(assets.id, target.id)).limit(1),
			]);
			if (sourceAsset[0]?.assetType !== targetAsset[0]?.assetType) {
				throw new SemanticRelationError(
					'RELATION_ROLE_INVALID',
					'variant_of exige Assets del mismo tipo concreto.',
					400
				);
			}
		}
	}
}

function normalizeEndpoints(
	role: RelationRoleRow | null,
	source: SemanticRelationEndpoint,
	target: SemanticRelationEndpoint
): { source: SemanticRelationEndpoint; target: SemanticRelationEndpoint } {
	if (source.type === target.type && source.id === target.id && !role?.allowSelf) {
		throw new SemanticRelationError('RELATION_VALIDATION', 'Los self-links no están permitidos por este role.', 400);
	}
	if (role?.isSymmetric && compareEndpoint(source, target) > 0) return { source: target, target: source };
	return { source, target };
}

function samePairPredicate(source: SemanticRelationEndpoint, target: SemanticRelationEndpoint) {
	return or(
		and(
			eq(semanticRelations.sourceType, source.type),
			eq(semanticRelations.sourceId, source.id),
			eq(semanticRelations.targetType, target.type),
			eq(semanticRelations.targetId, target.id)
		),
		and(
			eq(semanticRelations.sourceType, target.type),
			eq(semanticRelations.sourceId, target.id),
			eq(semanticRelations.targetType, source.type),
			eq(semanticRelations.targetId, source.id)
		)
	);
}

function hasSameDirection(
	row: Pick<SemanticRelationRow, 'sourceId' | 'sourceType' | 'targetId' | 'targetType'>,
	source: SemanticRelationEndpoint,
	target: SemanticRelationEndpoint
): boolean {
	return (
		row.sourceType === source.type &&
		row.sourceId === source.id &&
		row.targetType === target.type &&
		row.targetId === target.id
	);
}

async function assertPairSemantics(
	role: RelationRoleRow | null,
	source: SemanticRelationEndpoint,
	target: SemanticRelationEndpoint,
	excludeId?: string
): Promise<void> {
	const rows = await db
		.select({
			id: semanticRelations.id,
			roleSlug: semanticRelations.roleSlug,
			sourceId: semanticRelations.sourceId,
			sourceType: semanticRelations.sourceType,
			targetId: semanticRelations.targetId,
			targetType: semanticRelations.targetType,
		})
		.from(semanticRelations)
		.where(samePairPredicate(source, target));
	const existing = rows.filter((row: { id: string }) => row.id !== excludeId);
	if (
		role &&
		existing.some((row: SemanticRelationRow) => row.roleSlug === null && hasSameDirection(row, source, target))
	) {
		throw new SemanticRelationError('RELATION_CONFLICT', 'Una relación desnuda ya ocupa este par.', 409);
	}
	if (!role && existing.some((row: SemanticRelationRow) => hasSameDirection(row, source, target))) {
		throw new SemanticRelationError('RELATION_CONFLICT', 'Una relación desnuda no puede duplicar un par roleado.', 409);
	}
	if (!role) return;
	if (
		existing.some(
			(row: { roleSlug: string | null; sourceId: string; sourceType: string; targetId: string; targetType: string }) =>
				row.roleSlug === role.slug &&
				row.sourceType === source.type &&
				row.sourceId === source.id &&
				row.targetType === target.type &&
				row.targetId === target.id
		)
	) {
		throw new SemanticRelationError('RELATION_CONFLICT', 'The relation semántica ya existe.', 409);
	}
	const conflicts = await db.select().from(relationRoleConflicts);
	const incompatible = new Set(
		conflicts
			.filter((conflict: typeof relationRoleConflicts.$inferSelect) =>
				[conflict.leftRoleSlug, conflict.rightRoleSlug].includes(role.slug)
			)
			.flatMap((conflict: typeof relationRoleConflicts.$inferSelect) => [conflict.leftRoleSlug, conflict.rightRoleSlug])
	);
	if (existing.some((row: { roleSlug: string | null }) => row.roleSlug && incompatible.has(row.roleSlug))) {
		throw new SemanticRelationError('RELATION_CONFLICT', 'Los roles no pueden coexistir sobre el mismo par.', 409);
	}
}

async function assertDerivedAcyclic(
	role: RelationRoleRow | null,
	source: SemanticRelationEndpoint,
	target: SemanticRelationEndpoint,
	excludeId?: string
): Promise<void> {
	if (role?.slug !== 'derived_from') return;
	const cycle = (await db.all(sql`
		WITH RECURSIVE ancestry(entityType, entityId) AS (
			SELECT ${target.type}, ${target.id}
			UNION
			SELECT relation.targetType, relation.targetId
			FROM SemanticRelation relation
			JOIN ancestry ON relation.sourceType = ancestry.entityType AND relation.sourceId = ancestry.entityId
			WHERE relation.roleSlug = 'derived_from' ${excludeId ? sql`AND relation.id <> ${excludeId}` : sql``}
		)
		SELECT 1 AS found FROM ancestry WHERE entityType = ${source.type} AND entityId = ${source.id} LIMIT 1
	`)) as Array<{ found: number }>;
	if (cycle.length > 0) {
		throw new SemanticRelationError('RELATION_CYCLE', 'derived_from debe permanecer acíclico.', 409);
	}
}

async function canonicalInput(input: SemanticRelationInput, excludeId?: string) {
	validateEndpoint(input.source);
	validateEndpoint(input.target);
	const role = await resolveRole(input.roleSlug);
	const endpoints = normalizeEndpoints(role, input.source, input.target);
	await assertEndpointsExist(endpoints.source, endpoints.target);
	await assertRoleApplicability(role, endpoints.source, endpoints.target);
	await assertPairSemantics(role, endpoints.source, endpoints.target, excludeId);
	await assertDerivedAcyclic(role, endpoints.source, endpoints.target, excludeId);
	return { ...endpoints, role };
}

function toView(
	row: SemanticRelationRow,
	role: RelationRoleRow | null,
	endpoint: SemanticRelationEndpoint
): SemanticRelationView {
	const forward = row.sourceType === endpoint.type && row.sourceId === endpoint.id;
	return {
		createdAt: row.createdAt,
		direction: forward ? 'forward' : 'inverse',
		id: row.id,
		label: role ? (forward ? role.forwardLabel : role.inverseLabel) : null,
		other: forward
			? { id: row.targetId, type: row.targetType as SemanticRelationEntityType }
			: { id: row.sourceId, type: row.sourceType as SemanticRelationEntityType },
		role: role
			? {
					forwardLabel: role.forwardLabel,
					inverseLabel: role.inverseLabel,
					isSymmetric: role.isSymmetric,
					slug: role.slug,
				}
			: null,
		source: { id: row.sourceId, type: row.sourceType as SemanticRelationEntityType },
		target: { id: row.targetId, type: row.targetType as SemanticRelationEntityType },
		updatedAt: row.updatedAt,
	};
}

async function roleMap(): Promise<Map<string, RelationRoleRow>> {
	return new Map((await db.select().from(relationRoles)).map((role: RelationRoleRow) => [role.slug, role]));
}

export async function createSemanticRelation(input: SemanticRelationInput): Promise<SemanticRelationView> {
	const canonical = await canonicalInput(input);
	const id = `rel-${crypto.randomUUID()}`;
	let row: SemanticRelationRow;
	try {
		[row] = await db
			.insert(semanticRelations)
			.values({
				id,
				roleKey: canonical.role?.slug ?? '',
				roleSlug: canonical.role?.slug ?? null,
				sourceId: canonical.source.id,
				sourceType: canonical.source.type,
				targetId: canonical.target.id,
				targetType: canonical.target.type,
			})
			.returning();
	} catch (error) {
		if (String((error as { code?: unknown }).code ?? error).includes('CONSTRAINT')) {
			throw new SemanticRelationError('RELATION_CONFLICT', 'The relation viola una invariante canónica.', 409);
		}
		throw error;
	}
	if (!row) {
		throw new Error('SemanticRelation insertó sin devolver la fila creada.');
	}
	return toView(row, canonical.role, canonical.source);
}

export async function updateSemanticRelation(id: string, input: SemanticRelationInput): Promise<SemanticRelationView> {
	const existing = await getSemanticRelationRow(id);
	const canonical = await canonicalInput(input, id);
	let row: SemanticRelationRow;
	try {
		[row] = await db
			.update(semanticRelations)
			.set({
				roleKey: canonical.role?.slug ?? '',
				roleSlug: canonical.role?.slug ?? null,
				sourceId: canonical.source.id,
				sourceType: canonical.source.type,
				targetId: canonical.target.id,
				targetType: canonical.target.type,
				updatedAt: new Date(),
			})
			.where(eq(semanticRelations.id, existing.id))
			.returning();
	} catch (error) {
		if (String((error as { code?: unknown }).code ?? error).includes('CONSTRAINT')) {
			throw new SemanticRelationError('RELATION_CONFLICT', 'The relation viola una invariante canónica.', 409);
		}
		throw error;
	}
	if (!row) {
		throw new SemanticRelationError('RELATION_NOT_FOUND', 'The relation cambió durante la actualización.', 404);
	}
	return toView(row, canonical.role, canonical.source);
}

async function getSemanticRelationRow(id: string): Promise<SemanticRelationRow> {
	const [row] = await db.select().from(semanticRelations).where(eq(semanticRelations.id, id)).limit(1);
	if (!row) throw new SemanticRelationError('RELATION_NOT_FOUND', 'Relación semántica no encontrada.', 404);
	return row;
}

export async function getSemanticRelation(id: string): Promise<SemanticRelationView> {
	const row = await getSemanticRelationRow(id);
	const roles = await roleMap();
	return toView(row, row.roleSlug ? (roles.get(row.roleSlug) ?? null) : null, {
		id: row.sourceId,
		type: row.sourceType as SemanticRelationEntityType,
	});
}

export async function listSemanticRelations(
	endpoint: SemanticRelationEndpoint,
	options: {
		authorize?: (relation: SemanticRelationView) => Promise<boolean>;
		limit?: number;
		offset?: number;
	} = {}
): Promise<{ data: SemanticRelationView[]; limit: number; offset: number; total: number }> {
	validateEndpoint(endpoint);
	if (!(await endpointExists(endpoint))) {
		throw new SemanticRelationError(
			'RELATION_ENDPOINT_NOT_FOUND',
			'El extremo consultado no existe o no está activo.',
			404
		);
	}
	const limit = Math.min(Math.max(Number.isSafeInteger(options.limit) ? (options.limit ?? 50) : 50, 1), 200);
	const offset = Math.min(Math.max(Number.isSafeInteger(options.offset) ? (options.offset ?? 0) : 0, 0), 1_000_000);
	const rows = await db
		.select()
		.from(semanticRelations)
		.where(
			or(
				and(eq(semanticRelations.sourceType, endpoint.type), eq(semanticRelations.sourceId, endpoint.id)),
				and(eq(semanticRelations.targetType, endpoint.type), eq(semanticRelations.targetId, endpoint.id))
			)
		)
		.orderBy(semanticRelations.createdAt, semanticRelations.id);
	const roles = await roleMap();
	const authorizedRows: SemanticRelationView[] = [];
	for (const row of rows) {
		const [sourceActive, targetActive] = await Promise.all([
			endpointExists({ id: row.sourceId, type: row.sourceType as SemanticRelationEntityType }),
			endpointExists({ id: row.targetId, type: row.targetType as SemanticRelationEntityType }),
		]);
		if (!(sourceActive && targetActive)) continue;
		const relation = toView(row, row.roleSlug ? (roles.get(row.roleSlug) ?? null) : null, endpoint);
		if (!options.authorize || (await options.authorize(relation))) authorizedRows.push(relation);
	}
	return {
		data: authorizedRows.slice(offset, offset + limit),
		limit,
		offset,
		total: authorizedRows.length,
	};
}

export async function deleteSemanticRelation(id: string): Promise<void> {
	const result = await db
		.delete(semanticRelations)
		.where(eq(semanticRelations.id, id))
		.returning({ id: semanticRelations.id });
	if (result.length === 0)
		throw new SemanticRelationError('RELATION_NOT_FOUND', 'Relación semántica no encontrada.', 404);
}

export async function listRelationRoles(): Promise<RelationRoleRow[]> {
	return db.select().from(relationRoles).orderBy(relationRoles.slug);
}
