/**
 * ⚙️ WORKFLOW SERIALIZERS
 *
 * Funciones de serialización para respuestas de API.
 *
 * @updated 2025-01-27
 */

import { WorkflowBase, WorkflowWithStats } from '@/types/entities/workflow';

/**
 * Serializa WorkflowBase para respuestas de API
 */
export function serializeWorkflow(workflow: WorkflowBase): Record<string, unknown> {
	return {
		id: workflow.id,
		name: workflow.name,
		description: workflow.description,
		emoji: workflow.emoji,
		color: workflow.color,
		category: workflow.category,
		isPublic: workflow.isPublic,
		isFavorite: workflow.isFavorite,
		isActive: workflow.isActive,
		version: workflow.version,
		config: workflow.config,
		steps: workflow.steps,
		triggers: workflow.triggers,
		conditions: workflow.conditions,
		actions: workflow.actions,
		schedule: workflow.schedule,
		lastRun: workflow.lastRun?.toISOString() || null,
		nextRun: workflow.nextRun?.toISOString() || null,
		runCount: workflow.runCount,
		successCount: workflow.successCount,
		errorCount: workflow.errorCount,
		createdAt: workflow.createdAt.toISOString(),
		updatedAt: workflow.updatedAt.toISOString(),
	};
}

/**
 * Serializa WorkflowWithStats para respuestas de API
 */
export function serializeWorkflowWithStats(workflow: WorkflowWithStats): Record<string, unknown> {
	return {
		...serializeWorkflow(workflow),
		stats: {
			totalExecutions: workflow.stats.totalExecutions,
			successRate: Number(workflow.stats.successRate.toFixed(2)),
			averageDuration: workflow.stats.averageDuration,
			lastExecutedAt: workflow.stats.lastExecutedAt?.toISOString() || null,
			nodeCount: workflow.stats.nodeCount,
			connectionCount: workflow.stats.connectionCount,
		},
	};
}

/**
 * Serializa un array de workflows
 */
export function serializeWorkflows(workflows: WorkflowBase[]): Record<string, unknown>[] {
	return workflows.map(serializeWorkflow);
}

/**
 * Serializa un array de workflows con estadísticas
 */
export function serializeWorkflowsWithStats(workflows: WorkflowWithStats[]): Record<string, unknown>[] {
	return workflows.map(serializeWorkflowWithStats);
}
