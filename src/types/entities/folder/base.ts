import type { Folder as PrismaFolder, FolderVisualConfig as PrismaFolderVisualConfig } from '@prisma/client';

/**
 * Tipo base para Folder, extendido directamente del tipo Prisma
 */
export type FolderBase = PrismaFolder;

/**
 * Tipo base para FolderVisualConfig, extendido directamente del tipo Prisma
 */
export type FolderVisualConfigBase = PrismaFolderVisualConfig;

/**
 * Tipo para estadísticas básicas de carpetas
 */
export interface FolderStats {
  totalFolders: number;
  totalFiles: number;
  totalSize: number;
  lastIndexed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Datos mínimos requeridos para crear una carpeta
 */
export interface CreateFolderData {
  name: string;
  path: string;
  description?: string;
  emoji?: string;
  color?: string;
  presetId?: string | null;
  parentId?: string | null;
}

/**
 * Datos para actualizar una carpeta
 */
export interface UpdateFolderData {
  name?: string;
  description?: string;
  emoji?: string;
  color?: string;
  presetId?: string | null;
  isFavorite?: boolean;
  autoReindex?: boolean;
}

/**
 * Resumen básico de una carpeta para listados
 */
export interface FolderSummary {
  id: string;
  name: string;
  path: string;
  imageCount: number;
  totalSize: number;
  lastIndexed: Date | null;
}