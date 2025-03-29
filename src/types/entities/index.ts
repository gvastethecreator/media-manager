/**
 * @file Exportaciones de tipos para entidades principales del sistema
 * @module types/entities
 */

// Exportaciones de módulos individuales
export * from './activity';
export * from './album';
export * from './character';
export * from './collection';
export * from './concept';
export * from './favorite';
export * from './file';
export * from './folder';
export * from './image';
export * from './metadata';
export * from './note';
export * from './place';
export * from './profile';
export * from './prompt';
export * from './tag';
export * from './video';
export * from './world-item';

// Nuevas entidades
export * from './group';
export * from './property';
export * from './wildcard';

// Utilidades y tipos comunes
export * from './queueJob';

// Alias de compatibilidad (mantener para retrocompatibilidad)
// Se recomienda usar las importaciones directas de los módulos respectivos
export * from './albums';
export * from './characters';
export * from './collections';
export * from './concepts';
export * from './entities';
export * from './folders';
export * from './images';
export * from './notes';
export * from './places';
export * from './prompts';
export * from './tags';
export * from './world-items';

