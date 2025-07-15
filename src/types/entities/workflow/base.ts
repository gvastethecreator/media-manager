/**
 * 🗿 Modelo base de Workflow, directamente desde Drizzle.
 */
export type WorkflowBase = {
	id: string;
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	category: string | null;
	isPublic: boolean;
	isFavorite: boolean;
	isActive: boolean;
	version: string;
	config: string | null;
	steps: string | null;
	triggers: string | null;
	conditions: string | null;
	actions: string | null;
	schedule: string | null;
	lastRun: Date | null;
	nextRun: Date | null;
	runCount: number;
	successCount: number;
	errorCount: number;
	createdAt: Date;
	updatedAt: Date;
};

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

export interface WorkflowCreateInput extends Omit<WorkflowBase, 'id' | 'createdAt' | 'updatedAt'> {}
export interface WorkflowUpdateInput extends Partial<WorkflowCreateInput> {}
