/**
 * @file Exportación principal del servicio de álbumes
 * @module services/album-service-export
 * @description Este archivo facilita la importación del servicio en distintos contextos
 * @updated 2025-01-27
 */

import albumService, {
    addImageToAlbum,
    createAlbum,
    deleteAlbum,
    getAlbum,
    getAlbumImages,
    getAlbums,
    removeImageFromAlbum,
    toggleAlbumArchive,
    toggleAlbumPrivacy,
    updateAlbum,
    type CreateAlbumInput,
    type GetAlbumsOptions,
    type GetAlbumsResult,
    type UpdateAlbumInput,
} from './album/album.service';

// Exportaciones nombradas
export {
    addImageToAlbum,
    createAlbum,
    deleteAlbum,
    getAlbum,
    getAlbumImages,
    getAlbums,
    removeImageFromAlbum,
    toggleAlbumArchive,
    toggleAlbumPrivacy,
    updateAlbum,
    type CreateAlbumInput,
    type GetAlbumsOptions,
    type GetAlbumsResult,
    type UpdateAlbumInput
};

// Exportación por defecto
export default albumService;
