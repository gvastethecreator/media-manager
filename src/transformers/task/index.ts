/**
 * @file Exportaciones principales de transformers para la entidad Task
 * @module transformers/task
 */

// Exportar todas las funciones y tipos del transformador
export {
    TransformTaskOptions, getTaskVisualProps, transformTask, transformTaskToWithStats, transformTasks
} from './transformer';

// Exportar funciones de serialización
export {
    fromPrismaTask,
    toExtendedTask
} from './serializers';
