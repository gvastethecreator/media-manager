/**
 * @file Exportaciones principales de transformers para la entidad Task
 * @module transformers/task
 */

// Exportar funciones de serialización
export {
	fromPrismaTask,
	toExtendedTask,
} from './serializers';
// Exportar todas las funciones y tipos del transformador
export {
	getTaskVisualProps,
	TransformTaskOptions,
	transformTask,
	transformTasks,
	transformTaskToWithStats,
} from './transformer';
