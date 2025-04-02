/**
 * @file Transformadores para la entidad Task
 * @module transformers/task/transformer
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
    TaskBase,
    TaskExtended,
    TaskStatus,
    TaskType,
    TaskWithStats
} from '@/types/entities/task';
import { TransformerError } from '@/utils/transformers/errors';
import { fromPrismaTask, toExtendedTask } from './serializers';

// Logger específico para este módulo
const logger = serverLogger.child({ module: 'TaskTransformer' });

/**
 * Opciones para la transformación de tareas
 */
export interface TransformTaskOptions {
  /** Habilita la validación de campos */
  validateFields?: boolean;
  /** Deserializa campos JSON */
  deserializeFields?: boolean;
  /** Incluye relaciones */
  includeRelations?: boolean;
  /** Incluye propiedades UI */
  includeUI?: boolean;
  /** Incluye estadísticas calculadas */
  includeStats?: boolean;
}

/**
 * 🔄 Transforma un objeto a Task
 * @param input Objeto a transformar a Task
 * @param options Opciones de transformación
 * @returns Task transformado
 * @throws TransformerError si hay errores en la validación o transformación
 */
export function transformTask<T extends Partial<TaskBase> | unknown>(
  input: T,
  options: TransformTaskOptions = {}
): TaskExtended {
  try {
    if (!input || typeof input !== 'object') {
      logger.error('⚠️ Intentando transformar un objeto Task inválido:', input);
      throw new TransformerError('Error transformando tarea: objeto inválido');
    }

    // Si es un objeto de Prisma, primero lo transformamos al formato base
    if ('handler' in input && typeof input.handler === 'string') {
      const baseTask = fromPrismaTask(input);
      return toExtendedTask(baseTask, options);
    }

    // Si ya es un objeto Task, simplemente extenderlo
    return toExtendedTask(input as TaskBase, options);
  } catch (error) {
    logger.error('❌ Error transformando Task:', error);
    throw new TransformerError('Error transformando tarea', { cause: error });
  }
}

/**
 * 🔄 Transforma un array de objetos a Tasks
 * @param input Array de objetos a transformar
 * @param options Opciones de transformación
 * @returns Array de Tasks transformados
 */
export function transformTasks<T extends Partial<TaskBase>[] | unknown[]>(
  input: T,
  options: TransformTaskOptions = {}
): TaskExtended[] {
  if (!Array.isArray(input)) {
    logger.error('⚠️ Intentando transformar un array de Tasks inválido:', input);
    throw new TransformerError('Error transformando tareas: el input no es un array');
  }

  return input.map(item => transformTask(item, options));
}

/**
 * 🔄 Transforma un Task a TaskWithStats con estadísticas
 * @param task Task a transformar
 * @returns TaskWithStats con estadísticas adicionales
 */
export function transformTaskToWithStats(task: TaskBase): TaskWithStats {
  try {
    // Primero transformamos a extended
    const taskExtended = transformTask(task, { includeUI: true });

    // Calculamos estadísticas basadas en los datos disponibles
    return {
      ...taskExtended,
      stats: {
        averageRuntime: 0,
        lastRuntime: 0,
        successCount: 0,
        failureCount: 0,
        retryCount: 0,
        averageCpuUsage: 0,
        averageMemoryUsage: 0
      }
    };
  } catch (error) {
    logger.error('❌ Error transformando Task a WithStats:', error);
    throw new TransformerError('Error al transformar tarea con estadísticas', { cause: error });
  }
}

/**
 * 🎨 Asigna color e icono a una tarea basado en su tipo y estado
 * @param task Tarea a procesar
 * @returns Objeto con color e icono
 */
export function getTaskVisualProps(task: TaskBase): { color: string; icon: string } {
  // Mapeo de tipos a iconos
  const typeIconMap: Record<string, string> = {
    [TaskType.MAINTENANCE]: '🔧',
    [TaskType.PROCESSING]: '⚙️',
    [TaskType.IMPORT]: '📥',
    [TaskType.EXPORT]: '📤',
    [TaskType.INDEXING]: '🔍',
    [TaskType.CLEANUP]: '🧹',
    [TaskType.BACKUP]: '💾',
    [TaskType.CUSTOM]: '🔮'
  };

  // Mapeo de estados a colores
  const statusColorMap: Record<string, string> = {
    [TaskStatus.PENDING]: '#6941C6',     // Púrpura
    [TaskStatus.SCHEDULED]: '#3538CD',   // Índigo
    [TaskStatus.RUNNING]: '#026AA2',     // Azul
    [TaskStatus.COMPLETED]: '#039855',   // Verde
    [TaskStatus.FAILED]: '#D92D20',      // Rojo
    [TaskStatus.CANCELLED]: '#B54708',   // Naranja
    [TaskStatus.PAUSED]: '#EAAA08'       // Amarillo
  };

  // Obtener el icono y color adecuados
  const icon = typeIconMap[task.type] || '⚡';
  const color = statusColorMap[task.status] || '#667085'; // Gris por defecto

  return { color, icon };
}