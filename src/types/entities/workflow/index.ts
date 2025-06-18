/**
 * @file Exportaciones principales de tipos para la entidad Workflow
 * @module types/entities/workflow
 */

// Exportar los tipos principales
export type {
    WorkflowBase,
    WorkflowCreateInput,
    WorkflowUpdateInput
} from './types';

// Exportar el esquema de validación
export { workflowSchema } from './workflow.schema';
