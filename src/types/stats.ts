/**
 * @file Tipos para estadísticas y análisis
 * @module types/stats
 */

import type { EntityId } from '@/utils/types/utility-types';
import { z } from 'zod';

/**
 * Período de tiempo para estadísticas
 */
export enum StatsPeriod {
	HOUR = 'hour',
	DAY = 'day',
	WEEK = 'week',
	MONTH = 'month',
	YEAR = 'year',
	CUSTOM = 'custom',
}

/**
 * Tipo de métrica
 */
export enum MetricType {
	COUNTER = 'counter',
	GAUGE = 'gauge',
	HISTOGRAM = 'histogram',
	SUMMARY = 'summary',
}

/**
 * Estadísticas básicas
 */
export interface BaseStats {
	count: number;
	total: number;
	min: number;
	max: number;
	avg: number;
	median: number;
	stdDev: number;
}

/**
 * Estadísticas de sistema
 */
export interface SystemStats {
	cpu: {
		usage: number;
		load: number[];
	};
	memory: {
		total: number;
		used: number;
		free: number;
	};
	disk: {
		total: number;
		used: number;
		free: number;
	};
	process: {
		uptime: number;
		memory: number;
		cpu: number;
	};
}

/**
 * Estadísticas de uso
 */
export interface UsageStats {
	totalUsers: number;
	activeUsers: number;
	storageUsed: number;
	filesProcessed: number;
	avgProcessingTime: number;
	errorRate: number;
	requestsPerMinute: number;
}

/**
 * Métricas de rendimiento
 */
export interface PerformanceMetrics {
	responseTime: BaseStats;
	throughput: BaseStats;
	errorRate: BaseStats;
	concurrentUsers: BaseStats;
	resourceUtilization: {
		cpu: BaseStats;
		memory: BaseStats;
		disk: BaseStats;
		network: BaseStats;
	};
}

/**
 * Punto de datos de serie temporal
 */
export interface TimeSeriesDataPoint {
	timestamp: Date;
	value: number;
	metadata?: Record<string, unknown>;
}

/**
 * Serie temporal
 */
export interface TimeSeries {
	id: EntityId;
	name: string;
	metricType: MetricType;
	unit: string;
	dataPoints: TimeSeriesDataPoint[];
	startTime: Date;
	endTime: Date;
	resolution: string;
}

// Validaciones Zod
export const statsPeriodSchema = z.nativeEnum(StatsPeriod);
export const metricTypeSchema = z.nativeEnum(MetricType);

export const baseStatsSchema = z.object({
	count: z.number().nonnegative(),
	total: z.number(),
	min: z.number(),
	max: z.number(),
	avg: z.number(),
	median: z.number(),
	stdDev: z.number(),
});

export const systemStatsSchema = z.object({
	cpu: z.object({
		usage: z.number().min(0).max(100),
		load: z.array(z.number()),
	}),
	memory: z.object({
		total: z.number().positive(),
		used: z.number().nonnegative(),
		free: z.number().nonnegative(),
	}),
	disk: z.object({
		total: z.number().positive(),
		used: z.number().nonnegative(),
		free: z.number().nonnegative(),
	}),
	process: z.object({
		uptime: z.number().nonnegative(),
		memory: z.number().nonnegative(),
		cpu: z.number().min(0).max(100),
	}),
});

export const usageStatsSchema = z.object({
	totalUsers: z.number().nonnegative(),
	activeUsers: z.number().nonnegative(),
	storageUsed: z.number().nonnegative(),
	filesProcessed: z.number().nonnegative(),
	avgProcessingTime: z.number().nonnegative(),
	errorRate: z.number().min(0).max(100),
	requestsPerMinute: z.number().nonnegative(),
});

export const timeSeriesDataPointSchema = z.object({
	timestamp: z.date(),
	value: z.number(),
	metadata: z.record(z.unknown()).optional(),
});

export const timeSeriesSchema = z.object({
	id: z.string(),
	name: z.string(),
	metricType: metricTypeSchema,
	unit: z.string(),
	dataPoints: z.array(timeSeriesDataPointSchema),
	startTime: z.date(),
	endTime: z.date(),
	resolution: z.string(),
});

// Tipos inferidos
export type BaseStatsValidated = z.infer<typeof baseStatsSchema>;
export type SystemStatsValidated = z.infer<typeof systemStatsSchema>;
export type UsageStatsValidated = z.infer<typeof usageStatsSchema>;
export type TimeSeriesDataPointValidated = z.infer<typeof timeSeriesDataPointSchema>;
export type TimeSeriesValidated = z.infer<typeof timeSeriesSchema>;
