/**
 * @file Mappers para la entidad Workflow.
 * @module transformers/workflow/mappers
 * @description Contiene funciones para transformar datos de la entidad Workflow,
 *              enfocándose en el cálculo de estadísticas de ejecución.
 
 */

import { safeJsonParse } from '@/lib/utils/safe-json-parse';
import type { WorkflowStatistics, WorkflowWithStats } from '@/types/entities/workflow';

// Tipo local equivalente a Prisma (migración a Drizzle)
type DrizzleWorkflow = {
	id: string;
	name: string;
	description: string | null;
	definition: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * Datos agregados de las ejecuciones de un workflow, obtenidos de Drizzle.
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
 * ✅ MIGRADO A DRIZZLE
 *
 * @param workflow El objeto Workflow base de Drizzle.
 * @param aggregates Los datos agregados de las ejecuciones del workflow.
 * @returns Un objeto de tipo WorkflowStatistics.
 */
function calculateWorkflowStats(
	workflow: DrizzleWorkflow,
	aggregates: WorkflowExecutionAggregates
): WorkflowStatistics {
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
 * Convierte un objeto Workflow de Drizzle y sus estadísticas agregadas
 * a un objeto canónico WorkflowWithStats.
 * ✅ MIGRADO A DRIZZLE
 *
 * @param workflow El objeto Workflow de Drizzle.
 * @param aggregates Los datos agregados de las ejecuciones del workflow.
 * @returns Un objeto WorkflowWithStats.
 */
export function toWorkflowWithStats(
	workflow: DrizzleWorkflow,
	aggregates: WorkflowExecutionAggregates
): WorkflowWithStats {
	const stats = calculateWorkflowStats(workflow, aggregates);

	return {
		...workflow,
		stats,
	};
}

// Mantener función legacy para compatibilidad (DEPRECATED)
/**
 * @deprecated Usar toWorkflowWithStats con tipos de Drizzle
 */
export const toWorkflowWithStatsFromPrisma = toWorkflowWithStats;
