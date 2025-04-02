'use server';

/**
 * @file Exporta todas las acciones relacionadas con prompts
 * @module app/actions/prompts
 */

import * as PromptActions from './prompt.actions';

// Re-exportar funciones individuales
export async function getPrompts() {
  return PromptActions.getPrompts();
}

export async function getPrompt(id: string) {
  return PromptActions.getPrompt(id);
}

export async function getPromptWithRelations(id: string) {
  return PromptActions.getPromptWithRelations(id);
}

export async function createPrompt(data: any) {
  return PromptActions.createPrompt(data);
}

export async function updatePrompt(id: string, data: any) {
  return PromptActions.updatePrompt(id, data);
}

export async function deletePrompt(id: string) {
  return PromptActions.deletePrompt(id);
}

export async function linkEntityToPrompt(promptId: string, entityId: string, entityType: string) {
  return PromptActions.linkEntityToPrompt(promptId, entityId, entityType);
}

export async function unlinkEntityFromPrompt(promptId: string, entityId: string, entityType: string) {
  return PromptActions.unlinkEntityFromPrompt(promptId, entityId, entityType);
}

export async function getPromptImages(promptId: string) {
  return PromptActions.getPromptImages(promptId);
}

export async function addImageToPrompt(promptId: string, imageId: string) {
  return PromptActions.addImageToPrompt(promptId, imageId);
}

// Exportar interfaz adicional
export type { PromptWithImages } from './prompt.actions';
