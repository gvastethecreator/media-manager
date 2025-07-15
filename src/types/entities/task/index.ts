/**
 * @file Punto de entrada para los tipos de Task
 * @module types/entities/task
 * @updated 2025-01-27 - Migrado a estructura canónica Base+Statistics+WithStats
 */

// ✅ EXPORTACIONES PRINCIPALES (estructura canónica)
export type {
	TaskBase,
	// Legacy para compatibilidad temporal
	TaskComplete,
	TaskCreateInput,
	TaskStatistics,
	TaskUpdateInput,
	TaskWithStats,
} from './base';

export {
	TaskPriority,
	TaskStatus,
} from './base';
