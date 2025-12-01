/**
 * @file albums.ts
 * @description Rutas REST para gestión de albums.
 *
 * Endpoints:
 *  - GET    /api/albums              → Listar albums con filtros
 *  - GET    /api/albums/search       → Búsqueda avanzada
 *  - GET    /api/albums/cards        → Tarjetas de albums
 *  - GET    /api/albums/:id          → Obtener album específico
 *  - GET    /api/albums/:id/images   → Obtener imágenes del album
 *  - GET    /api/albums/:id/card-data → Datos para tarjeta de album
 *  - GET    /api/albums/:id/recent-media → Medios recientes
 *  - GET    /api/albums/:id/stats    → Estadísticas de album
 *  - POST   /api/albums              → Crear nuevo album
 *  - PUT    /api/albums/:id          → Actualizar album
 *  - DELETE /api/albums/:id          → Eliminar album
 *  - POST   /api/albums/:id/images/:imageId → Añadir imagen
 *  - DELETE /api/albums/:id/images/:imageId → Quitar imagen
 */

import express from 'express';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	addImageToAlbumHandler,
	createAlbumHandler,
	deleteAlbumHandler,
	getAlbumByIdHandler,
	getAlbumCardDataHandler,
	getAlbumCardsHandler,
	getAlbumImagesHandler,
	getAlbumRecentMediaHandler,
	getAlbumsHandler,
	getAlbumStatsHandler,
	removeImageFromAlbumHandler,
	searchAlbumsHandler,
	updateAlbumHandler,
} from './albums/albums.index';

export const albumsRouter = express.Router();

// Re-export para backward compatibility
export { getAlbumStats } from './albums/albums.utils';
export type { AlbumCardData, AlbumStats, ThumbnailImage } from './albums/albums.types';

// ==========================================
// RUTAS
// ==========================================

// GET - Listar/buscar albums
albumsRouter.get('/', getAlbumsHandler);
albumsRouter.get('/search', searchAlbumsHandler);
albumsRouter.get('/cards', getAlbumCardsHandler);

// GET - Album específico y sus recursos
albumsRouter.get('/:id', getAlbumByIdHandler);
albumsRouter.get('/:id/images', getAlbumImagesHandler);
albumsRouter.get('/:id/card-data', getAlbumCardDataHandler);
albumsRouter.get('/:id/recent-media', getAlbumRecentMediaHandler);
albumsRouter.get('/:id/stats', getAlbumStatsHandler);

// POST - Crear y modificar albums
albumsRouter.post('/', createAlbumHandler);
albumsRouter.put('/:id', updateAlbumHandler);
albumsRouter.delete('/:id', deleteAlbumHandler);

// POST/DELETE - Gestión de imágenes en album
albumsRouter.post('/:id/images/:imageId', addImageToAlbumHandler);
albumsRouter.delete('/:id/images/:imageId', removeImageFromAlbumHandler);

// Middleware de captura de errores específico para albums (debe ir al final)
albumsRouter.use((error: any, req: any, res: any, _next: any) => {
	serverLogger.error('🚨 [ALBUMS ERROR MIDDLEWARE] Error capturado:', error);
	serverLogger.error('🚨 [ALBUMS ERROR MIDDLEWARE] Stack:', error.stack);
	serverLogger.error('🚨 [ALBUMS ERROR MIDDLEWARE] Message:', error.message);
	serverLogger.error('🚨 [ALBUMS ERROR MIDDLEWARE] URL:', req.url);
	serverLogger.error('🚨 [ALBUMS ERROR MIDDLEWARE] Method:', req.method);
	res.status(500).json({ error: 'Error interno del servidor en albums' });
});
