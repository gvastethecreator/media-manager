/**
 * @file Tipos para el sistema de importación y exportación
 * @module types/import-export
 */

import { z } from 'zod';
import type { EntityId, JSONString } from '@/utils/types/utility-types';

/**
 * Formato de exportación/importación
 */
export enum DataFormat {
	JSON = 'json',
	CSV = 'csv',
	XML = 'xml',
	YAML = 'yaml',
	SQLITE = 'sqlite',
	CUSTOM = 'custom',
}

/**
 * Tipo de operación
 */
export enum OperationType {
	EXPORT = 'export',
	IMPORT = 'import',
	BACKUP = 'backup',
	RESTORE = 'restore',
	MIGRATE = 'migrate',
}

/**
 * Estado de operación
 */
export enum OperationStatus {
	PENDING = 'pending',
	IN_PROGRESS = 'in_progress',
	COMPLETED = 'completed',
	FAILED = 'failed',
	CANCELLED = 'cancelled',
}

/**
 * Opciones de exportación
 */
export interface ExportOptions {
	format: DataFormat;
	includeFiles: boolean;
	includeMetadata: boolean;
	includeThumbnails: boolean;
	compress: boolean;
	encrypt?: boolean;
	password?: string;
	destination: string;
	filter?: {
		startDate?: Date;
		endDate?: Date;
		types?: string[];
		tags?: string[];
		excludeArchived?: boolean;
	};
}

/**
 * Opciones de importación
 */
export interface ImportOptions {
	format: DataFormat;
	source: string;
	validateData: boolean;
	skipDuplicates: boolean;
	updateExisting: boolean;
	importFiles: boolean;
	importMetadata: boolean;
	decrypt?: boolean;
	password?: string;
}

/**
 * Operación de importación/exportación
 */
export interface DataOperation {
	id: EntityId;
	type: OperationType;
	status: OperationStatus;
	format: DataFormat;
	options: JSONString<ExportOptions | ImportOptions>;
	progress: number;
	totalItems: number;
	processedItems: number;
	errors: string[];
	startedAt: Date;
	completedAt?: Date;
	error?: string;
	metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Resultado de operación
 */
export interface OperationResult {
	success: boolean;
	operation: DataOperation;
	summary: {
		totalItems: number;
		processedItems: number;
		successfulItems: number;
		failedItems: number;
		skippedItems: number;
		duration: number;
	};
	errors: Array<{
		item: string;
		error: string;
	}>;
}

// Validaciones Zod
export const dataFormatSchema = z.nativeEnum(DataFormat);
export const operationTypeSchema = z.nativeEnum(OperationType);
export const operationStatusSchema = z.nativeEnum(OperationStatus);

export const exportOptionsSchema = z.object({
	format: dataFormatSchema,
	includeFiles: z.boolean(),
	includeMetadata: z.boolean(),
	includeThumbnails: z.boolean(),
	compress: z.boolean(),
	encrypt: z.boolean().optional(),
	password: z.string().optional(),
	destination: z.string(),
	filter: z
		.object({
			startDate: z.date().optional(),
			endDate: z.date().optional(),
			types: z.array(z.string()).optional(),
			tags: z.array(z.string()).optional(),
			excludeArchived: z.boolean().optional(),
		})
		.optional(),
});

export const importOptionsSchema = z.object({
	format: dataFormatSchema,
	source: z.string(),
	validateData: z.boolean(),
	skipDuplicates: z.boolean(),
	updateExisting: z.boolean(),
	importFiles: z.boolean(),
	importMetadata: z.boolean(),
	decrypt: z.boolean().optional(),
	password: z.string().optional(),
});

export const dataOperationSchema = z.object({
	id: z.string(),
	type: operationTypeSchema,
	status: operationStatusSchema,
	format: dataFormatSchema,
	options: z.string(),
	progress: z.number().min(0).max(100),
	totalItems: z.number().nonnegative(),
	processedItems: z.number().nonnegative(),
	errors: z.array(z.string()),
	startedAt: z.date(),
	completedAt: z.date().optional(),
	error: z.string().optional(),
	metadata: z.string().optional(),
});

export const operationResultSchema = z.object({
	success: z.boolean(),
	operation: dataOperationSchema,
	summary: z.object({
		totalItems: z.number().nonnegative(),
		processedItems: z.number().nonnegative(),
		successfulItems: z.number().nonnegative(),
		failedItems: z.number().nonnegative(),
		skippedItems: z.number().nonnegative(),
		duration: z.number().nonnegative(),
	}),
	errors: z.array(
		z.object({
			item: z.string(),
			error: z.string(),
		})
	),
});

// Tipos inferidos
export type ExportOptionsValidated = z.infer<typeof exportOptionsSchema>;
export type ImportOptionsValidated = z.infer<typeof importOptionsSchema>;
export type DataOperationValidated = z.infer<typeof dataOperationSchema>;
export type OperationResultValidated = z.infer<typeof operationResultSchema>;
