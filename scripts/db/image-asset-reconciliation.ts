import { Database } from 'bun:sqlite';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { isPathInsideDirectory } from '../../src/lib/filesystem/path-containment';
import {
	createAuthorizedRootRegistry,
	parseAuthorizedRootGrants,
	type AuthorizedRootRegistry,
	validateAuthorizedPathReference,
} from '../../src/server/security/authorized-roots';

const SHA256_HEX = /^[0-9a-f]{64}$/;

export interface ImageRootMapping {
	id: string;
	label: string;
	path: string;
}

export interface ImageAssetReconciliationReport {
	canonical: number;
	dataConsistent: boolean;
	divergent: number;
	divergentIds: string[];
	legacyOnly: number;
	legacyOnlyIds: string[];
	orphanCanonical: number;
	orphanCanonicalIds: string[];
	pathVerification: 'not_verified' | 'verified';
	totalImages: number;
}

type LegacyImageRow = {
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

type ReconciliationRow = LegacyImageRow & {
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
	mappings: ImageRootMapping[];
	registry: AuthorizedRootRegistry;
};

async function prepareImageRootMappings(roots: readonly ImageRootMapping[]): Promise<PreparedRoots> {
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

export async function validateImageRootMappings(roots: readonly ImageRootMapping[]): Promise<ImageRootMapping[]> {
	return (await prepareImageRootMappings(roots)).mappings;
}

async function mapLegacyPath(
	image: LegacyImageRow,
	registry: AuthorizedRootRegistry
): Promise<{ relativePath: string; rootId: string }> {
	try {
		if (!image.folderPath) throw new Error('FOLDER_PATH_NOT_FOUND');
		const [authorized, folder] = await Promise.all([
			registry.authorizeAbsolutePath(image.path, 'index'),
			registry.authorizeAbsolutePath(image.folderPath, 'index'),
		]);
		if (!isPathInsideDirectory(folder.absolutePath, authorized.absolutePath)) {
			throw new Error('FOLDER_PATH_CONFLICT');
		}
		return validateAuthorizedPathReference({ relativePath: authorized.relativePath, rootId: authorized.rootId });
	} catch (error) {
		const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'ROOT_PATH_INVALID';
		const reason = error instanceof Error && error.message.startsWith('FOLDER_PATH_') ? error.message : code;
		throw new Error(`Image ${image.id} no pudo autorizarse con el contrato runtime (${reason}).`);
	}
}

function deterministicSourceId(imageId: string): string {
	return `image_source_${createHash('sha256').update(imageId).digest('hex').slice(0, 40)}`;
}

function readLegacyImages(database: Database): LegacyImageRow[] {
	return database
		.query(`
			SELECT Image.id, Image.assetId, Image.name, Image.path, Image.hash, Image.size,
				Image.folderId, Image.createdAt, Folder.path AS folderPath
			FROM Image
			LEFT JOIN Folder ON Folder.id = Image.folderId
			ORDER BY Image.id
		`)
		.all() as LegacyImageRow[];
}

function readReconciliationRows(database: Database): ReconciliationRow[] {
	return database
		.query(`
			SELECT
				Image.id, Image.assetId, Image.name, Image.path, Image.hash, Image.size, Image.folderId, Image.createdAt,
				Folder.path AS folderPath,
				Asset.assetType, Asset.title, Asset.primarySourceFileId,
				SourceFile.id AS sourceId, SourceFile.assetId AS sourceAssetId, SourceFile.rootId,
				SourceFile.relativePath, SourceFile.folderId AS sourceFolderId,
				SourceFile.contentHash, SourceFile.byteSize
			FROM Image
			LEFT JOIN Folder ON Folder.id = Image.folderId
			LEFT JOIN Asset ON Asset.id = Image.assetId
			LEFT JOIN SourceFile ON SourceFile.id = Asset.primarySourceFileId
			ORDER BY Image.id
		`)
		.all() as ReconciliationRow[];
}

function readOrphanCanonicalIds(database: Database): string[] {
	return (
		database
			.query(`
				SELECT Asset.id
				FROM Asset
				LEFT JOIN Image ON Image.assetId = Asset.id
				WHERE Asset.assetType = 'image' AND Image.id IS NULL
				ORDER BY Asset.id
			`)
			.all() as Array<{ id: string }>
	).map((row) => row.id);
}

function hasStructuralDivergence(row: ReconciliationRow): boolean {
	return (
		row.assetId !== row.id ||
		row.assetType !== 'image' ||
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

function buildReport(
	rows: readonly ReconciliationRow[],
	orphanCanonicalIds: string[],
	divergentIds: string[],
	legacyOnlyIds: string[],
	pathVerification: ImageAssetReconciliationReport['pathVerification']
): ImageAssetReconciliationReport {
	return {
		canonical: rows.length - legacyOnlyIds.length - divergentIds.length,
		dataConsistent: legacyOnlyIds.length === 0 && divergentIds.length === 0 && orphanCanonicalIds.length === 0,
		divergent: divergentIds.length,
		divergentIds,
		legacyOnly: legacyOnlyIds.length,
		legacyOnlyIds,
		orphanCanonical: orphanCanonicalIds.length,
		orphanCanonicalIds,
		pathVerification,
		totalImages: rows.length,
	};
}

function reconcileImageAssetData(database: Database): ImageAssetReconciliationReport {
	const rows = readReconciliationRows(database);
	const legacyOnlyIds = rows.filter((row) => !row.assetId).map((row) => row.id);
	const divergentIds = rows.filter((row) => row.assetId && hasStructuralDivergence(row)).map((row) => row.id);
	return buildReport(rows, readOrphanCanonicalIds(database), divergentIds, legacyOnlyIds, 'not_verified');
}

export async function reconcileImageAssets(
	database: Database,
	rootMappings: readonly ImageRootMapping[] = []
): Promise<ImageAssetReconciliationReport> {
	if (rootMappings.length === 0) return reconcileImageAssetData(database);
	const { registry } = await prepareImageRootMappings(rootMappings);
	const rows = readReconciliationRows(database);
	const legacyOnlyIds: string[] = [];
	const divergentIds: string[] = [];
	for (const row of rows) {
		if (!row.assetId) {
			legacyOnlyIds.push(row.id);
			continue;
		}
		let divergent = hasStructuralDivergence(row);
		if (!divergent) {
			try {
				const [canonical, legacy, folder] = await Promise.all([
					registry.resolve({ relativePath: row.relativePath!, rootId: row.rootId! }, 'read'),
					registry.authorizeAbsolutePath(row.path, 'read'),
					registry.authorizeAbsolutePath(row.folderPath!, 'read'),
				]);
				divergent =
					canonical.absolutePath !== legacy.absolutePath ||
					!isPathInsideDirectory(folder.absolutePath, canonical.absolutePath);
			} catch {
				divergent = true;
			}
		}
		if (divergent) divergentIds.push(row.id);
	}
	return buildReport(rows, readOrphanCanonicalIds(database), divergentIds, legacyOnlyIds, 'verified');
}

function validateLegacyRow(image: LegacyImageRow): void {
	if (!SHA256_HEX.test(image.hash)) throw new Error(`Image ${image.id} tiene hash no canónico.`);
	if (!Number.isSafeInteger(image.size) || image.size < 0 || image.size > 107_374_182_400) {
		throw new Error(`Image ${image.id} tiene size no canónico.`);
	}
	if (!(typeof image.id === 'string' && image.id.length > 0)) throw new Error('Image.id inválido.');
}

export async function backfillImageAssets(
	database: Database,
	rootMappings: readonly ImageRootMapping[]
): Promise<{
	alreadyCanonical: number;
	backfilled: number;
	report: ImageAssetReconciliationReport;
}> {
	const preparedRoots = await prepareImageRootMappings(rootMappings);
	const roots = preparedRoots.mappings;
	const legacyImages = readLegacyImages(database);
	const prepared = await Promise.all(
		legacyImages.map(async (image) => {
			validateLegacyRow(image);
			return {
				image,
				location: await mapLegacyPath(image, preparedRoots.registry),
				sourceId: deterministicSourceId(image.id),
			};
		})
	);
	const before = await reconcileImageAssets(database, roots);
	if (before.divergent > 0 || before.orphanCanonical > 0) {
		throw new Error('La copia contiene divergencias canónicas previas; no se ejecutó el backfill.');
	}
	const pending = prepared.filter(({ image }) => image.assetId === null);
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
		VALUES (?, 'image', ?, ?, 'active', ?, ?)
	`);
	const linkImage = database.query('UPDATE Image SET assetId = ? WHERE id = ? AND assetId IS NULL');
	const transaction = database.transaction(() => {
		for (const root of roots) insertRoot.run(root.id, root.label, now, now, now);
		for (const { image, location, sourceId } of pending) {
			insertSource.run(
				sourceId,
				image.id,
				location.rootId,
				location.relativePath,
				image.folderId,
				image.hash,
				image.size,
				now,
				image.createdAt,
				now
			);
			insertAsset.run(image.id, image.name, sourceId, image.createdAt, now);
			const result = linkImage.run(image.id, image.id);
			if (result.changes !== 1) throw new Error(`Image ${image.id} cambió durante el backfill.`);
		}
		if (!reconcileImageAssetData(database).dataConsistent) {
			throw new Error('El backfill terminó con inconsistencias estructurales.');
		}
	});
	transaction.immediate();
	const report = await reconcileImageAssets(database, roots);
	if (!(report.dataConsistent && report.pathVerification === 'verified')) {
		throw new Error('El backfill terminó con inconsistencias de datos o paths no verificables.');
	}
	return { alreadyCanonical: legacyImages.length - pending.length, backfilled: pending.length, report };
}
