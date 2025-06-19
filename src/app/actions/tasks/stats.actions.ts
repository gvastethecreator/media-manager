'use server';

/**
 * @file Statistics actions for scheduled tasks
 * @module app/actions/tasks/stats.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

// FIXME: workaround for prisma generate issue
enum TaskType {
	CREATE_THUMBNAILS = 'CREATE_THUMBNAILS',
	PROCESS_UPLOADED_IMAGE = 'PROCESS_UPLOADED_IMAGE',
}
enum TaskStatus {
	PENDING = 'PENDING',
	RUNNING = 'RUNNING',
	COMPLETED = 'COMPLETED',
	FAILED = 'FAILED',
}

const taskLogger = serverLogger.withContext('TaskStatsActions');
const CACHE_REVALIDATE_SECONDS = 30;

export interface TaskStatsErrorData {
	name: string;
	message: string;
	code?: string;
	cause?: unknown;
}

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
	retryAnalysis: {
		avgRetries: number;
		maxRetries: number;
		retriedTasks: number;
		retriedPercentage: number;
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
	byType: Record<
		string,
		{
			count: number;
			percentage: number;
			errorGroups: Record<string, TaskErrorGroup>;
		}
	>;
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

function createTaskStatsError(message: string, code?: string, cause?: unknown): TaskStatsErrorData {
	return {
		name: 'TaskStatsError',
		message,
		code,
		cause,
	};
}

type GroupByStatusResult = { status: TaskStatus; _count: { _all: number } };
type GroupByTypeResult = { type: TaskType; _count: { _all: number } };

export async function getTaskStats(): Promise<TaskStats> {
	const getCachedStats = unstable_cache(
		async () => {
			try {
				taskLogger.info('📊 Getting task statistics');
				const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

				const [totalTasks, statusCounts, typeCounts, completionData] = await Promise.all([
					(prisma.scheduledTask as any).count(),
					(prisma.scheduledTask as any).groupBy({ by: ['status'], _count: { _all: true } }),
					(prisma.scheduledTask as any).groupBy({ by: ['type'], _count: { _all: true } }),
					(prisma.scheduledTask as any).findMany({
						where: { completedAt: { gte: twentyFourHoursAgo } },
						select: { status: true, startedAt: true, completedAt: true },
					}),
				]);

				const statusStats: TaskStatusStats = (statusCounts as GroupByStatusResult[]).reduce(
					(acc, { status, _count }) => {
						acc[status] = _count._all;
						return acc;
					},
					{} as TaskStatusStats,
				);

				const typeStats: TaskTypeStats = (typeCounts as GroupByTypeResult[]).reduce(
					(acc, { type, _count }) => {
						acc[type] = _count._all;
						return acc;
					},
					{} as TaskTypeStats,
				);

				const completedTasks = completionData.filter(
					(task: { status: string; startedAt: Date | null; completedAt: Date | null }) =>
						task.status === 'COMPLETED' && task.startedAt && task.completedAt,
				);

				let totalCompletionTime = 0;
				for (const task of completedTasks) {
					if (task.completedAt && task.startedAt) {
						totalCompletionTime += task.completedAt.getTime() - task.startedAt.getTime();
					}
				}

				const averageCompletionTime = completedTasks.length > 0 ? totalCompletionTime / completedTasks.length : 0;
				const successRate = completionData.length > 0 ? (completedTasks.length / completionData.length) * 100 : 0;

				const stats: TaskStats = {
					total: totalTasks,
					byStatus: statusStats,
					byType: typeStats,
					last24Hours: {
						completed: completedTasks.length,
						averageCompletionTime,
						successRate,
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
		{ revalidate: CACHE_REVALIDATE_SECONDS, tags: ['tasks'] },
	);

	return getCachedStats();
}

export async function getTaskTypeMetrics(type: TaskType): Promise<TaskTypeMetrics> {
	const getCachedMetrics = unstable_cache(
		async () => {
			try {
				taskLogger.info('📊 Getting metrics for task type:', type);
				const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

				const [totalTasks, completedTasksCount, failedTasksCount, completedTasksForAvg] = await Promise.all([
					(prisma.scheduledTask as any).count({ where: { type } }),
					(prisma.scheduledTask as any).count({
						where: { type, status: 'COMPLETED', completedAt: { gte: twentyFourHoursAgo } },
					}),
					(prisma.scheduledTask as any).findMany({
						where: {
							type,
							status: 'COMPLETED',
							completedAt: { gte: twentyFourHoursAgo },
							startedAt: { not: null },
						},
						select: { startedAt: true, completedAt: true },
					}),
					(prisma.scheduledTask as any).count({
						where: { type, status: 'FAILED', completedAt: { gte: twentyFourHoursAgo } },
					}),
				]);

				const totalLast24h = completedTasksCount + failedTasksCount;
				const successRate = totalLast24h > 0 ? (completedTasksCount / totalLast24h) * 100 : 0;

				let totalCompletionTime = 0;
				for (const task of completedTasksForAvg as any[]) {
					if (task.completedAt && task.startedAt) {
						totalCompletionTime += task.completedAt.getTime() - task.startedAt.getTime();
					}
				}

				const averageCompletionTime =
					completedTasksForAvg.length > 0 ? totalCompletionTime / completedTasksForAvg.length : 0;

				const metrics: TaskTypeMetrics = {
					type,
					total: totalTasks,
					last24Hours: {
						completed: completedTasksCount,
						failed: failedTasksCount,
						successRate,
						averageCompletionTime,
					},
					retryAnalysis: {
						avgRetries: 0,
						maxRetries: 0,
						retriedTasks: 0,
						retriedPercentage: 0,
					},
				};

				taskLogger.info('✅ Metrics retrieved for task type:', type);
				return metrics;
			} catch (error) {
				taskLogger.error(`❌ Error getting metrics for task type ${type}:`, error);
				throw createTaskStatsError(`Failed to get metrics for task type ${type}`, 'METRICS_FAILED', error);
			}
		},
		[`task-type-metrics-${type}`],
		{
			revalidate: CACHE_REVALIDATE_SECONDS,
			tags: ['tasks', `task-type-${type}`],
		},
	);

	return getCachedMetrics();
}

export async function getTaskFailureAnalysis(): Promise<TaskFailureAnalysis> {
	const getCachedAnalysis = unstable_cache(
		async () => {
			try {
				taskLogger.info('📊 Getting task failure analysis');

				const failedTasks = await (prisma.scheduledTask as any).findMany({
					where: { status: 'FAILED' },
				});

				const totalFailures = failedTasks.length;
				if (totalFailures === 0) {
					return {
						totalFailures: 0,
						byType: {},
						mostCommonErrors: [],
						retryAnalysis: { avgRetries: 0, maxRetries: 0, retriedTasks: 0, retriedPercentage: 0 },
					};
				}

				const byType: TaskFailureAnalysis['byType'] = {};
				const errorCounts: Record<string, { count: number; types: Set<TaskType> }> = {};
				let totalRetries = 0;
				let maxRetries = 0;
				let retriedTasksCount = 0;

				for (const task of failedTasks) {
					const { type, errorMessage, retryCount } = task as any; // Cast to any to avoid type errors

					if (!byType[type]) {
						byType[type] = { count: 0, percentage: 0, errorGroups: {} };
					}
					byType[type].count++;

					if (errorMessage) {
						if (!byType[type].errorGroups[errorMessage]) {
							byType[type].errorGroups[errorMessage] = {
								count: 0,
								errorMessages: [],
								avgRetryCount: 0,
								maxRetryCount: 0,
							};
						}
						const group = byType[type].errorGroups[errorMessage];
						group.count++;
						group.errorMessages.push(errorMessage);
						group.avgRetryCount = (group.avgRetryCount * (group.count - 1) + retryCount) / group.count;
						group.maxRetryCount = Math.max(group.maxRetryCount, retryCount);

						if (!errorCounts[errorMessage]) {
							errorCounts[errorMessage] = { count: 0, types: new Set() };
						}
						errorCounts[errorMessage].count++;
						errorCounts[errorMessage].types.add(type);
					}

					totalRetries += retryCount;
					maxRetries = Math.max(maxRetries, retryCount);
					if (retryCount > 0) {
						retriedTasksCount++;
					}
				}

				for (const type in byType) {
					byType[type].percentage = (byType[type].count / totalFailures) * 100;
				}

				const mostCommonErrors = Object.entries(errorCounts)
					.sort(([, a], [, b]) => b.count - a.count)
					.slice(0, 10)
					.map(([message, { count, types }]) => ({
						message,
						count,
						types: Array.from(types),
					}));

				const analysis: TaskFailureAnalysis = {
					totalFailures,
					byType,
					mostCommonErrors,
					retryAnalysis: {
						avgRetries: totalFailures > 0 ? totalRetries / totalFailures : 0,
						maxRetries,
						retriedTasks: retriedTasksCount,
						retriedPercentage: totalFailures > 0 ? (retriedTasksCount / totalFailures) * 100 : 0,
					},
				};

				taskLogger.info('✅ Task failure analysis retrieved');
				return analysis;
			} catch (error) {
				taskLogger.error('❌ Error getting task failure analysis:', error);
				throw createTaskStatsError('Failed to get task failure analysis', 'ANALYSIS_FAILED', error);
			}
		},
		['task-failure-analysis'],
		{ revalidate: CACHE_REVALIDATE_SECONDS, tags: ['tasks'] },
	);

	return getCachedAnalysis();
}
