/**
 * @file services/index.ts
 * @module services
 * @description Exporta todos los servicios del sistema para su uso centralizado
 */

// Entidades base
export * from './folder/index';
export * from './image/index';
export * from './tag/index';
export * from './video/index';

// Entidades organizacionales
export * from './album/index';
export * from './collection/index';
export * from './favorite.service';
export * from './group/index';

// Entidades adicionales
export * from './comment.service';
export * from './exif.service';
export * from './keyword.service';
export * from './metadata.service';

// Servicios del sistema
export * from './file/index';
export * from './thumbnail.service';
export * from './uploaded-image/index';

// Servicios de utilidad
export * from './cache.service';
export * from './indexing.service';
export * from './search.service';

// Servicios de infraestructura
export * from './activity/index';
export * from './auth.service';
export * from './event.service';
export * from './notification.service';
export * from './profile/index';
export * from './queue-job/index';
export * from './settings/index';
export * from './user.service';

/**
 * Objeto centralizado de servicios para un acceso más limpio
 */
export const services = {
	// Entidades base
	folder: require('./folder/index'),
	image: require('./image/index'),
	tag: require('./tag/index'),
	video: require('./video/index'),

	// Entidades organizacionales
	album: require('./album/index'),
	collection: require('./collection/index'),
	group: require('./group/index'),
	favorite: require('./favorite.service'),

	// Entidades adicionales
	metadata: require('./metadata.service'),
	exif: require('./exif.service'),
	keyword: require('./keyword.service'),
	comment: require('./comment.service'),

	// Servicios del sistema
	file: require('./file/index'),
	thumbnail: require('./thumbnail.service'),
	uploadedImage: require('./uploaded-image/index'),

	// Servicios de utilidad
	indexing: require('./indexing.service'),
	search: require('./search.service'),
	cache: require('./cache.service'),

	// Servicios de infraestructura
	event: require('./event.service'),
	notification: require('./notification.service'),
	activity: require('./activity/index'),
	profile: require('./profile/index'),
	settings: require('./settings/index'),
	queueJob: require('./queue-job/index'),
	user: require('./user.service'),
	auth: require('./auth.service'),
};
