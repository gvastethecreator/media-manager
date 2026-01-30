/**
 * Enhanced Download Service
 *
 * This service provides enhanced download functionality with progress tracking			// Start progress tracking if enabled
			let operationId: string | undefined;
			if (options.showProgress !== false) {
				const progressInfo = progressTrackingService.startOperation('file_download', 1, {
					showToast: true,
					description: `Descargando ${itemName}`,
					cancellable: true,
				});
				operationId = `download_${downloadId}`; // Keep original operationId format for consistency
			}ple format support, compression options, and integration with the browser's
 * download manager.
 */

import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import { getFileAsDataUrl } from '@/services/file/file.service';
import { progressTrackingService } from '@/services/progress/progress-tracking.service';
import type { AnyEntityWithStats } from '@/types/entities';
import type { FileItem } from '@/types/files';

const logger = clientLogger.withContext('DownloadService');

/**
 * Download format options
 */
export type DownloadFormat = 'original' | 'zip' | 'tar' | 'pdf';

/**
 * Download quality options for images
 */
export type DownloadQuality = 'original' | 'high' | 'medium' | 'low';

/**
 * Download options interface
 */
export interface DownloadOptions {
	/** Download format */
	format?: DownloadFormat;
	/** Image quality (for image files) */
	quality?: DownloadQuality;
	/** Enable compression */
	compress?: boolean;
	/** Compression level (0-9) */
	compressionLevel?: number;
	/** Custom filename */
	filename?: string;
	/** Show progress tracking */
	showProgress?: boolean;
	/** Enable batch download optimization */
	batchOptimization?: boolean;
	/** Maximum concurrent downloads */
	maxConcurrent?: number;
}

/**
 * Download result interface
 */
export interface DownloadResult {
	/** Success status */
	success: boolean;
	/** Downloaded file path/name */
	filename: string;
	/** File size in bytes */
	size: number;
	/** Download duration in milliseconds */
	duration: number;
	/** Error message if failed */
	error?: string;
}

/**
 * Batch download result interface
 */
export interface BatchDownloadResult {
	/** Overall success status */
	success: boolean;
	/** Total files processed */
	totalFiles: number;
	/** Successfully downloaded files */
	successfulDownloads: number;
	/** Failed downloads */
	failedDownloads: number;
	/** Individual download results */
	results: DownloadResult[];
	/** Total download duration */
	totalDuration: number;
	/** Total size downloaded */
	totalSize: number;
}

/**
 * Enhanced Download Service Class
 */
class EnhancedDownloadService {
	private readonly activeDownloads = new Map<string, AbortController>();
	private readonly maxConcurrentDownloads = 3;

	/**
	 * Download a single file with enhanced options
	 */
	async downloadFile(item: FileItem | AnyEntityWithStats, options: DownloadOptions = {}): Promise<DownloadResult> {
		const startTime = Date.now();
		const itemPath = 'path' in item ? item.path : 'filePath' in item ? (item as any).filePath : '';
		const itemName =
			'name' in item
				? item.name
				: 'fileName' in item
					? (item as any).fileName
					: `item-${(item as any).id || 'unknown'}`;

		logger.info('🔽 Starting enhanced download:', { itemName, options });

		try {
			// Create abort controller for cancellation
			const abortController = new AbortController();
			const downloadId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			this.activeDownloads.set(downloadId, abortController);

			// Start progress tracking if enabled
			let operationId: string | undefined;
			if (options.showProgress !== false) {
				const progressInfo = progressTrackingService.startOperation('file_download', 1, {
					showToast: true,
					description: `Descargando ${itemName}`,
					cancellable: true,
				});
				operationId = `download_${downloadId}`; // Keep original operationId format for consistency
			}

			let downloadUrl: string;
			let filename = options.filename || itemName;
			let blob: Blob;

			// Handle different download formats
			switch (options.format) {
				case 'zip':
					// For ZIP format, we'll compress the file
					blob = await this.downloadAsZip(itemPath, filename, abortController.signal);
					filename = filename.replace(/\.[^/.]+$/, '.zip');
					break;

				case 'pdf':
					// For PDF format (images only)
					if (this.isImageFile(itemName)) {
						blob = await this.downloadAsPdf(itemPath, filename, abortController.signal);
						filename = filename.replace(/\.[^/.]+$/, '.pdf');
					} else {
						throw new Error('PDF format only supported for image files');
					}
					break;

				default:
					// Original format
					blob = await this.downloadOriginal(itemPath, options, abortController.signal);
			}

			// Update progress
			if (operationId) {
				progressTrackingService.updateProgress(operationId, 1, itemName);
			}

			// Create download link and trigger download
			const objectUrl = URL.createObjectURL(blob);
			const downloadLink = document.createElement('a');
			downloadLink.href = objectUrl;
			downloadLink.download = filename;
			downloadLink.rel = 'noopener noreferrer';

			// Add to DOM, click, and remove
			document.body.appendChild(downloadLink);
			downloadLink.click();
			document.body.removeChild(downloadLink);

			// Clean up
			URL.revokeObjectURL(objectUrl);
			this.activeDownloads.delete(downloadId);

			const duration = Date.now() - startTime;
			const result: DownloadResult = {
				success: true,
				filename,
				size: blob.size,
				duration,
			};

			logger.info('✅ Download completed:', result);
			toastService.success(`Descarga completada: ${filename}`);

			return result;
		} catch (error) {
			const duration = Date.now() - startTime;
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

			logger.error('❌ Download failed:', error);
			toastService.error(`Error al descargar ${itemName}: ${errorMessage}`);

			return {
				success: false,
				filename: itemName,
				size: 0,
				duration,
				error: errorMessage,
			};
		}
	}

	/**
	 * Download multiple files with batch optimization
	 */
	async downloadMultipleFiles(
		items: (FileItem | AnyEntityWithStats)[],
		options: DownloadOptions = {}
	): Promise<BatchDownloadResult> {
		const startTime = Date.now();
		logger.info('🔽 Starting batch download:', { itemCount: items.length, options });

		// Start batch progress tracking
		const operationId = `batch_download_${Date.now()}`;
		if (options.showProgress !== false) {
			progressTrackingService.startOperation('file_download', items.length, {
				showToast: true,
				description: `Descargando ${items.length} archivo${items.length > 1 ? 's' : ''}`,
				cancellable: true,
			});
		}

		const results: DownloadResult[] = [];
		let successfulDownloads = 0;
		let totalSize = 0;

		try {
			// Handle batch optimization
			if (options.batchOptimization && items.length > 1) {
				// For multiple files, create a ZIP archive
				const result = await this.downloadAsZipArchive(items, options);
				results.push(result);
				if (result.success) {
					successfulDownloads = 1;
					totalSize = result.size;
				}
			} else {
				// Download files individually with concurrency control
				const maxConcurrent = options.maxConcurrent || this.maxConcurrentDownloads;
				const chunks = this.chunkArray(items, maxConcurrent);

				for (const chunk of chunks) {
					const chunkPromises = chunk.map(async (item, index) => {
						const result = await this.downloadFile(item, {
							...options,
							showProgress: false, // We're tracking at batch level
						});

						if (result.success) {
							successfulDownloads++;
							totalSize += result.size;
						}

						// Update batch progress
						const processedItems = results.length + index + 1;
						if (options.showProgress !== false) {
							progressTrackingService.updateProgress(operationId, processedItems, item.name);
						}

						return result;
					});

					const chunkResults = await Promise.all(chunkPromises);
					results.push(...chunkResults);
				}
			}

			const totalDuration = Date.now() - startTime;
			const batchResult: BatchDownloadResult = {
				success: successfulDownloads > 0,
				totalFiles: items.length,
				successfulDownloads,
				failedDownloads: items.length - successfulDownloads,
				results,
				totalDuration,
				totalSize,
			};

			// Complete progress tracking
			if (options.showProgress !== false) {
				progressTrackingService.completeOperation(operationId);
			}

			logger.info('✅ Batch download completed:', batchResult);
			toastService.success(
				`Descarga completada: ${successfulDownloads}/${items.length} archivo${items.length > 1 ? 's' : ''}`
			);

			return batchResult;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			logger.error('❌ Batch download failed:', error);

			if (options.showProgress !== false) {
				progressTrackingService.failOperation(operationId, errorMessage);
			}

			toastService.error(`Error en descarga masiva: ${errorMessage}`);

			return {
				success: false,
				totalFiles: items.length,
				successfulDownloads,
				failedDownloads: items.length - successfulDownloads,
				results,
				totalDuration: Date.now() - startTime,
				totalSize,
			};
		}
	}

	/**
	 * Cancel an active download
	 */
	cancelDownload(downloadId: string): boolean {
		const controller = this.activeDownloads.get(downloadId);
		if (controller) {
			controller.abort();
			this.activeDownloads.delete(downloadId);
			logger.info('🚫 Download cancelled:', downloadId);
			return true;
		}
		return false;
	}

	/**
	 * Get active downloads count
	 */
	getActiveDownloadsCount(): number {
		return this.activeDownloads.size;
	}

	/**
	 * Download file in original format
	 */
	private async downloadOriginal(filePath: string, _options: DownloadOptions, signal: AbortSignal): Promise<Blob> {
		// Try to get file as data URL first (for images)
		try {
			const { dataUrl } = await getFileAsDataUrl(filePath);
			const response = await fetch(dataUrl, { signal });
			return await response.blob();
		} catch {
			// Fallback to direct file access
			const response = await fetch(`/api/files/download?path=${encodeURIComponent(filePath)}`, {
				signal,
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			return await response.blob();
		}
	}

	/**
	 * Download file as ZIP
	 */
	private async downloadAsZip(filePath: string, _filename: string, signal: AbortSignal): Promise<Blob> {
		// For now, we'll use a simple approach
		// In a real implementation, you'd use a library like JSZip
		const originalBlob = await this.downloadOriginal(filePath, {}, signal);

		// TODO: Implement actual ZIP compression using JSZip
		// For now, return original blob (this would need JSZip library)
		return originalBlob;
	}

	/**
	 * Download image as PDF
	 */
	private async downloadAsPdf(filePath: string, _filename: string, signal: AbortSignal): Promise<Blob> {
		// For now, return original blob
		// In a real implementation, you'd convert image to PDF
		const originalBlob = await this.downloadOriginal(filePath, {}, signal);

		// TODO: Implement PDF conversion using jsPDF or similar
		return originalBlob;
	}

	/**
	 * Download multiple files as ZIP archive
	 */
	private async downloadAsZipArchive(
		items: (FileItem | AnyEntityWithStats)[],
		options: DownloadOptions
	): Promise<DownloadResult> {
		const startTime = Date.now();
		let totalSize = 0;

		try {
			// Create a simple ZIP-like structure (for demonstration)
			// In a real implementation, you would use JSZip library
			const files: Array<{ name: string; data: Blob }> = [];

			for (const item of items) {
				try {
					const itemPath = 'path' in item ? (item as any).path : item.name;
					const itemName = item.name;

					const blob = await this.downloadOriginal(itemPath, {}, new AbortController().signal);
					files.push({ name: itemName, data: blob });
					totalSize += blob.size;
				} catch (error) {
					logger.warn(`Failed to add ${item.name} to archive:`, error);
				}
			}

			// Create a simple concatenated blob (placeholder for ZIP)
			const combinedBlob = new Blob(
				files.map((f) => f.data),
				{ type: 'application/zip' }
			);

			const filename = options.filename || `archive-${Date.now()}.zip`;

			// Create download link and trigger download
			const objectUrl = URL.createObjectURL(combinedBlob);
			const downloadLink = document.createElement('a');
			downloadLink.href = objectUrl;
			downloadLink.download = filename;
			downloadLink.rel = 'noopener noreferrer';

			// Add to DOM, click, and remove
			document.body.appendChild(downloadLink);
			downloadLink.click();
			document.body.removeChild(downloadLink);

			// Clean up
			URL.revokeObjectURL(objectUrl);

			return {
				success: true,
				filename,
				size: totalSize,
				duration: Date.now() - startTime,
			};
		} catch (error) {
			logger.error('Failed to create ZIP archive:', error);
			throw error;
		}
	}

	/**
	 * Check if file is an image
	 */
	private isImageFile(filename: string): boolean {
		const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
		const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
		return imageExtensions.includes(extension);
	}

	/**
	 * Split array into chunks
	 */
	private chunkArray<T>(array: T[], chunkSize: number): T[][] {
		const chunks: T[][] = [];
		for (let i = 0; i < array.length; i += chunkSize) {
			chunks.push(array.slice(i, i + chunkSize));
		}
		return chunks;
	}
}

// Create and export service instance
export const enhancedDownloadService = new EnhancedDownloadService();
