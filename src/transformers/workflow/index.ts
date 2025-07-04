/**
 * @file Punto de entrada para los transformadores de la entidad Workflow.
 * @module transformers/workflow
 * @description Exporta las funciones de transformación canónicas para Workflow.
 * @see /src/transformers/workflow/mappers.ts
 * @see /src/transformers/workflow/transformer.ts
 * @updated 2025-01-27
 */

export { toWorkflowWithStats } from './mappers';
export { type WorkflowComplete, transformWorkflow } from './transformer';
