'use server';

/**
 * @file Exporta todas las acciones relacionadas con perfiles
 * @module app/actions/profiles
 */

import {
    activateProfile as activateProfileAction,
    createProfile as createProfileAction,
    deleteProfile as deleteProfileAction,
    getActiveProfile as getActiveProfileAction,
    getProfile as getProfileAction,
    getProfiles as getProfilesAction,
    updateProfile as updateProfileAction
} from './profile.actions';

// Re-exportar funciones como funciones async
export async function activateProfile(id: string) {
  return activateProfileAction(id);
}

export async function createProfile(data: any) {
  return createProfileAction(data);
}

export async function deleteProfile(id: string) {
  return deleteProfileAction(id);
}

export async function getActiveProfile() {
  return getActiveProfileAction();
}

export async function getProfile(id: string) {
  return getProfileAction(id);
}

export async function getProfiles(filters?: any, pagination?: any) {
  return getProfilesAction(filters, pagination);
}

export async function updateProfile(id: string, data: any) {
  return updateProfileAction(id, data);
}
