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
	emoji: z.string().nullable(),
	color: z.string().nullable(),
	category: z.string().nullable(),
	isPublic: z.boolean(),
	isFavorite: z.boolean(),
	isActive: z.boolean(),
	version: z.string(),
	config: z.string().nullable(),
	steps: z.string().nullable(),
	triggers: z.string().nullable(),
	conditions: z.string().nullable(),
	actions: z.string().nullable(),
	schedule: z.string().nullable(),
	lastRun: z.date().nullable(),
	nextRun: z.date().nullable(),
	runCount: z.number(),
	successCount: z.number(),
	errorCount: z.number(),
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
	lastRun: true,
	nextRun: true,
	runCount: true,
	successCount: true,
	errorCount: true,
}).extend({
	isActive: z.boolean().default(true),
	isPublic: z.boolean().default(false),
	isFavorite: z.boolean().default(false),
	version: z.string().default('1.0.0'),
	runCount: z.number().default(0),
	successCount: z.number().default(0),
	errorCount: z.number().default(0),
});

/**
 * Schema para actualizar un Workflow
 */
export const ZodWorkflowUpdateSchema = ZodWorkflowCreateSchema.partial();

export type ZodWorkflowType = z.infer<typeof ZodWorkflowSchema>;
export type ZodWorkflowCreateType = z.infer<typeof ZodWorkflowCreateSchema>;
export type ZodWorkflowUpdateType = z.infer<typeof ZodWorkflowUpdateSchema>;
