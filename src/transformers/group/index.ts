/**
 * @file Punto de entrada para los transformadores de la entidad Group.
 * @module transformers/group
 * @description Exporta de forma controlada las funciones de mapeo, serialización y transformación para la entidad Group.
 
 */

// Exportar mappers, serializers, validators y schemas
export * from './mappers';
export { toGroupWithStats } from './mappers';
export * from './schema';
export * from './serializers';
// Exportar funciones principales de transformación
export {
	fromDrizzleGroup,
	fromDrizzleGroups,
	toDrizzleGroup,
} from './transformer';
export * from './validators';
