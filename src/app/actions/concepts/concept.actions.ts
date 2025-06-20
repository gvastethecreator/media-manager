'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { EventType, emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import {
	createConcept as createConceptTransformer,
	deleteConcept as deleteConceptTransformer,
	getConceptById as getConceptByIdTransformer,
	searchConcepts as searchConceptsTransformer,
	updateConcept as updateConceptTransformer,
} from '@/transformers/concept';
import type {
	ConceptComplete,
	ConceptCreateInput,
	ConceptSearchOptions,
	ConceptSearchResult,
	ConceptUpdateInput,
} from '@/types/entities/concept/types';
import { revalidatePath } from 'next/cache';

const conceptLogger = serverLogger.withContext('ConceptActions');
const REVALIDATE_PATHS = ['/settings', '/concepts', '/concepts/[id]'] as const;

// Códigos de error
enum ConceptErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

// Función creadora de errores (enfoque funcional)
const createConceptError = (
	message: string,
	code: ConceptErrorCode = ConceptErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'ConceptError';
	Object.assign(error, { code, cause });
	return error;
};

// Funciones utilitarias
const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	conceptLogger.info('🔄 Rutas revalidadas');
};

const notifyConceptChange = async (action: 'create' | 'update' | 'delete', conceptId?: string) => {
	// Emitir evento
	await emit({
		type: 'concepts:modified' as EventType,
		...(conceptId ? { id: conceptId } : {}),
		data: { action },
	});

	// Actualizar estadísticas
	statsEventEmitter.emit(STATS_EVENTS.CONCEPT_CHANGE);
};

// Acciones del servidor
/**
 * 🔍 Busca conceptos según los criterios especificados
 * @param options Opciones de búsqueda
 * @returns Resultado de la búsqueda de conceptos
 */
export async function searchConcepts(options?: ConceptSearchOptions): Promise<ConceptSearchResult> {
	conceptLogger.info('🔍 Buscando conceptos...', options);
	try {
		// La lógica interna usa searchConceptsTransformer del transformer
		const results = await searchConceptsTransformer(options);
		conceptLogger.info(`✅ Encontrados ${results.total} conceptos`);
		return results;
	} catch (error) {
		conceptLogger.error('❌ Error al buscar conceptos:', error);
		throw createConceptError('Error al buscar conceptos', ConceptErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * 🔍 Obtiene un concepto por su ID con estadísticas
 * @param id ID del concepto
 * @returns Concepto completo o null si no se encuentra
 */
export async function getConceptById(id: string): Promise<ConceptComplete> {
	conceptLogger.info(`🔍 Obteniendo concepto con ID: ${id}`);
	try {
		// Usar la función getConceptByIdTransformer importada del transformer
		const concept = await getConceptByIdTransformer(id);
		if (!concept) {
			conceptLogger.warn(`⚠️ Concepto no encontrado con ID: ${id}`);
			throw createConceptError(`Concepto no encontrado con ID: ${id}`, ConceptErrorCode.NOT_FOUND);
		}
		conceptLogger.info(`✅ Concepto obtenido: ${concept.name}`);
		return concept;
	} catch (error) {
		conceptLogger.error(`❌ Error al obtener concepto con ID: ${id}`, error);
		if (error instanceof Error && error.name === 'ConceptError') throw error;
		throw createConceptError('Error al obtener concepto', ConceptErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * ✨ Crea un nuevo concepto
 * @param data Datos para crear el concepto
 * @returns Concepto creado
 */
export async function createConcept(data: ConceptCreateInput): Promise<ConceptComplete> {
	conceptLogger.info('✨ Creando nuevo concepto...', data.name);
	try {
		const newConcept = await createConceptTransformer(data);
		conceptLogger.info(`✅ Concepto creado: ${newConcept.name} (ID: ${newConcept.id})`);
		await revalidateAllPaths();
		await notifyConceptChange('create', newConcept.id);
		return newConcept;
	} catch (error) {
		conceptLogger.error('❌ Error al crear concepto:', error);
		throw createConceptError('Error al crear concepto', ConceptErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * 📝 Actualiza un concepto existente
 * @param id ID del concepto a actualizar
 * @param data Datos para actualizar
 * @returns Concepto actualizado
 */
export async function updateConcept(id: string, data: ConceptUpdateInput): Promise<ConceptComplete> {
	conceptLogger.info(`📝 Actualizando concepto: ${id}`, data);
	try {
		const updatedConcept = await updateConceptTransformer(id, data);
		conceptLogger.info(`✅ Concepto actualizado: ${updatedConcept.name}`);
		await revalidateAllPaths();
		await notifyConceptChange('update', id);
		return updatedConcept;
	} catch (error) {
		conceptLogger.error(`❌ Error al actualizar concepto: ${id}`, error);
		throw createConceptError('Error al actualizar concepto', ConceptErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * 🗑️ Elimina un concepto por su ID
 * @param id ID del concepto a eliminar
 * @returns Objeto indicando éxito
 */
export async function deleteConcept(id: string): Promise<{ success: boolean }> {
	conceptLogger.info(`🗑️ Eliminando concepto: ${id}`);
	try {
		await deleteConceptTransformer(id);
		conceptLogger.info(`✅ Concepto eliminado: ${id}`);
		await revalidateAllPaths();
		await notifyConceptChange('delete', id);
		return { success: true };
	} catch (error) {
		conceptLogger.error(`❌ Error al eliminar concepto: ${id}`, error);
		throw createConceptError('Error al eliminar concepto', ConceptErrorCode.OPERATION_FAILED, error);
	}
}

// --- Funciones Faltantes (Stubs) ---

/**
 * ➕ Asocia una imagen a un concepto (STUB)
 */
export async function addImageToConcept(conceptId: string, _imageId: string): Promise<{ success: boolean }> {
	conceptLogger.warn('⚠️ Función addImageToConcept no implementada');
	// Aquí iría la lógica para llamar a prisma.concept.update connect image
	await notifyConceptChange('update', conceptId); // Asumir que notifica cambio
	await revalidateAllPaths();
	// throw createConceptError('Función no implementada', ConceptErrorCode.OPERATION_FAILED);
	return { success: false }; // Temporalmente retorna false
}

/**
 * 🖼️ Obtiene las imágenes asociadas a un concepto (STUB)
 */
export async function getConceptImages(conceptId: string): Promise<{ images: any[] }> {
	conceptLogger.warn(`⚠️ Función getConceptImages no implementada para conceptId: ${conceptId}`);
	// Aquí iría la lógica para buscar el concepto y sus imágenes
	// throw createConceptError('Función no implementada', ConceptErrorCode.OPERATION_FAILED);
	return { images: [] }; // Temporalmente retorna array vacío
}

/**
 * 📚 Obtiene todos los conceptos (simplificado, usa search) (STUB)
 */
export async function getConcepts(options?: ConceptSearchOptions): Promise<ConceptSearchResult> {
	conceptLogger.warn('⚠️ Función getConcepts redirigida a searchConcepts');
	// Redirigir a searchConcepts sin filtros específicos por ahora
	return searchConcepts(options);
}
