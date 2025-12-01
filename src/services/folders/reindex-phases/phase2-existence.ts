/**
 * @file FASE 2: Verificación de existencia
 * @description Confirma qué carpetas existen físicamente
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { ReindexAnalysisResult, ReindexOptions, ReindexPhaseResult } from '../folder-reindex-types';

const logger = serverLogger.withContext('ReindexPhase2');

/**
 * FASE 2: 🔍 VERIFICACIÓN DE EXISTENCIA
 * Confirma qué carpetas existen físicamente
 */
export async function phase2_checkExistence(
	analysisResult: ReindexAnalysisResult,
	_options: ReindexOptions
): Promise<ReindexPhaseResult> {
	const startTime = Date.now();
	logger.info('🔍 Verificando existencia de carpetas');

	try {
		// La verificación ya se hizo en la fase de análisis
		// Aquí solo confirmamos los resultados

		const duration = Date.now() - startTime;
		const result = {
			success: true,
			processed: analysisResult.existingFolders.length,
			failed: analysisResult.missingFolders.length,
			errors: analysisResult.missingFolders.map((f) => `Carpeta no encontrada: ${f.path}`),
			duration,
		};

		logger.info('✅ Verificación de existencia completada', result);
		return result;
	} catch (error) {
		logger.error('❌ Error en verificación de existencia:', error);
		return {
			success: false,
			processed: 0,
			failed: 0,
			errors: [error instanceof Error ? error.message : 'Error desconocido'],
			duration: Date.now() - startTime,
		};
	}
}
