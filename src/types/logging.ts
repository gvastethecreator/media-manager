/**
 * @file Tipos para el sistema de logging
 * @module types/logging
 */

import type { EntityId, JSONString } from '@/utils/types/utility-types';
import { z } from 'zod';

/**
 * Nivel de log
 */
export enum LogLevel {
    TRACE = 'trace',
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    FATAL = 'fatal'
}

/**
 * Categoría de log
 */
export enum LogCategory {
    SYSTEM = 'system',
    APPLICATION = 'application',
    SECURITY = 'security',
    PERFORMANCE = 'performance',
    BUSINESS = 'business',
    AUDIT = 'audit'
}

/**
 * Destino de log
 */
export enum LogTarget {
    CONSOLE = 'console',
    FILE = 'file',
    DATABASE = 'database',
    REMOTE = 'remote',
    CUSTOM = 'custom'
}

/**
 * Entrada de log
 */
export interface LogEntry {
    id: EntityId;
    timestamp: Date;
    level: LogLevel;
    category: LogCategory;
    message: string;
    context?: {
        source: string;
        function?: string;
        line?: number;
        userId?: EntityId;
        requestId?: string;
        traceId?: string;
    };
    metadata?: JSONString<Record<string, unknown>>;
    error?: {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
}

/**
 * Configuración de logger
 */
export interface LoggerConfig {
    name: string;
    enabled: boolean;
    level: LogLevel;
    categories?: LogCategory[];
    targets: Array<{
        type: LogTarget;
        level?: LogLevel;
        format?: string;
        options?: JSONString<Record<string, unknown>>;
    }>;
    metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Filtros de consulta
 */
export interface LogQuery {
    timeRange?: {
        start: Date;
        end: Date;
    };
    levels?: LogLevel[];
    categories?: LogCategory[];
    sources?: string[];
    search?: string;
    limit?: number;
    offset?: number;
    sort?: {
        field: keyof LogEntry;
        order: 'asc' | 'desc';
    };
}

/**
 * Resultado de consulta
 */
export interface LogQueryResult {
    entries: LogEntry[];
    total: number;
    metadata: {
        query: LogQuery;
        duration: number;
        timestamp: Date;
    };
}

// Validaciones Zod
export const logLevelSchema = z.nativeEnum(LogLevel);
export const logCategorySchema = z.nativeEnum(LogCategory);
export const logTargetSchema = z.nativeEnum(LogTarget);

export const logEntrySchema = z.object({
    id: z.string(),
    timestamp: z.date(),
    level: logLevelSchema,
    category: logCategorySchema,
    message: z.string(),
    context: z.object({
        source: z.string(),
        function: z.string().optional(),
        line: z.number().positive().optional(),
        userId: z.string().optional(),
        requestId: z.string().optional(),
        traceId: z.string().optional()
    }).optional(),
    metadata: z.string().optional(),
    error: z.object({
        name: z.string(),
        message: z.string(),
        stack: z.string().optional(),
        cause: z.unknown().optional()
    }).optional()
});

export const loggerConfigSchema = z.object({
    name: z.string(),
    enabled: z.boolean(),
    level: logLevelSchema,
    categories: z.array(logCategorySchema).optional(),
    targets: z.array(z.object({
        type: logTargetSchema,
        level: logLevelSchema.optional(),
        format: z.string().optional(),
        options: z.string().optional()
    })),
    metadata: z.string().optional()
});

export const logQuerySchema = z.object({
    timeRange: z.object({
        start: z.date(),
        end: z.date()
    }).optional(),
    levels: z.array(logLevelSchema).optional(),
    categories: z.array(logCategorySchema).optional(),
    sources: z.array(z.string()).optional(),
    search: z.string().optional(),
    limit: z.number().positive().optional(),
    offset: z.number().nonnegative().optional(),
    sort: z.object({
        field: z.enum(['id', 'timestamp', 'level', 'category', 'message']),
        order: z.enum(['asc', 'desc'])
    }).optional()
});

export const logQueryResultSchema = z.object({
    entries: z.array(logEntrySchema),
    total: z.number().nonnegative(),
    metadata: z.object({
        query: logQuerySchema,
        duration: z.number().positive(),
        timestamp: z.date()
    })
});

// Tipos inferidos
export type LogEntryValidated = z.infer<typeof logEntrySchema>;
export type LoggerConfigValidated = z.infer<typeof loggerConfigSchema>;
export type LogQueryValidated = z.infer<typeof logQuerySchema>;
export type LogQueryResultValidated = z.infer<typeof logQueryResultSchema>;