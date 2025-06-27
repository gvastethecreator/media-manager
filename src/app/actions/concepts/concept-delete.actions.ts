'use server';

import { getPrismaClient } from '@/lib/database/db';
import { createEntityErrorObject, EntityErrorCode } from '@/lib/errors';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { revalidatePath } from 'next/cache';

// Logger dedicado
const conceptDeleteLogger = serverLogger.withContext('ConceptDeleteActions');

// Función creadora de errores
const createConceptDeleteError = (
	message: string,
	code: EntityErrorCode = EntityErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	return createEntityErrorObject('ConceptDeleteError', message, code, cause);
};

// Rutas para revalidar
const REVALIDATE_PATHS = ['/settings', '/concepts', '/concepts/[id]'] as const;

// Funciones utilitarias
const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	conceptDeleteLogger.info('🔄 Rutas revalidadas');
};

const notifyConceptChange = async (id: string) => {
	await emit({
		type: 'objects:modified',
		data: { action: 'delete', id },
	});
	statsEventEmitter.emit(STATS_EVENTS.CONCEPT_CHANGE);
};

/**
 * Elimina un concepto específico por su ID
 */
export async function deleteConcept(id: string): Promise<{ id: string }> {
	try {
		conceptDeleteLogger.info('🗑️ Eliminando concepto:', id);
		const prisma = await getPrismaClient();

		// Verificar que el concepto exista
		const concept = await prisma.concept.findUnique({
			where: { id },
			select: { id: true, name: true },
		});

		if (!concept) {
			throw createConceptDeleteError('Concepto no encontrado', EntityErrorCode.NOT_FOUND);
		}

		// Eliminar el concepto y sus relaciones
		await prisma.$transaction(async (tx) => {
			// Desconectar de todas las entidades relacionadas
			await tx.concept.update({
				where: { id },
				data: {
					// Desconectar de todas las relaciones
					prompts: { set: [] },
					notes: { set: [] },
					characters: { set: [] },
					places: { set: [] },
					worldItems: { set: [] },
					images: { set: [] },
					groups: { set: [] },
					properties: { set: [] },
					wildcards: { set: [] },
				},
			});

			// Eliminar finalmente el concepto
			await tx.concept.delete({
				where: { id },
			});
		});

		// Notificar cambio
		await notifyConceptChange(id);
		await revalidateAllPaths();

		conceptDeleteLogger.info('✅ Concepto eliminado:', concept.name);
		return { id };
	} catch (error) {
		conceptDeleteLogger.error('❌ Error al eliminar concepto:', error);
		if (error instanceof Error && error.name === 'ConceptDeleteError') {
			throw error;
		}
		throw createConceptDeleteError('No se pudo eliminar el concepto', EntityErrorCode.OPERATION_FAILED, error);
	}
}
