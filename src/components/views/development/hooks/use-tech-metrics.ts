import { useCallback, useEffect, useState } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';
import { getFileSystemPerformance, getImageProcessingPerformance, getTechnicalMetrics } from '../services/tech-metrics';

export function useTechMetrics() {
	const [isLoading, setIsLoading] = useState(true);
	const [technicalMetrics, setTechnicalMetrics] = useState<Awaited<ReturnType<typeof getTechnicalMetrics>> | null>(
		null
	);
	const [fileSystemPerformance, setFileSystemPerformance] = useState<Awaited<
		ReturnType<typeof getFileSystemPerformance>
	> | null>(null);
	const [imageProcessingPerformance, setImageProcessingPerformance] = useState<Awaited<
		ReturnType<typeof getImageProcessingPerformance>
	> | null>(null);
	const [error, setError] = useState<string | null>(null);

	const fetchMetrics = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const [techMetrics, fsPerformance, imgProcessing] = await Promise.all([
				getTechnicalMetrics(),
				getFileSystemPerformance(),
				getImageProcessingPerformance(),
			]);

			setTechnicalMetrics(techMetrics);
			setFileSystemPerformance(fsPerformance);
			setImageProcessingPerformance(imgProcessing);
		} catch (err) {
			clientLogger.error('Could not get technical metrics:', err);
			setError('Technical metrics could not be loaded');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchMetrics();

		// Actualizar datos cada 15 segundos
		const intervalId = setInterval(() => {
			fetchMetrics();
		}, 15_000);

		return () => clearInterval(intervalId);
	}, [fetchMetrics]);

	return {
		isLoading,
		error,
		technicalMetrics,
		fileSystemPerformance,
		imageProcessingPerformance,
		refreshMetrics: fetchMetrics,
	};
}
