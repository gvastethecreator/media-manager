import { Image } from '@prisma/client';

export interface FolderStats {
  totalFolders: number;
  totalFiles: number;
  totalSize: number;
  lastIndexed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessStatus {
  status?: string;
  current?: number;
  total?: number;
  progress?: number;
  currentFile?: string;
  timestamp?: number;
}

export interface ErrorResponse {
  message: string;
  details?: string;
  code?: string;
  timestamp?: number;
}

export interface FolderResponse {
  folder: {
    id: string;
    name: string;
    path: string;
    totalFiles?: number;
    totalSize?: number;
    lastIndexed?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  stats?: {
    processed: number;
    total: number;
    totalSize?: number;
  };
  timestamp?: number;
}

export interface IndexCallbacks {
  onProgress?: (status: ProcessStatus) => void;
  onError?: (error: ErrorResponse) => void;
  onComplete?: (data: FolderResponse) => void;
}

export interface ExtendedProcessStatus extends ProcessStatus {
  currentFile?: string;
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  totalFiles: number;
  totalSize: number;
  lastIndexed: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    images: number;
  };
  recentImages?: (string | null)[];
  images?: Image[];
}