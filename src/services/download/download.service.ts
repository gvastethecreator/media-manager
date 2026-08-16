/**
 * Downloads only authorized original files.
 *
 * Archive, conversion, and PDF output stay out of this surface until the
 * application can generate and validate those formats.
 */

import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import { progressTrackingService } from '@/services/progress/progress-tracking.service';
import type { AnyEntityWithStats } from '@/types/entities';
import type { FileItem } from '@/types/files';

const logger = clientLogger.withContext('DownloadService');

export type DownloadFormat = 'original';

export interface DownloadOptions {
	/** Custom filename for a single original-file download. */
	filename?: string;
	/** Original download is the only supported output. */
	format?: DownloadFormat;
	/** Stable queue ID used to cancel the active request. */
	operationId?: string;
	/** Show progress tracking and its cancellation action. */
	showProgress?: boolean;
}

export interface DownloadResult {
	duration: number;
	error?: string;
	filename: string;
	size: number;
	success: boolean;
}

export interface BatchDownloadResult {
	failedDownloads: number;
	results: DownloadResult[];
	success: boolean;
	successfulDownloads: number;
	totalDuration: number;
	totalFiles: number;
	totalSize: number;
}

interface ActiveDownload {
	controller: AbortController;
	progressOperationId?: string;
}

class EnhancedDownloadService {
	private readonly activeDownloads = new Map<string, ActiveDownload>();

	async downloadFile(item: FileItem | AnyEntityWithStats, options: DownloadOptions = {}): Promise<DownloadResult> {
		const startedAt = Date.now();
		const itemName = this.getItemName(item);
		const downloadId = options.operationId ?? this.createDownloadId();
		const controller = new AbortController();
		const progressOperationId = this.startProgress(downloadId, 1, itemName, options, controller);
		this.activeDownloads.set(downloadId, { controller, progressOperationId });

		try {
			const blob = await this.downloadOriginal(item, controller.signal);
			const filename = options.filename || itemName;
			this.triggerBrowserDownload(blob, filename);
			this.completeProgress(progressOperationId, itemName);
			const result = {
				duration: Date.now() - startedAt,
				filename,
				size: blob.size,
				success: true,
			} satisfies DownloadResult;
			if (!progressOperationId) toastService.success(`Descarga completada: ${filename}`);
			logger.info('Descarga completada.', { filename, size: blob.size });
			return result;
		} catch (error) {
			return this.toFailureResult(
				itemName,
				controller.signal.aborted,
				error,
				progressOperationId,
				Date.now() - startedAt
			);
		} finally {
			this.activeDownloads.delete(downloadId);
		}
	}

	async downloadMultipleFiles(
		items: (FileItem | AnyEntityWithStats)[],
		options: DownloadOptions = {}
	): Promise<BatchDownloadResult> {
		const startTime = Date.now();
		const downloadId = options.operationId ?? this.createDownloadId();
		const controller = new AbortController();
		const progressOperationId = this.startProgress(
			downloadId,
			items.length,
			`Descargando ${items.length} archivo${items.length === 1 ? '' : 's'}`,
			options,
			controller
		);
		this.activeDownloads.set(downloadId, { controller, progressOperationId });

		const results: DownloadResult[] = [];
		let totalSize = 0;
		try {
			for (const [index, item] of items.entries()) {
				if (controller.signal.aborted) break;
				const itemName = this.getItemName(item);
				try {
					const blob = await this.downloadOriginal(item, controller.signal);
					this.triggerBrowserDownload(blob, itemName);
					results.push({ duration: 0, filename: itemName, size: blob.size, success: true });
					totalSize += blob.size;
				} catch (error) {
					results.push(this.toFailureResult(itemName, controller.signal.aborted, error));
					if (controller.signal.aborted) break;
				}
				if (progressOperationId) {
					progressTrackingService.updateProgress(progressOperationId, ((index + 1) / items.length) * 100, itemName);
				}
			}

			const successfulDownloads = results.filter((result) => result.success).length;
			const result: BatchDownloadResult = {
				failedDownloads: items.length - successfulDownloads,
				results,
				success: successfulDownloads > 0 && !controller.signal.aborted,
				successfulDownloads,
				totalDuration: Date.now() - startTime,
				totalFiles: items.length,
				totalSize,
			};
			if (controller.signal.aborted) {
				if (progressOperationId) progressTrackingService.cancelOperation(progressOperationId);
			} else if (!result.success && progressOperationId) {
				progressTrackingService.failOperation(progressOperationId, 'No se pudo descargar ningún archivo.');
			}
			if (!progressOperationId) {
				const message = `Descargados ${successfulDownloads}/${items.length} archivos.`;
				if (result.success) toastService.success(message);
				else toastService.error(message);
			}
			return result;
		} finally {
			this.activeDownloads.delete(downloadId);
		}
	}

	cancelDownload(downloadId: string): boolean {
		const activeDownload = this.activeDownloads.get(downloadId);
		if (!activeDownload) return false;
		activeDownload.controller.abort();
		if (activeDownload.progressOperationId) {
			progressTrackingService.cancelOperation(activeDownload.progressOperationId);
		}
		return true;
	}

	getActiveDownloadsCount(): number {
		return this.activeDownloads.size;
	}

	private completeProgress(progressOperationId: string | undefined, itemName: string): void {
		if (progressOperationId) progressTrackingService.updateProgress(progressOperationId, 100, itemName);
	}

	private createDownloadId(): string {
		return `download_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
	}

	private getItemName(item: FileItem | AnyEntityWithStats): string {
		const candidate = item as unknown as Record<string, unknown>;
		if (typeof candidate.name === 'string' && candidate.name) return candidate.name;
		if (typeof candidate.fileName === 'string' && candidate.fileName) return candidate.fileName;
		return typeof candidate.id === 'string' ? `item-${candidate.id}` : 'download';
	}

	private async downloadOriginal(item: FileItem | AnyEntityWithStats, signal: AbortSignal): Promise<Blob> {
		const response = await fetch('/api/download', {
			body: JSON.stringify(this.toAuthorizedDownloadBody(item)),
			headers: { 'Content-Type': 'application/json' },
			method: 'POST',
			signal,
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		return response.blob();
	}

	private toAuthorizedDownloadBody(item: FileItem | AnyEntityWithStats): {
		asset?: { assetId: string; assetType: string };
		source?: { relativePath: string; rootId: string };
	} {
		const candidate = item as unknown as Record<string, unknown>;
		if (typeof candidate.rootId === 'string' && typeof candidate.relativePath === 'string') {
			return { source: { relativePath: candidate.relativePath, rootId: candidate.rootId } };
		}
		const rawType = candidate.entityType ?? candidate.type;
		const assetType = rawType === 'jsonFile' || rawType === 'jsonfile' ? 'json' : rawType;
		if (
			typeof candidate.id === 'string' &&
			typeof assetType === 'string' &&
			['image', 'video', 'audio', 'document', 'json', 'file3d'].includes(assetType)
		) {
			return { asset: { assetId: candidate.id, assetType } };
		}
		throw new Error('El elemento no contiene una referencia de descarga autorizable.');
	}

	private startProgress(
		downloadId: string,
		totalItems: number,
		description: string,
		options: DownloadOptions,
		controller: AbortController
	): string | undefined {
		if (options.showProgress === false) return undefined;
		return progressTrackingService.startOperation('file_download', totalItems, {
			cancellable: true,
			description,
			onCancel: () => controller.abort(),
			showToast: true,
			metadata: { downloadId },
		});
	}

	private toFailureResult(
		itemName: string,
		wasCancelled: boolean,
		error: unknown,
		progressOperationId?: string,
		duration = 0
	): DownloadResult {
		const errorMessage = wasCancelled
			? 'Descarga cancelada.'
			: error instanceof Error
				? error.message
				: 'Error desconocido';
		if (progressOperationId) {
			if (wasCancelled) progressTrackingService.cancelOperation(progressOperationId);
			else progressTrackingService.failOperation(progressOperationId, errorMessage);
		} else if (wasCancelled) {
			toastService.info(errorMessage);
		} else {
			toastService.error(`Error al descargar ${itemName}: ${errorMessage}`);
		}
		logger.warn('Descarga fallida.', { cancelled: wasCancelled, itemName });
		return { duration, error: errorMessage, filename: itemName, size: 0, success: false };
	}

	private triggerBrowserDownload(blob: Blob, filename: string): void {
		const objectUrl = URL.createObjectURL(blob);
		const downloadLink = document.createElement('a');
		downloadLink.download = filename;
		downloadLink.href = objectUrl;
		downloadLink.rel = 'noopener noreferrer';
		document.body.appendChild(downloadLink);
		downloadLink.click();
		downloadLink.remove();
		URL.revokeObjectURL(objectUrl);
	}
}

export const enhancedDownloadService = new EnhancedDownloadService();
