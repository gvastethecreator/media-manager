import si from 'systeminformation';
import { serverLogger } from '@/lib/logger/server-logger';

export async function getRealSystemMetrics() {
	try {
		const [cpuLoad, mem, fsSize, osInfo, cpu, time] = await Promise.all([
			si.currentLoad(),
			si.mem(),
			si.fsSize(),
			si.osInfo(),
			si.cpu(),
			si.time(),
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
			disk:
				fsSize && fsSize.length > 0
					? {
							total: fsSize[0].size,
							used: fsSize[0].used,
							available: fsSize[0].available,
							usagePercentage: Math.round((fsSize[0].used / fsSize[0].size) * 100),
						}
					: null,
			os: {
				platform: osInfo.platform,
				release: osInfo.release,
				hostname: osInfo.hostname,
				uptime: time.uptime,
			},
		};
	} catch (error) {
		serverLogger.error('Error al obtener métricas del sistema:', error);
		return null;
	}
}
