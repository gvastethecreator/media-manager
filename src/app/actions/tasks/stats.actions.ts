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
 * Custom error for task stats operations
 */
class TaskStatsError extends Error {
  constructor(
    message: string,
    public code?: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'TaskStatsError';
  }
}

/**
 * Gets overall task statistics
 */
export async function getTaskStats() {
  const getCachedStats = unstable_cache(
    async () => {
      try {
        taskLogger.info('📊 Getting task statistics');

        const [
          totalTasks,
          statusCounts,
          typeCounts,
          completionStats,
        ] = await Promise.all([
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
          statusCounts.map(({ status, _count }) => [status, _count])
        );

        // Process type counts
        const typeStats = Object.fromEntries(
          typeCounts.map(({ type, _count }) => [type, _count])
        );

        // Calculate completion statistics
        const completedTasks = completionStats.filter(task =>
          task.status === 'COMPLETED' && task.startedAt && task.completedAt
        );

        const averageCompletionTime = completedTasks.length > 0
          ? completedTasks.reduce((acc, task) => {
              if (!task.completedAt || !task.startedAt) return acc;
              const duration = task.completedAt.getTime() - task.startedAt.getTime();
              return acc + duration;
            }, 0) / completedTasks.length
          : 0;

        const stats = {
          total: totalTasks,
          byStatus: statusStats,
          byType: typeStats,
          last24Hours: {
            completed: completedTasks.length,
            averageCompletionTime,
            successRate: completedTasks.length / completionStats.length || 0,
          },
        };

        taskLogger.info('✅ Task statistics retrieved');
        return stats;
      } catch (error) {
        taskLogger.error('❌ Error getting task statistics:', error);
        throw new TaskStatsError('Failed to get task statistics', 'STATS_FAILED', error);
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
export async function getTaskTypeMetrics(type: TaskType) {
  const getCachedMetrics = unstable_cache(
    async () => {
      try {
        taskLogger.info('📊 Getting metrics for task type:', type);

        const [
          totalTasks,
          completedTasks,
          failedTasks,
          averageTime,
        ] = await Promise.all([
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
        const avgTime = averageTime.length > 0
          ? averageTime.reduce((acc, task) => {
              if (!task.completedAt || !task.startedAt) return acc;
              const duration = task.completedAt.getTime() - task.startedAt.getTime();
              return acc + duration;
            }, 0) / averageTime.length
          : 0;

        const metrics = {
          type,
          total: totalTasks,
          last24Hours: {
            completed: completedTasks,
            failed: failedTasks,
            successRate: completedTasks / (completedTasks + failedTasks) || 0,
            averageCompletionTime: avgTime,
          },
        };

        taskLogger.info('✅ Task type metrics retrieved:', { type });
        return metrics;
      } catch (error) {
        taskLogger.error('❌ Error getting task type metrics:', error);
        throw new TaskStatsError('Failed to get task type metrics', 'METRICS_FAILED', error);
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
export async function getTaskFailureAnalysis() {
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
        const failuresByType = failedTasks.reduce((acc, task) => {
          const type = task.type;
          if (!acc[type]) {
            acc[type] = {
              count: 0,
              errors: {},
              avgRetries: 0,
              totalTasks: 0,
            };
          }

          acc[type].count++;
          acc[type].totalTasks++;
          acc[type].avgRetries += task.retryCount;

          const error = task.error || 'Unknown error';
          acc[type].errors[error] = (acc[type].errors[error] || 0) + 1;

          return acc;
        }, {} as Record<string, {
          count: number;
          errors: Record<string, number>;
          avgRetries: number;
          totalTasks: number;
        }>);

        // Calculate averages and sort errors
        for (const type in failuresByType) {
          const typeStats = failuresByType[type];
          typeStats.avgRetries = typeStats.avgRetries / typeStats.totalTasks;

          // Sort errors by frequency
          const sortedErrors = Object.entries(typeStats.errors)
            .sort(([, a], [, b]) => b - a)
            .reduce((obj, [key, value]) => {
              obj[key] = value;
              return obj;
            }, {} as Record<string, number>);

          typeStats.errors = sortedErrors;
        }

        taskLogger.info('✅ Task failure analysis completed');
        return failuresByType;
      } catch (error) {
        taskLogger.error('❌ Error analyzing task failures:', error);
        throw new TaskStatsError('Failed to analyze task failures', 'ANALYSIS_FAILED', error);
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