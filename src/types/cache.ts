/**
 * @file Tipos para el sistema de caché
 * @module types/cache
 */

import type { EntityId, JSONString } from '@/utils/types/utility-types';
import { z } from 'zod';

/**
 * Política de expiración
 */
export enum CacheExpirationPolicy {
	NEVER = 'never',
	TIME_TO_LIVE = 'ttl',
	TIME_TO_IDLE = 'tti',
	SLIDING_WINDOW = 'sliding',
}

/**
 * Política de evicción
 */
export enum CacheEvictionPolicy {
	NONE = 'none',
	LRU = 'lru',
	LFU = 'lfu',
	FIFO = 'fifo',
}

/**
 * Estado de entrada de caché
 */
export enum CacheEntryStatus {
	VALID = 'valid',
	EXPIRED = 'expired',
	INVALIDATED = 'invalidated',
}

/**
 * Nivel de caché
 */
export enum CacheLevel {
	MEMORY = 'memory',
	DISK = 'disk',
	REMOTE = 'remote',
}

/**
 * Entrada de caché
 */
export interface CacheEntry<T = unknown> {
	id: EntityId;
	key: string;
	value: JSONString<T>;
	type: string;
	level: CacheLevel;
	status: CacheEntryStatus;
	size: number;
	hits: number;
	createdAt: Date;
	updatedAt: Date;
	accessedAt: Date;
	expiresAt?: Date;
	metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Configuración de caché
 */
export interface CacheConfig {
	name: string;
	enabled: boolean;
	levels: CacheLevel[];
	maxSize: number;
	maxEntries?: number;
	expirationPolicy: CacheExpirationPolicy;
	evictionPolicy: CacheEvictionPolicy;
	defaultTTL?: number;
	compression?: boolean;
	encryption?: boolean;
	metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Estadísticas de caché
 */
export interface CacheStats {
	size: number;
	entries: number;
	hits: number;
	misses: number;
	evictions: number;
	hitRate: number;
	avgAccessTime: number;
	lastEvictionTime?: Date;
	byLevel: Record<
		CacheLevel,
		{
			size: number;
			entries: number;
			hits: number;
		}
	>;
}

/**
 * Resultado de operación de caché
 */
export interface CacheResult<T = unknown> {
	success: boolean;
	entry?: CacheEntry<T>;
	error?: string;
	metadata?: {
		operation: string;
		duration: number;
		timestamp: Date;
	};
}

// Validaciones Zod
export const cacheExpirationPolicySchema = z.nativeEnum(CacheExpirationPolicy);
export const cacheEvictionPolicySchema = z.nativeEnum(CacheEvictionPolicy);
export const cacheEntryStatusSchema = z.nativeEnum(CacheEntryStatus);
export const cacheLevelSchema = z.nativeEnum(CacheLevel);

export const cacheEntrySchema = z.object({
	id: z.string(),
	key: z.string(),
	value: z.string(),
	type: z.string(),
	level: cacheLevelSchema,
	status: cacheEntryStatusSchema,
	size: z.number().nonnegative(),
	hits: z.number().nonnegative(),
	createdAt: z.date(),
	updatedAt: z.date(),
	accessedAt: z.date(),
	expiresAt: z.date().optional(),
	metadata: z.string().optional(),
});

export const cacheConfigSchema = z.object({
	name: z.string(),
	enabled: z.boolean(),
	levels: z.array(cacheLevelSchema),
	maxSize: z.number().positive(),
	maxEntries: z.number().positive().optional(),
	expirationPolicy: cacheExpirationPolicySchema,
	evictionPolicy: cacheEvictionPolicySchema,
	defaultTTL: z.number().positive().optional(),
	compression: z.boolean().optional(),
	encryption: z.boolean().optional(),
	metadata: z.string().optional(),
});

export const cacheStatsSchema = z.object({
	size: z.number().nonnegative(),
	entries: z.number().nonnegative(),
	hits: z.number().nonnegative(),
	misses: z.number().nonnegative(),
	evictions: z.number().nonnegative(),
	hitRate: z.number().min(0).max(1),
	avgAccessTime: z.number().positive(),
	lastEvictionTime: z.date().optional(),
	byLevel: z.record(
		z.object({
			size: z.number().nonnegative(),
			entries: z.number().nonnegative(),
			hits: z.number().nonnegative(),
		})
	),
});

export const cacheResultSchema = z.object({
	success: z.boolean(),
	entry: cacheEntrySchema.optional(),
	error: z.string().optional(),
	metadata: z
		.object({
			operation: z.string(),
			duration: z.number().positive(),
			timestamp: z.date(),
		})
		.optional(),
});

// Tipos inferidos
export type CacheEntryValidated = z.infer<typeof cacheEntrySchema>;
export type CacheConfigValidated = z.infer<typeof cacheConfigSchema>;
export type CacheStatsValidated = z.infer<typeof cacheStatsSchema>;
export type CacheResultValidated = z.infer<typeof cacheResultSchema>;
