'use server';

/**
 * @file Exporta todas las acciones relacionadas con lugares
 * @module app/actions/places
 */

import * as PlaceActions from './place.actions';

// Re-exportamos cada función como asíncrona para cumplir con las restricciones de 'use server'
export const getPlaces = PlaceActions.getPlaces;
export const getPlace = PlaceActions.getPlaceById;
export const createPlace = PlaceActions.createPlace;
export const updatePlace = PlaceActions.updatePlace;
export const deletePlace = PlaceActions.deletePlace;
