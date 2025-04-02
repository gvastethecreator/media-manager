'use server';

/**
 * @file Exporta todas las acciones relacionadas con comodines
 * @module app/actions/wildcards
 */

import * as WildcardActions from './wildcard.actions';

// Re-exportamos cada función como asíncrona para cumplir con las restricciones de 'use server'
export const getWildcards = WildcardActions.getWildcards;
export const getWildcard = WildcardActions.getWildcard;
export const createWildcard = WildcardActions.createWildcard;
export const updateWildcard = WildcardActions.updateWildcard;
export const deleteWildcard = WildcardActions.deleteWildcard;
export const getWildcardImages = WildcardActions.getWildcardImages;
export const addImageToWildcard = WildcardActions.addImageToWildcard;
export const removeImageFromWildcard = WildcardActions.removeImageFromWildcard;
export const getRootWildcards = WildcardActions.getRootWildcards;
