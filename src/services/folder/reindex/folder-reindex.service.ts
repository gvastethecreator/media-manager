/**
 * Reindexado de Folder sobre el modelo canónico Asset/SourceFile.
 *
 * El pipeline legacy de ocho fases permanece aislado como material de retirada, pero ya no
 * participa del endpoint público: ninguna lectura de media depende de las columnas `*.path`.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { emitProgress } from '@/lib/server/events.server';
import type { AuthorizedRootRegistry } from '@/server/security/authorized-roots';
import type { ProcessStatus } from '@/types/folders';
import { executeCanonicalFolderReindex, type CanonicalFolderReindexContext } from './canonical-folder-reindex';
import type { ReindexOptions, ReindexPhaseResult } from './folder-reindex-types';

export type { ReindexAnalysisResult, ReindexOptions, ReindexPhaseResult } from './folder-reindex-types';

export interface StructuredReindexContext {
	afterFolderAuthorization?: CanonicalFolderReindexContext['afterFolderAuthorization'];
	authorizedRootRegistry: AuthorizedRootRegistry;
}

export interface StructuredReindexResult {
	phases: Record<string, ReindexPhaseResult>;
	success: boolean;
	summary: {
		filesIndexed: number;
		foldersProcessed: number;
	};
	totalDuration: number;
}

const phase = (
	processed: number,
	options: Partial<Omit<ReindexPhaseResult, 'processed'>> = {}
): ReindexPhaseResult => ({
	duration: options.duration ?? 0,
	errors: options.errors ?? [],
	failed: options.failed ?? 0,
	processed,
	skipped: options.skipped,
	success: options.success ?? true,
});

export class FolderReindexService {
	private static instance: FolderReindexService;
	private readonly logger = serverLogger.withContext('FolderReindexService');

	static getInstance(): FolderReindexService {
		FolderReindexService.instance ??= new FolderReindexService();
		return FolderReindexService.instance;
	}

	async executeStructuredReindex(
		options: ReindexOptions = {},
		context?: StructuredReindexContext
	): Promise<StructuredReindexResult> {
		if (!context?.authorizedRootRegistry) {
			throw new Error('El reindex requiere un registro explícito de media roots autorizados.');
		}
		const startTime = Date.now();
		this.logger.info('Iniciando reindex canónico', { folderId: options.folderId });
		if (options.emitEvents !== false) await this.emitProgress('starting', 0, 'Iniciando reindex canónico...');

		try {
			const result = await executeCanonicalFolderReindex(options, context);
			const success = result.errors.length === 0;
			const phases: Record<string, ReindexPhaseResult> = {
				analysis: phase(result.foldersProcessed + result.missingFolders),
				existence: phase(result.foldersProcessed + result.missingFolders),
				deletion: phase(0, { skipped: true }),
				structure: phase(result.newFolders),
				indexing: phase(result.filesIndexed, {
					errors: result.errors,
					failed: result.errors.length,
					success,
				}),
				// Metadata y derivados se producen dentro de la ingesta de archivos nuevos. No se
				// reportan como fases separadas para evitar afirmar trabajo que no fue observado.
				thumbnails: phase(0, { skipped: true }),
				metadata: phase(0, { skipped: true }),
				verification: phase(result.totalFilesObserved, {
					errors: result.errors,
					failed: result.errors.length,
					success,
				}),
			};
			const totalDuration = Date.now() - startTime;
			if (options.emitEvents !== false) {
				await this.emitProgress(
					success ? 'completed' : 'error',
					success ? 100 : 0,
					success ? 'Reindex canónico completado' : 'El reindex canónico terminó con errores'
				);
			}
			return {
				phases,
				success,
				summary: {
					filesIndexed: result.filesIndexed,
					foldersProcessed: result.foldersProcessed,
				},
				totalDuration,
			};
		} catch (error) {
			this.logger.error('Error durante reindex canónico', {
				error: error instanceof Error ? error.message : String(error),
				folderId: options.folderId,
			});
			if (options.emitEvents !== false) await this.emitProgress('error', 0, 'El reindex canónico falló');
			throw error;
		}
	}

	private async emitProgress(phaseName: string, progress: number, message: string): Promise<void> {
		try {
			await emitProgress('folder:reindexAll:progress', {
				filesProcessed: 0,
				folderId: undefined,
				isProcessing: progress < 100,
				message,
				phase: phaseName,
				progress,
				timestamp: Date.now(),
				totalFiles: 0,
			} as ProcessStatus);
		} catch {
			// El canal de progreso es best-effort y no altera la transacción de reindexado.
		}
	}
}
