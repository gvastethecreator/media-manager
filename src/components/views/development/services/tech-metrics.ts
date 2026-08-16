/**
 * @file Métricas técnicas de desarrollo
 * @description Compatible con Vite + React
 */

/**
 * Obtiene métricas técnicas detalladas del sistema
 */
export async function getTechnicalMetrics(): Promise<{
	systemInfo: {
		platform: string;
		nodeVersion: string;
		uptime: number;
		memoryUsage: {
			total: number;
			used: number;
			free: number;
		};
		cpuUsage: {
			overall: number;
			cores: number[];
		};
	};
	databaseMetrics: {
		connectionPoolSize: number;
		activeConnections: number;
		queryResponseTime: number;
		totalQueries: number;
		errorRate: number;
	};
	apiMetrics: {
		requestsPerMinute: number;
		averageResponseTime: number;
		errorRate: number;
		topEndpoints: Array<{
			endpoint: string;
			hits: number;
		}>;
	};
}> {
	const performanceApi = globalThis.performance;
	const navigatorApi = globalThis.navigator;
	const now = performanceApi?.now() ?? 0;
	const uptimeSeconds = Math.floor(now / 1000);
	const entries = (performanceApi?.getEntriesByType('resource') ?? []) as PerformanceResourceTiming[];
	const apiEntries = entries.filter((entry) => entry.name.includes('/api/'));
	const hardwareConcurrency = navigatorApi?.hardwareConcurrency ?? 1;
	const totalApiDuration = apiEntries.reduce((sum, entry) => sum + entry.duration, 0);
	const timeWindowMinutes = Math.max(now / 60_000, 1);
	const overallUsage = Math.max(0, Math.min(100, Number(((totalApiDuration / Math.max(now, 1)) * 100).toFixed(2))));
	const cpuCores = Array.from({ length: hardwareConcurrency }, () => overallUsage);
	const memory =
		performanceApi && 'memory' in performanceApi
			? (performanceApi.memory as { jsHeapSizeLimit: number; totalJSHeapSize: number; usedJSHeapSize: number })
			: null;
	const topEndpoints = Array.from(
		apiEntries
			.reduce((map, entry) => {
				const endpoint = (() => {
					try {
						return new URL(entry.name, globalThis.location?.origin ?? 'http://localhost').pathname;
					} catch {
						return entry.name;
					}
				})();
				map.set(endpoint, (map.get(endpoint) ?? 0) + 1);
				return map;
			}, new Map<string, number>())
			.entries()
	)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([endpoint, hits]) => ({ endpoint, hits }));

	return {
		systemInfo: {
			platform: navigatorApi?.platform || 'unknown',
			nodeVersion: 'n/d (cliente)',
			uptime: uptimeSeconds,
			memoryUsage: {
				total: memory ? Math.round(memory.jsHeapSizeLimit / 1024 / 1024) : 0,
				used: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0,
				free: memory ? Math.max(0, Math.round((memory.jsHeapSizeLimit - memory.usedJSHeapSize) / 1024 / 1024)) : 0,
			},
			cpuUsage: {
				overall: Math.round(overallUsage),
				cores: cpuCores,
			},
		},
		databaseMetrics: {
			connectionPoolSize: 0,
			activeConnections: 0,
			queryResponseTime:
				apiEntries.length > 0 ? apiEntries.reduce((sum, entry) => sum + entry.duration, 0) / apiEntries.length : 0,
			totalQueries: apiEntries.length,
			errorRate: 0,
		},
		apiMetrics: {
			requestsPerMinute: Math.round(apiEntries.length / timeWindowMinutes),
			averageResponseTime:
				apiEntries.length > 0 ? apiEntries.reduce((sum, entry) => sum + entry.duration, 0) / apiEntries.length : 0,
			errorRate: 0,
			topEndpoints: topEndpoints,
		},
	};
}

/**
 * Obtiene estadísticas de rendimiento del sistema de archivos
 */
export async function getFileSystemPerformance(): Promise<{
	readSpeed: number; // MB/s
	writeSpeed: number; // MB/s
	averageAccessTime: number; // ms
	iopsRead: number; // operaciones/s
	iopsWrite: number; // operaciones/s
	currentOperations: number;
}> {
	const performanceApi = globalThis.performance;
	const entries = (performanceApi?.getEntriesByType('resource') ?? []) as PerformanceResourceTiming[];
	const fileEntries = entries.filter((entry) =>
		/\.(png|jpg|jpeg|webp|gif|mp4|mp3|wav|pdf|json|glb|gltf)(\?|$)/i.test(entry.name)
	);
	const totalDurationMs = fileEntries.reduce((sum, entry) => sum + Math.max(entry.duration, 0), 0);
	const transferredBytes = fileEntries.reduce(
		(sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || entry.decodedBodySize || 0),
		0
	);
	const seconds = Math.max(totalDurationMs / 1000, 1);
	const readSpeed = transferredBytes > 0 ? transferredBytes / 1024 / 1024 / seconds : 0;
	const iopsRead = Math.round(fileEntries.length / seconds);

	return {
		readSpeed: Number(readSpeed.toFixed(2)),
		writeSpeed: 0,
		averageAccessTime: fileEntries.length > 0 ? totalDurationMs / fileEntries.length : 0,
		iopsRead: iopsRead,
		iopsWrite: 0,
		currentOperations: 0,
	};
}

/**
 * Obtiene estadísticas de rendimiento del procesamiento de imágenes
 */
export async function getImageProcessingPerformance(): Promise<{
	averageProcessingTime: number; // ms por imagen
	imagesProcessedPerHour: number;
	batchSize: number;
	memoryUsagePerImage: number; // MB
	queueSize: number;
	successRate: number; // porcentaje
}> {
	const performanceApi = globalThis.performance;
	const now = performanceApi?.now() ?? 0;
	const imageEntries = ((performanceApi?.getEntriesByType('resource') ?? []) as PerformanceResourceTiming[]).filter(
		(entry) => /\/(thumbnails|images)|\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(entry.name)
	);
	const totalDuration = imageEntries.reduce((sum, entry) => sum + Math.max(entry.duration, 0), 0);
	const avgDuration = imageEntries.length > 0 ? totalDuration / imageEntries.length : 0;
	const hours = Math.max(now / 3_600_000, 1 / 60);
	const transferredBytes = imageEntries.reduce(
		(sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || entry.decodedBodySize || 0),
		0
	);
	const memoryPerImage = imageEntries.length > 0 ? transferredBytes / imageEntries.length / 1024 / 1024 : 0;

	return {
		averageProcessingTime: Math.round(avgDuration),
		imagesProcessedPerHour: Math.round(imageEntries.length / hours),
		batchSize: imageEntries.length,
		memoryUsagePerImage: Number(memoryPerImage.toFixed(2)),
		queueSize: 0,
		successRate: imageEntries.length > 0 ? 100 : 0,
	};
}
