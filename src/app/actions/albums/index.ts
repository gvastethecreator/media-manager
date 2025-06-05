'use server';

/**
 * @file Exporta todas las acciones relacionadas con álbumes
 * @module app/actions/albums
 */

import * as AlbumImagesActions from './album-images.actions';
import * as AlbumActions from './album.actions';

// Re-exportamos cada función como asíncrona para cumplir con las restricciones de 'use server'
// De album-images.actions
export const getAlbumImages = AlbumImagesActions.getAlbumImages;
export const addImageToAlbum = AlbumImagesActions.addImageToAlbum;
export const removeImageFromAlbum = AlbumImagesActions.removeImageFromAlbum;
export const addImagesToAlbum = AlbumImagesActions.addImagesToAlbum;
export const removeImagesFromAlbum = AlbumImagesActions.removeImagesFromAlbum;

// De album.actions
export const getAlbums = AlbumActions.getAlbums;
export const getAlbum = AlbumActions.getAlbum;
export const createAlbum = AlbumActions.createAlbum;
export const updateAlbum = AlbumActions.updateAlbum;
export const deleteAlbum = AlbumActions.deleteAlbum;
