/**
 * @file Hook para mover archivos entre carpetas
 * @module hooks/use-move
 * @description Hook para mover archivos de una carpeta a otra
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import type { MediaAssetReference } from '@/lib/api/authorized-roots';
import { apiClient } from '@/lib/api/client';
import {
	addFileMutationResult,
	type FileMutationItemResult,
	type FileMutationSummary,
	PartialFileMutationError,
	pendingFileMutationDescription,
} from '@/lib/api/file-mutation-result';
import { clientLogger } from '@/lib/logger/client-logger';

export interface MoveFilesOptions {
	/** Assets autorizables a mover */
	assets: MediaAssetReference[];
	/** ID de la carpeta destino */
	targetFolderId: string;
}

export interface UseMoveResult {
	/** Error si ocurrió */
	error: Error | null;
	/** Si está procesando */
	isLoading: boolean;
	/** Si la operación fue exitosa */
	isSuccess: boolean;
	/** Función para mover archivos */
	moveFiles: (options: MoveFilesOptions) => Promise<void>;
	/** Resetear estado */
	reset: () => void;
}

/**
 * Hook para mover archivos entre carpetas
 */
export function useMove(): UseMoveResult {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	const mutation = useMutation<FileMutationSummary, Error, MoveFilesOptions>({
		mutationFn: async (options: MoveFilesOptions) => {
			const { assets, targetFolderId } = options;
			if (assets.length === 0) throw new Error('No hay archivos compatibles para mover');
			const summary: FileMutationSummary = {
				applied: 0,
				cleanupPending: 0,
				reconciliationPending: 0,
				recoveryPending: 0,
				total: assets.length,
			};

			try {
				for (const asset of assets) {
					const response = await apiClient.post<{
						data: { moved: FileMutationItemResult[] };
						success: true;
					}>('/files/assets/move', { assets: [asset], targetFolderId });
					const moved = response.data.moved[0];
					if (!moved) throw new Error('El servidor no confirmó el asset movido.');
					addFileMutationResult(summary, moved);
				}
			} catch (error) {
				throw new PartialFileMutationError(
					error instanceof Error ? error.message : 'No se pudieron mover todos los archivos.',
					summary,
					error
				);
			}
			return summary;
		},
		onSuccess: async (summary, variables) => {
			const { assets, targetFolderId } = variables;
			let reindexed = true;

			// Reindexar archivos en la carpeta destino
			try {
				await apiClient.post(`/folders/${encodeURIComponent(targetFolderId)}/reindex`);
			} catch (error) {
				reindexed = false;
				clientLogger.warn('Error reindexing folder after move:', error);
				// No bloquear el éxito de la operación si la reindexación falla
			}

			const reconciliation = pendingFileMutationDescription(summary);
			toast(
				reconciliation
					? { title: '⚠️ Movimiento aplicado con tareas pendientes', description: reconciliation }
					: {
							title: '✅ Archivos movidos',
							description: reindexed
								? `${assets.length} archivo${assets.length > 1 ? 's' : ''} movido${assets.length > 1 ? 's' : ''} y reindexado${assets.length > 1 ? 's' : ''}`
								: `${assets.length} archivo${assets.length > 1 ? 's' : ''} movido${assets.length > 1 ? 's' : ''}; la reindexación quedó pendiente`,
						}
			);
		},
		onError: (error) => {
			clientLogger.error('Error moving files:', error);

			const partial = error instanceof PartialFileMutationError ? error.summary : null;
			toast({
				variant: 'destructive',
				title: partial?.applied ? '⚠️ Movimiento parcialmente aplicado' : '❌ Error al mover',
				description: partial?.applied
					? `${partial.applied} de ${partial.total} archivos fueron movidos antes del fallo. Revisa el destino antes de reintentar.`
					: error.message,
			});
		},
		onSettled: async () => {
			await Promise.all(
				['folder-files', 'files', 'folders', 'images', 'videos', 'audios', 'documents', 'all-images', 'stats'].map(
					(key) => queryClient.invalidateQueries({ queryKey: [key] })
				)
			);
		},
	});

	return {
		moveFiles: async (options) => {
			await mutation.mutateAsync(options);
		},
		isLoading: mutation.isPending,
		error: mutation.error,
		isSuccess: mutation.isSuccess,
		reset: mutation.reset,
	};
}
