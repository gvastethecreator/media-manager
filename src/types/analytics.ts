/**
 * @file Tipos para el sistema de estadísticas y analíticas
 * @module types/analytics
 */

import type { EntityId, JSONString } from '@/utils/types/utility-types';
import { z } from 'zod';

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
 * Categoría de métrica
 */
export enum MetricCategory {
	SYSTEM = 'system',
	PERFORMANCE = 'performance',
	USAGE = 'usage',
	BUSINESS = 'business',
	CUSTOM = 'custom',
}

/**
 * Agregación temporal
 */
export enum TimeAggregation {
	MINUTE = 'minute',
	HOUR = 'hour',
	DAY = 'day',
	WEEK = 'week',
	MONTH = 'month',
	YEAR = 'year',
}

/**
 * Definición de métrica
 */
export interface MetricDefinition {
	id: EntityId;
	name: string;
	description: string;
	type: MetricType;
	category: MetricCategory;
	unit?: string;
	labels?: string[];
	aggregations?: TimeAggregation[];
	retentionPeriod?: number;
}

/**
 * Punto de datos
 */
export interface DataPoint {
	id: EntityId;
	metricId: EntityId;
	timestamp: Date;
	value: number;
	labels?: Record<string, string>;
	metadata?: JSONString<Record<string, unknown>>;
}

/**
 * Serie temporal
 */
export interface TimeSeries {
	metricId: EntityId;
	interval: TimeAggregation;
	startTime: Date;
	endTime: Date;
	dataPoints: DataPoint[];
	statistics: {
		count: number;
		sum: number;
		min: number;
		max: number;
		avg: number;
	};
}

/**
 * Filtros de consulta
 */
export interface AnalyticsQuery {
	metrics: EntityId[];
	timeRange: {
		start: Date;
		end: Date;
	};
	interval?: TimeAggregation;
	filters?: {
		labels?: Record<string, string[]>;
		minValue?: number;
		maxValue?: number;
	};
	limit?: number;
}

/**
 * Resultado de análisis
 */
export interface AnalyticsResult {
	query: AnalyticsQuery;
	series: TimeSeries[];
	metadata: {
		totalPoints: number;
		processedAt: Date;
		duration: number;
	};
}

// Validaciones Zod
export const metricTypeSchema = z.nativeEnum(MetricType);
export const metricCategorySchema = z.nativeEnum(MetricCategory);
export const timeAggregationSchema = z.nativeEnum(TimeAggregation);

export const metricDefinitionSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	type: metricTypeSchema,
	category: metricCategorySchema,
	unit: z.string().optional(),
	labels: z.array(z.string()).optional(),
	aggregations: z.array(timeAggregationSchema).optional(),
	retentionPeriod: z.number().positive().optional(),
});

export const dataPointSchema = z.object({
	id: z.string(),
	metricId: z.string(),
	timestamp: z.date(),
	value: z.number(),
	labels: z.record(z.string()).optional(),
	metadata: z.string().optional(),
});

export const timeSeriesSchema = z.object({
	metricId: z.string(),
	interval: timeAggregationSchema,
	startTime: z.date(),
	endTime: z.date(),
	dataPoints: z.array(dataPointSchema),
	statistics: z.object({
		count: z.number().nonnegative(),
		sum: z.number(),
		min: z.number(),
		max: z.number(),
		avg: z.number(),
	}),
});

export const analyticsQuerySchema = z.object({
	metrics: z.array(z.string()),
	timeRange: z.object({
		start: z.date(),
		end: z.date(),
	}),
	interval: timeAggregationSchema.optional(),
	filters: z
		.object({
			labels: z.record(z.array(z.string())).optional(),
			minValue: z.number().optional(),
			maxValue: z.number().optional(),
		})
		.optional(),
	limit: z.number().positive().optional(),
});

export const analyticsResultSchema = z.object({
	query: analyticsQuerySchema,
	series: z.array(timeSeriesSchema),
	metadata: z.object({
		totalPoints: z.number().nonnegative(),
		processedAt: z.date(),
		duration: z.number().positive(),
	}),
});

// Tipos inferidos
export type MetricDefinitionValidated = z.infer<typeof metricDefinitionSchema>;
export type DataPointValidated = z.infer<typeof dataPointSchema>;
export type TimeSeriesValidated = z.infer<typeof timeSeriesSchema>;
export type AnalyticsQueryValidated = z.infer<typeof analyticsQuerySchema>;
export type AnalyticsResultValidated = z.infer<typeof analyticsResultSchema>;
