/**
 * @file Exportación principal del servicio de álbumes
 * @module services/album-service-export
 * @description Este archivo facilita la importación del servicio en distintos contextos
 */

import albumService, {
    addImageToAlbumService,
    ALBUM_EVENTS,
    AlbumErrorCode,
    createAlbumError,
    createAlbumService,
    deleteAlbumService,
    getAlbumService,
    getAlbumStatsService,
    notifyAlbumChange,
    removeImageFromAlbumService,
    searchAlbumsService,
    updateAlbumService
} from './album.service';

export {
    addImageToAlbumService, ALBUM_EVENTS, AlbumErrorCode, createAlbumError, createAlbumService, deleteAlbumService, getAlbumService, getAlbumStatsService, notifyAlbumChange, removeImageFromAlbumService, searchAlbumsService, updateAlbumService
};

export default albumService;