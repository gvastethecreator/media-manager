/**
 * ⚙️ WORKFLOW TRANSFORMER
 *
 * Transformador principal para la entidad Workflow.
 * Convierte datos de base de datos a estructuras optimizadas para UI.
 *
 * @updated 2025-01-27
 */

import {
	WorkflowBase,
	WorkflowWithStats,
	WorkflowStatistics,
} from '@/types/entities/workflow';
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
			};
		}
		
		// Retornar con estadísticas vacías
		return {
			...baseWorkflow,
			stats: {
				averageExecutionTime: 0,
				successRate: 0,
				complexityScore: 0,
				popularityScore: 0,
				completenessScore: 0,
			},
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
		steps: data.steps || '[]',
		isActive: data.isActive ?? true,
		category: data.category || null,
		version: data.version || null,
		author: data.author || null,
		tags: data.tags || [],
		executionCount: data.executionCount || data.execution_count || 0,
		lastExecutedAt: normalizeDate(data.lastExecutedAt || data.last_executed_at),
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
	const averageExecutionTime = executionHistory.length > 0
		? executionHistory.reduce((sum, exec) => sum + exec.duration, 0) / executionHistory.length
		: 0;

	const successRate = executionHistory.length > 0
		? (executionHistory.filter(exec => exec.success).length / executionHistory.length) * 100
		: 0;

	const complexityScore = calculateComplexityScore(workflow);
	const popularityScore = Math.log1p(workflow.executionCount) * 10;
	const completenessScore = calculateCompleteness(workflow, ['name', 'description', 'category', 'author']);

	return {
		averageExecutionTime,
		successRate,
		complexityScore,
		popularityScore,
		completenessScore,
	};
}

/**
 * Calcula un score de complejidad basado en los pasos del workflow
 */
function calculateComplexityScore(workflow: WorkflowBase): number {
	try {
		const steps = JSON.parse(workflow.steps);
		const stepCount = Array.isArray(steps) ? steps.length : 0;
		
		// Score basado en número de pasos, complejidad de estructura, etc.
		const baseScore = Math.min(100, stepCount * 5);
		const tagComplexity = workflow.tags.length * 2;
		
		return Math.min(100, baseScore + tagComplexity);
	} catch {
		return 0;
	}
}

/**
 * Normaliza fechas desde diferentes formatos
 */
function normalizeDate(date?: Date | string | null): Date {
	if (!date) return new Date();
	if (date instanceof Date) return date;
	return new Date(date);
}

/**
 * Función de ayuda para calcular completeness
 */
function calculateCompleteness(workflow: WorkflowBase, requiredFields: (keyof WorkflowBase)[]): number {
	const completed = requiredFields.filter(field => {
		const value = workflow[field];
		return value !== null && value !== undefined && value !== '';
	}).length;
	
	return Math.round((completed / requiredFields.length) * 100);
}
