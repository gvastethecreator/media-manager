import type { ProcessStatus, ExtendedProcessStatus } from './process'

export interface FolderStats {
  totalFolders: number;
  totalFiles: number;
  totalSize: number;
  lastIndexed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  totalFiles?: number;
  totalSize?: number;
  lastIndexed: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    images: number;
  };
  recentImages?: (string | null)[];
}

export type { ProcessStatus, ExtendedProcessStatus }