'use server';

/**
 * Monitor de sistema para Next.js
 *
 * Este módulo proporciona funcionalidades para monitorear el rendimiento
 * del servidor y mostrar estadísticas en tiempo real.
 */

import os from 'os';
import { serverLogger } from '../logger/server-logger';

// Logger específico para el monitor de sistema
const systemLogger = serverLogger.withContext('SystemMonitor');

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
 * Obtiene estadísticas del sistema
 * @returns Objeto con estadísticas del sistema
 */
function getSystemStats(): SystemStats {
	// CPU
	const cpus = os.cpus();
	const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown';
	const cpuCores = cpus.length;
	const loadAvg = os.loadavg();

	// Calcular uso de CPU (aproximado)
	let totalIdle = 0;
	let totalTick = 0;

	for (const cpu of cpus) {
		for (const type in cpu.times) {
			totalTick += cpu.times[type as keyof typeof cpu.times];
		}
		totalIdle += cpu.times.idle;
	}

	const cpuUsage = cpuCores > 0 ? Math.round((1 - totalIdle / totalTick) * 100) : 0;

	// Memoria
	const totalMem = os.totalmem();
	const freeMem = os.freemem();
	const usedMem = totalMem - freeMem;
	const usedMemPercent = Math.round((usedMem / totalMem) * 100);

	// Memoria del proceso
	const processMemory = process.memoryUsage();
	const processUsedMem = processMemory.rss;
	const processUsedMemPercent = Math.round((processUsedMem / totalMem) * 100);

	// Tiempo de actividad
	const systemUptime = os.uptime();
	const processUptime = process.uptime();

	// Interfaces de red
	const networkInterfaces = Object.keys(os.networkInterfaces());

	return {
		cpu: {
			usage: cpuUsage,
			cores: cpuCores,
			model: cpuModel,
			loadAvg,
		},
		memory: {
			total: totalMem,
			free: freeMem,
			used: usedMem,
			usedPercent: usedMemPercent,
			processUsed: processUsedMem,
			processUsedPercent: processUsedMemPercent,
		},
		uptime: {
			system: systemUptime,
			process: processUptime,
		},
		network: {
			interfaces: networkInterfaces,
		},
		platform: {
			type: os.platform(),
			release: os.release(),
			arch: os.arch(),
		},
		nodejs: {
			version: process.version,
			pid: process.pid,
		},
	};
}

/**
 * Formatea bytes a una unidad legible
 * @param bytes Número de bytes
 * @param decimals Número de decimales
 * @returns Cadena formateada
 */
function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return '0 B';

	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / (k ** i)).toFixed(decimals))} ${sizes[i]}`;
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
 * Muestra estadísticas del sistema en la consola
 */
function logSystemStats(): void {
	const stats = getSystemStats();

	systemLogger.separator('Estadísticas del Sistema');

	// Información del sistema
	systemLogger.system('Información del Sistema', {
		platform: `${stats.platform.type} ${stats.platform.release} (${stats.platform.arch})`,
		nodejs: stats.nodejs.version,
		pid: stats.nodejs.pid,
	});

	// CPU
	systemLogger.system('CPU', {
		model: stats.cpu.model,
		cores: stats.cpu.cores,
		usage: `${stats.cpu.usage}%`,
		loadAvg: stats.cpu.loadAvg.map((load) => load.toFixed(2)).join(', '),
	});

	// Memoria
	systemLogger.system('Memoria', {
		total: formatBytes(stats.memory.total),
		used: `${formatBytes(stats.memory.used)} (${stats.memory.usedPercent}%)`,
		free: formatBytes(stats.memory.free),
		process: `${formatBytes(stats.memory.processUsed)} (${stats.memory.processUsedPercent}%)`,
	});

	// Tiempo de actividad
	systemLogger.system('Tiempo de Actividad', {
		system: formatUptime(stats.uptime.system),
		process: formatUptime(stats.uptime.process),
	});

	// Interfaces de red
	systemLogger.system('Interfaces de Red', stats.network.interfaces);

	// Barras de progreso
	systemLogger.progress('Uso de CPU', stats.cpu.usage);
	systemLogger.progress('Memoria del Sistema', stats.memory.usedPercent);
	systemLogger.progress('Memoria del Proceso', stats.memory.processUsedPercent);

	systemLogger.separatorEnd();
}

/**
 * Inicia el monitor de sistema
 * @param interval Intervalo en milisegundos (por defecto 60000 = 1 minuto)
 * @returns Función para detener el monitor
 */
export async function startSystemMonitor(interval = 60000): Promise<() => void> {
	// Mostrar estadísticas iniciales
	logSystemStats();

	// Configurar intervalo
	const timer = setInterval(() => {
		logSystemStats();
	}, interval);

	// Devolver función para detener el monitor
	return () => {
		clearInterval(timer);
		systemLogger.info('Monitor de sistema detenido');
	};
}

/**
 * Muestra estadísticas del sistema una sola vez
 */
export async function logSystemStatsOnce(): Promise<void> {
	logSystemStats();
}

/**
 * Registra estadísticas del sistema al inicio de la aplicación
 */
export async function logSystemStartup(): Promise<void> {
	const stats = getSystemStats();

	systemLogger.separator('Inicio del Servidor');

	systemLogger.system('Servidor iniciado', {
		platform: `${stats.platform.type} ${stats.platform.release} (${stats.platform.arch})`,
		nodejs: stats.nodejs.version,
		pid: stats.nodejs.pid,
		cpu: {
			cores: stats.cpu.cores,
			model: stats.cpu.model,
		},
		memory: {
			total: formatBytes(stats.memory.total),
			free: formatBytes(stats.memory.free),
		},
	});

	systemLogger.separatorEnd();
}

/**
 * Registra estadísticas del sistema al cierre de la aplicación
 */
export async function logSystemShutdown(): Promise<void> {
	const stats = getSystemStats();

	systemLogger.separator('Cierre del Servidor');

	systemLogger.system('Servidor cerrando', {
		uptime: formatUptime(stats.uptime.process),
		memory: {
			processUsed: formatBytes(stats.memory.processUsed),
		},
	});

	systemLogger.separatorEnd();
}

// No exportar objetos en archivos con 'use server'
// Crear funciones asíncronas para acceder a ellos
export async function getSystemMonitorHelpers() {
	return {
		getSystemStats,
		formatBytes,
		formatUptime,
		logSystemStats
	};
}
