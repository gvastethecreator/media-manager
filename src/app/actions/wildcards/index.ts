'use server';

/**
 * @file Exportaciones de server actions para wildcards
 * @module app/actions/wildcards
 */

import * as WildcardActions from './wildcard.actions';

// Exportaciones principales
export const getWildcards = WildcardActions.getWildcards;
export const getWildcard = WildcardActions.getWildcard;
export const createWildcard = WildcardActions.createWildcard;
export const updateWildcard = WildcardActions.updateWildcard;
export const deleteWildcard = WildcardActions.deleteWildcard;
export const getRootWildcards = WildcardActions.getRootWildcards;
export const moveWildcard = WildcardActions.moveWildcard;
