'use server';

/**
 * @file Exporta todas las acciones relacionadas con colecciones
 * @module app/actions/collections
 */

import * as CollectionActions from './collection.actions';

// Re-exportamos cada función como asíncrona para cumplir con las restricciones de 'use server'
export const getCollections = CollectionActions.getCollections;
export const getCollection = CollectionActions.getCollection;
export const createCollection = CollectionActions.createCollection;
export const updateCollection = CollectionActions.updateCollection;
export const deleteCollection = CollectionActions.deleteCollection;
export const getCollectionImages = CollectionActions.getCollectionImages;
export const addImageToCollection = CollectionActions.addImageToCollection;
export const removeImageFromCollection = CollectionActions.removeImageFromCollection;
export const addCollectionToImage = CollectionActions.addCollectionToImage;
export const removeCollectionFromImage = CollectionActions.removeCollectionFromImage;
