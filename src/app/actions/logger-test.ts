'use server';

import { clientLogger } from '@/lib/logger/client-logger';

const logger = clientLogger.withContext('LoggerTestActions');

export async function successAction(message: string) {
	logger.info('🟢 Success action executed:', message);
	return { success: true, message };
}

export async function errorAction(errorMessage: string) {
	logger.error('🔴 Error action executed:', errorMessage);
	throw new Error(errorMessage);
}

export async function sensitiveDataAction(_data: Record<string, unknown>) {
	logger.info('🔒 Sensitive data action executed with sanitized data');
	return { success: true, data: '***SANITIZED***' };
}
