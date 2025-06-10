/**
 * @file services/index.ts
 * @module services
 * @description Exporta todos los servicios del sistema para su uso centralizado
 */

/**
 * @file services/index.ts
 * @module services
 * @description Exporta todos los servicios del sistema para su uso centralizado
 */

// Entidades base - Solo las que existen
export * from './folder/index';
export * from './image/index';
export * from './tag/index';
export * from './video/index';

// Entidades organizacionales - Solo las que existen
export * from './album/index';
export * from './collection/index';
export * from './favorite.service';
export * from './group/index';

// Servicios individuales que existen
export * from './concept.service';
export * from './favorites.service';
export * from './note.service';
export * from './prompt.service';
export * from './stats.service';
export * from './task.service';
// export * from './thumbnail.service'; // ❌ DISABLED: Conflicto con ./image/index - usar image/index
export * from './toast.service';

// Servicios del sistema - Solo los que existen
export * from './file/index';
export * from './profile/index';
export * from './settings/index';
// export * from './stats/index'; // ❌ DISABLED: archivo no existe

/**
 * Objeto centralizado de servicios para un acceso más limpio
 * Solo incluye servicios que realmente existen
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

	// Servicios individuales
	concept: require('./concept.service'),
	favorites: require('./favorites.service'),
	note: require('./note.service'),
	prompt: require('./prompt.service'),
	stats: require('./stats.service'),
	task: require('./task.service'),
	toast: require('./toast.service'),

	// Servicios del sistema
	file: require('./file/index'),
	profile: require('./profile/index'),
	settings: require('./settings/index'),
};
