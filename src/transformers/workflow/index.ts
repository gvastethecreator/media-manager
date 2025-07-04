/**
 * @file Punto de entrada para los transformadores de la entidad Workflow.
 * @module transformers/workflow
 * @description Exporta la función `toWorkflowWithStats` como el transformador canónico
 *              y los tipos de agregados necesarios para el cálculo de estadísticas.
 * @see /src/transformers/workflow/mappers.ts
 * @updated 2025-01-27
 */

export type { WorkflowExecutionAggregates } from './mappers';
// Alias por compatibilidad
export { toWorkflowWithStats, toWorkflowWithStatsFromPrisma } from './mappers';
