/**
 * @file Tipos para la entidad Folder y sus relacionados
 * @module types/entities/folder
 */

// Exportar todos los tipos base
export * from './base';

// Exportar todos los tipos extendidos
export * from './extended';

// Exportar todos los enums y constantes
export * from './enums';

// Alias común para el tipo principal (usado frecuentemente)
import type { FolderExtended } from './extended';
export type Folder = FolderExtended;