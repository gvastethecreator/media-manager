import { dirname, relative, resolve, sep } from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { folders, sourceFiles } from '@/lib/drizzle/schema';
import { fileSyncService } from '@/lib/filesystem/file-sync.service';
import { recomputeAndPersistFolderAggregates } from '@/lib/filesystem/folder-stats.aggregates';
import { scanFolder } from '@/lib/filesystem/folder-scanner';
import { isPathInsideDirectory } from '@/lib/filesystem/path-containment';
import { serverLogger } from '@/lib/logger/server-logger';
import type { AuthorizedRootRegistry } from '@/server/security/authorized-roots';
import { normalizeFolderName } from '@/lib/utils/folder-id-generator';
import type { ReindexOptions } from './folder-reindex-types';

const logger = serverLogger.withContext('CanonicalFolderReindex');

interface FolderRow {
	id: string;
	name: string;
	parentId: string | null;
	path: string;
}

export interface CanonicalFolderReindexContext {
	afterFolderAuthorization?: (folderId: string) => Promise<void>;
	authorizedRootRegistry: AuthorizedRootRegistry;
}

export interface CanonicalFolderReindexResult {
	errors: string[];
	filesIndexed: number;
	foldersProcessed: number;
	missingFolders: number;
	newFolders: number;
	totalFilesObserved: number;
}

const pathKey = (value: string): string => resolve(value).toLocaleLowerCase('en-US');

function collectDescendantIds(folderRows: readonly FolderRow[], rootId: string): Set<string> {
	const childrenByParent = new Map<string, string[]>();
	for (const folder of folderRows) {
		if (!folder.parentId) continue;
		const children = childrenByParent.get(folder.parentId) ?? [];
		children.push(folder.id);
		childrenByParent.set(folder.parentId, children);
	}
	const descendants = new Set<string>();
	const pending = [rootId];
	while (pending.length > 0) {
		const current = pending.pop();
		if (!current || descendants.has(current)) continue;
		descendants.add(current);
		for (const child of childrenByParent.get(current) ?? []) pending.push(child);
	}
	return descendants;
}

function allocateFolderId(name: string, reservedIds: Set<string>): string {
	const base = normalizeFolderName(name);
	for (let suffix = 1; suffix <= 100; suffix++) {
		const candidate = suffix === 1 ? base : `${base}-${suffix}`;
		if (reservedIds.has(candidate)) continue;
		reservedIds.add(candidate);
		return candidate;
	}
	const fallback = crypto.randomUUID();
	reservedIds.add(fallback);
	return fallback;
}

async function reconcilePhysicalFolderStructure(
	rootFolder: FolderRow,
	rootPath: string,
	directories: ReadonlyArray<{ name: string; path: string }>,
	includeSubfolders: boolean
): Promise<{ missingFolderIds: string[]; newFolderIds: string[]; physicalFolders: FolderRow[]; newFolders: number }> {
	const allFolders: FolderRow[] = await db
		.select({ id: folders.id, name: folders.name, parentId: folders.parentId, path: folders.path })
		.from(folders);
	const logicalScope = includeSubfolders ? collectDescendantIds(allFolders, rootFolder.id) : new Set([rootFolder.id]);
	const existingByPath = new Map<string, FolderRow>(allFolders.map((folder) => [pathKey(folder.path), folder]));
	const physicalByPath = new Map<string, FolderRow>([[pathKey(rootPath), { ...rootFolder, path: rootPath }]]);
	const reservedIds = new Set<string>(allFolders.map((folder) => folder.id));
	const newRows: FolderRow[] = [];

	if (includeSubfolders) {
		const orderedDirectories = [...directories].sort((left, right) => {
			const leftDepth = relative(rootPath, left.path).split(sep).filter(Boolean).length;
			const rightDepth = relative(rootPath, right.path).split(sep).filter(Boolean).length;
			return leftDepth - rightDepth;
		});
		for (const directory of orderedDirectories) {
			if (!isPathInsideDirectory(rootPath, directory.path)) {
				throw new Error('El escaneo devolvió una subcarpeta fuera del Folder autorizado.');
			}
			const key = pathKey(directory.path);
			const existing = existingByPath.get(key);
			if (existing) {
				if (!logicalScope.has(existing.id)) {
					throw new Error(`La estructura física entra en conflicto con el Folder ${existing.id}.`);
				}
				physicalByPath.set(key, { ...existing, path: directory.path });
				continue;
			}
			const parent = physicalByPath.get(pathKey(dirname(directory.path)));
			if (!parent) throw new Error('No se pudo determinar el Folder padre de una subcarpeta descubierta.');
			const row: FolderRow = {
				id: allocateFolderId(directory.name, reservedIds),
				name: directory.name,
				parentId: parent.id,
				path: directory.path,
			};
			newRows.push(row);
			physicalByPath.set(key, row);
		}
	}

	const physicalIds = new Set([...physicalByPath.values()].map((folder) => folder.id));
	const missingFolderIds = [...logicalScope].filter((id) => !physicalIds.has(id));
	for (const missingFolderId of missingFolderIds) {
		const missingFolder = allFolders.find((folder) => folder.id === missingFolderId);
		if (!missingFolder || !isPathInsideDirectory(rootPath, missingFolder.path)) {
			throw new Error(`El Folder descendiente ${missingFolderId} no pertenece a la raíz física autorizada.`);
		}
	}

	return {
		missingFolderIds,
		newFolderIds: newRows.map((row) => row.id),
		newFolders: newRows.length,
		physicalFolders: [...physicalByPath.values()].sort((left, right) => left.path.length - right.path.length),
	};
}

export async function executeCanonicalFolderReindex(
	options: ReindexOptions,
	context: CanonicalFolderReindexContext
): Promise<CanonicalFolderReindexResult> {
	if (!options.folderId) throw new Error('El reindex canónico requiere un folderId explícito.');
	const [rootFolder] = await db
		.select({ id: folders.id, name: folders.name, parentId: folders.parentId, path: folders.path })
		.from(folders)
		.where(eq(folders.id, options.folderId))
		.limit(1);
	if (!rootFolder) throw new Error(`Folder ${options.folderId} no encontrado.`);

	let authorizedFolder = await context.authorizedRootRegistry.authorizeAbsolutePath(rootFolder.path, 'read');
	authorizedFolder = await context.authorizedRootRegistry.authorizeAbsolutePath(rootFolder.path, 'index');
	await context.afterFolderAuthorization?.(rootFolder.id);
	// El seam de prueba puede cambiar el estado físico tras la autorización inicial.
	// Revalidamos antes del scan; el scanner también falla cerrado si el filesystem cambia después.
	authorizedFolder = await context.authorizedRootRegistry.authorizeAbsolutePath(rootFolder.path, 'read');
	authorizedFolder = await context.authorizedRootRegistry.authorizeAbsolutePath(rootFolder.path, 'index');

	const includeSubfolders = options.includeSubfolders !== false;
	const scan = await scanFolder(authorizedFolder.absolutePath, {
		includeHidden: options.includeHidden,
		limit: 0,
		maxDepth: includeSubfolders ? 99 : 0,
		recursive: includeSubfolders,
	});
	if (scan.error) throw new Error(`No se pudo escanear el Folder autorizado ${rootFolder.id}.`);

	const structure = await reconcilePhysicalFolderStructure(
		rootFolder,
		authorizedFolder.absolutePath,
		scan.directories,
		includeSubfolders
	);
	const errors: string[] = [];
	let filesIndexed = 0;
	const newFolderIds = new Set(structure.newFolderIds);
	const insertedFolderIds: string[] = [];
	try {
		for (const folder of structure.physicalFolders) {
			if (newFolderIds.has(folder.id)) {
				await db.insert(folders).values(folder);
				insertedFolderIds.push(folder.id);
			}
			const sync = await fileSyncService.syncFolderFiles(folder.id, {
				authorizedRootRegistry: context.authorizedRootRegistry,
				includeHidden: options.includeHidden,
				maxDepth: 0,
				recursive: false,
			});
			filesIndexed += sync.stats.newFilesFound;
			errors.push(...sync.errors);
			await recomputeAndPersistFolderAggregates(folder.id);
		}
		for (const missingFolderId of structure.missingFolderIds) {
			const now = new Date();
			await db
				.update(sourceFiles)
				.set({ availability: 'missing', observedAt: now, updatedAt: now })
				.where(eq(sourceFiles.folderId, missingFolderId));
			await recomputeAndPersistFolderAggregates(missingFolderId);
		}
	} catch (error) {
		// Una excepción inesperada antes de que un Folder nuevo reciba Sources no debe
		// dejar estructura fantasma. Los folders ya usados se conservan para no orfanar datos.
		for (const folderId of insertedFolderIds.reverse()) {
			const references = await db
				.select({ id: sourceFiles.id })
				.from(sourceFiles)
				.where(eq(sourceFiles.folderId, folderId))
				.limit(1);
			if (references.length === 0) await db.delete(folders).where(eq(folders.id, folderId));
		}
		throw error;
	}

	logger.info('Reindex canónico completado', {
		errors: errors.length,
		filesIndexed,
		folderId: rootFolder.id,
		foldersProcessed: structure.physicalFolders.length,
		missingFolders: structure.missingFolderIds.length,
		newFolders: structure.newFolders,
		totalFilesObserved: scan.totalFiles,
	});
	return {
		errors,
		filesIndexed,
		foldersProcessed: structure.physicalFolders.length,
		missingFolders: structure.missingFolderIds.length,
		newFolders: structure.newFolders,
		totalFilesObserved: scan.totalFiles,
	};
}
