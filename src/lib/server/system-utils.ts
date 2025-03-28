'use server';

/**
 * Utilidades del sistema que solo funcionan en el servidor
 *
 * Este módulo proporciona funciones relacionadas con información del sistema
 * que dependen de módulos de Node.js y solo deben ejecutarse en el servidor.
 */

import os from 'os';

/**
 * Interfaz para estadísticas del sistema
 */
export interface SystemInfo {
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
	};
	uptime: {
		system: number;
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
	network: {
		interfaces: string[];
	};
}

/**
 * Obtiene información del sistema operativo
 * Esta función solo debe llamarse desde el servidor
 */
export async function getSystemInfo(): Promise<SystemInfo> {
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
		},
		uptime: {
			system: os.uptime(),
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
		network: {
			interfaces: networkInterfaces,
		},
	};
}

/**
 * Formatea bytes a una unidad legible
 * @param bytes Número de bytes
 * @param decimals Número de decimales
 * @returns Cadena formateada
 */
export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return '0 B';

	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Formatea segundos a una unidad legible
 * @param seconds Número de segundos
 * @returns Cadena formateada
 */
export function formatUptime(seconds: number): string {
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
