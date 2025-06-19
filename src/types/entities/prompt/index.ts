/**
 * @file Exportaciones principales de tipos para la entidad Prompt
 * @module types/entities/prompt
 */

// Re-exportar todos los tipos desde los módulos correspondientes
export * from './enums';
export * from './extended';
export * from './schema';
export type { PromptComplete as Prompt } from './types';
// Alias común para el tipo principal
export * from './types';
