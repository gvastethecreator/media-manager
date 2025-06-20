'use server';

/**
 * @file Exporta todas las acciones relacionadas con perfiles
 * @module app/actions/profiles
 */

import type { ProfileBase, ProfileCreateInput, ProfileUpdateInput } from '@/types/entities/profile/types';
import {
	activateProfile as activateProfileAction,
	createProfile as createProfileAction,
	deleteProfile as deleteProfileAction,
	getActiveProfile as getActiveProfileAction,
	getProfile as getProfileAction,
	getProfiles as getProfilesAction,
	updateProfile as updateProfileAction,
} from './profile.actions';

// Re-exportar funciones como funciones async con tipos apropiados
export async function activateProfile(id: string): Promise<void> {
	return activateProfileAction(id);
}

export async function createProfile(data: ProfileCreateInput): Promise<ProfileBase> {
	return createProfileAction(data);
}

export async function deleteProfile(id: string): Promise<void> {
	return deleteProfileAction(id);
}

export async function getActiveProfile(): Promise<ProfileBase | null> {
	return getActiveProfileAction();
}

export async function getProfile(id: string): Promise<ProfileBase> {
	return getProfileAction(id);
}

export async function getProfiles(): Promise<ProfileBase[]> {
	return getProfilesAction();
}

export async function updateProfile(id: string, data: ProfileUpdateInput): Promise<ProfileBase> {
	return updateProfileAction(id, data);
}
