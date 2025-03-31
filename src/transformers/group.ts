/**
 * @file Punto de entrada para el transformer de Group
 * @module transformers/group
 * @description Este archivo re-exporta la funcionalidad del transformer de Group
 */

// Re-exportar funciones e interfaces
export * from './group/index';

// Importar y re-exportar por defecto
import GroupTransformer from './group/index';
export default GroupTransformer;