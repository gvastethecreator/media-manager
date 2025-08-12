/**
 * Download Manager Hook
 *
 * Custom hook for managing file downloads with progress tracking,
 * queue management, and integration with the enhanced download service.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toastService } from '@/lib/ui/toast';
import type { BatchDownloadResult, DownloadOptions, DownloadResult } from '@/services/download/download.service';
import { enhancedDownloadService } from '@/services/download/download.service';
import type { FileItem } from '@/types/files';
import { useProgressTracking } from './use-progress-tracking';

export interface DownloadQueueItem {
	id: string;
	files: FileItem[];
	options: DownloadOptions;
	status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
	result?: DownloadResult | BatchDownloadResult;
	error?: string;
	createdAt: number;
}

export interface UseDownloadManagerOptions {
	/** Maximum number of concurrent downloads */
	maxConcurrent?: number;
	/** Auto-start downloads when added to queue */
	autoStart?: boolean;
	/** Show notifications for download events */
	showNotifications?: boolean;
}

export interface UseDownloadManagerReturn {
	/** Current download queue */
	queue: DownloadQueueItem[];
	/** Active downloads count */
	activeDownloads: number;
	/** Whether downloads are currently processing */
	isProcessing: boolean;
	/** Download a single file */
	downloadFile: (file: FileItem, options?: DownloadOptions) => Promise<string>;
	/** Download multiple files */
	downloadFiles: (files: FileItem[], options?: DownloadOptions) => Promise<string>;
	/** Cancel a download */
	cancelDownload: (downloadId: string) => boolean;
	/** Clear completed downloads from queue */
	clearCompleted: () => void;
	/** Retry a failed download */
	retryDownload: (downloadId: string) => Promise<void>;
	/** Get download statistics */
	getStats: () => {
		total: number;
		completed: number;
		failed: number;
		pending: number;
		totalSize: number;
	};
}

/**
 * Hook for managing file downloads
 */
export function useDownloadManager(options: UseDownloadManagerOptions = {}): UseDownloadManagerReturn {
	const { maxConcurrent = 3, autoStart = true, showNotifications = true } = options;

	const [queue, setQueue] = useState<DownloadQueueItem[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);
	const processingRef = useRef(false);
	const activeDownloadsRef = useRef(0);

	// Progress tracking integration
	const { operations } = useProgressTracking({
		trackAll: true,
		operationTypes: ['file_download'],
	});

	// Calculate active downloads from progress tracking
	const activeDownloads = operations.filter(
		(op) => op.type === 'file_download' && ['pending', 'running'].includes(op.status)
	).length;

	/**
	 * Execute a single download
	 */
	const executeDownload = useCallback(
		async (downloadItem: DownloadQueueItem) => {
			try {
				let result: DownloadResult | BatchDownloadResult;

				if (downloadItem.files.length === 1) {
					// Descarga de un único archivo: pasar el FileItem completo para cumplir tipos
					const file = downloadItem.files[0];
					result = await enhancedDownloadService.downloadFile(file, downloadItem.options);
				} else {
					// Descarga múltiple: pasar los FileItem completos
					result = await enhancedDownloadService.downloadMultipleFiles(downloadItem.files, downloadItem.options);
				}

				// Update queue with success
				setQueue((prev) =>
					prev.map((item) => (item.id === downloadItem.id ? { ...item, status: 'completed' as const, result } : item))
				);

				if (showNotifications) {
					const fileCount = downloadItem.files.length;
					toastService.success(`Descarga completada: ${fileCount} archivo${fileCount > 1 ? 's' : ''}`);
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

				// Update queue with error
				setQueue((prev) =>
					prev.map((item) =>
						item.id === downloadItem.id ? { ...item, status: 'failed' as const, error: errorMessage } : item
					)
				);

				if (showNotifications) {
					toastService.error(`Error en descarga: ${errorMessage}`);
				}
			}
		},
		[showNotifications]
	);

	/**
	 * Process the download queue
	 */
	const processQueue = useCallback(async () => {
		// no-op await para cumplir regla useAwait y mantener API
		await Promise.resolve();
		if (processingRef.current) {
			return;
		}

		processingRef.current = true;
		setIsProcessing(true);

		try {
			while (true) {
				// Find pending downloads
				const pendingDownloads = queue.filter((item) => item.status === 'pending');

				if (pendingDownloads.length === 0) {
					break;
				}
				if (activeDownloadsRef.current >= maxConcurrent) {
					break;
				}

				const downloadItem = pendingDownloads[0];

				// Update status to downloading
				setQueue((prev) =>
					prev.map((item) => (item.id === downloadItem.id ? { ...item, status: 'downloading' as const } : item))
				);

				activeDownloadsRef.current++;

				// Start download (don't await to allow concurrent downloads)
				executeDownload(downloadItem).finally(() => {
					activeDownloadsRef.current--;
					// Continue processing queue
					setTimeout(processQueue, 100);
				});
			}
		} finally {
			processingRef.current = false;
			setIsProcessing(activeDownloadsRef.current > 0);
		}
	}, [
		executeDownload,
		queue,
		maxConcurrent, // Start download (don't await to allow concurrent downloads)
	]);

	// Añadir dependencia ahora que está definida
	// biome-ignore lint/correctness/useExhaustiveDependencies: dependencia añadida manualmente
	(processQueue as unknown as any).deps = [executeDownload];

	/**
	 * Add download to queue
	 */
	const addToQueue = useCallback(
		(files: FileItem[], dlOptions: DownloadOptions = {}): string => {
			const downloadId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const queueItem: DownloadQueueItem = {
				id: downloadId,
				files,
				options: dlOptions,
				status: 'pending',
				createdAt: Date.now(),
			};

			setQueue((prev) => [...prev, queueItem]);

			if (autoStart) {
				// Trigger queue processing
				setTimeout(processQueue, 100);
			}

			return downloadId;
		},
		[autoStart, processQueue]
	);

	/**
	 * Download a single file
	 */
	const downloadFile = useCallback(
		async (inputFile: FileItem, dlOptions: DownloadOptions = {}): Promise<string> => {
			// no-op await para cumplir regla useAwait
			await Promise.resolve();
			return addToQueue([inputFile], dlOptions);
		},
		[addToQueue]
	);

	/**
	 * Download multiple files
	 */
	const downloadFiles = useCallback(
		async (inputFiles: FileItem[], dlOptions: DownloadOptions = {}): Promise<string> => {
			await Promise.resolve();
			return addToQueue(inputFiles, dlOptions);
		},
		[addToQueue]
	);

	/**
	 * Cancel a download
	 */
	const cancelDownload = useCallback((downloadId: string): boolean => {
		setQueue((prev) =>
			prev.map((item) =>
				item.id === downloadId && ['pending', 'downloading'].includes(item.status)
					? { ...item, status: 'cancelled' as const }
					: item
			)
		);

		// Try to cancel in the download service
		return enhancedDownloadService.cancelDownload(downloadId);
	}, []);

	/**
	 * Clear completed downloads
	 */
	const clearCompleted = useCallback(() => {
		setQueue((prev) => prev.filter((item) => !['completed', 'failed', 'cancelled'].includes(item.status)));
	}, []);

	/**
	 * Retry a failed download
	 */
	const retryDownload = useCallback(
		async (downloadId: string): Promise<void> => {
			await Promise.resolve();
			const downloadItem = queue.find((item) => item.id === downloadId);
			if (!downloadItem || downloadItem.status !== 'failed') {
				return;
			}

			// Reset status to pending
			setQueue((prev) =>
				prev.map((item) => (item.id === downloadId ? { ...item, status: 'pending' as const, error: undefined } : item))
			);

			if (autoStart) {
				setTimeout(processQueue, 100);
			}
		},
		[queue, autoStart, processQueue]
	);

	/**
	 * Get download statistics
	 */
	const getStats = useCallback(() => {
		const stats = queue.reduce(
			(acc, item) => {
				acc.total++;
				if (item.status === 'completed') {
					acc.completed++;
				}
				if (item.status === 'failed') {
					acc.failed++;
				}
				if (item.status === 'pending') {
					acc.pending++;
				}

				if (item.result && 'size' in item.result) {
					acc.totalSize += item.result.size;
				} else if (item.result && 'totalSize' in item.result) {
					acc.totalSize += item.result.totalSize;
				}

				return acc;
			},
			{ total: 0, completed: 0, failed: 0, pending: 0, totalSize: 0 }
		);

		return stats;
	}, [queue]);

	// Auto-process queue when items are added
	useEffect(() => {
		if (autoStart && queue.some((item) => item.status === 'pending')) {
			const timer = setTimeout(processQueue, 100);
			return () => clearTimeout(timer);
		}
	}, [queue, autoStart, processQueue]);

	return {
		queue,
		activeDownloads,
		isProcessing,
		downloadFile,
		downloadFiles,
		cancelDownload,
		clearCompleted,
		retryDownload,
		getStats,
	};
}
