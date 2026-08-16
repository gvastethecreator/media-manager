import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { serverAlerts } from '@/lib/drizzle/schema/dev';
import { serverLogger } from '@/lib/logger/server-logger';

export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

export async function createServerAlert(params: {
	level: AlertLevel;
	service: string;
	title: string;
	message: string;
	details?: string;
}) {
	try {
		await db.insert(serverAlerts).values({
			level: params.level,
			service: params.service,
			title: params.title,
			message: params.message,
			details: params.details,
			resolved: false,
		});

		serverLogger.info(`[ALERTA ${params.level.toUpperCase()}] ${params.service}: ${params.title}`);
	} catch (error) {
		serverLogger.error('Error al insertar alerta en BD:', error);
	}
}

export async function resolveServerAlert(alertId: string) {
	try {
		await db.update(serverAlerts).set({ resolved: true, resolvedAt: new Date() }).where(eq(serverAlerts.id, alertId));
	} catch (error) {
		serverLogger.error('Error al resolver alerta:', error);
	}
}
