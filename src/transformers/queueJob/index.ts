/**
 * @file Exportaciones principales de transformers para la entidad QueueJob
 * @module transformers/queueJob
 */

// Serializadores
export {
    QueueJobTransformOptions,
    calculateElapsedTime,
    estimateTimeRemaining,
    extendQueueJob,
    extendQueueJobs,
    formatQueueJobDate,
    formatSeconds,
    fromPrismaQueueJob,
    getQueueJobPriorityText,
    getQueueJobStatusText,
    parseQueueJobData,
    parseQueueJobMetadata,
    stringifyQueueJobData,
    stringifyQueueJobMetadata,
    toPrismaQueueJob,
    validateQueueJob
} from './serializers';

// Mappers
export {
    toCreateQueueJobData,
    toSearchFilters,
    toSearchOptions,
    toSearchResult,
    toUpdateQueueJobData
} from './mappers';

// Exportación predeterminada
export default {
  // Serializadores
  fromPrismaQueueJob,
  toPrismaQueueJob,
  validateQueueJob,
  extendQueueJob,
  extendQueueJobs,
  parseQueueJobData,
  stringifyQueueJobData,
  parseQueueJobMetadata,
  stringifyQueueJobMetadata,

  // Funciones de UI
  getQueueJobStatusText,
  getQueueJobPriorityText,
  formatQueueJobDate,
  calculateElapsedTime,
  estimateTimeRemaining,
  formatSeconds,

  // Mappers
  toCreateQueueJobData,
  toUpdateQueueJobData,
  toSearchOptions,
  toSearchFilters,
  toSearchResult
};