/**
 * ⚙️ WORKFLOW TRANSFORMER
 *
 * Transformador principal para la entidad Workflow.
 * Convierte datos de base de datos a estructuras optimizadas para UI.
 *
 * @updated 2025-01-27
 */

import { createDefaultEntityStats } from '../../lib/utils';
import { WorkflowBase, WorkflowStatistics, WorkflowWithStats } from '../../types/entities/workflow';
import { validateWorkflow } from './validators';

/**
 * Tipo para datos de entrada del transformer
 */
export interface WorkflowInputData extends Partial<WorkflowBase> {
	// Propiedades adicionales que podrían venir de DB
	created_at?: Date | string;
	updated_at?: Date | string;
	last_executed_at?: Date | string;
	execution_count?: number;
}

/**
 * Tipo completo de Workflow (alias para compatibilidad)
 */
export type WorkflowComplete = WorkflowWithStats;

/**
 * Transformador principal para Workflow
 */
export function transformWorkflow(
	data: WorkflowInputData,
	options: {
		includeStats?: boolean;
		executionHistory?: Array<{ duration: number; success: boolean }>;
	} = {}
): WorkflowWithStats {
	const { includeStats = true, executionHistory = [] } = options;

	try {
		// Normalizar datos de entrada
		const normalizedData = normalizeWorkflowData(data);

		// Validar estructura básica
		const baseWorkflow = validateWorkflow(normalizedData);

		// Retornar con estadísticas si se solicita
		if (includeStats) {
			const stats = calculateWorkflowStats(baseWorkflow, executionHistory);
			return {
				...baseWorkflow,
				stats,
				entityType: 'workflow' as const,
			};
		}

		// Retornar con estadísticas vacías
		return {
			...baseWorkflow,
			stats: {
				...createDefaultEntityStats(),
				totalExecutions: 0,
				successRate: 0,
				averageDuration: 0,
				lastExecutedAt: null,
				nodeCount: 0,
				connectionCount: 0,
			},
			entityType: 'workflow' as const,
		};
	} catch (error) {
		throw new Error(`Error transforming workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Normaliza datos de entrada para asegurar compatibilidad
 */
function normalizeWorkflowData(data: WorkflowInputData): WorkflowBase {
	return {
		id: data.id || '',
		name: data.name || '',
		description: data.description || null,
		emoji: data.emoji || null,
		color: data.color || null,
		category: data.category || null,

		isFavorite: data.isFavorite ?? false,
		isActive: data.isActive ?? true,
		version: data.version || '1.0.0',
		config: data.config || null,
		steps: data.steps || null,
		triggers: data.triggers || null,
		conditions: data.conditions || null,
		actions: data.actions || null,
		schedule: data.schedule || null,
		lastRun: data.lastRun || null,
		nextRun: data.nextRun || null,
		runCount: data.runCount || 0,
		successCount: data.successCount || 0,
		errorCount: data.errorCount || 0,
		createdAt: normalizeDate(data.createdAt || data.created_at),
		updatedAt: normalizeDate(data.updatedAt || data.updated_at),
	};
}

/**
 * Calcula estadísticas del workflow
 */
function calculateWorkflowStats(
	workflow: WorkflowBase,
	executionHistory: Array<{ duration: number; success: boolean }>
): WorkflowStatistics {
	const averageDuration =
		executionHistory.length > 0
			? executionHistory.reduce((sum, exec) => sum + exec.duration, 0) / executionHistory.length
			: 0;

	const successRate = workflow.runCount > 0 ? (workflow.successCount / workflow.runCount) * 100 : 0;

	const nodeCount = calculateNodeCount(workflow);
	const connectionCount = calculateConnectionCount(workflow);

	return {
		...createDefaultEntityStats(),
		totalExecutions: workflow.runCount,
		successRate,
		averageDuration,
		lastExecutedAt: workflow.lastRun,
		nodeCount,
		connectionCount,
	};
}

/**
 * Calcula el número de nodos en el workflow
 */
function calculateNodeCount(workflow: WorkflowBase): number {
	try {
		if (!workflow.steps) {
			return 0;
		}
		const steps = JSON.parse(workflow.steps);
		return Array.isArray(steps) ? steps.length : 0;
	} catch {
		return 0;
	}
}

/**
 * Calcula el número de conexiones en el workflow
 */
function calculateConnectionCount(workflow: WorkflowBase): number {
	try {
		if (!workflow.steps) {
			return 0;
		}
		const steps = JSON.parse(workflow.steps);
		if (!Array.isArray(steps)) {
			return 0;
		}
		// Estimación simple: cada paso (excepto el primero) tiene al menos una conexión
		return Math.max(0, steps.length - 1);
	} catch {
		return 0;
	}
}

/**
 * Normaliza fechas desde diferentes formatos
 */
function normalizeDate(date?: Date | string | null): Date {
	if (!date) {
		return new Date();
	}
	if (date instanceof Date) {
		return date;
	}
	return new Date(date);
}
