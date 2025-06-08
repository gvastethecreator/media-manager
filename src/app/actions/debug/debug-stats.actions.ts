'use server';

import { appMonitor } from '@/lib/server/app-monitor';
import { getSystemMonitorHelpers } from '@/lib/server/system-monitor';

export async function getSystemStats() {
	const { getSystemStats } = await getSystemMonitorHelpers();
	return getSystemStats();
}

export async function getAppStats() {
	return appMonitor.getAppStats();
}
