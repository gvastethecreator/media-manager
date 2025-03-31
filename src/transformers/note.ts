/**
 * @file Punto de entrada para el transformer de Note
 * @module transformers/note
 * @description Este archivo re-exporta la funcionalidad del transformer de Note
 */

// Re-exportar funciones e interfaces
export * from './note/index';

// Importar y re-exportar por defecto
import NoteTransformer from './note/index';
export default NoteTransformer;