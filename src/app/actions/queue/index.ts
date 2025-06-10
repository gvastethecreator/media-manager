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
export const createJob = CrudActions.createJob;
export const updateJob = CrudActions.updateJob;
export const deleteJob = CrudActions.deleteJob;

// De process.actions
export const processJob = ProcessActions.processJob;
export const retryJob = ProcessActions.retryJob;
export const cancelJob = ProcessActions.cancelJob;

// De query.actions
export const getJobs = QueryActions.getJobs;
export const getJob = QueryActions.getJob;
export const getQueueStatus = QueryActions.getQueueStatus;

// De stats.actions
export const getQueueStats = StatsActions.getQueueStats;
