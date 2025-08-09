/**
 * @file File Service Exports
 * @module services/file
 * @description Centralized exports for file service functionality
 */

// Export enhanced file operations service (sin re-exportar clipboardManager para evitar colisiones)
export { enhancedFileOperationsService } from './enhanced-file-operations.service';
// Export all existing file operations
export * from './file.service';
