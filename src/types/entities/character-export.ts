/**
 * @file Exportación centralizada de tipos para la entidad Character
 * @module types/entities/character-export
 * @description Punto único de exportación para todos los tipos relacionados con Character
 */

// Exportar todos los tipos desde sus respectivos archivos
export * from '@/types/entities/character/base';
export * from '@/types/entities/character/enums';
export * from '@/types/entities/character/extended';
export * from '@/types/entities/character/schema';
export * from '@/types/entities/character/types';

// Alias común para el tipo principal (para compatibilidad y facilidad de uso)
export type { CharacterWithRelations as Character } from '@/types/entities/character/types';
