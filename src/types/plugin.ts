/**
 * @file Tipos para el sistema de plugins
 * @module types/plugin
 */

import type { EntityId, JSONString } from '@/utils/types/utility-types';
import { z } from 'zod';

/**
 * Estado de plugin
 */
export enum PluginStatus {
    INACTIVE = 'inactive',
    ACTIVE = 'active',
    ERROR = 'error',
    UPDATING = 'updating'
}

/**
 * Tipo de plugin
 */
export enum PluginType {
    PROCESSOR = 'processor',
    TRANSFORMER = 'transformer',
    GENERATOR = 'generator',
    ANALYZER = 'analyzer',
    INTEGRATION = 'integration',
    THEME = 'theme',
    EXTENSION = 'extension'
}

/**
 * Permisos de plugin
 */
export enum PluginPermission {
    READ_FILES = 'read_files',
    WRITE_FILES = 'write_files',
    READ_METADATA = 'read_metadata',
    WRITE_METADATA = 'write_metadata',
    NETWORK_ACCESS = 'network_access',
    SYSTEM_ACCESS = 'system_access'
}

/**
 * Configuración de plugin
 */
export interface PluginConfig {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    homepage?: string;
    repository?: string;
    license?: string;
    type: PluginType;
    permissions: PluginPermission[];
    dependencies?: Record<string, string>;
    settings?: JSONString<Record<string, unknown>>;
}

/**
 * Evento de plugin
 */
export interface PluginEvent {
    id: EntityId;
    pluginId: string;
    type: string;
    payload: JSONString<Record<string, unknown>>;
    timestamp: Date;
}

/**
 * Estado de plugin
 */
export interface PluginState {
    id: string;
    status: PluginStatus;
    installedVersion: string;
    lastUpdated: Date;
    error?: string;
    stats: {
        usageCount: number;
        errorCount: number;
        lastUsed: Date;
    };
}

/**
 * Resultado de operación de plugin
 */
export interface PluginResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: Error;
    metadata?: JSONString<Record<string, unknown>>;
    duration?: number;
}

// Validaciones Zod
export const pluginStatusSchema = z.nativeEnum(PluginStatus);
export const pluginTypeSchema = z.nativeEnum(PluginType);
export const pluginPermissionSchema = z.nativeEnum(PluginPermission);

export const pluginConfigSchema = z.object({
    id: z.string(),
    name: z.string(),
    version: z.string(),
    description: z.string(),
    author: z.string(),
    homepage: z.string().url().optional(),
    repository: z.string().url().optional(),
    license: z.string().optional(),
    type: pluginTypeSchema,
    permissions: z.array(pluginPermissionSchema),
    dependencies: z.record(z.string()).optional(),
    settings: z.string().optional()
});

export const pluginEventSchema = z.object({
    id: z.string(),
    pluginId: z.string(),
    type: z.string(),
    payload: z.string(),
    timestamp: z.date()
});

export const pluginStateSchema = z.object({
    id: z.string(),
    status: pluginStatusSchema,
    installedVersion: z.string(),
    lastUpdated: z.date(),
    error: z.string().optional(),
    stats: z.object({
        usageCount: z.number().nonnegative(),
        errorCount: z.number().nonnegative(),
        lastUsed: z.date()
    })
});

export const pluginResultSchema = z.object({
    success: z.boolean(),
    data: z.unknown().optional(),
    error: z.instanceof(Error).optional(),
    metadata: z.string().optional(),
    duration: z.number().positive().optional()
});

// Tipos inferidos
export type PluginConfigValidated = z.infer<typeof pluginConfigSchema>;
export type PluginEventValidated = z.infer<typeof pluginEventSchema>;
export type PluginStateValidated = z.infer<typeof pluginStateSchema>;
export type PluginResultValidated = z.infer<typeof pluginResultSchema>;