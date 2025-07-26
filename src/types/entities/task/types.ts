/**
 * 🗂️ Tipos canónicos para la entidad Task
 *
 * - Este archivo contiene todos los tipos base, relaciones e inputs para Task.
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - No usar ni importar tipos de base.ts (eliminado).
 *
 * Estructura:
 * - TaskBase: tipo canónico principal
 * - TaskRelations: relaciones con otras entidades (any[] si no existen tipos canónicos)
 * - TaskCreateInput, TaskUpdateInput: inputs para mutaciones
 *
 * 🛡️ Todos los campos clave (id, createdAt, updatedAt) son obligatorios.
 * 📝 Documenta cualquier cambio relevante aquí.
 */

export type TaskBase = {
	id: string;
	createdAt: Date;
	updatedAt: Date;
	// otros campos base
};

export type TaskRelations = Record<string, never>;

export type TaskCreateInput = Omit<TaskBase, 'id' | 'createdAt' | 'updatedAt'>;

export type TaskUpdateInput = Partial<TaskBase>;

/**
 * 📋 Task extendido con información adicional para UI
 */
export interface TaskExtended extends TaskBase {
	title: string;
	description?: string | null;
	status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
	priority: 'low' | 'medium' | 'high' | 'urgent';
	dueDate?: Date | null;
	completedAt?: Date | null;
	assignedTo?: string | null;
	tags?: string[];
	progress?: number;
	estimatedHours?: number;
	actualHours?: number;
	notes?: string | null;
}
