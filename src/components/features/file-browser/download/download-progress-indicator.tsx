/**
 * Download Progress Indicator Component
 *
 * This component displays download progress in a compact, non-intrusive way.
 * It shows active downloads, progress bars, and allows cancellation.
 */

import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Download, Pause, Play, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import { useDownloadManager } from '@/hooks/use-download-manager';
import { useProgressTracking } from '@/hooks/use-progress-tracking';
import { formatDuration, formatFileSize } from '@/lib/utils/format.utils';

interface DownloadProgressIndicatorProps {
	/** Position of the indicator */
	position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
	/** Whether to show detailed progress */
	showDetails?: boolean;
}

const positionClasses = {
	'bottom-right': 'bottom-4 right-4',
	'bottom-left': 'bottom-4 left-4',
	'top-right': 'top-4 right-4',
	'top-left': 'top-4 left-4',
};

export function DownloadProgressIndicator({
	position = 'bottom-right',
	showDetails = false,
}: DownloadProgressIndicatorProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [showCompleted, setShowCompleted] = useState(false);

	const { queue, activeDownloads, cancelDownload, clearCompleted, retryDownload } = useDownloadManager();
	const { operations } = useProgressTracking({
		trackAll: true,
		operationTypes: ['file_download'],
	});

	// Filter download operations
	const downloadOperations = operations.filter((op) => op.type === 'file_download');
	const activeOperations = downloadOperations.filter((op) => ['pending', 'running'].includes(op.status));
	const completedOperations = downloadOperations.filter((op) => op.status === 'completed');
	const failedOperations = downloadOperations.filter((op) => op.status === 'failed');

	// Don't show if no downloads
	if (queue.length === 0 && downloadOperations.length === 0) {
		return null;
	}

	const formatTimeRemaining = (ms: number): string => {
		if (ms < 60000) return `${Math.round(ms / 1000)}s`;
		if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
		return `${Math.round(ms / 3600000)}h`;
	};

	const getOverallProgress = (): number => {
		if (activeOperations.length === 0) return 100;
		const totalProgress = activeOperations.reduce((sum, op) => sum + op.progress.percentage, 0);
		return totalProgress / activeOperations.length;
	};

	return (
		<div className={`fixed ${positionClasses[position]} z-40 max-w-sm`}>
			<AnimatePresence>
				{/* Compact Indicator */}
				{!isExpanded && (activeOperations.length > 0 || completedOperations.length > 0) && (
					<motion.div
						initial={{ opacity: 0, scale: 0.8, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.8, y: 20 }}
						className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer"
						onClick={() => setIsExpanded(true)}
					>
						<div className="flex items-center gap-3">
							<div className="relative">
								<Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
								{activeOperations.length > 0 && (
									<div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
										<span className="text-xs text-white font-bold">{activeOperations.length}</span>
									</div>
								)}
							</div>

							<div className="flex-1 min-w-0">
								{activeOperations.length > 0 ? (
									<>
										<div className="text-sm font-medium text-gray-900 dark:text-white">
											Descargando {activeOperations.length} archivo{activeOperations.length > 1 ? 's' : ''}
										</div>
										<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
											<div
												className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
												style={{ width: `${getOverallProgress()}%` }}
											/>
										</div>
									</>
								) : (
									<div className="text-sm font-medium text-green-600 dark:text-green-400">
										{completedOperations.length} descarga{completedOperations.length > 1 ? 's' : ''} completada
										{completedOperations.length > 1 ? 's' : ''}
									</div>
								)}
							</div>

							<ChevronUp className="w-4 h-4 text-gray-400" />
						</div>
					</motion.div>
				)}

				{/* Expanded View */}
				{isExpanded && (
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.9, y: 20 }}
						className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-80 max-h-96 overflow-hidden"
					>
						{/* Header */}
						<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
							<div className="flex items-center gap-2">
								<Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
								<span className="font-medium text-gray-900 dark:text-white">Descargas</span>
								{activeOperations.length > 0 && (
									<span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
										{activeOperations.length} activa{activeOperations.length > 1 ? 's' : ''}
									</span>
								)}
							</div>

							<div className="flex items-center gap-2">
								{completedOperations.length > 0 && (
									<button
										onClick={clearCompleted}
										className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
									>
										Limpiar
									</button>
								)}
								<button
									onClick={() => setIsExpanded(false)}
									className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
								>
									<ChevronDown className="w-4 h-4 text-gray-500" />
								</button>
							</div>
						</div>

						{/* Content */}
						<div className="max-h-64 overflow-y-auto">
							{/* Active Downloads */}
							{activeOperations.map((operation) => (
								<div key={operation.id} className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
									<div className="flex items-center justify-between mb-2">
										<div className="flex-1 min-w-0">
											<div className="text-sm font-medium text-gray-900 dark:text-white truncate">
												{operation.currentStep || 'Descargando...'}
											</div>
											<div className="text-xs text-gray-500 dark:text-gray-400">
												{operation.items.processed} de {operation.items.total} archivo
												{operation.items.total > 1 ? 's' : ''}
												{operation.progress.eta && (
													<span> • {formatTimeRemaining(operation.progress.eta - Date.now())} restante</span>
												)}
											</div>
										</div>

										<button
											onClick={() => cancelDownload(operation.id)}
											className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded ml-2"
											title="Cancelar descarga"
										>
											<X className="w-4 h-4 text-gray-500" />
										</button>
									</div>

									<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
										<div
											className="bg-blue-600 h-2 rounded-full transition-all duration-300"
											style={{ width: `${operation.progress.percentage}%` }}
										/>
									</div>

									<div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
										<span>{Math.round(operation.progress.percentage)}%</span>
										{operation.progress.speed && <span>{operation.progress.speed.toFixed(1)} archivos/s</span>}
									</div>
								</div>
							))}

							{/* Completed Downloads */}
							{showCompleted &&
								completedOperations.map((operation) => (
									<div
										key={operation.id}
										className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 bg-green-50 dark:bg-green-900/10"
									>
										<div className="flex items-center gap-2">
											<CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
											<div className="flex-1 min-w-0">
												<div className="text-sm font-medium text-gray-900 dark:text-white truncate">
													{operation.currentStep || 'Descarga completada'}
												</div>
												<div className="text-xs text-green-600 dark:text-green-400">
													{operation.items.total} archivo{operation.items.total > 1 ? 's' : ''} descargado
													{operation.items.total > 1 ? 's' : ''}
												</div>
											</div>
										</div>
									</div>
								))}

							{/* Failed Downloads */}
							{failedOperations.map((operation) => (
								<div
									key={operation.id}
									className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 bg-red-50 dark:bg-red-900/10"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2 flex-1 min-w-0">
											<AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
											<div className="flex-1 min-w-0">
												<div className="text-sm font-medium text-gray-900 dark:text-white truncate">
													{operation.currentStep || 'Descarga fallida'}
												</div>
												<div className="text-xs text-red-600 dark:text-red-400">
													{operation.error || 'Error desconocido'}
												</div>
											</div>
										</div>

										<button
											onClick={() => retryDownload(operation.id)}
											className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 ml-2"
										>
											Reintentar
										</button>
									</div>
								</div>
							))}

							{/* Toggle Completed */}
							{completedOperations.length > 0 && (
								<div className="p-3 border-t border-gray-200 dark:border-gray-700">
									<button
										onClick={() => setShowCompleted(!showCompleted)}
										className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center gap-2"
									>
										{showCompleted ? 'Ocultar' : 'Mostrar'} completadas ({completedOperations.length})
										{showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
									</button>
								</div>
							)}

							{/* Empty State */}
							{activeOperations.length === 0 && completedOperations.length === 0 && failedOperations.length === 0 && (
								<div className="p-6 text-center">
									<Download className="w-8 h-8 text-gray-400 mx-auto mb-2" />
									<div className="text-sm text-gray-500 dark:text-gray-400">No hay descargas activas</div>
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
