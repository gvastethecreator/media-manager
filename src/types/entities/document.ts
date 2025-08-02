/**
 * @file Document entity types and interfaces
 * @module types/entities/document
 */

import type { EntityStats } from './entity.types';

export interface DocumentStats extends EntityStats {
  // Propiedades específicas de documentos
  pageCount?: number;
  wordCount?: number;
  author?: string;
  title?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  language?: string;
  version?: string;

  // Funciones del sistema de archivos
  /** Whether this is a directory */
  isDirectory: boolean;
  /** Whether this is a file */
  isFile: boolean;
}

export interface Document {
  id: string;
  name: string;
  path?: string;
  size?: number;
  type: string;
  mimeType?: string;
  extension?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  isEncrypted?: boolean;
  checksum?: string;
  metadata?: Record<string, any>;
}

export interface DocumentWithStats extends Document {
  stats?: DocumentStats;
}

export interface DocumentPreview {
  id: string;
  documentId: string;
  pageNumber: number;
  thumbnailUrl?: string;
  previewUrl?: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  path: string;
  size: number;
  checksum: string;
  createdAt: Date;
  createdBy?: string;
  changes?: string;
}

export interface DocumentPermission {
  id: string;
  documentId: string;
  userId?: string;
  groupId?: string;
  permission: 'read' | 'write' | 'admin';
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export interface DocumentTag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  createdAt: Date;
}

export interface DocumentWithTags extends DocumentWithStats {
  tags?: DocumentTag[];
}

export interface DocumentSearchResult {
  document: DocumentWithStats;
  relevanceScore: number;
  matchedFields: string[];
  highlights?: Record<string, string[]>;
}

export interface DocumentFilter {
  types?: string[];
  extensions?: string[];
  sizeRange?: {
    min?: number;
    max?: number;
  };
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  tags?: string[];
  hasStats?: boolean;
  isEncrypted?: boolean;
}

export interface DocumentSortOptions {
  field: 'name' | 'size' | 'createdAt' | 'updatedAt' | 'lastAccessedAt' | 'type';
  direction: 'asc' | 'desc';
}

export interface DocumentListOptions {
  filter?: DocumentFilter;
  sort?: DocumentSortOptions;
  pagination?: {
    page: number;
    limit: number;
  };
  includeStats?: boolean;
  includeTags?: boolean;
}

export interface DocumentUploadOptions {
  overwrite?: boolean;
  generatePreview?: boolean;
  extractMetadata?: boolean;
  tags?: string[];
  description?: string;
}

export interface DocumentExportOptions {
  format: 'pdf' | 'docx' | 'txt' | 'html' | 'markdown';
  includeMetadata?: boolean;
  includeImages?: boolean;
  quality?: 'low' | 'medium' | 'high';
}

export interface DocumentCreateInput {
  name: string;
  path: string;
  size: number;
  hash: string;
  mimeType: string;
  extension: string;
  folderId: string;
  isFavorite: boolean;
  isArchived: boolean;
  pageCount?: number | null;
  wordCount?: number | null;
  language?: string | null;
  title?: string | null;
  author?: string | null;
  subject?: string | null;
  keywords?: string | null;
  creator?: string | null;
  producer?: string | null;
  creationDate?: Date | null;
  modificationDate?: Date | null;
  encrypted?: boolean | null;
  version?: string | null;
  content?: string | null;
  summary?: string | null;
  description?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface DocumentUpdateInput {
  name?: string;
  path?: string;
  size?: number;
  hash?: string;
  mimeType?: string;
  extension?: string;
  folderId?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  pageCount?: number | null;
  wordCount?: number | null;
  language?: string | null;
  title?: string | null;
  author?: string | null;
  subject?: string | null;
  keywords?: string | null;
  creator?: string | null;
  producer?: string | null;
  creationDate?: Date | null;
  modificationDate?: Date | null;
  encrypted?: boolean | null;
  version?: string | null;
  content?: string | null;
  summary?: string | null;
  description?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}