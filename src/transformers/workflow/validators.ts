/**
 * ⚙️ WORKFLOW VALIDATORS
 *
 * Funciones de validación para la entidad Workflow usando Zod.
 *
 * @updated 2025-01-27
 */

import {
    ZodWorkflowCreateSchema,
    type ZodWorkflowCreateType,
    ZodWorkflowSchema,
    type ZodWorkflowType,
    ZodWorkflowUpdateSchema,
    type ZodWorkflowUpdateType,
} from './schema';

/**
 * Valida un objeto Workflow completo
 */
export function validateWorkflow(data: unknown): ZodWorkflowType {
	return ZodWorkflowSchema.parse(data);
}

/**
 * Valida datos para crear un Workflow
 */
export function validateWorkflowCreate(data: unknown): ZodWorkflowCreateType {
	return ZodWorkflowCreateSchema.parse(data);
}

/**
 * Valida datos para actualizar un Workflow
 */
export function validateWorkflowUpdate(data: unknown): ZodWorkflowUpdateType {
	return ZodWorkflowUpdateSchema.parse(data);
}

/**
 * Verifica si un objeto es un Workflow válido sin lanzar errores
 */
export function isWorkflow(data: unknown): data is ZodWorkflowType {
	const result = ZodWorkflowSchema.safeParse(data);
	return result.success;
}

/**
 * Verifica si un objeto es válido para crear un Workflow
 */
export function isWorkflowCreateValid(data: unknown): data is ZodWorkflowCreateType {
	const result = ZodWorkflowCreateSchema.safeParse(data);
	return result.success;
}

/**
 * Verifica si un objeto es válido para actualizar un Workflow
 */
export function isWorkflowUpdateValid(data: unknown): data is ZodWorkflowUpdateType {
	const result = ZodWorkflowUpdateSchema.safeParse(data);
	return result.success;
}
