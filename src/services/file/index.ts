/**
 * @file File Service Exports
 * @module services/file
 * @description Centralized exports for file service functionality
 */

// Export all existing file operations
export * from './file.service';

// Export enhanced file operations service
export {
  enhancedFileOperationsService,
  clipboardManager,
  type ClipboardData,
} from './enhanced-file-operations.service';