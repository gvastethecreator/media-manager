/**
 * @file Exportaciones principales de tipos para la entidad Note
 * @module types/entities/note
 */

export * from './base';
export * from './enums';
export * from './extended';
export * from './note-types';

// Alias común para el tipo principal
export type { NoteWithRelations as Note } from './note-types';

