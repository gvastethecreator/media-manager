/**
 * @file Componente para mostrar logs de errores y warnings del sistema de reindexado
 * @module components/system/ReindexLogsViewer
 * @description Interfaz para visualizar y monitorear logs del sistema de reindexado
 */

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, FileText, RefreshCw, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { JsonViewer } from '@/components/panels/details-panel/components/json-viewer';
import type { ReindexLogEntry } from '@/lib/logger/reindex-file-logger';

interface LogStats {
	errorLogPath: string;
	warningLogPath: string;
	errorLogSize: number;
	warningLogSize: number;
	errorLogExists: boolean;
	warningLogExists: boolean;
}

interface LogResponse<T = ReindexLogEntry[]> {
	success: boolean;
	data: T;
	count?: number;
	period?: string;
	breakdown?: {
		errors: number;
		warnings: number;
	};
}

/**
 * Formatea el tamaño en bytes a formato legible
 */
const formatBytes = (bytes: number): string => {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
};

/**
 * Formatea la fecha relativa
 */
const formatRelativeTime = (timestamp: string): string => {
	const date = new Date(timestamp);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffMins < 1) return 'ahora';
	if (diffMins < 60) return `hace ${diffMins}min`;
	if (diffHours < 24) return `hace ${diffHours}h`;
	return `hace ${diffDays}d`;
};

/**
 * Obtiene el color para el tipo de log
 */
const getLogTypeColor = (level: 'ERROR' | 'WARN'): string => {
	return level === 'ERROR' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400';
};

/**
 * Obtiene el ícono para el tipo de log
 */
const getLogTypeIcon = (level: 'ERROR' | 'WARN') => {
	return level === 'ERROR' ? XCircle : AlertTriangle;
};

/**
 * Obtiene el color para el source
 */
const getSourceColor = (source: string): string => {
	const colors: Record<string, string> = {
		'circuit-breaker': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
		'auto-indexing': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
		'folder-stats': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
		monitor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
		'operation-queue': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
		'file-browser': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
	};
	return colors[source] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

export default function ReindexLogsViewer() {
	const [activeTab, setActiveTab] = useState<'recent' | 'errors' | 'warnings' | 'summary'>('recent');
	const [logLimit, setLogLimit] = useState(50);

	// Obtener estadísticas de logs
	const statsQuery = useQuery<LogResponse<LogStats>>({
		queryKey: ['reindex-logs-stats'],
		queryFn: async () => {
			const response = await fetch('/api/reindex-logs/stats');
			if (!response.ok) throw new Error('Error obteniendo estadísticas de logs');
			return response.json();
		},
		refetchInterval: 30_000, // Actualizar cada 30 segundos
	});

	// Obtener logs recientes
	const recentQuery = useQuery<LogResponse>({
		queryKey: ['reindex-logs-recent', logLimit],
		queryFn: async () => {
			const response = await fetch(`/api/reindex-logs/recent?limit=${logLimit}`);
			if (!response.ok) throw new Error('Error obteniendo logs recientes');
			return response.json();
		},
		enabled: activeTab === 'recent',
		refetchInterval: 5000, // Actualizar cada 5 segundos para logs recientes
	});

	// Obtener solo errores
	const errorsQuery = useQuery<LogResponse>({
		queryKey: ['reindex-logs-errors', logLimit],
		queryFn: async () => {
			const response = await fetch(`/api/reindex-logs/errors?limit=${logLimit}`);
			if (!response.ok) throw new Error('Error obteniendo logs de errores');
			return response.json();
		},
		enabled: activeTab === 'errors',
		refetchInterval: 10_000, // Actualizar cada 10 segundos
	});

	// Obtener solo warnings
	const warningsQuery = useQuery<LogResponse>({
		queryKey: ['reindex-logs-warnings', logLimit],
		queryFn: async () => {
			const response = await fetch(`/api/reindex-logs/warnings?limit=${logLimit}`);
			if (!response.ok) throw new Error('Error obteniendo logs de warnings');
			return response.json();
		},
		enabled: activeTab === 'warnings',
		refetchInterval: 10_000, // Actualizar cada 10 segundos
	});

	// Obtener resumen
	const summaryQuery = useQuery<LogResponse<Record<string, number>>>({
		queryKey: ['reindex-logs-summary'],
		queryFn: async () => {
			const response = await fetch('/api/reindex-logs/summary?days=7');
			if (!response.ok) throw new Error('Error obteniendo resumen de logs');
			return response.json();
		},
		enabled: activeTab === 'summary',
		refetchInterval: 60_000, // Actualizar cada minuto
	});

	// Limpiar logs antiguos
	const handleCleanupLogs = async () => {
		try {
			const response = await fetch('/api/reindex-logs/cleanup', { method: 'POST' });
			if (!response.ok) throw new Error('Error en limpieza de logs');
			// Refetch statistics after cleanup
			await statsQuery.refetch();
		} catch (error) {
			console.error('Error limpiando logs:', error);
		}
	};

	const currentQuery = {
		recent: recentQuery,
		errors: errorsQuery,
		warnings: warningsQuery,
		summary: summaryQuery,
	}[activeTab];

	return (
		<div className="space-y-6">
			{/* Header con estadísticas */}
			<div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
				<div className="mb-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FileText className="h-6 w-6 text-blue-600" />
						<h2 className="font-semibold text-gray-900 text-xl dark:text-gray-100">Logs de Sistema de Reindexado</h2>
					</div>
					<div className="flex items-center gap-2">
						<button
							className="flex items-center gap-1 rounded-md bg-red-100 px-3 py-1.5 text-red-700 text-sm transition-colors hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
							onClick={handleCleanupLogs}
							type="button"
						>
							<Trash2 className="h-4 w-4" />
							Limpiar Antiguos
						</button>
						<button
							className="flex items-center gap-1 rounded-md bg-blue-100 px-3 py-1.5 text-blue-700 text-sm transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
							disabled={currentQuery.isFetching}
							onClick={() => currentQuery.refetch()}
							type="button"
						>
							<RefreshCw className={`h-4 w-4 ${currentQuery.isFetching ? 'animate-spin' : ''}`} />
							Actualizar
						</button>
					</div>
				</div>

				{statsQuery.data?.success && (
					<div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
						<div className="flex flex-col">
							<span className="text-gray-500 dark:text-gray-400">Errores</span>
							<span className="font-mono text-lg">
								{statsQuery.data.data.errorLogExists ? formatBytes(statsQuery.data.data.errorLogSize) : '0 B'}
							</span>
						</div>
						<div className="flex flex-col">
							<span className="text-gray-500 dark:text-gray-400">Warnings</span>
							<span className="font-mono text-lg">
								{statsQuery.data.data.warningLogExists ? formatBytes(statsQuery.data.data.warningLogSize) : '0 B'}
							</span>
						</div>
						<div className="flex flex-col">
							<span className="text-gray-500 dark:text-gray-400">Log Errores</span>
							<span
								className={`text-sm ${
									statsQuery.data.data.errorLogExists ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
								}`}
							>
								{statsQuery.data.data.errorLogExists ? '✓ Activo' : '○ Vacío'}
							</span>
						</div>
						<div className="flex flex-col">
							<span className="text-gray-500 dark:text-gray-400">Log Warnings</span>
							<span
								className={`text-sm ${
									statsQuery.data.data.warningLogExists ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
								}`}
							>
								{statsQuery.data.data.warningLogExists ? '✓ Activo' : '○ Vacío'}
							</span>
						</div>
					</div>
				)}
			</div>

			{/* Tabs */}
			<div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
				<div className="border-gray-200 border-b dark:border-gray-700">
					<nav className="flex space-x-8 px-6">
						{[
							{ key: 'recent' as const, label: 'Recientes', icon: Clock },
							{ key: 'errors' as const, label: 'Errores', icon: XCircle },
							{ key: 'warnings' as const, label: 'Warnings', icon: AlertTriangle },
							{ key: 'summary' as const, label: 'Resumen', icon: FileText },
						].map(({ key, label, icon: Icon }) => (
							<button
								className={`flex items-center gap-2 border-b-2 px-1 py-4 font-medium text-sm transition-colors ${
									activeTab === key
										? 'border-blue-500 text-blue-600 dark:text-blue-400'
										: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
								}`}
								key={key}
								onClick={() => setActiveTab(key)}
								type="button"
							>
								<Icon className="h-4 w-4" />
								{label}
							</button>
						))}
					</nav>
				</div>

				{/* Controls */}
				<div className="border-gray-200 border-b p-4 dark:border-gray-700">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<label className="text-gray-600 text-sm dark:text-gray-400" htmlFor="logLimit">
								Mostrar:
							</label>
							<select
								className="rounded border border-gray-300 bg-white px-3 py-1 text-gray-900 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
								id="logLimit"
								onChange={(e) => setLogLimit(Number.parseInt(e.target.value, 10))}
								value={logLimit}
							>
								<option value={25}>25 entradas</option>
								<option value={50}>50 entradas</option>
								<option value={100}>100 entradas</option>
								<option value={200}>200 entradas</option>
							</select>
						</div>

						{currentQuery.data?.success && (
							<div className="text-gray-500 text-sm dark:text-gray-400">
								{activeTab === 'recent' && currentQuery.data.breakdown
									? `${currentQuery.data.breakdown.errors} errores, ${currentQuery.data.breakdown.warnings} warnings`
									: `${currentQuery.data.count} entradas`}
							</div>
						)}
					</div>
				</div>

				{/* Content */}
				<div className="p-6">
					{currentQuery.isLoading && (
						<div className="flex items-center justify-center py-8">
							<RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
							<span className="ml-2 text-gray-600 dark:text-gray-400">Cargando logs...</span>
						</div>
					)}

					{currentQuery.error && (
						<div className="flex items-center justify-center py-8 text-red-600 dark:text-red-400">
							<XCircle className="mr-2 h-6 w-6" />
							Error cargando logs: {(currentQuery.error as Error).message}
						</div>
					)}

					{/* Summary View */}
					{activeTab === 'summary' && summaryQuery.data?.success && (
						<div className="space-y-4">
							<h3 className="mb-4 font-medium text-gray-900 text-lg dark:text-gray-100">
								Errores por fuente (últimos 7 días)
							</h3>
							{Object.keys(summaryQuery.data.data).length === 0 ? (
								<div className="py-8 text-center text-gray-500 dark:text-gray-400">
									No hay errores registrados en los últimos 7 días
								</div>
							) : (
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
									{Object.entries(summaryQuery.data.data).map(([source, count]) => (
										<div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700" key={source}>
											<div className="flex items-center justify-between">
												<span className={`rounded-full px-2 py-1 font-medium text-xs ${getSourceColor(source)}`}>
													{source}
												</span>
												<span className="font-bold font-mono text-red-600 text-xl dark:text-red-400">{count}</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Logs List */}
					{activeTab !== 'summary' && currentQuery.data?.success && Array.isArray(currentQuery.data.data) && (
						<div className="space-y-2">
							{currentQuery.data.data.length === 0 ? (
								<div className="py-8 text-center text-gray-500 dark:text-gray-400">
									No hay logs de {activeTab} disponibles
								</div>
							) : (
								currentQuery.data.data.map((log: ReindexLogEntry, index: number) => {
									const Icon = getLogTypeIcon(log.level);
									return (
										<div
											className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
											key={`${log.timestamp}-${index}`}
										>
											<div className="flex items-start gap-3">
												<Icon className={`mt-0.5 h-5 w-5 ${getLogTypeColor(log.level)}`} />
												<div className="min-w-0 flex-1">
													<div className="mb-1 flex items-center gap-2">
														<span
															className={`rounded-full px-2 py-1 font-medium text-xs ${getSourceColor(log.source)}`}
														>
															{log.source}
														</span>
														<span className="text-gray-500 text-xs dark:text-gray-400">
															{formatRelativeTime(log.timestamp)}
														</span>
														{log.folderId && (
															<span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-700">
																{log.folderId.slice(0, 8)}...
															</span>
														)}
													</div>
													<p className="mb-2 text-gray-900 text-sm dark:text-gray-100">{log.message}</p>
													{log.context && (
														<details className="text-gray-600 text-xs dark:text-gray-400">
															<summary className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
																Contexto
															</summary>
															<div className="mt-2">
																<JsonViewer
																	content={JSON.stringify(log.context, null, 2)}
																	defaultExpanded={false}
																	maxHeight={200}
																/>
															</div>
														</details>
													)}
													{log.error && (
														<details className="mt-2 text-red-600 text-xs dark:text-red-400">
															<summary className="cursor-pointer hover:text-red-800 dark:hover:text-red-200">
																Error Details
															</summary>
															<div className="mt-2 rounded bg-red-50 p-2 dark:bg-red-900/20">
																<p>
																	<strong>Name:</strong> {log.error.name}
																</p>
																<p>
																	<strong>Message:</strong> {log.error.message}
																</p>
																{log.error.stack && (
																	<pre className="mt-1 overflow-x-auto text-xs">{log.error.stack}</pre>
																)}
															</div>
														</details>
													)}
												</div>
											</div>
										</div>
									);
								})
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
