import { stat } from 'node:fs/promises';
import { checkFileSyncStatus, syncFolderFiles } from '@/lib/filesystem/file-sync.service';
import type { FileSystemSync, SyncFileResult } from '@/lib/filesystem/sync-interface';
import type { FileInfo } from '@/types/file-entity-mapper';

async function withConfiguredRoots() {
	const { getConfiguredMediaRootRegistry } = await import('@/server/security/configured-media-source');
	return { authorizedRootRegistry: await getConfiguredMediaRootRegistry() };
}

/**
 * Adapter de producción para el seam FileSystemSync.
 * Usa filesystem + DB existentes y delega creación de entidades al mapper.
 */
export class FsDbFileSystemSyncAdapter implements FileSystemSync {
	async syncFile(filePath: string, folderId: string): Promise<SyncFileResult> {
		const status = await checkFileSyncStatus(folderId, await withConfiguredRoots());
		const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();

		const isDeleted = status.removedFiles.some(
			(file) => file.path.replace(/\\/g, '/').toLowerCase() === normalizedPath
		);
		if (isDeleted) {
			const removed = status.removedFiles.find(
				(file) => file.path.replace(/\\/g, '/').toLowerCase() === normalizedPath
			);
			return {
				fileId: removed?.id ?? '',
				entityType: removed?.type ?? 'unknown',
				action: 'deleted',
			};
		}

		const isNew = status.newFiles.some((file) => file.path.replace(/\\/g, '/').toLowerCase() === normalizedPath);
		if (!isNew) {
			return {
				fileId: '',
				entityType: 'unknown',
				action: 'skipped',
			};
		}

		const fileStats = await stat(filePath);
		if (!fileStats.isFile()) {
			return {
				fileId: '',
				entityType: 'unknown',
				action: 'skipped',
			};
		}

		const { FileEntityMapperService } = await import('@/services/file-entity-mapper/file-entity-mapper.service');
		const mapper = FileEntityMapperService.getInstance();
		const result = await mapper.createEntityFromFile(filePath, folderId);

		if (!result.success) {
			return {
				fileId: '',
				entityType: result.entityType,
				action: 'skipped',
			};
		}

		return {
			fileId: result.entityId ?? '',
			entityType: result.entityType,
			action: 'created',
		};
	}

	async detectDeletedFiles(folderId: string): Promise<string[]> {
		const status = await checkFileSyncStatus(folderId, await withConfiguredRoots());
		return status.removedFiles.map((file) => file.path);
	}

	async detectNewFiles(folderId: string): Promise<FileInfo[]> {
		const status = await checkFileSyncStatus(folderId, await withConfiguredRoots());
		const now = new Date();

		return status.newFiles.map((file) => ({
			path: file.path,
			name: file.name,
			extension: file.extension,
			size: 0,
			lastModified: now,
			folderId,
		}));
	}

	async cleanOrphanRecords(folderId: string): Promise<number> {
		const result = await syncFolderFiles(folderId, { ...(await withConfiguredRoots()), dryRun: false });
		return result.removedFiles.length;
	}
}
