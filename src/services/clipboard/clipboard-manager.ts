/**
 * @file ClipboardManager for system integration
 * @module services/clipboard/clipboard-manager
 * @description Comprehensive clipboard manager with system clipboard integration,
 * multiple file formats support, and metadata handling for file browser operations
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { getEntityName, getEntityPath, getEntitySize, isEntityDirectory } from '@/lib/utils/entity-properties.utils';
import { formatFileSize } from '@/lib/utils/format.utils';
import { getFileAsDataUrl } from '@/services/file/file.service';
import { toastService } from '@/services/toast/toast.service';
import type { AnyEntityWithStats } from '@/types/entities';
import { FileErrorCode, FileType } from '@/types/entities/file';

const logger = serverLogger.withContext('ClipboardManager');

/**
 * Supported clipboard data formats
 */
export const ClipboardFormat = {
	TEXT: 'text/plain',
	HTML: 'text/html',
	IMAGE: 'image/png',
	FILES: 'application/x-file-list',
	JSON: 'application/json',
	URI_LIST: 'text/uri-list',
} as const;
export type ClipboardFormat = (typeof ClipboardFormat)[keyof typeof ClipboardFormat];

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
	async copy(items: AnyEntityWithStats[], source = 'file-browser'): Promise<void> {
		try {
			logger.info('📋 Copying items to clipboard with system integration:', items.length);

			// Validate items
			const validation = this.validateItems(items, 'copy');
			if (!validation.isValid) {
				throw createClipboardError(
					`Validation failed: ${validation.errors.join(', ')}`,
					FileErrorCode.VALIDATION_ERROR
				);
			}

			// Create clipboard data
			const clipboardData = await this.createClipboardData(items, 'copy', source);
			this.clipboardData = clipboardData;

			// Integrate with system clipboard
			await this.writeToSystemClipboard(clipboardData);

			// Show success notification
			const message =
				items.length === 1
					? `"${getEntityName(items[0])}" copiado al portapapeles`
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
	async cut(items: AnyEntityWithStats[], source = 'file-browser'): Promise<void> {
		try {
			logger.info('✂️ Cutting items to clipboard with system integration:', items.length);

			// Validate items
			const validation = this.validateItems(items, 'cut');
			if (!validation.isValid) {
				throw createClipboardError(
					`Validation failed: ${validation.errors.join(', ')}`,
					FileErrorCode.VALIDATION_ERROR
				);
			}

			// Create clipboard data
			const clipboardData = await this.createClipboardData(items, 'cut', source);
			this.clipboardData = clipboardData;

			// Integrate with system clipboard
			await this.writeToSystemClipboard(clipboardData);

			// Show success notification
			const message =
				items.length === 1
					? `"${getEntityName(items[0])}" cortado al portapapeles`
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
		return (
			this.clipboardData !== null &&
			this.clipboardData.items.length > 0 &&
			this.clipboardData.metadata.canPasteToFileSystem
		);
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
					return await this.generateTextRepresentation(this.clipboardData);

				case ClipboardFormat.HTML:
					return await this.generateHtmlRepresentation(this.clipboardData);

				case ClipboardFormat.JSON:
					return JSON.stringify(this.clipboardData, null, 2);

				case ClipboardFormat.URI_LIST:
					return await this.generateUriListRepresentation(this.clipboardData);

				default:
					logger.warn('Unsupported clipboard format requested:', format);
					return null;
			}
		} catch (error) {
			logger.error('Error generating clipboard data in format:', format, error instanceof Error ? error.message : String(error));
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
	private createClipboardData(
		items: AnyEntityWithStats[],
		operation: 'copy' | 'cut',
		source: string
	): ClipboardData {
		// Calculate metadata
		const totalSize = items.reduce((sum, item) => sum + getEntitySize(item), 0);
		const fileTypes = Array.from(
			new Set(items.map((item) => ('entityType' in item ? item.entityType : 'unknown')).filter(Boolean))
		) as FileType[];

		// Determine supported formats
		const formats: ClipboardFormat[] = [ClipboardFormat.TEXT, ClipboardFormat.JSON];

		if (this.systemClipboardOptions.includeHtml) {
			formats.push(ClipboardFormat.HTML);
		}

		if (this.systemClipboardOptions.includeUris) {
			formats.push(ClipboardFormat.URI_LIST);
		}

		// Check if any items are images within size limit
		const hasValidImages = items.some(
			(item) => item.entityType === 'image' && getEntitySize(item) <= this.systemClipboardOptions.maxImageSize
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

		this.validateBasic(items, errors, warnings);
		if (operation === 'cut') {
			this.validateCut(items, warnings);
		}
		this.validateSize(items, warnings);
		this.computeSupportedOps(items, errors, supportedOperations);

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
			supportedOperations,
		};
	}

	private validateBasic(items: AnyEntityWithStats[], errors: string[], warnings: string[]): void {
		if (!items || items.length === 0) {
			errors.push('No items provided');
			return;
		}
		for (const item of items) {
			this.validateItemBasic(item, errors, warnings);
		}
	}

	private validateItemBasic(item: AnyEntityWithStats, errors: string[], warnings: string[]): void {
		if (!item.id) {
			errors.push(`Item missing ID: ${'name' in item ? item.name : 'unknown'}`);
		}
		const itemPath = getEntityPath(item);
		if (!itemPath) {
			errors.push(`Item missing path: ${'name' in item ? item.name : 'unknown'}`);
		}
		if (!('name' in item && item.name)) {
			warnings.push(`Item missing name: ${item.id || 'unknown'}`);
		}
	}

	private validateCut(items: AnyEntityWithStats[], warnings: string[]): void {
		const readonlyItems = items.filter((item) => isEntityDirectory(item));
		if (readonlyItems.length > 0) {
			warnings.push(
				`Moving directories may have restrictions: ${readonlyItems.map((i) => getEntityName(i)).join(', ')}`
			);
		}
	}

	private validateSize(items: AnyEntityWithStats[], warnings: string[]): void {
		const totalSize = items.reduce((sum, item) => sum + getEntitySize(item), 0);
		const maxClipboardSize = 100 * 1024 * 1024; // 100MB
		if (totalSize > maxClipboardSize) {
			warnings.push(`Total size (${formatFileSize(totalSize)}) exceeds recommended clipboard limit`);
		}
	}

	private computeSupportedOps(
		items: AnyEntityWithStats[],
		errors: string[],
		supportedOperations: ('copy' | 'cut' | 'paste')[]
	): void {
		if (errors.length > 0) {
			return;
		}
		supportedOperations.push('copy');
		const hasMovableItems = items.some((item) => !isEntityDirectory(item));
		if (hasMovableItems) {
			supportedOperations.push('cut');
		}
		supportedOperations.push('paste');
	}

	/**
	 * Write clipboard data to system clipboard
	 */
	private async writeToSystemClipboard(clipboardData: ClipboardData): Promise<void> {
		try {
			if (typeof navigator === 'undefined' || !navigator.clipboard) {
				logger.warn('System clipboard API not available');
				return;
			}
			const clipboardItems = await this.buildClipboardItemsForSystem(clipboardData);
			if (Object.keys(clipboardItems).length === 0) {
				return;
			}
			await this.writeClipboardItemsToSystem(clipboardItems);
		} catch (error) {
			logger.error('❌ Error writing to system clipboard:', error);
		}
	}

	private async buildClipboardItemsForSystem(
		clipboardData: ClipboardData,
	): Promise<Record<string, Blob>> {
		const clipboardItems: Record<string, Blob> = {};
		if (this.systemClipboardOptions.includeText) {
			const textBlob = this.prepareTextBlob(clipboardData);
			if (textBlob) {
				clipboardItems[ClipboardFormat.TEXT] = textBlob;
			}
		}
		if (this.systemClipboardOptions.includeHtml) {
			const htmlBlob = this.prepareHtmlBlob(clipboardData);
			if (htmlBlob) {
				clipboardItems[ClipboardFormat.HTML] = htmlBlob;
			}
		}
		if (this.systemClipboardOptions.includeImages && clipboardData.items.length === 1) {
			const imageBlob = await this.prepareImageBlob(clipboardData.items[0]);
			if (imageBlob) {
				clipboardItems[ClipboardFormat.IMAGE] = imageBlob;
			}
		}
		return clipboardItems;
	}

	private async writeClipboardItemsToSystem(
		clipboardItems: Record<string, Blob>,
	): Promise<void> {
		const clipboardItem = new ClipboardItem(clipboardItems);
		await navigator.clipboard.write([clipboardItem]);
		logger.info('✅ Data written to system clipboard');
	}

	/**
	 * Generate text representation of clipboard data
	 */
	private generateTextRepresentation(clipboardData: ClipboardData): string {
		const lines: string[] = [];

		// Add header
		const operationText = clipboardData.operation === 'copy' ? 'Copied' : 'Cut';
		lines.push(`${operationText} ${clipboardData.items.length} item(s):`);
		lines.push('');

		// Add item details
		for (const item of clipboardData.items) {
			lines.push(`• ${item.name}`);
			const itemPath = getEntityPath(item);
			if (itemPath) {
				lines.push(`  Path: ${itemPath}`);
			}
			const itemSize = getEntitySize(item);
			if (itemSize > 0) {
				lines.push(`  Size: ${formatFileSize(itemSize)}`);
			}
			lines.push(`  Type: ${item.entityType}`);
			lines.push('');
		}

		return lines.join('\n');
	}

	/**
	 * Generate HTML representation of clipboard data
	 */
	private generateHtmlRepresentation(clipboardData: ClipboardData): string {
		const operationText = clipboardData.operation === 'copy' ? 'Copied' : 'Cut';

		let html = `<div class="clipboard-data">`;
		html += `<h3>${operationText} ${clipboardData.items.length} item(s)</h3>`;
		html += '<ul>';

		for (const item of clipboardData.items) {
			html += '<li>';
			html += `<strong>${item.name}</strong>`;
			const itemPath = getEntityPath(item);
			if (itemPath) {
				html += `<br><small>Path: ${itemPath}</small>`;
			}
			const itemSize = getEntitySize(item);
			if (itemSize > 0) {
				html += `<br><small>Size: ${formatFileSize(itemSize)}</small>`;
			}
			html += `<br><small>Type: ${item.entityType}</small>`;
			html += '</li>';
		}

		html += '</ul>';
		html += '</div>';

		return html;
	}

	/**
	 * Generate URI list representation of clipboard data
	 */
	private generateUriListRepresentation(clipboardData: ClipboardData): string {
		const uris: string[] = [];

		for (const item of clipboardData.items) {
			const itemPath = getEntityPath(item);
			if (itemPath) {
				// Convert file path to file:// URI
				const uri = `file://${itemPath.replace(/\\/g, '/')}`;
				uris.push(uri);
			}
		}

		return uris.join('\n');
	}

	// Helpers to reduce complexity in writeToSystemClipboard
	private prepareTextBlob(clipboardData: ClipboardData): Blob | null {
		try {
			const text = this.generateTextRepresentation(clipboardData);
			return new Blob([text], { type: ClipboardFormat.TEXT });
		} catch {
			return null;
		}
	}

	private prepareHtmlBlob(clipboardData: ClipboardData): Blob | null {
		try {
			const html = this.generateHtmlRepresentation(clipboardData);
			return new Blob([html], { type: ClipboardFormat.HTML });
		} catch {
			return null;
		}
	}

	private async prepareImageBlob(item: AnyEntityWithStats): Promise<Blob | null> {
		if (item.entityType !== 'image' || getEntitySize(item) > this.systemClipboardOptions.maxImageSize) {
			return null;
		}
		try {
			const itemPath = getEntityPath(item);
			const dataUrlResponse = await getFileAsDataUrl(itemPath);
			const base64Data = dataUrlResponse.dataUrl.split(',')[1];
			const binaryData = atob(base64Data);
			const bytes = new Uint8Array(binaryData.length);
			for (let i = 0; i < binaryData.length; i++) {
				bytes[i] = binaryData.charCodeAt(i);
			}
			return new Blob([bytes], { type: dataUrlResponse.mimeType });
		} catch (error) {
			logger.warn('Failed to prepare image blob for system clipboard:', error);
			return null;
		}
	}
}

// Create and export singleton instance
export const clipboardManager = new ClipboardManager();
