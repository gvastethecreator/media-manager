/**
 * @file Punto de entrada principal para la biblioteca @/lib
 * @description Exporta todos los módulos organizados por categorías
 */

export * from './client';
// Configuración
export * from './config';
export * from './constants';
// Módulos organizados por categoría
export * from './dev';
export * from './errors';
export * from './events';
// NOTA: filesystem NO se exporta aquí porque contiene código de Node.js
// que no debe incluirse en el bundle del cliente.
// Importar directamente desde '@/lib/filesystem' solo en código de servidor.
export * from './hooks';
export * from './image';
// Logger
export * from './logger';
export * from './mock';
// Parsers y mock
export * from './parsers';
// Servidor
export * from './server';
export * from './system';
// Tipos y constantes
export * from './types';
// Utilidades principales

export * from './web';
