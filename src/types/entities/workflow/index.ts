/**
 * @file Exportaciones principales de tipos para la entidad Workflow.
 * @module types/entities/workflow
 * @description
 *   Este archivo centraliza las exportaciones de tipos para la entidad Workflow.
 *   El tipo canónico para usar en la aplicación es **`WorkflowWithStats`**.
 *
 *   - `WorkflowBase`: Tipo base de Prisma.
 *   - `WorkflowWithStats`: Tipo enriquecido con estadísticas de ejecución.
 *
 * @see /src/types/entities/workflow/base.ts
 * @updated 2025-01-27
 */

// --- Tipos Canónicos (NUEVO) ---
export type { PrismaWorkflow, WorkflowBase, WorkflowStatistics, WorkflowWithStats } from './base';

// --- Esquemas de Validación ---
export { workflowSchema } from './workflow.schema';

// --- Tipos Legacy (OBSOLETOS) ---
/**
 * @deprecated Los tipos monolíticos de `types.ts` están obsoletos.
 * Usar `WorkflowWithStats` y otros tipos canónicos desde `base.ts`.
 * @see /src/types/entities/workflow/base.ts
 */
// export * from './types';
