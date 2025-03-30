/**
 * @file Tipos para archivos cargados
 * @module types/uploaded-files
 */

import type { EntityId, JSONString } from '@/utils/types/utility-types';
import { z } from 'zod';
import type { MediaMetadata } from './metadata.types';

/**
 * Estado de carga de archivo
 */
export enum UploadStatus {
    PENDING = 'pending',
    UPLOADING = 'uploading',
    PROCESSING = 'processing',
    COMPLETE = 'complete',
    ERROR = 'error'
}

/**
 * Tipo de archivo subido
 */
export enum UploadedFileType {
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio',
    DOCUMENT = 'document',
    OTHER = 'other'
}

/**
 * Interfaz para archivo subido
 */
export interface UploadedFile {
    id: EntityId;
    name: string;
    originalName: string;
    path: string;
    type: UploadedFileType;
    mimeType: string;
    size: number;
    status: UploadStatus;
    progress: number;
    error?: string;
    metadata: JSONString<MediaMetadata>;
    uploadedAt: Date;
    userId: EntityId;
}

/**
 * Opciones de carga
 */
export interface UploadOptions {
    generateThumbnails?: boolean;
    processMetadata?: boolean;
    allowedTypes?: UploadedFileType[];
    maxSize?: number;
    destination?: string;
    overwrite?: boolean;
    batch?: boolean;
}

/**
 * Resultado de carga
 */
export interface UploadResult {
    success: boolean;
    file?: UploadedFile;
    error?: string;
}

/**
 * Estado de carga múltiple
 */
export interface BatchUploadState {
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
    files: Map<string, UploadedFile>;
    errors: Map<string, string>;
}

// Validaciones Zod
export const uploadStatusSchema = z.nativeEnum(UploadStatus);
export const uploadedFileTypeSchema = z.nativeEnum(UploadedFileType);

export const uploadedFileSchema = z.object({
    id: z.string(),
    name: z.string(),
    originalName: z.string(),
    path: z.string(),
    type: uploadedFileTypeSchema,
    mimeType: z.string(),
    size: z.number().positive(),
    status: uploadStatusSchema,
    progress: z.number().min(0).max(100),
    error: z.string().optional(),
    metadata: z.string(),
    uploadedAt: z.date(),
    userId: z.string()
});

export const uploadOptionsSchema = z.object({
    generateThumbnails: z.boolean().optional(),
    processMetadata: z.boolean().optional(),
    allowedTypes: z.array(uploadedFileTypeSchema).optional(),
    maxSize: z.number().positive().optional(),
    destination: z.string().optional(),
    overwrite: z.boolean().optional(),
    batch: z.boolean().optional()
});

export const uploadResultSchema = z.object({
    success: z.boolean(),
    file: uploadedFileSchema.optional(),
    error: z.string().optional()
});

// Tipos inferidos
export type UploadedFileValidated = z.infer<typeof uploadedFileSchema>;
export type UploadOptionsValidated = z.infer<typeof uploadOptionsSchema>;
export type UploadResultValidated = z.infer<typeof uploadResultSchema>;
