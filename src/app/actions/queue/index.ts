'use server';

/**
 * @file Exportaciones de acciones para trabajos en cola
 * @module app/actions/queue
 */

import * as ControlActions from './control.actions';
import * as CrudActions from './crud.actions';
import * as ProcessActions from './process.actions';
import * as QueryActions from './query.actions';
import * as StatsActions from './stats.actions';

// Re-exportamos cada función como asíncrona para cumplir con las restricciones de 'use server'
// De control.actions
// ❌ DISABLED: export const startQueue = ControlActions.startQueue; // Función no existe en ./control.actions
// ❌ DISABLED: export const stopQueue = ControlActions.stopQueue; // Función no existe en ./control.actions
export const pauseQueue = ControlActions.pauseQueue;
export const resumeQueue = ControlActions.resumeQueue;

// De crud.actions
export const createJob = CrudActions.createQueueJob;
export const updateJob = CrudActions.updateQueueJob;
export const deleteJob = CrudActions.deleteQueueJob;

// De process.actions
export const retryJob = ProcessActions.retryQueueJob;
export const cancelJob = ProcessActions.cancelQueueJob;

// De query.actions
export const getJobs = QueryActions.getQueueJobs;
export const getJob = QueryActions.getQueueJob;
export const getJobsByStatus = QueryActions.getQueueJobsByStatus;

// De stats.actions
export const getQueueStats = StatsActions.getQueueStats;
