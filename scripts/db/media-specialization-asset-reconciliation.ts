import { Database } from 'bun:sqlite';
import { createHash } from 'node:crypto';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isPathInsideDirectory } from '../../src/lib/filesystem/path-containment';
import {
	createAuthorizedRootRegistry,
	parseAuthorizedRootGrants,
	type AuthorizedRootRegistry,
	validateAuthorizedPathReference,
} from '../../src/server/security/authorized-roots';

const SHA256_HEX = /^[0-9a-f]{64}$/;

export const MEDIA_SPECIALIZATIONS = ['video', 'audio', 'document', 'json', 'file3d'] as const;
export type MediaSpecializationType = (typeof MEDIA_SPECIALIZATIONS)[number];

export interface MediaRootMapping {
	id: string;
	label: string;
	path: string;
}

export interface MediaSpecializationFamilyReport {
	canonical: number;
	divergent: number;
	divergentIds: string[];
	legacyOnly: number;
	legacyOnlyIds: string[];
	orphanCanonical: number;
	orphanCanonicalIds: string[];
	total: number;
}

export interface MediaSpecializationReconciliationReport {
	canonical: number;
	dataConsistent: boolean;
	divergent: number;
	families: Record<MediaSpecializationType, MediaSpecializationFamilyReport>;
	identityCollisionIds: string[];
	legacyOnly: number;
	orphanCanonical: number;
	pathVerification: 'not_verified' | 'verified';
	total: number;
}

type FamilyConfig = {
	assetType: MediaSpecializationType;
	table: 'Video' | 'Audio' | 'Document' | 'JsonFile' | 'File3D';
};

type LegacyRow = {
	assetId: string | null;
	createdAt: number;
	folderId: string;
	folderPath: string | null;
	hash: string;
	id: string;
	name: string;
	path: string;
	size: number;
};

type ReconciliationRow = LegacyRow & {
	assetType: string | null;
	byteSize: number | null;
	contentHash: string | null;
	primarySourceFileId: string | null;
	relativePath: string | null;
	rootId: string | null;
	sourceAssetId: string | null;
	sourceFolderId: string | null;
	sourceId: string | null;
	title: string | null;
};

type PreparedRoots = {
	mappings: MediaRootMapping[];
	registry: AuthorizedRootRegistry;
};

const FAMILY_CONFIGS: readonly FamilyConfig[] = [
	{ assetType: 'video', table: 'Video' },
	{ assetType: 'audio', table: 'Audio' },
	{ assetType: 'document', table: 'Document' },
	{ assetType: 'json', table: 'JsonFile' },
	{ assetType: 'file3d', table: 'File3D' },
];

async function prepareRootMappings(roots: readonly MediaRootMapping[]): Promise<PreparedRoots> {
	if (roots.length === 0) throw new Error('Se requiere al menos un media root explícito.');
	for (const root of roots) {
		if (!(root && typeof root === 'object')) throw new Error('Cada media root debe ser un objeto.');
		if (typeof root.label !== 'string' || !root.label.trim()) throw new Error(`Media root sin label: ${root.id}`);
	}
	const grants = parseAuthorizedRootGrants(
		JSON.stringify(
			roots.map((root) => ({
				id: root.id,
				label: root.label,
				path: root.path,
				permissions: ['read', 'index'],
			}))
		)
	);
	const registry = await createAuthorizedRootRegistry(grants);
	return {
		mappings: grants.map((grant) => ({ id: grant.id, label: grant.label ?? grant.id, path: resolve(grant.path) })),
		registry,
	};
}

export async function validateMediaRootMappings(roots: readonly MediaRootMapping[]): Promise<MediaRootMapping[]> {
	return (await prepareRootMappings(roots)).mappings;
}

function readLegacyRows(database: Database, config: FamilyConfig): LegacyRow[] {
	return database
		.query(`
			SELECT Entity.id, Entity.assetId, Entity.name, Entity.path, Entity.hash, Entity.size,
				Entity.folderId, Entity.createdAt, Folder.path AS folderPath
			FROM ${config.table} AS Entity
			LEFT JOIN Folder ON Folder.id = Entity.folderId
			ORDER BY Entity.id
		`)
		.all() as LegacyRow[];
}

function readReconciliationRows(database: Database, config: FamilyConfig): ReconciliationRow[] {
	return database
		.query(`
			SELECT
				Entity.id, Entity.assetId, Entity.name, Entity.path, Entity.hash, Entity.size,
				Entity.folderId, Entity.createdAt, Folder.path AS folderPath,
				Asset.assetType, Asset.title, Asset.primarySourceFileId,
				SourceFile.id AS sourceId, SourceFile.assetId AS sourceAssetId, SourceFile.rootId,
				SourceFile.relativePath, SourceFile.folderId AS sourceFolderId,
				SourceFile.contentHash, SourceFile.byteSize
			FROM ${config.table} AS Entity
			LEFT JOIN Folder ON Folder.id = Entity.folderId
			LEFT JOIN Asset ON Asset.id = Entity.assetId
			LEFT JOIN SourceFile ON SourceFile.id = Asset.primarySourceFileId
			ORDER BY Entity.id
		`)
		.all() as ReconciliationRow[];
}

function readOrphanCanonicalIds(database: Database, config: FamilyConfig): string[] {
	return (
		database
			.query(`
				SELECT Asset.id
				FROM Asset
				LEFT JOIN ${config.table} AS Entity ON Entity.assetId = Asset.id
				WHERE Asset.assetType = ? AND Entity.id IS NULL
				ORDER BY Asset.id
			`)
			.all(config.assetType) as Array<{ id: string }>
	).map((row) => row.id);
}

function readIdentityCollisionIds(database: Database): string[] {
	return (
		database
			.query(`
				WITH Legacy(type, id, assetId) AS (
					SELECT 'image', id, assetId FROM Image UNION ALL
					SELECT 'video', id, assetId FROM Video UNION ALL
					SELECT 'audio', id, assetId FROM Audio UNION ALL
					SELECT 'document', id, assetId FROM Document UNION ALL
					SELECT 'json', id, assetId FROM JsonFile UNION ALL
					SELECT 'file3d', id, assetId FROM File3D
				), DuplicateIds AS (
					SELECT id FROM Legacy GROUP BY id HAVING count(*) > 1
				)
				SELECT DISTINCT Legacy.id
				FROM Legacy
				LEFT JOIN Asset ON Asset.id = Legacy.id
				WHERE Legacy.id IN (SELECT id FROM DuplicateIds)
					OR (Legacy.assetId IS NULL AND Asset.id IS NOT NULL)
				ORDER BY Legacy.id
			`)
			.all() as Array<{ id: string }>
	).map((row) => row.id);
}

function hasStructuralDivergence(row: ReconciliationRow, assetType: MediaSpecializationType): boolean {
	return (
		row.assetId !== row.id ||
		row.assetType !== assetType ||
		row.title !== row.name ||
		row.sourceId !== row.primarySourceFileId ||
		row.sourceAssetId !== row.assetId ||
		row.contentHash !== row.hash ||
		row.byteSize !== row.size ||
		row.sourceFolderId !== row.folderId ||
		!row.folderPath ||
		!row.rootId ||
		!row.relativePath
	);
}

function reconcileData(
	database: Database,
	pathVerification: MediaSpecializationReconciliationReport['pathVerification'],
	verifiedDivergences: Partial<Record<MediaSpecializationType, string[]>> = {}
): MediaSpecializationReconciliationReport {
	const families = {} as Record<MediaSpecializationType, MediaSpecializationFamilyReport>;
	for (const config of FAMILY_CONFIGS) {
		const rows = readReconciliationRows(database, config);
		const legacyOnlyIds = rows.filter((row) => !row.assetId).map((row) => row.id);
		const structuralDivergentIds = rows
			.filter((row) => row.assetId && hasStructuralDivergence(row, config.assetType))
			.map((row) => row.id);
		const divergentIds = [
			...new Set([...structuralDivergentIds, ...(verifiedDivergences[config.assetType] ?? [])]),
		].sort();
		const orphanCanonicalIds = readOrphanCanonicalIds(database, config);
		families[config.assetType] = {
			canonical: rows.length - legacyOnlyIds.length - divergentIds.length,
			divergent: divergentIds.length,
			divergentIds,
			legacyOnly: legacyOnlyIds.length,
			legacyOnlyIds,
			orphanCanonical: orphanCanonicalIds.length,
			orphanCanonicalIds,
			total: rows.length,
		};
	}
	const identityCollisionIds = readIdentityCollisionIds(database);
	const totals = Object.values(families).reduce(
		(acc, family) => ({
			canonical: acc.canonical + family.canonical,
			divergent: acc.divergent + family.divergent,
			legacyOnly: acc.legacyOnly + family.legacyOnly,
			orphanCanonical: acc.orphanCanonical + family.orphanCanonical,
			total: acc.total + family.total,
		}),
		{ canonical: 0, divergent: 0, legacyOnly: 0, orphanCanonical: 0, total: 0 }
	);
	return {
		...totals,
		dataConsistent:
			totals.divergent === 0 &&
			totals.legacyOnly === 0 &&
			totals.orphanCanonical === 0 &&
			identityCollisionIds.length === 0,
		families,
		identityCollisionIds,
		pathVerification,
	};
}

export async function reconcileMediaSpecializationAssets(
	database: Database,
	rootMappings: readonly MediaRootMapping[] = []
): Promise<MediaSpecializationReconciliationReport> {
	if (rootMappings.length === 0) return reconcileData(database, 'not_verified');
	const { registry } = await prepareRootMappings(rootMappings);
	const pathDivergences: Partial<Record<MediaSpecializationType, string[]>> = {};
	for (const config of FAMILY_CONFIGS) {
		const divergentIds: string[] = [];
		for (const row of readReconciliationRows(database, config)) {
			if (!row.assetId || hasStructuralDivergence(row, config.assetType)) continue;
			try {
				const [canonical, legacy, folder] = await Promise.all([
					registry.resolve({ relativePath: row.relativePath!, rootId: row.rootId! }, 'read'),
					registry.authorizeAbsolutePath(row.path, 'read'),
					registry.authorizeAbsolutePath(row.folderPath!, 'read'),
				]);
				const fileStats = await stat(canonical.absolutePath);
				if (
					!fileStats.isFile() ||
					fileStats.size !== row.byteSize ||
					fileStats.size !== row.size ||
					canonical.absolutePath !== legacy.absolutePath ||
					!isPathInsideDirectory(folder.absolutePath, canonical.absolutePath)
				) {
					divergentIds.push(row.id);
				}
			} catch {
				divergentIds.push(row.id);
			}
		}
		pathDivergences[config.assetType] = divergentIds;
	}
	return reconcileData(database, 'verified', pathDivergences);
}

async function mapLegacyPath(
	row: LegacyRow,
	assetType: MediaSpecializationType,
	registry: AuthorizedRootRegistry
): Promise<{ relativePath: string; rootId: string }> {
	try {
		if (!row.folderPath) throw new Error('FOLDER_PATH_NOT_FOUND');
		const [authorized, folder] = await Promise.all([
			registry.authorizeAbsolutePath(row.path, 'index'),
			registry.authorizeAbsolutePath(row.folderPath, 'index'),
		]);
		if (!isPathInsideDirectory(folder.absolutePath, authorized.absolutePath)) throw new Error('FOLDER_PATH_CONFLICT');
		return validateAuthorizedPathReference({ relativePath: authorized.relativePath, rootId: authorized.rootId });
	} catch (error) {
		const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'ROOT_PATH_INVALID';
		const reason = error instanceof Error && error.message.startsWith('FOLDER_PATH_') ? error.message : code;
		throw new Error(`${assetType}:${row.id} no pudo autorizarse con el contrato runtime (${reason}).`);
	}
}

function validateLegacyRow(row: LegacyRow, assetType: MediaSpecializationType): void {
	if (!SHA256_HEX.test(row.hash)) throw new Error(`${assetType}:${row.id} tiene hash no canónico.`);
	if (!Number.isSafeInteger(row.size) || row.size < 0 || row.size > 107_374_182_400) {
		throw new Error(`${assetType}:${row.id} tiene size no canónico.`);
	}
	if (!(typeof row.id === 'string' && row.id.length > 0)) throw new Error(`${assetType}.id inválido.`);
}

function deterministicSourceId(assetType: MediaSpecializationType, id: string): string {
	return `media_source_${createHash('sha256').update(`${assetType}:${id}`).digest('hex').slice(0, 40)}`;
}

export async function backfillMediaSpecializationAssets(
	database: Database,
	rootMappings: readonly MediaRootMapping[]
): Promise<{
	alreadyCanonical: number;
	backfilled: number;
	report: MediaSpecializationReconciliationReport;
}> {
	const preparedRoots = await prepareRootMappings(rootMappings);
	const prepared = (
		await Promise.all(
			FAMILY_CONFIGS.flatMap((config) =>
				readLegacyRows(database, config).map(async (row) => {
					validateLegacyRow(row, config.assetType);
					return {
						config,
						location: await mapLegacyPath(row, config.assetType, preparedRoots.registry),
						row,
						sourceId: deterministicSourceId(config.assetType, row.id),
					};
				})
			)
		)
	).sort((left, right) =>
		`${left.config.assetType}:${left.row.id}`.localeCompare(`${right.config.assetType}:${right.row.id}`)
	);
	const before = await reconcileMediaSpecializationAssets(database, preparedRoots.mappings);
	if (before.divergent > 0 || before.orphanCanonical > 0 || before.identityCollisionIds.length > 0) {
		throw new Error('La copia contiene divergencias, huérfanos o colisiones de identidad; no se ejecutó el backfill.');
	}
	const pending = prepared.filter(({ row }) => row.assetId === null);
	const now = Date.now();
	const insertRoot = database.query(`
		INSERT INTO MediaRoot(id, label, status, lastSeenAt, createdAt, updatedAt)
		VALUES (?, ?, 'active', ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET label = excluded.label, status = 'active', lastSeenAt = excluded.lastSeenAt,
			updatedAt = excluded.updatedAt
	`);
	const insertSource = database.query(`
		INSERT INTO SourceFile(
			id, assetId, rootId, relativePath, folderId, contentHash, byteSize, availability,
			observedAt, createdAt, updatedAt
		) VALUES (?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, ?)
	`);
	const insertAsset = database.query(`
		INSERT INTO Asset(id, assetType, title, primarySourceFileId, status, createdAt, updatedAt)
		VALUES (?, ?, ?, ?, 'active', ?, ?)
	`);
	const transaction = database.transaction(() => {
		for (const root of preparedRoots.mappings) insertRoot.run(root.id, root.label, now, now, now);
		for (const { config, location, row, sourceId } of pending) {
			insertSource.run(
				sourceId,
				row.id,
				location.rootId,
				location.relativePath,
				row.folderId,
				row.hash,
				row.size,
				now,
				row.createdAt,
				now
			);
			insertAsset.run(row.id, config.assetType, row.name, sourceId, row.createdAt, now);
			const result = database
				.query(`UPDATE ${config.table} SET assetId = ? WHERE id = ? AND assetId IS NULL`)
				.run(row.id, row.id);
			if (result.changes !== 1) throw new Error(`${config.assetType}:${row.id} cambió durante el backfill.`);
		}
		if (!reconcileData(database, 'not_verified').dataConsistent) {
			throw new Error('El backfill terminó con inconsistencias estructurales.');
		}
	});
	transaction.immediate();
	const report = await reconcileMediaSpecializationAssets(database, preparedRoots.mappings);
	if (!(report.dataConsistent && report.pathVerification === 'verified')) {
		throw new Error('El backfill terminó con inconsistencias de datos o paths no verificables.');
	}
	return { alreadyCanonical: prepared.length - pending.length, backfilled: pending.length, report };
}
