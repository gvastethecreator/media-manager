import type { FileSystemSync } from '@/lib/filesystem/sync-interface';
import { FsDbFileSystemSyncAdapter } from './adapters/fs-db-filesystem-sync.adapter';

let adapter: FileSystemSync = new FsDbFileSystemSyncAdapter();

export function getFileSystemSyncAdapter(): FileSystemSync {
	return adapter;
}

export function setFileSystemSyncAdapter(nextAdapter: FileSystemSync): void {
	adapter = nextAdapter;
}
