/**
 * @file Hook para mover archivos entre carpetas
 * @module hooks/use-move
 * @description Hook para mover archivos de una carpeta a otra
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { clientLogger } from '@/lib/logger/client-logger';

export interface MoveFilesOptions {
	/** IDs de los archivos a mover */
	fileIds: string[];
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

	const mutation = useMutation({
		mutationFn: async (options: MoveFilesOptions) => {
			const { fileIds, targetFolderId } = options;

			const response = await fetch('/api/files/move', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ fileIds, targetFolderId }),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Error al mover archivos' }));
				throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
			}

			return response.json();
		},
		onSuccess: async (_, variables) => {
			const { fileIds, targetFolderId } = variables;

			// Invalidar queries relacionadas
			queryClient.invalidateQueries({ queryKey: ['folder-files'] });
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['folders'] });
			queryClient.invalidateQueries({ queryKey: ['images'] });
			queryClient.invalidateQueries({ queryKey: ['videos'] });
			queryClient.invalidateQueries({ queryKey: ['audios'] });
			queryClient.invalidateQueries({ queryKey: ['documents'] });
			queryClient.invalidateQueries({ queryKey: ['all-images'] });
			queryClient.invalidateQueries({ queryKey: ['stats'] });

			// Reindexar archivos en la carpeta destino
			try {
				await fetch(`/api/folders/${targetFolderId}/reindex`, {
					method: 'POST',
				});
			} catch (error) {
				clientLogger.warn('Error reindexing folder after move:', error);
				// No bloquear el éxito de la operación si la reindexación falla
			}

			toast({
				title: '✅ Archivos movidos',
				description: `${fileIds.length} archivo${fileIds.length > 1 ? 's' : ''} movido${fileIds.length > 1 ? 's' : ''} exitosamente y reindexados`,
			});
		},
		onError: (error) => {
			clientLogger.error('Error moving files:', error);

			toast({
				variant: 'destructive',
				title: '❌ Error al mover',
				description: error instanceof Error ? error.message : 'Error desconocido',
			});
		},
	});

	return {
		moveFiles: mutation.mutateAsync,
		isLoading: mutation.isPending,
		error: mutation.error,
		isSuccess: mutation.isSuccess,
		reset: mutation.reset,
	};
}
