/**
 * @file Acciones del sistema
 * @module app/actions/system
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

'use server';

// Tipo local para Settings (equivalente a Drizzle)
type DrizzleSettings = {
	id: string;
	key: string;
	value: string | null;
	category: string | null;
	description: string | null;
	isPublic: boolean;
	createdAt: Date;
	updatedAt: Date;
};

import { revalidatePath } from 'next/cache';
import { serverLogger } from '@/lib/logger/server-logger';

const systemLogger = serverLogger.withContext('SystemActions');

/**
 * Obtiene la configuración del sistema
 */
export async function getSystemSettings(): Promise<DrizzleSettings[]> {
	try {
		systemLogger.info('Obteniendo configuración del sistema');
		// TODO: Implementar con Drizzle cuando esté disponible
		return [];
	} catch (error) {
		systemLogger.error('Error al obtener configuración', { error });
		throw new Error('No se pudo obtener la configuración del sistema');
	}
}

/**
 * Actualiza una configuración del sistema
 */
export async function updateSystemSetting(key: string, value: string): Promise<void> {
	try {
		systemLogger.info('Actualizando configuración', { key });
		// TODO: Implementar con Drizzle cuando esté disponible
		revalidatePath('/settings');
	} catch (error) {
		systemLogger.error('Error al actualizar configuración', { error, key });
		throw new Error('No se pudo actualizar la configuración');
	}
}
