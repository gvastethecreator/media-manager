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
			throw new Error('Could not get system information');
		}
		return response.json();
	} catch (error) {
		console.warn('❌ Could not get system information:', error);
		// Mantener una respuesta segura y neutra cuando la API no está disponible.
		return {
			cpu: {
				usage: 0,
				cores: 0,
				model: 'Unknown',
				loadAvg: [0, 0, 0],
			},
			memory: {
				total: 0,
				free: 0,
				used: 0,
				usedPercent: 0,
			},
			uptime: {
				system: 0,
			},
			platform: {
				type: 'unknown',
				release: 'unknown',
				arch: 'unknown',
			},
			nodejs: {
				version: 'unknown',
				pid: 0,
			},
			network: {
				interfaces: [],
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
