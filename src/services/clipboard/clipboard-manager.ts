/**
 * @file ClipboardManager for system integration
 * @module services/clipboard/clipboard-manager
 * @description Comprehensive clipboard manager with system clipboard integration,
 * multiple file formats support, and metadata handling for file browser operations
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { toastService } from '@/services/toast';
import type { AnyEntityWithStats } from '@/types/migration';
import { getFileAsDataUrl } from '@/services/file/file.service';
import { FileErrorCode, FileType } from '@/types/entities/file';

const logger = serverLogger.withContext('ClipboardManager');

/**
 * Supported clipboard data formats
 */
export enum ClipboardFormat {
  TEXT = 'text/plain',
  HTML = 'text/html',
  IMAGE = 'image/png',
  FILES = 'application/x-file-list',
  JSON = 'application/json',
  URI_LIST = 'text/uri-list',
}

/**
 * Clipboard data structure with metadata
 */
export interface ClipboardData {
  /** Items being copied/cut */
  items: AnyEntityWithStats[];
  /** Operation type */
  operation: 'copy' | 'cut';
  /** Timestamp when operation was performed */
  timestamp: number;
  /** Source context (e.g., 'file-browser', 'image-viewer') */
  source: string;
  /** Supported formats for this clipboard data */
  formats: ClipboardFormat[];
  /** Additional metadata */
  metadata: {
    /** Total size of all items */
    totalSize: number;
    /** File types present */
    fileTypes: FileType[];
    /** Whether items can be pasted to file system */
    canPasteToFileSystem: boolean;
    /** Whether items can be pasted to other applications */
    canPasteToSystem: boolean;
  };
}

/**
 * System clipboard integration options
 */
export interface SystemClipboardOptions {
  /** Include file paths as text */
  includeText: boolean;
  /** Include HTML representation */
  includeHtml: boolean;
  /** Include images as data URLs */
  includeImages: boolean;
  /** Include file URIs */
  includeUris: boolean;
  /** Maximum image size for clipboard (in bytes) */
  maxImageSize: number;
}

/**
 * Clipboard validation result
 */
export interface ClipboardValidation {
  /** Whether clipboard data is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Warnings */
  warnings: string[];
  /** Supported operations */
  supportedOperations: ('copy' | 'cut' | 'paste')[];
}

/**
 * Function creator for file operation errors
 */
const createClipboardError = (
  message: string,
  code: FileErrorCode = FileErrorCode.OPERATION_FAILED,
  cause?: unknown
): Error & { code: FileErrorCode; cause?: unknown } => {
  const error = new Error(message);
  error.name = 'ClipboardError';
  return Object.assign(error, { code, cause });
};

/**
 * Enhanced clipboard manager with system integration
 */
export class ClipboardManager {
  private clipboardData: ClipboardData | null = null;
  private systemClipboardOptions: SystemClipboardOptions = {
    includeText: true,
    includeHtml: true,
    includeImages: true,
    includeUris: true,
    maxImageSize: 10 * 1024 * 1024, // 10MB
  };

  /**
   * Copy items to clipboard with system integration
   */
  async copy(items: AnyEntityWithStats[], source: string = 'file-browser'): Promise<void> {
    try {
      logger.info('📋 Copying items to clipboard with system integration:', items.length);

      // Validate items
      const validation = this.validateItems(items, 'copy');
      if (!validation.isValid) {
        throw createClipboardError(
          `Validation failed: ${validation.errors.join(', ')}`,
          FileErrorCode.INVALID_OPERATION
        );
      }

      // Create clipboard data
      const clipboardData = await this.createClipboardData(items, 'copy', source);
      this.clipboardData = clipboardData;

      // Integrate with system clipboard
      await this.writeToSystemClipboard(clipboardData);

      // Show success notification
      const message = items.length === 1
        ? `"${items[0].name}" copiado al portapapeles`
        : `${items.length} elementos copiados al portapapeles`;
      toastService.success(message);

      logger.info('✅ Items copied to clipboard successfully');

    } catch (error) {
      logger.error('❌ Error copying to clipboard:', error);
      toastService.error('Error al copiar al portapapeles');
      throw createClipboardError('No se pudo copiar al portapapeles', FileErrorCode.OPERATION_FAILED, error);
    }
  }

  /**
   * Cut items to clipboard with system integration
   */
  async cut(items: AnyEntityWithStats[], source: string = 'file-browser'): Promise<void> {
    try {
      logger.info('✂️ Cutting items to clipboard with system integration:', items.length);

      // Validate items
      const validation = this.validateItems(items, 'cut');
      if (!validation.isValid) {
        throw createClipboardError(
          `Validation failed: ${validation.errors.join(', ')}`,
          FileErrorCode.INVALID_OPERATION
        );
      }

      // Create clipboard data
      const clipboardData = await this.createClipboardData(items, 'cut', source);
      this.clipboardData = clipboardData;

      // Integrate with system clipboard
      await this.writeToSystemClipboard(clipboardData);

      // Show success notification
      const message = items.length === 1
        ? `"${items[0].name}" cortado al portapapeles`
        : `${items.length} elementos cortados al portapapeles`;
      toastService.success(message);

      logger.info('✅ Items cut to clipboard successfully');

    } catch (error) {
      logger.error('❌ Error cutting to clipboard:', error);
      toastService.error('Error al cortar al portapapeles');
      throw createClipboardError('No se pudo cortar al portapapeles', FileErrorCode.OPERATION_FAILED, error);
    }
  }

  /**
   * Check if clipboard has items that can be pasted
   */
  canPaste(): boolean {
    return this.clipboardData !== null &&
      this.clipboardData.items.length > 0 &&
      this.clipboardData.metadata.canPasteToFileSystem;
  }

  /**
   * Get clipboard data
   */
  getClipboardData(): ClipboardData | null {
    return this.clipboardData;
  }

  /**
   * Get clipboard data in specific format
   */
  async getClipboardDataInFormat(format: ClipboardFormat): Promise<string | null> {
    if (!this.clipboardData) {
      return null;
    }

    try {
      switch (format) {
        case ClipboardFormat.TEXT:
          return this.generateTextRepresentation(this.clipboardData);

        case ClipboardFormat.HTML:
          return this.generateHtmlRepresentation(this.clipboardData);

        case ClipboardFormat.JSON:
          return JSON.stringify(this.clipboardData, null, 2);

        case ClipboardFormat.URI_LIST:
          return this.generateUriListRepresentation(this.clipboardData);

        default:
          logger.warn('Unsupported clipboard format requested:', format);
          return null;
      }
    } catch (error) {
      logger.error('Error generating clipboard data in format:', format, error);
      return null;
    }
  }

  /**
   * Clear clipboard
   */
  clear(): void {
    this.clipboardData = null;
    logger.info('🗑️ Clipboard cleared');
    toastService.info('Portapapeles limpiado');
  }

  /**
   * Validate clipboard state and operations
   */
  validateClipboard(): ClipboardValidation {
    if (!this.clipboardData) {
      return {
        isValid: false,
        errors: ['No clipboard data available'],
        warnings: [],
        supportedOperations: [],
      };
    }

    return this.validateItems(this.clipboardData.items, this.clipboardData.operation);
  }

  /**
   * Update system clipboard options
   */
  updateSystemClipboardOptions(options: Partial<SystemClipboardOptions>): void {
    this.systemClipboardOptions = {
      ...this.systemClipboardOptions,
      ...options,
    };
    logger.info('📋 System clipboard options updated:', this.systemClipboardOptions);
  }

  /**
   * Get system clipboard options
   */
  getSystemClipboardOptions(): SystemClipboardOptions {
    return { ...this.systemClipboardOptions };
  }

  /**
   * Create clipboard data with metadata
   */
  private async createClipboardData(
    items: AnyEntityWithStats[],
    operation: 'copy' | 'cut',
    source: string
  ): Promise<ClipboardData> {
    // Calculate metadata
    const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);
    const fileTypes = Array.from(new Set(items.map(item => item.type).filter(Boolean))) as FileType[];

    // Determine supported formats
    const formats: ClipboardFormat[] = [ClipboardFormat.TEXT, ClipboardFormat.JSON];

    if (this.systemClipboardOptions.includeHtml) {
      formats.push(ClipboardFormat.HTML);
    }

    if (this.systemClipboardOptions.includeUris) {
      formats.push(ClipboardFormat.URI_LIST);
    }

    // Check if any items are images within size limit
    const hasValidImages = items.some(item =>
      item.type === FileType.IMAGE &&
      (item.size || 0) <= this.systemClipboardOptions.maxImageSize
    );

    if (hasValidImages && this.systemClipboardOptions.includeImages) {
      formats.push(ClipboardFormat.IMAGE);
    }

    return {
      items,
      operation,
      timestamp: Date.now(),
      source,
      formats,
      metadata: {
        totalSize,
        fileTypes,
        canPasteToFileSystem: true,
        canPasteToSystem: formats.length > 1,
      },
    };
  }

  /**
   * Validate items for clipboard operations
   */
  private validateItems(items: AnyEntityWithStats[], operation: 'copy' | 'cut' | 'paste'): ClipboardValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const supportedOperations: ('copy' | 'cut' | 'paste')[] = [];

    // Basic validation
    if (!items || items.length === 0) {
      errors.push('No items provided');
      return {
        isValid: false,
        errors,
        warnings,
        supportedOperations,
      };
    }

    // Check for required properties
    for (const item of items) {
      if (!item.id) {
        errors.push(`Item missing ID: ${item.name || 'unknown'}`);
      }
      if (!item.path) {
        errors.push(`Item missing path: ${item.name || 'unknown'}`);
      }
      if (!item.name) {
        warnings.push(`Item missing name: ${item.id || 'unknown'}`);
      }
    }

    // Operation-specific validation
    if (operation === 'cut') {
      // Check if items can be moved (not readonly)
      const readonlyItems = items.filter(item => item.isReadonly);
      if (readonlyItems.length > 0) {
        errors.push(`Cannot cut readonly items: ${readonlyItems.map(i => i.name).join(', ')}`);
      }
    }

    // Size validation
    const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);
    const maxClipboardSize = 100 * 1024 * 1024; // 100MB
    if (totalSize > maxClipboardSize) {
      warnings.push(`Total size (${this.formatSize(totalSize)}) exceeds recommended clipboard limit`);
    }

    // Determine supported operations
    if (errors.length === 0) {
      supportedOperations.push('copy');

      const hasNonReadonly = items.some(item => !item.isReadonly);
      if (hasNonReadonly) {
        supportedOperations.push('cut');
      }

      supportedOperations.push('paste');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      supportedOperations,
    };
  }

  /**
   * Write clipboard data to system clipboard
   */
  private async writeToSystemClipboard(clipboardData: ClipboardData): Promise<void> {
    try {
      // In a browser environment, we would use the Clipboard API
      // For now, we'll prepare the data for system integration

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const clipboardItems: Record<string, Blob> = {};

        // Add text representation
        if (this.systemClipboardOptions.includeText) {
          const textData = await this.generateTextRepresentation(clipboardData);
          if (textData) {
            clipboardItems[ClipboardFormat.TEXT] = new Blob([textData], { type: ClipboardFormat.TEXT });
          }
        }

        // Add HTML representation
        if (this.systemClipboardOptions.includeHtml) {
          const htmlData = await this.generateHtmlRepresentation(clipboardData);
          if (htmlData) {
            clipboardItems[ClipboardFormat.HTML] = new Blob([htmlData], { type: ClipboardFormat.HTML });
          }
        }

        // Add image data for single image items
        if (this.systemClipboardOptions.includeImages && clipboardData.items.length === 1) {
          const item = clipboardData.items[0];
          if (item.type === FileType.IMAGE && (item.size || 0) <= this.systemClipboardOptions.maxImageSize) {
            try {
              const dataUrlResponse = await getFileAsDataUrl(item.path);
              const base64Data = dataUrlResponse.dataUrl.split(',')[1];
              const binaryData = atob(base64Data);
              const bytes = new Uint8Array(binaryData.length);
              for (let i = 0; i < binaryData.length; i++) {
                bytes[i] = binaryData.charCodeAt(i);
              }
              clipboardItems[ClipboardFormat.IMAGE] = new Blob([bytes], { type: dataUrlResponse.mimeType });
            } catch (error) {
              logger.warn('Failed to add image to system clipboard:', error);
            }
          }
        }

        // Write to system clipboard if we have data
        if (Object.keys(clipboardItems).length > 0) {
          const clipboardItem = new ClipboardItem(clipboardItems);
          await navigator.clipboard.write([clipboardItem]);
          logger.info('✅ Data written to system clipboard');
        }
      } else {
        logger.warn('System clipboard API not available');
      }

    } catch (error) {
      logger.error('❌ Error writing to system clipboard:', error);
      // Don't throw error here as internal clipboard still works
    }
  }

  /**
   * Generate text representation of clipboard data
   */
  private async generateTextRepresentation(clipboardData: ClipboardData): Promise<string> {
    const lines: string[] = [];

    // Add header
    const operationText = clipboardData.operation === 'copy' ? 'Copied' : 'Cut';
    lines.push(`${operationText} ${clipboardData.items.length} item(s):`);
    lines.push('');

    // Add item details
    for (const item of clipboardData.items) {
      lines.push(`• ${item.name}`);
      if (item.path) {
        lines.push(`  Path: ${item.path}`);
      }
      if (item.size) {
        lines.push(`  Size: ${this.formatSize(item.size)}`);
      }
      if (item.type) {
        lines.push(`  Type: ${item.type}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate HTML representation of clipboard data
   */
  private async generateHtmlRepresentation(clipboardData: ClipboardData): Promise<string> {
    const operationText = clipboardData.operation === 'copy' ? 'Copied' : 'Cut';

    let html = `<div class="clipboard-data">`;
    html += `<h3>${operationText} ${clipboardData.items.length} item(s)</h3>`;
    html += `<ul>`;

    for (const item of clipboardData.items) {
      html += `<li>`;
      html += `<strong>${item.name}</strong>`;
      if (item.path) {
        html += `<br><small>Path: ${item.path}</small>`;
      }
      if (item.size) {
        html += `<br><small>Size: ${this.formatSize(item.size)}</small>`;
      }
      if (item.type) {
        html += `<br><small>Type: ${item.type}</small>`;
      }
      html += `</li>`;
    }

    html += `</ul>`;
    html += `</div>`;

    return html;
  }

  /**
   * Generate URI list representation of clipboard data
   */
  private async generateUriListRepresentation(clipboardData: ClipboardData): Promise<string> {
    const uris: string[] = [];

    for (const item of clipboardData.items) {
      if (item.path) {
        // Convert file path to file:// URI
        const uri = `file://${item.path.replace(/\\/g, '/')}`;
        uris.push(uri);
      }
    }

    return uris.join('\n');
  }

  /**
   * Format file size for display
   */
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

// Create and export singleton instance
export const clipboardManager = new ClipboardManager();

// Export types for external use
export type { SystemClipboardOptions, ClipboardValidation };