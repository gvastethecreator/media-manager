/**
 * @file Tipos para la entidad Image y sus relacionados
 * @module types/entities/image
 */

// Exportar todos los tipos base
export * from './base';

// Exportar todos los tipos extendidos
export * from './extended';

// Exportar todos los enums y constantes
export * from './enums';

// Alias común para el tipo principal (usado frecuentemente)
import { ImageExtended } from './extended';
export type Image = ImageExtended;