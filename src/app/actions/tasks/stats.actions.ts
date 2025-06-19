'use server';

/**
 * @file Statistics actions for scheduled tasks
 * @module app/actions/tasks/stats.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { type TaskType } from '@/types/tasks';
import { unstable_cache } from 'next/cache';

// Logger for stats actions
const taskLogger = serverLogger.withContext('TaskStatsActions');

// Cache revalidation time in seconds
const CACHE_REVALIDATE_SECONDS = 30;

/**
 * Interfaz para errores de estadísticas de tareas
 */
export interface TaskStatsErrorData {
	name: string;
	message: string;
	code?: string;
	cause?: unknown;
}

/**
 * Interfaces para las respuestas de estadísticas
 */
export interface TaskStatusStats {
	[key: string]: number;
}

export interface TaskTypeStats {
	[key: string]: number;
}

export interface TaskCompletionStats {
	completed: number;
	averageCompletionTime: number;
	successRate: number;
}

export interface TaskStats {
	total: number;
	byStatus: TaskStatusStats;
	byType: TaskTypeStats;
	last24Hours: TaskCompletionStats;
}

export interface TaskTypeMetrics {
	type: TaskType;
	total: number;
	last24Hours: {
		completed: number;
		failed: number;
		successRate: number;
		averageCompletionTime: number;
	};
}

export interface TaskErrorGroup {
	count: number;
	errorMessages: string[];
	avgRetryCount: number;
	maxRetryCount: number;
}

export interface TaskFailureAnalysis {
	totalFailures: number;
	byType: Record<string, {
		count: number;
		percentage: number;
		errorGroups: Record<string, TaskErrorGroup>;
	}>;
	mostCommonErrors: Array<{
		message: string;
		count: number;
		types: string[];
	}>;
	retryAnalysis: {
		avgRetries: number;
		maxRetries: number;
		retriedTasks: number;
		retriedPercentage: number;
	};
}

/**
 * Función para crear errores de estadísticas de tareas (enfoque funcional)
 */
function createTaskStatsError(message: string, code?: string, cause?: unknown): TaskStatsErrorData {
	return {
		name: 'TaskStatsError',
		message,
		code,
		cause,
	};
}

/**
 * Gets overall task statistics
 */
export async function getTaskStats(): Promise<TaskStats> {
	const getCachedStats = unstable_cache(
		async () => {
			try {
				taskLogger.info('📊 Getting task statistics');

				const [totalTasks, statusCounts, typeCounts, completionStats] = await Promise.all([
					// Total number of tasks
					prisma.scheduledTask.count(),

					// Count by status
					prisma.scheduledTask.groupBy({
						by: ['status'],
						_count: true,
					}),

					// Count by type
					prisma.scheduledTask.groupBy({
						by: ['type'],
						_count: true,
					}),

					// Completion stats for the last 24 hours
					prisma.scheduledTask.findMany({
						where: {
							completedAt: {
								gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
							},
						},
						select: {
							status: true,
							startedAt: true,
							completedAt: true,
						},
					}),
				]);

				// Process status counts
				const statusStats = Object.fromEntries(
					statusCounts.map(({ status, _count }) => [status, _count._all])
				);

				// Process type counts
				const typeStats = Object.fromEntries(
					typeCounts.map(({ type, _count }) => [type, _count._all])
				);

				// Calculate completion statistics
				const completedTasks = completionStats.filter(
					(task) => task.status === 'COMPLETED' && task.startedAt && task.completedAt
				);

				const averageCompletionTime =
					completedTasks.length > 0
						? completedTasks.reduce((acc, task) => {
								if (!task.completedAt || !task.startedAt) return acc;
								const duration = task.completedAt.getTime() - task.startedAt.getTime();
								return acc + duration;
							}, 0) / completedTasks.length
						: 0;

				const stats: TaskStats = {
					total: totalTasks,
					byStatus: statusStats,
					byType: typeStats,
					last24Hours: {
						completed: completedTasks.length,
						averageCompletionTime,
						successRate: completionStats.length > 0 ? completedTasks.length / completionStats.length : 0,
					},
				};

				taskLogger.info('✅ Task statistics retrieved');
				return stats;
			} catch (error) {
				taskLogger.error('❌ Error getting task statistics:', error);
				throw createTaskStatsError('Failed to get task statistics', 'STATS_FAILED', error);
			}
		},
		['task-stats'],
		{
			revalidate: CACHE_REVALIDATE_SECONDS,
			tags: ['tasks'],
		}
	);

	return getCachedStats();
}

/**
 * Gets performance metrics for a specific task type
 */
export async function getTaskTypeMetrics(type: TaskType): Promise<TaskTypeMetrics> {
	const getCachedMetrics = unstable_cache(
		async () => {
			try {
				taskLogger.info('📊 Getting metrics for task type:', type);

				const [totalTasks, completedTasks, failedTasks, averageTime] = await Promise.all([
					// Total tasks of this type
					prisma.scheduledTask.count({
						where: { type },
					}),

					// Completed tasks in the last 24 hours
					prisma.scheduledTask.count({
						where: {
							type,
							status: 'COMPLETED',
							completedAt: {
								gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
							},
						},
					}),

					// Failed tasks in the last 24 hours
					prisma.scheduledTask.count({
						where: {
							type,
							status: 'FAILED',
							completedAt: {
								gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
							},
						},
					}),

					// Average completion time
					prisma.scheduledTask.findMany({
						where: {
							type,
							status: 'COMPLETED',
							completedAt: {
								gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
							},
							startedAt: { not: null },
						},
						select: {
							startedAt: true,
							completedAt: true,
						},
					}),
				]);

				// Calculate average completion time
				const avgTime =
					averageTime.length > 0
						? averageTime.reduce((acc, task) => {
								if (!task.completedAt || !task.startedAt) return acc;
								const duration = task.completedAt.getTime() - task.startedAt.getTime();
								return acc + duration;
							}, 0) / averageTime.length
						: 0;

				const metrics: TaskTypeMetrics = {
					type,
					total: totalTasks,
					last24Hours: {
						completed: completedTasks,
						failed: failedTasks,
						successRate: completedTasks + failedTasks > 0 ? completedTasks / (completedTasks + failedTasks) : 0,
						averageCompletionTime: avgTime,
					},
				};

				taskLogger.info('✅ Task type metrics retrieved:', { type });
				return metrics;
			} catch (error) {
				taskLogger.error('❌ Error getting task type metrics:', error);
				throw createTaskStatsError('Failed to get task type metrics', 'METRICS_FAILED', error);
			}
		},
		['task-type-metrics', type],
		{
			revalidate: CACHE_REVALIDATE_SECONDS,
			tags: ['tasks'],
		}
	);

	return getCachedMetrics();
}

/**
 * Gets failure analysis for tasks
 */
export async function getTaskFailureAnalysis(): Promise<TaskFailureAnalysis> {
	const getCachedAnalysis = unstable_cache(
		async () => {
			try {
				taskLogger.info('📊 Analyzing task failures');

				const failedTasks = await prisma.scheduledTask.findMany({
					where: {
						status: 'FAILED',
						completedAt: {
							gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
						},
					},
					select: {
						type: true,
						error: true,
						retryCount: true,
						maxRetries: true,
					},
				});

				// Group failures by type
				const failuresByType: Record<string, {
					count: number;
					percentage: number;
					errorGroups: Record<string, TaskErrorGroup>;
				}> = {};

				// Track most common errors
				const errorCounts: Record<string, { count: number; types: Set<string> }> = {};

				// Retry metrics
				let totalRetries = 0;
				let maxRetries = 0;
				let retriedTasks = 0;

				// Process each failed task
				for (const task of failedTasks) {
					// Skip if no error
					if (!task.error) continue;

					// Get error message
					const errorMessage = typeof task.error === 'string'
						? task.error
						: JSON.stringify(task.error);

					// Get error code (first part of error message before colon)
					const errorCode = errorMessage.split(':')[0].trim();

					// Track by type
					if (!failuresByType[task.type]) {
						failuresByType[task.type] = {
							count: 0,
							percentage: 0,
							errorGroups: {},
						};
					}

					failuresByType[task.type].count++;

					// Track by error code within type
					if (!failuresByType[task.type].errorGroups[errorCode]) {
						failuresByType[task.type].errorGroups[errorCode] = {
							count: 0,
							errorMessages: [],
							avgRetryCount: 0,
							maxRetryCount: 0,
						};
					}

					const errorGroup = failuresByType[task.type].errorGroups[errorCode];
					errorGroup.count++;

					// Only add unique error messages
					if (!errorGroup.errorMessages.includes(errorMessage)) {
						errorGroup.errorMessages.push(errorMessage);
					}

					// Update retry stats for this error group
					const retryCount = task.retryCount || 0;
					errorGroup.avgRetryCount =
						(errorGroup.avgRetryCount * (errorGroup.count - 1) + retryCount) / errorGroup.count;
					errorGroup.maxRetryCount = Math.max(errorGroup.maxRetryCount, retryCount);

					// Track most common errors across all types
					if (!errorCounts[errorCode]) {
						errorCounts[errorCode] = { count: 0, types: new Set() };
					}
					errorCounts[errorCode].count++;
					errorCounts[errorCode].types.add(task.type);

					// Update overall retry metrics
					totalRetries += retryCount;
					maxRetries = Math.max(maxRetries, retryCount);
					if (retryCount > 0) retriedTasks++;
				}

				// Calculate percentages
				const totalFailures = failedTasks.length;
				for (const type of Object.keys(failuresByType)) {
					failuresByType[type].percentage = totalFailures > 0
						? failuresByType[type].count / totalFailures
						: 0;
				}

				// Get most common errors
				const mostCommonErrors = Object.entries(errorCounts)
					.map(([message, { count, types }]) => ({
						message,
						count,
						types: Array.from(types),
					}))
					.sort((a, b) => b.count - a.count)
					.slice(0, 10);

				const analysis: TaskFailureAnalysis = {
					totalFailures,
					byType: failuresByType,
					mostCommonErrors,
					retryAnalysis: {
						avgRetries: totalFailures > 0 ? totalRetries / totalFailures : 0,
						maxRetries,
						retriedTasks,
						retriedPercentage: totalFailures > 0 ? retriedTasks / totalFailures : 0,
					},
				};

				taskLogger.info('✅ Task failure analysis completed');
				return analysis;
			} catch (error) {
				taskLogger.error('❌ Error analyzing task failures:', error);
				throw createTaskStatsError('Failed to analyze task failures', 'ANALYSIS_FAILED', error);
			}
		},
		['task-failure-analysis'],
		{
			revalidate: CACHE_REVALIDATE_SECONDS,
			tags: ['tasks'],
		}
	);

	return getCachedAnalysis();
}
