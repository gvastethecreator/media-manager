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
	// En un entorno real, estos datos vendrían de sistemas de monitoreo
	// Aquí simulamos valores para demostración

	const cpuCores = Array.from({ length: 8 }, () => Math.floor(Math.random() * 100));
	const averageCpuUsage = cpuCores.reduce((sum, value) => sum + value, 0) / cpuCores.length;

	return {
		systemInfo: {
			platform: 'win32',
			nodeVersion: 'v18.16.0',
			uptime: Math.floor(Math.random() * 3600 * 24 * 7), // Hasta 7 días en segundos
			memoryUsage: {
				total: 16_384, // MB
				used: 6144 + Math.floor(Math.random() * 2048), // 6-8GB
				free: 8192 - Math.floor(Math.random() * 2048), // Resto
			},
			cpuUsage: {
				overall: Math.round(averageCpuUsage),
				cores: cpuCores,
			},
		},
		databaseMetrics: {
			connectionPoolSize: 10,
			activeConnections: Math.floor(Math.random() * 8) + 1,
			queryResponseTime: Math.random() * 0.5, // 0-500ms
			totalQueries: 18_500 + Math.floor(Math.random() * 1000),
			errorRate: Math.random() * 1.5, // 0-1.5%
		},
		apiMetrics: {
			requestsPerMinute: Math.floor(Math.random() * 200) + 50,
			averageResponseTime: Math.random() * 0.3, // 0-300ms
			errorRate: Math.random() * 2, // 0-2%
			topEndpoints: [
				{ endpoint: '/api/files', hits: Math.floor(Math.random() * 5000) + 15_000 },
				{ endpoint: '/api/images', hits: Math.floor(Math.random() * 3000) + 10_000 },
				{ endpoint: '/api/tags', hits: Math.floor(Math.random() * 2000) + 5000 },
				{ endpoint: '/api/search', hits: Math.floor(Math.random() * 1500) + 3000 },
				{ endpoint: '/api/folders', hits: Math.floor(Math.random() * 1000) + 1000 },
			],
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
	// Datos simulados
	return {
		readSpeed: Math.floor(Math.random() * 100) + 100, // 100-200 MB/s
		writeSpeed: Math.floor(Math.random() * 80) + 60, // 60-140 MB/s
		averageAccessTime: Math.random() * 5 + 1, // 1-6 ms
		iopsRead: Math.floor(Math.random() * 5000) + 10_000, // 10k-15k
		iopsWrite: Math.floor(Math.random() * 2000) + 3000, // 3k-5k
		currentOperations: Math.floor(Math.random() * 100),
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
	// Datos simulados
	return {
		averageProcessingTime: Math.floor(Math.random() * 500) + 200, // 200-700 ms
		imagesProcessedPerHour: Math.floor(Math.random() * 1000) + 2000, // 2k-3k
		batchSize: 50,
		memoryUsagePerImage: Math.random() * 20 + 5, // 5-25 MB
		queueSize: Math.floor(Math.random() * 200),
		successRate: 99.5 - Math.random(), // 98.5-99.5%
	};
}
