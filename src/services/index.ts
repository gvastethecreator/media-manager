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

// Entidades organizacionales - Solo las que existen
export * from './album/index';
export * from './collection/index';
// Servicios individuales que existen
export * from './concept.service';
// Servicios del sistema - Solo los que existen
export * from './file/index';
// Entidades base - Solo las que existen
export * from './folder/index';
export * from './group/index';
export * from './image/index';
export * from './note.service';
export * from './profile/index';
export * from './prompt.service';
export * from './settings/index';
export * from './stats.service';
export * from './tag/index';
export * from './task.service';
// export * from './thumbnail.service'; // ❌ DISABLED: Conflicto con ./image/index - usar image/index
export * from './toast.service';
export * from './video/index';
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

	// Servicios individuales
	concept: require('./concept.service'),
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
