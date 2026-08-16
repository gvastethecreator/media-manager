import { Activity, BarChart, Boxes, Cpu, FileJson, Folder, HardDrive, Library, Tag } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import type { SystemMetric } from '../cards/metric-card';
import type { ProcessingMetric } from '../cards/processing-metric-card';
import {
	getCollectionsCount,
	getFilesHistoricalData,
	getIndexedFilesCount,
	getMonitoredFoldersCount,
	getSystemMetrics,
	getTagsCount,
	getTagsHistoricalData,
	getTotalSpaceUsed,
} from '../services/system-stats';

export function useSystemStats() {
	const [isLoading, setIsLoading] = useState(true);
	const [metrics, setMetrics] = useState<SystemMetric[]>([]);
	const [processingMetrics, setProcessingMetrics] = useState<ProcessingMetric[]>([]);

	const fetchData = useCallback(async () => {
		setIsLoading(true);

		try {
			// Obtener datos del sistema
			const [
				filesCount,
				spaceUsed,
				foldersCount,
				collectionsCount,
				tagsCount,
				filesHistorical,
				tagsHistorical,
				systemMetrics,
			] = await Promise.all([
				getIndexedFilesCount(),
				getTotalSpaceUsed(),
				getMonitoredFoldersCount(),
				getCollectionsCount(),
				getTagsCount(),
				getFilesHistoricalData(),
				getTagsHistoricalData(),
				getSystemMetrics(),
			]);

			// Construir datos de gráficos
			const filesChartData = filesHistorical.map((item) => item.count);
			const filesChartLabels = filesHistorical.map((item) => {
				const date = new Date(item.date);
				return date.toLocaleDateString('en-US', { weekday: 'short' });
			});

			const tagsChartData = tagsHistorical.map((item) => item.count);
			const tagsChartLabels = tagsHistorical.map((item) => {
				const date = new Date(item.date);
				return date.toLocaleDateString('en-US', { weekday: 'short' });
			});

			// Crear métricas
			const systemMetricsData: SystemMetric[] = [
				{
					name: 'Indexed Files',
					value: filesCount,
					unit: 'files',
					icon: FileJson,
					chart: {
						data: filesChartData,
						labels: filesChartLabels,
					},
				},
				{
					name: 'Espacio Total',
					value: spaceUsed.formatted,
					unit: 'usados',
					icon: HardDrive,
				},
				{
					name: 'Monitored Folders',
					value: foldersCount,
					unit: 'folders',
					icon: Folder,
				},
				{
					name: 'Collections',
					value: collectionsCount,
					unit: 'total',
					icon: Library,
				},
				{
					name: 'Tags',
					value: tagsCount,
					unit: 'total',
					icon: Tag,
					chart: {
						data: tagsChartData,
						labels: tagsChartLabels,
					},
				},
				{
					name: 'Statistics',
					value: '-',
					unit: '',
					icon: BarChart,
				},
			];

			// Crear métricas de procesamiento
			const processingMetricsData: ProcessingMetric[] = [
				{
					name: 'Cola de Procesamiento',
					value: systemMetrics.queueSize,
					max: 100,
					icon: Activity,
				},
				{
					name: 'Uso de CPU',
					value: systemMetrics.cpuUsage,
					max: 100,
					icon: Cpu,
				},
				{
					name: 'Memoria en Uso',
					value: systemMetrics.memoryUsage,
					max: 100,
					icon: Boxes,
				},
			];

			setMetrics(systemMetricsData);
			setProcessingMetrics(processingMetricsData);
		} catch (error) {
			clientLogger.error('Could not get system statistics:', error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();

		// Actualizar datos cada 30 segundos
		const intervalId = setInterval(() => {
			fetchData();
		}, 30_000);

		return () => clearInterval(intervalId);
	}, [fetchData]);

	return {
		isLoading,
		metrics,
		processingMetrics,
		refreshData: fetchData,
	};
}
