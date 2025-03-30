/**
 * @file Tipos para el sistema de respaldo y restauración
 * @module types/backup
 */

import type { EntityId, JSONString } from '@/utils/types/utility-types';
import { z } from 'zod';

/**
 * Tipo de respaldo
 */
export enum BackupType {
    FULL = 'full',
    INCREMENTAL = 'incremental',
    DIFFERENTIAL = 'differential'
}

/**
 * Estado de respaldo
 */
export enum BackupStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    FAILED = 'failed',
    RESTORING = 'restoring',
    RESTORED = 'restored'
}

/**
 * Método de compresión
 */
export enum CompressionMethod {
    NONE = 'none',
    GZIP = 'gzip',
    ZIP = 'zip',
    TAR = 'tar',
    CUSTOM = 'custom'
}

/**
 * Método de encriptación
 */
export enum EncryptionMethod {
    NONE = 'none',
    AES_256 = 'aes-256',
    RSA = 'rsa',
    CUSTOM = 'custom'
}

/**
 * Opciones de respaldo
 */
export interface BackupOptions {
    type: BackupType;
    location: string;
    includeFiles: boolean;
    includeMetadata: boolean;
    includeThumbnails: boolean;
    includeSettings: boolean;
    compression: {
        enabled: boolean;
        method: CompressionMethod;
        level?: number;
    };
    encryption: {
        enabled: boolean;
        method: EncryptionMethod;
        key?: string;
    };
    retention: {
        maxBackups?: number;
        maxAge?: number;
    };
}

/**
 * Registro de respaldo
 */
export interface BackupRecord {
    id: EntityId;
    type: BackupType;
    status: BackupStatus;
    filename: string;
    location: string;
    size: number;
    itemsCount: number;
    compression: CompressionMethod;
    encrypted: boolean;
    checksum: string;
    createdAt: Date;
    completedAt?: Date;
    restoredAt?: Date;
    error?: string;
    metadata: JSONString<Record<string, unknown>>;
}

/**
 * Estado de restauración
 */
export interface RestoreState {
    backupId: EntityId;
    status: BackupStatus;
    progress: number;
    totalItems: number;
    restoredItems: number;
    failedItems: number;
    startedAt: Date;
    completedAt?: Date;
    error?: string;
}

/**
 * Resultado de operación de respaldo
 */
export interface BackupResult {
    success: boolean;
    record: BackupRecord;
    summary: {
        duration: number;
        filesSize: number;
        compressedSize: number;
        itemsByType: Record<string, number>;
    };
    errors: Array<{
        item: string;
        error: string;
    }>;
}

// Validaciones Zod
export const backupTypeSchema = z.nativeEnum(BackupType);
export const backupStatusSchema = z.nativeEnum(BackupStatus);
export const compressionMethodSchema = z.nativeEnum(CompressionMethod);
export const encryptionMethodSchema = z.nativeEnum(EncryptionMethod);

export const backupOptionsSchema = z.object({
    type: backupTypeSchema,
    location: z.string(),
    includeFiles: z.boolean(),
    includeMetadata: z.boolean(),
    includeThumbnails: z.boolean(),
    includeSettings: z.boolean(),
    compression: z.object({
        enabled: z.boolean(),
        method: compressionMethodSchema,
        level: z.number().min(1).max(9).optional()
    }),
    encryption: z.object({
        enabled: z.boolean(),
        method: encryptionMethodSchema,
        key: z.string().optional()
    }),
    retention: z.object({
        maxBackups: z.number().positive().optional(),
        maxAge: z.number().positive().optional()
    })
});

export const backupRecordSchema = z.object({
    id: z.string(),
    type: backupTypeSchema,
    status: backupStatusSchema,
    filename: z.string(),
    location: z.string(),
    size: z.number().nonnegative(),
    itemsCount: z.number().nonnegative(),
    compression: compressionMethodSchema,
    encrypted: z.boolean(),
    checksum: z.string(),
    createdAt: z.date(),
    completedAt: z.date().optional(),
    restoredAt: z.date().optional(),
    error: z.string().optional(),
    metadata: z.string()
});

export const restoreStateSchema = z.object({
    backupId: z.string(),
    status: backupStatusSchema,
    progress: z.number().min(0).max(100),
    totalItems: z.number().nonnegative(),
    restoredItems: z.number().nonnegative(),
    failedItems: z.number().nonnegative(),
    startedAt: z.date(),
    completedAt: z.date().optional(),
    error: z.string().optional()
});

export const backupResultSchema = z.object({
    success: z.boolean(),
    record: backupRecordSchema,
    summary: z.object({
        duration: z.number().positive(),
        filesSize: z.number().nonnegative(),
        compressedSize: z.number().nonnegative(),
        itemsByType: z.record(z.number())
    }),
    errors: z.array(z.object({
        item: z.string(),
        error: z.string()
    }))
});

// Tipos inferidos
export type BackupOptionsValidated = z.infer<typeof backupOptionsSchema>;
export type BackupRecordValidated = z.infer<typeof backupRecordSchema>;
export type RestoreStateValidated = z.infer<typeof restoreStateSchema>;
export type BackupResultValidated = z.infer<typeof backupResultSchema>;