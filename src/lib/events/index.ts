/**
 * Archivo principal para exportaciones de eventos
 * Punto central para importar eventos y funciones relacionadas
 * Evita el problema de 'use server' exportando objetos
 */

export * from './client';
// Re-exportaciones desde archivos de compatibilidad
export * from './server';
