import express from 'express';
import os from 'os';
import { appMonitor } from '@/lib/server/app-monitor';
import { getSystemMonitorHelpers } from '@/lib/server/system-monitor';
import { formatBytes } from '@/lib/utils/format.utils';

const router = express.Router();

router.get('/app-stats', (_req, res) => {
  try {
    const rawStats = appMonitor.getStats();
    const stats = {
      requests: {
        total: rawStats.requests.total,
        success: rawStats.requests.success,
        error: rawStats.requests.error,
        pending: rawStats.requests.pending,
        successRate:
          rawStats.requests.total > 0
            ? ((rawStats.requests.success / rawStats.requests.total) * 100).toFixed(2) + '%'
            : 'N/A',
      },
      performance: {
        avgResponseTime: `${rawStats.performance.avgResponseTime.toFixed(2)}ms`,
        minResponseTime: `${rawStats.performance.minResponseTime.toFixed(2)}ms`,
        maxResponseTime: `${rawStats.performance.maxResponseTime.toFixed(2)}ms`,
        p95ResponseTime: `${rawStats.performance.p95ResponseTime.toFixed(2)}ms`,
      },
      errors: {
        count: rawStats.errors.count,
        byType: rawStats.errors.byType,
        last: rawStats.errors.lastError
          ? {
              mensaje: rawStats.errors.lastError.message,
              tipo: rawStats.errors.lastError.name,
            }
          : undefined,
      },
      database: {
        queries: rawStats.database.queries,
        avgQueryTime: `${rawStats.database.avgQueryTime.toFixed(2)}ms`,
        slowQueries: rawStats.database.slowQueries,
      },
      cache: {
        hits: rawStats.cache.hits,
        misses: rawStats.cache.misses,
        ratio: `${(rawStats.cache.ratio * 100).toFixed(2)}%`,
      },
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener estadísticas de la aplicación',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get('/system-stats', async (_req, res) => {
  try {
    const { getSystemStats } = await getSystemMonitorHelpers();
    const stats = await getSystemStats();
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
    res.json(formattedStats);
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener estadísticas del sistema',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const parts = [] as string[];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  return parts.join(' ');
}

function formatNetworkInterfaces() {
  const interfaces = os.networkInterfaces();
  const result: Array<{ interface: string; address: string; netmask: string; mac: string }> = [];
  for (const [name, netInterface] of Object.entries(interfaces)) {
    if (netInterface) {
      for (const iface of netInterface) {
        if (iface.family === 'IPv4') {
          result.push({ interface: name, address: iface.address, netmask: iface.netmask, mac: iface.mac });
        }
      }
    }
  }
  return result;
}

export default router;
