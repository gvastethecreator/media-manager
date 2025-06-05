/**
 * @file Template para archivos index.ts de entidades
 * @module utils/types/entity-index-template
 *
 * Este archivo sirve como referencia para estandarizar los archivos index.ts
 * de todas las entidades en el sistema.
 */

// Ejemplo para una entidad llamada "Entity"

/**
 * @file Índice para tipos de Entity
 * @module types/entities/entity
 */

// Exportar todos los archivos de la carpeta
export * from './base';
export * from './enums';
export * from './extended';
export * from './types';

// Exportar el alias principal para la entidad
// Esto permite importar simplemente: import { Entity } from '@/types/entities/entity'
export type { EntityWithRelations as Entity } from './types';

/**
 * Recomendaciones para archivos de tipos:
 *
 * 1. types.ts: Definiciones principales de la entidad (Base, WithRelations, CreateData, UpdateData)
 * 2. base.ts: Tipos base y utilidades derivados directamente de Prisma
 * 3. extended.ts: Tipos extendidos con propiedades adicionales para UI o lógica específica
 * 4. enums.ts: Enumeraciones y constantes relacionadas con la entidad
 *
 * Siempre usar el mismo patrón de importación en todos los archivos:
 * import type { EntityName } from '../entity-name';
 *
 * Evitar importar directamente desde paths como '../entity-name/types'
 */
