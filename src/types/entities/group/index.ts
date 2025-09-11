/**
 * @file Exportaciones principales de tipos para la entidad Group.
 * @module types/entities/group
 * @description
 *   Centraliza la exportación del tipo canónico **`GroupWithStats`**.
 *
 *   - `GroupBase`: Tipo base de Drizzle.
 *   - `GroupStatistics`: Interfaz para las estadísticas de conteo.
 *   - `GroupWithStats`: El tipo enriquecido que se debe usar en la app.
 *
 * @see /src/types/entities/group/base.ts
 * @updated 2025-01-27
 */

export type { GroupBase, GroupComplete, GroupStatistics, GroupWithStats } from './base';
export { GroupViewMode } from './base';
export * from './enums';
// Exportaciones tipadas principales explícitas (evitar export * para no colisionar)
export type { GroupCreateInput, GroupUpdateInput, GroupViewConfig } from './types';
