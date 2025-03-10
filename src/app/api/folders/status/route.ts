import { normalizeId } from '@/lib/id-utils';
import { logger } from '@/lib/logger';
import { FOLDER_EVENTS, folderService } from '@/services/folder.service';
import type { FolderResponse, ProcessStatus } from '@/types/process';
import { type NextRequest, NextResponse } from 'next/server';

const statusLogger = logger.withContext('FolderStatusAPI');

// Estado global compartido para procesos de reindexación
const lastProcessStatus: Record<string, ProcessStatus> = {};
const folderCompletionStatus: Record<string, boolean> = {};
const processFinishTime: Record<string, number> = {};
const rawToNormalizedIds: Record<string, string> = {}; // Mapeo entre IDs originales y normalizados

// Mantener un registro de los últimos estados procesados
folderService.onProgress((status: ProcessStatus) => {
	if (status?.folderId) {
		// Normalizar ID para evitar inconsistencias
		const originalId = status.folderId;
		const folderId = normalizeId(originalId);

		// Guardar mapeo de IDs para diagnóstico
		rawToNormalizedIds[originalId] = folderId;

		// Checar si el proceso está finalizado
		const isComplete =
			status.phase === 'complete' ||
			(status.progress === 100 && status.phase === 'metadata') ||
			(status.progress === 100 &&
				typeof status.filesProcessed === 'number' &&
				typeof status.totalFiles === 'number' &&
				status.filesProcessed >= status.totalFiles);

		// Guardar estado con ID normalizado
		lastProcessStatus[folderId] = {
			...lastProcessStatus[folderId],
			...status,
			folderId, // Usar el ID normalizado
			timestamp: Date.now(),
		};

		statusLogger.info(`📊 Actualización de estado para carpeta ${folderId}:`, {
			progress: status.progress,
			phase: status.phase,
			isComplete,
			originalId,
			normalizedId: folderId,
		});

		// Marcar como completa si corresponde
		if (isComplete) {
			folderCompletionStatus[folderId] = true;
			processFinishTime[folderId] = Date.now();

			// Asegurarse de que el estado refleje que está completo
			lastProcessStatus[folderId] = {
				...lastProcessStatus[folderId],
				phase: 'complete',
				status: 'Proceso completado',
				progress: 100,
				timestamp: Date.now(),
			};

			statusLogger.info(`✅ Marcando carpeta ${folderId} como completada`);

			// Programar limpieza
			scheduleStatusCleanup(folderId);
		}
	}
});

// Limpiar estados completados después de un tiempo
folderService.on(FOLDER_EVENTS.COMPLETE, (data: FolderResponse) => {
	if (data?.id) {
		// Normalizar ID para evitar inconsistencias
		const originalId = data.id;
		const folderId = normalizeId(originalId);

		// Guardar mapeo de IDs para diagnóstico
		rawToNormalizedIds[originalId] = folderId;

		// Marcar como completado
		folderCompletionStatus[folderId] = true;
		processFinishTime[folderId] = Date.now();

		lastProcessStatus[folderId] = {
			...lastProcessStatus[folderId],
			phase: 'complete',
			status: 'Proceso completado',
			progress: 100,
			filesProcessed: data.totalFiles || 0,
			totalFiles: data.totalFiles || 0,
			timestamp: Date.now(),
			folderId, // Usar el ID normalizado
		};

		statusLogger.info(`✅ Evento COMPLETE recibido para carpeta ${folderId}`, {
			originalId,
			normalizedId: folderId,
		});

		// Programar limpieza
		scheduleStatusCleanup(folderId);
	}
});

// Función para programar limpieza de estado
function scheduleStatusCleanup(folderId: string) {
	// Aumentar el tiempo a 30 segundos para dar más margen al cliente para verificar
	setTimeout(() => {
		// Solo limpiar si ha pasado al menos 30 segundos desde la finalización
		const finishTime = processFinishTime[folderId] || 0;
		const elapsed = Date.now() - finishTime;

		if (elapsed >= 30000) {
			delete lastProcessStatus[folderId];
			delete folderCompletionStatus[folderId];
			delete processFinishTime[folderId];
			statusLogger.info(`🧹 Limpiando estado de carpeta ${folderId} después de ${elapsed}ms`);
		}
	}, 30000);
}

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const rawFolderId = searchParams.get('folderId');

		if (rawFolderId) {
			// Normalizar ID para garantizar consistencia
			const folderId = normalizeId(rawFolderId);

			// Buscar si existe algún mapeo conocido para este ID
			const knownMappings = Object.entries(rawToNormalizedIds)
				.filter(([original, normalized]) => normalized === folderId || original === rawFolderId)
				.map(([original, normalized]) => ({ original, normalized }));

			// Verificar si hay información disponible usando el ID normalizado o el original
			const status = lastProcessStatus[folderId];
			const isComplete = folderCompletionStatus[folderId] || false;
			const finishedAt = processFinishTime[folderId] || null;

			// Log más detallado para debugging
			statusLogger.info(`GET /api/folders/status?folderId=${rawFolderId}`, {
				hasStatus: !!status,
				isComplete,
				timeElapsed: finishedAt ? Date.now() - finishedAt : null,
				originalId: rawFolderId,
				normalizedId: folderId,
				knownMappings: knownMappings.length > 0 ? knownMappings : 'ninguno',
				allKnownIds: Object.keys(lastProcessStatus),
				currentStatus: status
					? {
							progress: status.progress,
							phase: status.phase,
						}
					: null,
			});

			// Devolver estado específico de una carpeta
			return NextResponse.json(
				{
					status,
					isComplete,
					finishedAt,
					timestamp: Date.now(),
					// Incluir información útil para depuración
					originalId: rawFolderId,
					normalizedId: folderId,
					allActiveIds: Object.keys(lastProcessStatus),
					knownMappings: knownMappings.length > 0 ? knownMappings : null,
				},
				{
					headers: {
						'Cache-Control': 'no-store, max-age=0',
					},
				}
			);
		}

		// Devolver todos los estados activos
		return NextResponse.json({
			statuses: lastProcessStatus,
			completionStatus: folderCompletionStatus,
			finishTimes: processFinishTime,
			idMappings: rawToNormalizedIds,
			timestamp: Date.now(),
		});
	} catch (error) {
		statusLogger.error('Error en GET /api/folders/status:', error);
		return NextResponse.json(
			{
				error: 'Error obteniendo estado de carpetas',
				message: error instanceof Error ? error.message : String(error),
				timestamp: Date.now(),
			},
			{ status: 500 }
		);
	}
}
