/**
 * ⚙️ WORKFLOW SCHEMA
 *
 * Schema de validación con Zod para la entidad Workflow.
 * Derivado del schema de Drizzle.
 *
 * @updated 2025-01-27
 */

import { z } from 'zod';

/**
 * Schema Zod para WorkflowBase
 */
export const ZodWorkflowSchema = z.object({
	id: z.string().min(1, 'ID es requerido'),
	name: z.string().min(1, 'Nombre es requerido'),
	description: z.string().nullable(),
	steps: z.string(), // JSON string con los pasos del workflow
	isActive: z.boolean(),
	category: z.string().nullable(),
	version: z.string().nullable(),
	author: z.string().nullable(),
	tags: z.array(z.string()).default([]),
	executionCount: z.number().default(0),
	lastExecutedAt: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Schema para crear un Workflow
 */
export const ZodWorkflowCreateSchema = ZodWorkflowSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	executionCount: true,
	lastExecutedAt: true,
}).extend({
	isActive: z.boolean().default(true),
});

/**
 * Schema para actualizar un Workflow
 */
export const ZodWorkflowUpdateSchema = ZodWorkflowCreateSchema.partial();

export type ZodWorkflowType = z.infer<typeof ZodWorkflowSchema>;
export type ZodWorkflowCreateType = z.infer<typeof ZodWorkflowCreateSchema>;
export type ZodWorkflowUpdateType = z.infer<typeof ZodWorkflowUpdateSchema>;
