/**
 * @file Exportaciones principales de tipos para la entidad Audio
 * @module types/entities/audio
 */

// Exportar el esquema de validación
export { audioSchema } from './audio.schema';
// Exportar los tipos principales
// Exportar tipo principal como Audio para compatibilidad
export type {
    AudioBase as Audio,
    AudioBase,
    AudioComplete,
    AudioCreateInput,
    AudioUpdateInput
} from './types';

