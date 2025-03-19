import { serverLogger } from '@/lib/logger/server-logger';
import { systemMonitor } from '@/lib/server/system-monitor';
import { NextResponse } from 'next/server';
import os from 'node:os';

// Logger específico para esta ruta
const logger = serverLogger.withContext('SystemStatsAPI');

/**
 * Ruta de API para obtener estadísticas del sistema
 *
 * Proporciona información sobre CPU, memoria, tiempo de actividad,
 * interfaces de red y otros datos del sistema.
 */
export async function GET() {
	try {
		logger.info('Solicitud de estadísticas del sistema recibida');

		// Obtener estadísticas del sistema
		const stats = systemMonitor.getStats();

		// Formatear estadísticas para la API
		const formattedStats = {
			cpu: {
				usage: stats.cpu.usage,
				cores: stats.cpu.cores,
				model: stats.cpu.model,
			},
			memory: {
				total: formatBytes(stats.memory.total),
				free: formatBytes(stats.memory.free),
				used: formatBytes(stats.memory.used),
				usedPercentage: stats.memory.usedPercent,
			},
			uptime: formatUptime(stats.uptime.system),
			platform: `${stats.platform.type} ${stats.platform.release}`,
			nodeVersion: stats.nodejs.version,
			network: formatNetworkInterfaces(),
		};

		logger.info('Estadísticas del sistema enviadas', {
			cpu: `${stats.cpu.usage.toFixed(1)}%`,
			memory: `${stats.memory.usedPercent.toFixed(1)}%`,
		});

		return NextResponse.json(formattedStats);
	} catch (error) {
		logger.error('Error al obtener estadísticas del sistema', {
			error: error instanceof Error ? error.message : String(error),
		});

		return NextResponse.json(
			{
				error: 'Error al obtener estadísticas del sistema',
				message: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

/**
 * Formatea bytes a una unidad legible
 * @param bytes Número de bytes
 * @param decimals Número de decimales
 * @returns Cadena formateada
 */
function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`;
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
 * Formatea las interfaces de red
 * @returns Array de interfaces de red formateadas
 */
function formatNetworkInterfaces(): Array<{
	interface: string;
	address: string;
	netmask: string;
	mac: string;
}> {
	const interfaces = os.networkInterfaces();
	const result = [];

	for (const [name, netInterface] of Object.entries(interfaces)) {
		if (netInterface) {
			for (const iface of netInterface) {
				// Solo incluir IPv4
				if (iface.family === 'IPv4') {
					result.push({
						interface: name,
						address: iface.address,
						netmask: iface.netmask,
						mac: iface.mac,
					});
				}
			}
		}
	}

	return result;
}
