/**
 * @file Exportaciones principales de tipos para la entidad Image
 * @module types/entities/image
 */

// Exportar tipos base
export * from './base';

// Exportar tipos extendidos para UI y visualización
export * from './extended';

// Exportar tipos completos (con campos JSON deserializados)
export * from './complete';

// Exportar todos los enums y constantes
export * from './enums';

// Alias común para el tipo principal - usando el tipo extendido para mantener consistencia
export type { ImageWithRelationsExtendedComplete as Image } from './complete';
