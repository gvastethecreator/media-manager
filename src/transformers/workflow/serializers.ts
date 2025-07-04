/**
 * ⚙️ WORKFLOW SERIALIZERS
 *
 * Funciones de serialización para respuestas de API.
 *
 * @updated 2025-01-27
 */

import {
	WorkflowBase,
	WorkflowWithStats,
} from '@/types/entities/workflow';

/**
 * Serializa WorkflowBase para respuestas de API
 */
export function serializeWorkflow(workflow: WorkflowBase): Record<string, any> {
	return {
		id: workflow.id,
		name: workflow.name,
		description: workflow.description,
		steps: workflow.steps,
		isActive: workflow.isActive,
		category: workflow.category,
		version: workflow.version,
		author: workflow.author,
		tags: workflow.tags,
		executionCount: workflow.executionCount,
		lastExecutedAt: workflow.lastExecutedAt?.toISOString() || null,
		createdAt: workflow.createdAt.toISOString(),
		updatedAt: workflow.updatedAt.toISOString(),
	};
}

/**
 * Serializa WorkflowWithStats para respuestas de API
 */
export function serializeWorkflowWithStats(workflow: WorkflowWithStats): Record<string, any> {
	return {
		...serializeWorkflow(workflow),
		stats: {
			averageExecutionTime: workflow.stats.averageExecutionTime,
			successRate: Number(workflow.stats.successRate.toFixed(2)),
			complexityScore: workflow.stats.complexityScore,
			popularityScore: workflow.stats.popularityScore,
			completenessScore: workflow.stats.completenessScore,
		},
	};
}

/**
 * Serializa un array de workflows
 */
export function serializeWorkflows(workflows: WorkflowBase[]): Record<string, any>[] {
	return workflows.map(serializeWorkflow);
}

/**
 * Serializa un array de workflows con estadísticas
 */
export function serializeWorkflowsWithStats(workflows: WorkflowWithStats[]): Record<string, any>[] {
	return workflows.map(serializeWorkflowWithStats);
}
