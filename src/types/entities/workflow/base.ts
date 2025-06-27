import type { Workflow } from '@prisma/client';

/**
 * 🗿 Modelo base de Workflow, directamente desde Prisma.
 */
export type WorkflowBase = Workflow;

/**
 * 🤖 Tipo de un Workflow de Prisma que incluye sus relaciones directas.
 * A diferencia de EntityWithStats, no usamos `_count` aquí, sino que calcularemos
 * las estadísticas a partir de las ejecuciones relacionadas.
 */
export type PrismaWorkflow = WorkflowBase;

/**
 * 📊 Estadísticas calculadas para un Workflow.
 * Este conjunto de métricas se enfoca en el rendimiento y la complejidad del workflow.
 */
export interface WorkflowStatistics {
	totalExecutions: number;
	successRate: number; // Porcentaje (0-100)
	averageDuration: number; // En milisegundos
	lastExecutedAt: Date | null;
	nodeCount: number;
	connectionCount: number;
}

/**
 * ✨ Modelo extendido de Workflow con estadísticas de ejecución.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface WorkflowWithStats extends WorkflowBase {
	stats: WorkflowStatistics;
}
