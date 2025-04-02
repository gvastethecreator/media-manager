'use server';

/**
 * @file Exporta todas las acciones relacionadas con grupos
 * @module app/actions/groups
 */

import * as GroupActions from './group.actions';

// Re-exportar funciones individuales
export async function getGroups() {
  return GroupActions.getGroups();
}

export async function getGroup(id: string) {
  return GroupActions.getGroup(id);
}

export async function createGroup(data: any) {
  return GroupActions.createGroup(data);
}

export async function updateGroup(id: string, data: any) {
  return GroupActions.updateGroup(id, data);
}

export async function deleteGroup(id: string) {
  return GroupActions.deleteGroup(id);
}

export async function toggleGroupFavorite(id: string) {
  return GroupActions.toggleGroupFavorite(id);
}
