import si from 'systeminformation';
import { clientLogger } from '@/lib/logger/server-logger';

export async function getRealSystemMetrics() {
	try {
		const [cpuLoad, mem, fsSize, osInfo, cpu] = await Promise.all([
			si.currentLoad(),
			si.mem(),
			si.fsSize('/'),
			si.osInfo(),
			si.cpu(),
		]);

		return {
			cpu: {
				usage: Math.round(cpuLoad.currentLoad),
				cores: cpu.cores,
				speed: cpu.speed,
				manufacturer: cpu.manufacturer,
				model: cpu.model,
			},
			memory: {
				total: mem.total,
				free: mem.free,
				used: mem.used,
				swaptotal: mem.swaptotal,
				swapused: mem.swapused,
				usagePercentage: Math.round((mem.used / mem.total) * 100),
			},
			disk: {
				total: fsSize.size,
				used: fsSize.used,
				available: fsSize.available,
				usagePercentage: Math.round((fsSize.used / fsSize.size) * 100),
			},
			os: {
				platform: osInfo.platform,
				release: osInfo.release,
				hostname: osInfo.hostname,
				uptime: osInfo.uptime,
			},
		};
	} catch (error) {
		clientLogger.error('Error al obtener métricas del sistema:', error);
		return null;
	}
}
