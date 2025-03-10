import { logger } from '@/lib/logger';
import { FOLDER_EVENTS, folderService } from '@/services/folder.service';
import type { FolderResponse, ProcessStatus } from '@/types/process';
import { type NextRequest, NextResponse } from 'next/server';

const statusLogger = logger.withContext('FolderStatusAPI');

// Estado global compartido para procesos de reindexación
const lastProcessStatus: Record<string, ProcessStatus> = {};

// Mantener un registro de los últimos estados procesados
folderService.onProgress((status: ProcessStatus) => {
	if (status?.folderId) {
		lastProcessStatus[status.folderId] = {
			...lastProcessStatus[status.folderId],
			...status,
			timestamp: Date.now(),
		};
	}
});

// Limpiar estados completados después de un tiempo
folderService.on(FOLDER_EVENTS.COMPLETE, (data: FolderResponse) => {
	if (data?.id) {
		// Marcar como completado pero mantener por un tiempo para que el cliente lo vea
		if (lastProcessStatus[data.id]) {
			lastProcessStatus[data.id] = {
				...lastProcessStatus[data.id],
				phase: 'complete',
				status: 'Proceso completado',
				progress: 100,
				timestamp: Date.now(),
			};

			// Eliminar después de 10 segundos
			setTimeout(() => {
				delete lastProcessStatus[data.id];
			}, 10000);
		}
	}
});

export async function GET(request: NextRequest) {
	try {
		statusLogger.info('GET /api/folders/status');

		const searchParams = request.nextUrl.searchParams;
		const folderId = searchParams.get('folderId');

		if (folderId) {
			// Devolver estado específico de una carpeta
			return NextResponse.json({
				status: lastProcessStatus[folderId] || null,
				timestamp: Date.now(),
			});
		}

		// Devolver todos los estados activos
		return NextResponse.json({
			statuses: lastProcessStatus,
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
