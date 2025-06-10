'use server';

/**
 * @file Exporta todas las acciones relacionadas con álbumes
 * @module app/actions/albums
 */

import * as AlbumImagesActions from './album-images.actions';
import * as AlbumActions from './album.actions';

// Re-exportar tipos
export type { AlbumWithStats } from './album.actions';

// Re-exportamos cada función como asíncrona para cumplir con las restricciones de 'use server'
// De album-images.actions
export const getRecentAlbumImages = AlbumImagesActions.getRecentAlbumImages;

// De album.actions
export const getAlbums = AlbumActions.getAlbums;
export const getAlbum = AlbumActions.getAlbum;
export const createAlbum = AlbumActions.createAlbum;
export const updateAlbum = AlbumActions.updateAlbum;
export const deleteAlbum = AlbumActions.deleteAlbum;
export const getAlbumImages = AlbumActions.getAlbumImages;
export const addImageToAlbum = AlbumActions.addImageToAlbum;
export const removeImageFromAlbum = AlbumActions.removeImageFromAlbum;
