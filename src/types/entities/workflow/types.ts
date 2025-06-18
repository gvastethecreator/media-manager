/**
 * ⚙️ Tipos canónicos para la entidad Workflow
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - Validar con Zod antes de persistir datos.
 * - No usar ni importar tipos legacy.
 */

export interface WorkflowBase {
  id: string;
  name: string;
  filePath: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkflowCreateInput = Omit<WorkflowBase, 'id' | 'createdAt' | 'updatedAt'>;
export type WorkflowUpdateInput = Partial<Omit<WorkflowBase, 'id'>>;
