'use server';

/**
 * @file Exporta todas las acciones de Activity
 * @module app/actions/activity
 */

import * as ActivityActions from './activity.actions';

// Re-exportamos cada función como asíncrona para cumplir con las restricciones de 'use server'
export const getFilteredActivities = ActivityActions.getFilteredActivities;
export const logActivity = ActivityActions.logActivity;
export const getRecentActivities = ActivityActions.getRecentActivities;
export const getActivityById = ActivityActions.getActivityById;
export const deleteActivity = ActivityActions.deleteActivity;
export const getActivitiesByImage = ActivityActions.getActivitiesByImage;
export const cleanupOldActivities = ActivityActions.cleanupOldActivities;
export const getActivitiesByType = ActivityActions.getActivitiesByType;
export const createActivity = ActivityActions.createActivity;
