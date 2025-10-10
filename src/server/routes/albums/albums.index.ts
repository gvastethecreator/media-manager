/**
 * @file albums.index.ts
 * @module server/routes/albums
 * @description Barrel export para módulos de rutas de albums
 */

// Basic handlers
export {
	addImageToAlbumHandler,
	createAlbumHandler,
	deleteAlbumHandler,
	getAlbumByIdHandler,
	getAlbumImagesHandler,
	removeImageFromAlbumHandler,
	updateAlbumHandler,
} from './albums.handlers';
// Advanced handlers
export {
	getAlbumCardDataHandler,
	getAlbumCardsHandler,
	getAlbumRecentMediaHandler,
	getAlbumStatsHandler,
	getAlbumsHandler,
	searchAlbumsHandler,
} from './albums.handlers-advanced';
// Types
export type { AlbumCardData, AlbumStats, ThumbnailImage } from './albums.types';
// Utils
export { getAlbumStats } from './albums.utils';
export type { AlbumCreate, AlbumFilters, AlbumUpdate } from './albums.validators';
// Validators
export { AlbumCreateSchema, AlbumFiltersSchema, AlbumUpdateSchema } from './albums.validators';
