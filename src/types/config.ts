/**
 * @file Tipos para el sistema de configuración global
 * @module types/config
 */

import type { JSONString } from '@/utils/types/utility-types';
import { z } from 'zod';
import { CacheExpirationPolicy } from './cache';
import { LogLevel } from './logging';
import { ThumbnailQuality } from './thumbnails';

/**
 * Tema de la aplicación
 */
export enum AppTheme {
	LIGHT = 'light',
	DARK = 'dark',
	SYSTEM = 'system',
}

/**
 * Idioma de la aplicación
 */
export enum AppLanguage {
	ES = 'es',
	EN = 'en',
}

/**
 * Tipo de valor de configuración
 */
export enum ConfigValueType {
	STRING = 'string',
	NUMBER = 'number',
	BOOLEAN = 'boolean',
	OBJECT = 'object',
	ARRAY = 'array',
}

/**
 * Nivel de configuración
 */
export enum ConfigLevel {
	SYSTEM = 'system',
	USER = 'user',
	WORKSPACE = 'workspace',
}

/**
 * Configuración de interfaz
 */
export interface UIConfig {
	theme: AppTheme;
	language: AppLanguage;
	animations: boolean;
	confirmations: boolean;
	sidebarExpanded: boolean;
	gridColumns: number;
	thumbnailQuality: ThumbnailQuality;
	customCSS?: string;
}

/**
 * Configuración de archivos
 */
export interface FileConfig {
	maxUploadSize: number;
	allowedTypes: string[];
	storageLocation: string;
	thumbnailsLocation: string;
	processingConcurrency: number;
	preserveOriginal: boolean;
	backupEnabled: boolean;
	backupLocation?: string;
}

/**
 * Configuración de seguridad
 */
export interface SecurityConfig {
	allowRegistration: boolean;
	requireEmailVerification: boolean;
	passwordMinLength: number;
	sessionTimeout: number;
	maxLoginAttempts: number;
	rateLimiting: {
		enabled: boolean;
		maxRequests: number;
		timeWindow: number;
	};
}

/**
 * Configuración de servicios externos
 */
export interface ServicesConfig {
	imageMagick: {
		enabled: boolean;
		path?: string;
		defaultQuality: number;
	};
	openAI: {
		enabled: boolean;
		apiKey?: string;
		model: string;
	};
	email: {
		enabled: boolean;
		provider: string;
		apiKey?: string;
		fromAddress: string;
	};
}

/**
 * Configuración de sistema
 */
export interface SystemConfig {
	logLevel: LogLevel;
	cache: {
		enabled: boolean;
		storage: CacheStorage;
		expiration: CacheExpirationPolicy;
		maxSize: number;
	};
	maintenance: {
		enabled: boolean;
		message?: string;
		allowedIPs?: string[];
	};
	metrics: {
		enabled: boolean;
		retentionDays: number;
	};
}

/**
 * Entrada de configuración
 */
export interface ConfigEntry {
	key: string;
	value: JSONString<unknown>;
	type: ConfigValueType;
	level: ConfigLevel;
	description?: string;
	defaultValue?: JSONString<unknown>;
	validation?: {
		required?: boolean;
		min?: number;
		max?: number;
		pattern?: string;
		enum?: string[];
	};
	metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Grupo de configuración
 */
export interface ConfigGroup {
	name: string;
	description?: string;
	entries: Record<string, ConfigEntry>;
	metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Configuración global
 */
export interface GlobalConfig {
	version: string;
	groups: Record<string, ConfigGroup>;
	metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Operación de configuración
 */
export interface ConfigOperation {
	type: 'get' | 'set' | 'delete';
	key: string;
	value?: JSONString<unknown>;
	level?: ConfigLevel;
	metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Resultado de operación
 */
export interface ConfigResult {
	success: boolean;
	value?: JSONString<unknown>;
	error?: string;
	metadata?: {
		operation: ConfigOperation;
		timestamp: Date;
	};
}

/**
 * Configuración completa
 */
export interface AppConfig {
	ui: UIConfig;
	files: FileConfig;
	security: SecurityConfig;
	services: ServicesConfig;
	system: SystemConfig;
	customization: JSONString<Record<string, unknown>>;
}

// Validaciones Zod
export const appThemeSchema = z.nativeEnum(AppTheme);
export const appLanguageSchema = z.nativeEnum(AppLanguage);

export const uiConfigSchema = z.object({
	theme: appThemeSchema,
	language: appLanguageSchema,
	animations: z.boolean(),
	confirmations: z.boolean(),
	sidebarExpanded: z.boolean(),
	gridColumns: z.number().int().min(1).max(12),
	thumbnailQuality: z.nativeEnum(ThumbnailQuality),
	customCSS: z.string().optional(),
});

export const fileConfigSchema = z.object({
	maxUploadSize: z.number().positive(),
	allowedTypes: z.array(z.string()),
	storageLocation: z.string(),
	thumbnailsLocation: z.string(),
	processingConcurrency: z.number().positive(),
	preserveOriginal: z.boolean(),
	backupEnabled: z.boolean(),
	backupLocation: z.string().optional(),
});

export const securityConfigSchema = z.object({
	allowRegistration: z.boolean(),
	requireEmailVerification: z.boolean(),
	passwordMinLength: z.number().int().min(6),
	sessionTimeout: z.number().positive(),
	maxLoginAttempts: z.number().int().positive(),
	rateLimiting: z.object({
		enabled: z.boolean(),
		maxRequests: z.number().positive(),
		timeWindow: z.number().positive(),
	}),
});

export const servicesConfigSchema = z.object({
	imageMagick: z.object({
		enabled: z.boolean(),
		path: z.string().optional(),
		defaultQuality: z.number().min(1).max(100),
	}),
	openAI: z.object({
		enabled: z.boolean(),
		apiKey: z.string().optional(),
		model: z.string(),
	}),
	email: z.object({
		enabled: z.boolean(),
		provider: z.string(),
		apiKey: z.string().optional(),
		fromAddress: z.string().email(),
	}),
});

export const systemConfigSchema = z.object({
	logLevel: z.nativeEnum(LogLevel),
	cache: z.object({
		enabled: z.boolean(),
		storage: z.nativeEnum(CacheStorage),
		expiration: z.nativeEnum(CacheExpirationPolicy),
		maxSize: z.number().positive(),
	}),
	maintenance: z.object({
		enabled: z.boolean(),
		message: z.string().optional(),
		allowedIPs: z.array(z.string()).optional(),
	}),
	metrics: z.object({
		enabled: z.boolean(),
		retentionDays: z.number().int().positive(),
	}),
});

export const configValueTypeSchema = z.nativeEnum(ConfigValueType);
export const configLevelSchema = z.nativeEnum(ConfigLevel);

export const configValidationSchema = z.object({
	required: z.boolean().optional(),
	min: z.number().optional(),
	max: z.number().optional(),
	pattern: z.string().optional(),
	enum: z.array(z.string()).optional(),
});

export const configEntrySchema = z.object({
	key: z.string(),
	value: z.string(),
	type: configValueTypeSchema,
	level: configLevelSchema,
	description: z.string().optional(),
	defaultValue: z.string().optional(),
	validation: configValidationSchema.optional(),
	metadata: z.string().optional(),
});

export const configGroupSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	entries: z.record(configEntrySchema),
	metadata: z.string().optional(),
});

export const globalConfigSchema = z.object({
	version: z.string(),
	groups: z.record(configGroupSchema),
	metadata: z.string().optional(),
});

export const configOperationSchema = z.object({
	type: z.enum(['get', 'set', 'delete']),
	key: z.string(),
	value: z.string().optional(),
	level: configLevelSchema.optional(),
	metadata: z.string().optional(),
});

export const configResultSchema = z.object({
	success: z.boolean(),
	value: z.string().optional(),
	error: z.string().optional(),
	metadata: z
		.object({
			operation: configOperationSchema,
			timestamp: z.date(),
		})
		.optional(),
});

export const appConfigSchema = z.object({
	ui: uiConfigSchema,
	files: fileConfigSchema,
	security: securityConfigSchema,
	services: servicesConfigSchema,
	system: systemConfigSchema,
	customization: z.string(),
});

// Tipos inferidos
export type UIConfigValidated = z.infer<typeof uiConfigSchema>;
export type FileConfigValidated = z.infer<typeof fileConfigSchema>;
export type SecurityConfigValidated = z.infer<typeof securityConfigSchema>;
export type ServicesConfigValidated = z.infer<typeof servicesConfigSchema>;
export type SystemConfigValidated = z.infer<typeof systemConfigSchema>;
export type AppConfigValidated = z.infer<typeof appConfigSchema>;
export type ConfigEntryValidated = z.infer<typeof configEntrySchema>;
export type ConfigGroupValidated = z.infer<typeof configGroupSchema>;
export type GlobalConfigValidated = z.infer<typeof globalConfigSchema>;
export type ConfigOperationValidated = z.infer<typeof configOperationSchema>;
export type ConfigResultValidated = z.infer<typeof configResultSchema>;
