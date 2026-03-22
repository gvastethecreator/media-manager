/**
 * Utilidades del sistema - versión cliente
 *
 * Este módulo proporciona funciones relacionadas con información del sistema
 * que ahora se comunican con la API del servidor.
 */

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
	network: {
		interfaces: string[];
	};
	nodejs: {
		version: string;
		pid: number;
	};
	platform: {
		type: string;
		release: string;
		arch: string;
	};
	uptime: {
		system: number;
	};
}

/**
 * Obtiene información del sistema a través de la API
 */
export async function getSystemInfo(): Promise<SystemInfo> {
	try {
		const response = await fetch('/api/system/info');
		if (!response.ok) {
			throw new Error('Error al obtener información del sistema');
		}
		return response.json();
	} catch (error) {
		console.warn('❌ Error al obtener información del sistema:', error);
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
			},
			uptime: {
				system: 86_400, // 1 día
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
			network: {
				interfaces: ['eth0', 'lo'],
			},
		};
	}
}

// formatBytes se ha movido a @/lib/utils/format.utils.ts para evitar duplicación
// Importar desde allí si se necesita: import { formatBytes } from '@/lib/utils/format.utils';

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
	if (days > 0) {
		parts.push(`${days}d`);
	}
	if (hours > 0) {
		parts.push(`${hours}h`);
	}
	if (minutes > 0) {
		parts.push(`${minutes}m`);
	}
	if (secs > 0 || parts.length === 0) {
		parts.push(`${secs}s`);
	}

	return parts.join(' ');
}
