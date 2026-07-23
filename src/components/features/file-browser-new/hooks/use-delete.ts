/**
 * @file Hook para eliminar archivos
 * @module file-browser-new/hooks/use-delete
 *
 * Provee funcionalidad para eliminar múltiples archivos
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/client';
import { type FileMutationSummary, PartialFileMutationError } from '@/lib/api/file-mutation-result';
import { clientLogger } from '@/lib/logger/client-logger';
import type { BrowserEntityType, BrowserItem } from '../types/item.types';

interface DeleteInput {
	items: BrowserItem[];
}

interface DeleteResult {
	deleteItems: (items: BrowserItem[]) => Promise<void>;
	error: Error | null;
	isLoading: boolean;
	isSuccess: boolean;
}

function deletionRoute(entityType: BrowserEntityType): string | null {
	switch (entityType) {
		case 'document':
			return 'documents';
		case 'file3d':
			return 'file3ds';
		case 'folder':
			return 'folders';
		case 'jsonFile':
			return 'json-files';
		default:
			return null;
	}
}

function mediaDeletionRoute(entityType: BrowserEntityType): string | null {
	switch (entityType) {
		case 'audio':
			return 'audios';
		case 'image':
			return 'images';
		case 'video':
			return 'videos';
		default:
			return null;
	}
}

/**
 * Ejecuta borrados en un orden que permite informar qué cambió si una llamada falla.
 * Los medios conservan sus endpoints batch, que ya manejan cada grupo de forma transaccional.
 */
export async function deleteBrowserItems(items: BrowserItem[]): Promise<FileMutationSummary> {
	const summary: FileMutationSummary = {
		applied: 0,
		cleanupPending: 0,
		reconciliationPending: 0,
		recoveryPending: 0,
		total: items.length,
	};
	const grouped = new Map<BrowserEntityType, BrowserItem[]>();

	for (const item of items) {
		grouped.set(item.entityType, [...(grouped.get(item.entityType) ?? []), item]);
	}

	try {
		for (const [entityType, group] of grouped) {
			const mediaRoute = mediaDeletionRoute(entityType);
			if (mediaRoute) {
				await apiClient.delete(`/${mediaRoute}/batch`, { ids: group.map((item) => item.id) });
				summary.applied += group.length;
				continue;
			}

			const route = deletionRoute(entityType);
			if (!route) throw new Error(`Tipo no compatible para eliminar: ${entityType}`);

			for (const item of group) {
				await apiClient.delete(`/${route}/${encodeURIComponent(item.id)}`);
				summary.applied += 1;
			}
		}
	} catch (error) {
		throw new PartialFileMutationError(
			error instanceof Error ? error.message : 'No se pudieron eliminar todos los elementos.',
			summary,
			error
		);
	}

	return summary;
}

/**
 * Hook para eliminar archivos
 * @returns Objeto con la función deleteItems y estados de la mutación
 */
export function useDelete(): DeleteResult {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	const mutation = useMutation<FileMutationSummary, Error, DeleteInput>({
		mutationFn: ({ items }) => deleteBrowserItems(items),
		onSuccess: (summary) => {
			toast({
				title: '✅ Elementos eliminados',
				description: `${summary.applied} elemento${summary.applied === 1 ? '' : 's'} eliminado${summary.applied === 1 ? '' : 's'}.`,
			});
		},
		onError: (error) => {
			clientLogger.error('Error deleting browser items:', error);
			const partial = error instanceof PartialFileMutationError ? error.summary : null;
			toast({
				variant: 'destructive',
				title: partial?.applied ? '⚠️ Eliminación parcialmente aplicada' : '❌ Error al eliminar',
				description: partial?.applied
					? `${partial.applied} de ${partial.total} elementos se eliminaron antes del fallo. Revisa la lista antes de volver a intentarlo.`
					: error.message,
			});
		},
		onSettled: async () => {
			await Promise.all(
				[
					'files',
					'folder-files',
					'folders',
					'images',
					'videos',
					'audios',
					'documents',
					'favorites',
					'albums',
					'collections',
				].map((key) => queryClient.invalidateQueries({ queryKey: [key] }))
			);
		},
	});

	const deleteItems = async (items: BrowserItem[]): Promise<void> => {
		await mutation.mutateAsync({ items });
	};

	return {
		deleteItems,
		isLoading: mutation.isPending,
		error: mutation.error,
		isSuccess: mutation.isSuccess,
	};
}
