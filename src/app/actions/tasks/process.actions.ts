'use server';

/**
 * @file Process actions for scheduled tasks
 * @module app/actions/tasks/process.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { type ScheduledTask } from '@/types/tasks';
import { revalidatePath } from 'next/cache';

// Logger for process actions
const taskLogger = serverLogger.withContext('TaskProcessActions');

// Paths to revalidate when task state changes
const REVALIDATE_PATHS = [
  '/tasks',
  '/dashboard',
  '/settings/tasks',
];

/**
 * Revalidates all paths affected by task changes
 */
async function revalidateTaskPaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
    taskLogger.info('🔄 Revalidated path:', path);
  }
}

/**
 * Custom error for task process operations
 */
class TaskProcessError extends Error {
  constructor(
    message: string,
    public code?: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'TaskProcessError';
  }
}

/**
 * Starts execution of a task
 */
export async function startTask(id: string): Promise<ScheduledTask> {
  try {
    taskLogger.info('▶️ Starting task execution:', id);

    const task = await prisma.scheduledTask.findUnique({
      where: { id },
    });

    if (!task) {
      throw new TaskProcessError('Task not found', 'TASK_NOT_FOUND');
    }

    if (task.status === 'RUNNING') {
      throw new TaskProcessError('Task is already running', 'TASK_RUNNING');
    }

    const updatedTask = await prisma.scheduledTask.update({
      where: { id },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        error: null,
      },
    });

    await revalidateTaskPaths();
    taskLogger.info('✅ Task started:', { id });
    return updatedTask;
  } catch (error) {
    taskLogger.error('❌ Error starting task:', error);
    throw new TaskProcessError('Failed to start task', 'START_FAILED', error);
  }
}

/**
 * Completes a task execution
 */
export async function completeTask(id: string, result?: unknown): Promise<ScheduledTask> {
  try {
    taskLogger.info('🏁 Completing task:', id);

    const task = await prisma.scheduledTask.findUnique({
      where: { id },
    });

    if (!task) {
      throw new TaskProcessError('Task not found', 'TASK_NOT_FOUND');
    }

    if (task.status !== 'RUNNING') {
      throw new TaskProcessError('Task is not running', 'TASK_NOT_RUNNING');
    }

    // Calculate next run time for recurring tasks
    let nextRunAt: Date | null = null;
    if (task.recurring && task.interval) {
      nextRunAt = new Date();
      nextRunAt.setSeconds(nextRunAt.getSeconds() + task.interval);
    }

    const updatedTask = await prisma.scheduledTask.update({
      where: { id },
      data: {
        status: nextRunAt ? 'SCHEDULED' : 'COMPLETED',
        completedAt: new Date(),
        nextRunAt,
        result: result ? JSON.stringify(result) : null,
        error: null,
        lastRunAt: new Date(),
      },
    });

    await revalidateTaskPaths();
    taskLogger.info('✅ Task completed:', { id, nextRunAt });
    return updatedTask;
  } catch (error) {
    taskLogger.error('❌ Error completing task:', error);
    throw new TaskProcessError('Failed to complete task', 'COMPLETE_FAILED', error);
  }
}

/**
 * Marks a task as failed
 */
export async function failTask(id: string, error: Error | string): Promise<ScheduledTask> {
  try {
    taskLogger.info('❌ Marking task as failed:', id);

    const task = await prisma.scheduledTask.findUnique({
      where: { id },
    });

    if (!task) {
      throw new TaskProcessError('Task not found', 'TASK_NOT_FOUND');
    }

    // Calculate next run time for recurring tasks with retry
    let nextRunAt: Date | null = null;
    if (task.recurring && task.interval && task.retryCount < task.maxRetries) {
      nextRunAt = new Date();
      nextRunAt.setSeconds(nextRunAt.getSeconds() + task.interval);
    }

    const updatedTask = await prisma.scheduledTask.update({
      where: { id },
      data: {
        status: nextRunAt ? 'SCHEDULED' : 'FAILED',
        error: error instanceof Error ? error.message : error,
        nextRunAt,
        lastRunAt: new Date(),
        retryCount: {
          increment: 1,
        },
      },
    });

    await revalidateTaskPaths();
    taskLogger.info('✅ Task marked as failed:', { id, nextRunAt });
    return updatedTask;
  } catch (error) {
    taskLogger.error('❌ Error marking task as failed:', error);
    throw new TaskProcessError('Failed to mark task as failed', 'FAIL_FAILED', error);
  }
}

/**
 * Pauses a running task
 */
export async function pauseTask(id: string): Promise<ScheduledTask> {
  try {
    taskLogger.info('⏸️ Pausing task:', id);

    const task = await prisma.scheduledTask.findUnique({
      where: { id },
    });

    if (!task) {
      throw new TaskProcessError('Task not found', 'TASK_NOT_FOUND');
    }

    if (task.status !== 'RUNNING' && task.status !== 'SCHEDULED') {
      throw new TaskProcessError('Task cannot be paused', 'TASK_NOT_PAUSABLE');
    }

    const updatedTask = await prisma.scheduledTask.update({
      where: { id },
      data: {
        status: 'PAUSED',
      },
    });

    await revalidateTaskPaths();
    taskLogger.info('✅ Task paused:', { id });
    return updatedTask;
  } catch (error) {
    taskLogger.error('❌ Error pausing task:', error);
    throw new TaskProcessError('Failed to pause task', 'PAUSE_FAILED', error);
  }
}

/**
 * Resumes a paused task
 */
export async function resumeTask(id: string): Promise<ScheduledTask> {
  try {
    taskLogger.info('▶️ Resuming task:', id);

    const task = await prisma.scheduledTask.findUnique({
      where: { id },
    });

    if (!task) {
      throw new TaskProcessError('Task not found', 'TASK_NOT_FOUND');
    }

    if (task.status !== 'PAUSED') {
      throw new TaskProcessError('Task is not paused', 'TASK_NOT_PAUSED');
    }

    const updatedTask = await prisma.scheduledTask.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        nextRunAt: new Date(),
      },
    });

    await revalidateTaskPaths();
    taskLogger.info('✅ Task resumed:', { id });
    return updatedTask;
  } catch (error) {
    taskLogger.error('❌ Error resuming task:', error);
    throw new TaskProcessError('Failed to resume task', 'RESUME_FAILED', error);
  }
}

/**
 * Reschedules a task
 */
export async function rescheduleTask(id: string, nextRunAt: Date): Promise<ScheduledTask> {
  try {
    taskLogger.info('🕒 Rescheduling task:', { id, nextRunAt });

    const task = await prisma.scheduledTask.findUnique({
      where: { id },
    });

    if (!task) {
      throw new TaskProcessError('Task not found', 'TASK_NOT_FOUND');
    }

    if (task.status === 'RUNNING') {
      throw new TaskProcessError('Cannot reschedule running task', 'TASK_RUNNING');
    }

    const updatedTask = await prisma.scheduledTask.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        nextRunAt,
      },
    });

    await revalidateTaskPaths();
    taskLogger.info('✅ Task rescheduled:', { id, nextRunAt });
    return updatedTask;
  } catch (error) {
    taskLogger.error('❌ Error rescheduling task:', error);
    throw new TaskProcessError('Failed to reschedule task', 'RESCHEDULE_FAILED', error);
  }
}