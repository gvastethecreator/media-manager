/**
 * @file Exportaciones principales de tipos para la entidad Audio
 * @module types/entities/audio
 */

// Exportar los tipos principales
export type {
    AudioBase,
    AudioCreateInput,
    AudioUpdateInput
} from './types';

// Exportar el esquema de validación
export { audioSchema } from './audio.schema';
