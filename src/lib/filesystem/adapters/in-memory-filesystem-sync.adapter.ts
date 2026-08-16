import type { FileSystemSync, SyncFileResult } from '@/lib/filesystem/sync-interface';
import type { FileInfo } from '@/types/file-entity-mapper';

/**
 * Adapter in-memory para tests del seam FileSystemSync.
 */
export class InMemoryFileSystemSyncAdapter implements FileSystemSync {
	private readonly filesByFolder = new Map<string, Map<string, FileInfo>>();
	private readonly orphanPathsByFolder = new Map<string, Set<string>>();

	seedFiles(folderId: string, files: FileInfo[]): void {
		this.filesByFolder.set(folderId, new Map(files.map((file) => [file.path, file])));
	}

	markOrphan(folderId: string, filePath: string): void {
		const current = this.orphanPathsByFolder.get(folderId) ?? new Set<string>();
		current.add(filePath);
		this.orphanPathsByFolder.set(folderId, current);
	}

	async syncFile(filePath: string, folderId: string): Promise<SyncFileResult> {
		const folderFiles = this.filesByFolder.get(folderId) ?? new Map<string, FileInfo>();
		const orphanSet = this.orphanPathsByFolder.get(folderId) ?? new Set<string>();

		if (orphanSet.has(filePath)) {
			folderFiles.delete(filePath);
			orphanSet.delete(filePath);
			return { fileId: filePath, entityType: 'unknown', action: 'deleted' };
		}

		const existing = folderFiles.get(filePath);
		if (existing) {
			return { fileId: filePath, entityType: 'unknown', action: 'skipped', hash: existing.hash };
		}

		const created: FileInfo = {
			path: filePath,
			name: filePath.split(/[/\\]/).pop() ?? filePath,
			extension: filePath.includes('.') ? `.${filePath.split('.').pop()}` : '',
			size: 0,
			lastModified: new Date(),
			folderId,
		};
		folderFiles.set(filePath, created);
		this.filesByFolder.set(folderId, folderFiles);

		return { fileId: filePath, entityType: 'unknown', action: 'created' };
	}

	async detectDeletedFiles(folderId: string): Promise<string[]> {
		return [...(this.orphanPathsByFolder.get(folderId) ?? new Set<string>())];
	}

	async detectNewFiles(folderId: string): Promise<FileInfo[]> {
		return [...(this.filesByFolder.get(folderId)?.values() ?? [])];
	}

	async cleanOrphanRecords(folderId: string): Promise<number> {
		const orphanSet = this.orphanPathsByFolder.get(folderId) ?? new Set<string>();
		const folderFiles = this.filesByFolder.get(folderId) ?? new Map<string, FileInfo>();
		let removed = 0;

		for (const orphanPath of orphanSet) {
			if (folderFiles.delete(orphanPath)) {
				removed++;
			}
		}

		orphanSet.clear();
		this.filesByFolder.set(folderId, folderFiles);
		this.orphanPathsByFolder.set(folderId, orphanSet);

		return removed;
	}
}
