/**
 * @file services/index.ts
 * @module services
 * @description Exporta todos los servicios del sistema para su uso centralizado
 */

// Servicios especializados
export * from './activity/index';
// Entidades base
export * from './album/index';
// Entidades de contenido
export * from './audio/index';
export * from './character/index';
// Servicios del sistema
// Clipboard centralizado. Evitar re-exportaciones duplicadas desde otros barrels.
export * from './clipboard/index';
// Entidades organizacionales
export * from './collection/index';
export * from './concept/index';
export * from './document/index';
export * from './file/index';
export * from './file3d/index';
export * from './folder/index';
export * from './group/index';
export * from './image/index';
export * from './json-file/index';
export * from './metadata/index';
export * from './note/index';
export * from './place/index';
export * from './profile/index';
export * from './property/index';
export * from './queue-job/index';
// Servicios del sistema
export * from './settings/index';
export * from './stats/index';
export * from './tag/index';
export * from './toast/index';
export * from './uploaded-images/index';
export * from './video/index';
export * from './wildcard/index';
export * from './world-item/index';
