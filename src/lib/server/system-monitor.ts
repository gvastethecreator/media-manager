/**
 * Monitor de sistema - versión cliente
 *
 * Este módulo proporciona funcionalidades para monitorear el rendimiento
 * del servidor a través de la API.
 */

import { formatBytes } from '@/lib/utils/format.utils';

// Interfaz para las estadísticas del sistema
interface SystemStats {
	cpu: {
		usage: number;
		cores: number;
		model: string;
		loadAvg: number[];
	};
	memory: {
		total: number;
		free: number;
		used: number;
		usedPercent: number;
		processUsed: number;
		processUsedPercent: number;
	};
	uptime: {
		system: number;
		process: number;
	};
	network: {
		interfaces: string[];
	};
	platform: {
		type: string;
		release: string;
		arch: string;
	};
	nodejs: {
		version: string;
		pid: number;
	};
}

/**
 * Obtiene estadísticas del sistema a través de la API
 * @returns Objeto con estadísticas del sistema
 */
async function getSystemStats(): Promise<SystemStats> {
	try {
		const response = await fetch('/api/system/stats');
		if (!response.ok) {
			throw new Error('Error al obtener estadísticas del sistema');
		}
		return response.json();
	} catch (error) {
		console.warn('❌ Error al obtener estadísticas del sistema:', error);
		// Retornar datos mock en caso de error
		return {
			cpu: {
				usage: 0,
				cores: 4,
				model: 'Unknown',
				loadAvg: [0, 0, 0],
			},
			memory: {
				total: 8_589_934_592, // 8GB
				free: 4_294_967_296, // 4GB
				used: 4_294_967_296, // 4GB
				usedPercent: 50,
				processUsed: 134_217_728, // 128MB
				processUsedPercent: 2,
			},
			uptime: {
				system: 86_400, // 1 día
				process: 3600, // 1 hora
			},
			network: {
				interfaces: ['eth0', 'lo'],
			},
			platform: {
				type: 'unknown',
				release: 'unknown',
				arch: 'x64',
			},
			nodejs: {
				version: 'v18.0.0',
				pid: 1234,
			},
		};
	}
}

/**
 * Formatea segundos a una unidad legible
 * @param seconds Número de segundos
 * @returns Cadena formateada
 */
function formatUptime(seconds: number): string {
	const days = Math.floor(seconds / (3600 * 24));
	const hours = Math.floor((seconds % (3600 * 24)) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	const parts = [];
	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

	return parts.join(' ');
}

/**
 * Muestra estadísticas del sistema en la consola (versión cliente)
 */
async function logSystemStats(): Promise<void> {
	const stats = await getSystemStats();

	console.log('=== Estadísticas del Sistema ===');

	// Información del sistema
	console.log('Información del Sistema:', {
		platform: `${stats.platform.type} ${stats.platform.release} (${stats.platform.arch})`,
		nodejs: stats.nodejs.version,
		pid: stats.nodejs.pid,
	});

	// CPU
	console.log('CPU:', {
		model: stats.cpu.model,
		cores: stats.cpu.cores,
		usage: `${stats.cpu.usage}%`,
		loadAvg: stats.cpu.loadAvg.map((load) => load.toFixed(2)).join(', '),
	});

	// Memoria
	console.log('Memoria:', {
		total: formatBytes(stats.memory.total),
		used: `${formatBytes(stats.memory.used)} (${stats.memory.usedPercent}%)`,
		free: formatBytes(stats.memory.free),
		process: `${formatBytes(stats.memory.processUsed)} (${stats.memory.processUsedPercent}%)`,
	});

	// Tiempo de actividad
	console.log('Tiempo de Actividad:', {
		system: formatUptime(stats.uptime.system),
		process: formatUptime(stats.uptime.process),
	});

	// Interfaces de red
	console.log('Interfaces de Red:', stats.network.interfaces);

	console.log('=== Fin Estadísticas ===');
}

/**
 * Inicia el monitor de sistema (versión cliente)
 * @param interval Intervalo en milisegundos (por defecto 60000 = 1 minuto)
 * @returns Función para detener el monitor
 */
export async function startSystemMonitor(interval = 60_000): Promise<() => void> {
	console.log('🖥️ Iniciando monitor de sistema (cliente)...');

	const intervalId = setInterval(logSystemStats, interval);

	// Log inicial
	await logSystemStats();

	return () => {
		clearInterval(intervalId);
		console.log('🛑 Monitor de sistema detenido');
	};
}

/**
 * Registra las estadísticas del sistema una sola vez (versión cliente)
 */
export async function logSystemStatsOnce(): Promise<void> {
	await logSystemStats();
}

/**
 * Registra información de inicio del sistema (versión cliente)
 */
export async function logSystemStartup(): Promise<void> {
	console.log('🚀 Sistema iniciado');
	await logSystemStats();
}

/**
 * Registra información de cierre del sistema (versión cliente)
 */
export async function logSystemShutdown(): Promise<void> {
	console.log('🔄 Sistema cerrando...');
	await logSystemStats();
}

/**
 * Obtiene helpers del monitor de sistema (versión cliente)
 */
export async function getSystemMonitorHelpers() {
	return {
		getSystemStats,
		formatUptime,
		formatBytes,
		logSystemStats,
		logSystemStatsOnce,
		logSystemStartup,
		logSystemShutdown,
	};
}
