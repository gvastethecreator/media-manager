/**
 * @file Tipos para manejo de errores y logging
 * @module types/errors
 */

import type { JSONString } from '@/utils/types/utility-types';
import { z } from 'zod';

/**
 * Códigos de error por categoría
 */
export enum ErrorCode {
	// Errores generales
	UNKNOWN = 'ERR_UNKNOWN',
	VALIDATION = 'ERR_VALIDATION',
	NOT_FOUND = 'ERR_NOT_FOUND',
	UNAUTHORIZED = 'ERR_UNAUTHORIZED',
	FORBIDDEN = 'ERR_FORBIDDEN',
	CONFLICT = 'ERR_CONFLICT',

	// Errores de archivos
	FILE_NOT_FOUND = 'ERR_FILE_NOT_FOUND',
	FILE_TOO_LARGE = 'ERR_FILE_TOO_LARGE',
	INVALID_FILE_TYPE = 'ERR_INVALID_FILE_TYPE',
	FILE_PROCESSING_FAILED = 'ERR_FILE_PROCESSING_FAILED',

	// Errores de base de datos
	DB_CONNECTION = 'ERR_DB_CONNECTION',
	DB_QUERY = 'ERR_DB_QUERY',
	DB_CONSTRAINT = 'ERR_DB_CONSTRAINT',
	DB_TRANSACTION = 'ERR_DB_TRANSACTION',

	// Errores de API
	API_REQUEST = 'ERR_API_REQUEST',
	API_RESPONSE = 'ERR_API_RESPONSE',
	API_TIMEOUT = 'ERR_API_TIMEOUT',
	API_RATE_LIMIT = 'ERR_API_RATE_LIMIT',
}

/**
 * Nivel de severidad de error
 */
export enum ErrorSeverity {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
	CRITICAL = 'critical',
}

/**
 * Error base de la aplicación
 */
export interface AppError extends Error {
	code: ErrorCode;
	severity: ErrorSeverity;
	metadata: JSONString<Record<string, unknown>>;
	timestamp: Date;
	stack?: string;
	cause?: Error;
}

/**
 * Error de validación
 */
export interface ValidationError extends AppError {
	code: ErrorCode.VALIDATION;
	fields: Record<string, string[]>;
}

/**
 * Error de archivo
 */
export interface FileError extends AppError {
	code:
		| ErrorCode.FILE_NOT_FOUND
		| ErrorCode.FILE_TOO_LARGE
		| ErrorCode.INVALID_FILE_TYPE
		| ErrorCode.FILE_PROCESSING_FAILED;
	filePath: string;
	fileSize?: number;
	fileType?: string;
}

/**
 * Error de base de datos
 */
export interface DatabaseError extends AppError {
	code: ErrorCode.DB_CONNECTION | ErrorCode.DB_QUERY | ErrorCode.DB_CONSTRAINT | ErrorCode.DB_TRANSACTION;
	query?: string;
	params?: unknown[];
}

/**
 * Error de API
 */
export interface APIError extends AppError {
	code: ErrorCode.API_REQUEST | ErrorCode.API_RESPONSE | ErrorCode.API_TIMEOUT | ErrorCode.API_RATE_LIMIT;
	status?: number;
	endpoint?: string;
	method?: string;
}

// Validaciones Zod
export const errorCodeSchema = z.nativeEnum(ErrorCode);
export const errorSeveritySchema = z.nativeEnum(ErrorSeverity);

export const appErrorSchema = z.object({
	name: z.string(),
	message: z.string(),
	code: errorCodeSchema,
	severity: errorSeveritySchema,
	metadata: z.string(),
	timestamp: z.date(),
	stack: z.string().optional(),
	cause: z.instanceof(Error).optional(),
});

export const validationErrorSchema = appErrorSchema.extend({
	code: z.literal(ErrorCode.VALIDATION),
	fields: z.record(z.array(z.string())),
});

export const fileErrorSchema = appErrorSchema.extend({
	code: z.enum([
		ErrorCode.FILE_NOT_FOUND,
		ErrorCode.FILE_TOO_LARGE,
		ErrorCode.INVALID_FILE_TYPE,
		ErrorCode.FILE_PROCESSING_FAILED,
	]),
	filePath: z.string(),
	fileSize: z.number().optional(),
	fileType: z.string().optional(),
});

export const databaseErrorSchema = appErrorSchema.extend({
	code: z.enum([ErrorCode.DB_CONNECTION, ErrorCode.DB_QUERY, ErrorCode.DB_CONSTRAINT, ErrorCode.DB_TRANSACTION]),
	query: z.string().optional(),
	params: z.array(z.unknown()).optional(),
});

export const apiErrorSchema = appErrorSchema.extend({
	code: z.enum([ErrorCode.API_REQUEST, ErrorCode.API_RESPONSE, ErrorCode.API_TIMEOUT, ErrorCode.API_RATE_LIMIT]),
	status: z.number().optional(),
	endpoint: z.string().optional(),
	method: z.string().optional(),
});

// Tipos inferidos
export type AppErrorValidated = z.infer<typeof appErrorSchema>;
export type ValidationErrorValidated = z.infer<typeof validationErrorSchema>;
export type FileErrorValidated = z.infer<typeof fileErrorSchema>;
export type DatabaseErrorValidated = z.infer<typeof databaseErrorSchema>;
export type APIErrorValidated = z.infer<typeof apiErrorSchema>;
