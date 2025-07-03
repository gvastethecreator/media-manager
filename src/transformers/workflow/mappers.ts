/**
 * @file Mappers para la entidad Workflow.
 * @module transformers/workflow/mappers
 * @description Contiene funciones para transformar datos de la entidad Workflow,
 *              enfocándose en el cálculo de estadísticas de ejecución.
 */

import type { Workflow } from '@prisma/client';
import { safeJsonParse } from '@/lib/utils/safe-json-parse';
import type { WorkflowStatistics, WorkflowWithStats } from '@/types/entities/workflow';

/**
 * Datos agregados de las ejecuciones de un workflow, obtenidos de Prisma.
 */
export type WorkflowExecutionAggregates = {
	totalExecutions: number;
	successfulExecutions: number;
	_avg: {
		duration: number | null;
	};
	_max: {
		startedAt: Date | null;
	};
};

/**
 * Representa la estructura esperada del campo `definition` de un Workflow.
 */
type WorkflowDefinition = {
	nodes?: unknown[];
	edges?: unknown[];
};

/**
 * Calcula las estadísticas de un workflow a partir de sus datos y las agregaciones de sus ejecuciones.
 *
 * @param workflow El objeto Workflow base de Prisma.
 * @param aggregates Los datos agregados de las ejecuciones del workflow.
 * @returns Un objeto de tipo WorkflowStatistics.
 */
function calculateWorkflowStats(workflow: Workflow, aggregates: WorkflowExecutionAggregates): WorkflowStatistics {
	const { totalExecutions, successfulExecutions, _avg, _max } = aggregates;

	// Parsear la definición para contar nodos y conexiones
	const definition = safeJsonParse<WorkflowDefinition>(workflow.definition, { nodes: [], edges: [] });
	const nodeCount = definition.nodes?.length ?? 0;
	const connectionCount = definition.edges?.length ?? 0;

	const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

	return {
		totalExecutions,
		successRate: Number.parseFloat(successRate.toFixed(1)),
		averageDuration: Math.round(_avg.duration ?? 0),
		lastExecutedAt: _max.startedAt ?? null,
		nodeCount,
		connectionCount,
	};
}

/**
 * Convierte un objeto Workflow de Prisma y sus estadísticas agregadas
 * a un objeto canónico WorkflowWithStats.
 *
 * @param workflow El objeto Workflow de Prisma.
 * @param aggregates Los datos agregados de las ejecuciones del workflow.
 * @returns Un objeto WorkflowWithStats.
 */
export function toWorkflowWithStats(workflow: Workflow, aggregates: WorkflowExecutionAggregates): WorkflowWithStats {
	const stats = calculateWorkflowStats(workflow, aggregates);

	return {
		...workflow,
		stats,
	};
}
