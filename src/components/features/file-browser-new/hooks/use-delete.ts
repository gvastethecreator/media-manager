/**
 * @file Hook para eliminar archivos
 * @module file-browser-new/hooks/use-delete
 *
 * Provee funcionalidad para eliminar múltiples archivos
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { BrowserEntityType, BrowserItem } from '../types/item.types';

const API_BASE = '/api';

interface DeleteInput {
	items: BrowserItem[];
}

interface DeleteResult {
	deleteItems: (items: BrowserItem[]) => Promise<void>;
	error: Error | null;
	isLoading: boolean;
	isSuccess: boolean;
}

/**
 * Hook para eliminar archivos
 * @returns Objeto con la función deleteItems y estados de la mutación
 */
export function useDelete(): DeleteResult {
	const queryClient = useQueryClient();

	const mutation = useMutation<void, Error, DeleteInput>({
		mutationFn: async ({ items }) => {
			const grouped = new Map<BrowserEntityType, BrowserItem[]>();
			for (const item of items) {
				grouped.set(item.entityType, [...(grouped.get(item.entityType) ?? []), item]);
			}
			for (const [entityType, group] of grouped) {
				let requests: Array<Promise<Response>>;
				if (entityType === 'image' || entityType === 'video' || entityType === 'audio') {
					const route = entityType === 'image' ? 'images' : entityType === 'video' ? 'videos' : 'audios';
					requests = [
						fetch(`${API_BASE}/${route}/batch`, {
							method: 'DELETE',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ ids: group.map((item) => item.id) }),
						}),
					];
				} else {
					const route =
						entityType === 'document'
							? 'documents'
							: entityType === 'jsonFile'
								? 'json-files'
								: entityType === 'file3d'
									? 'file3ds'
									: entityType === 'folder'
										? 'folders'
										: null;
					if (!route) throw new Error(`Tipo no compatible para eliminar: ${entityType}`);
					requests = group.map((item) =>
						fetch(`${API_BASE}/${route}/${encodeURIComponent(item.id)}`, { method: 'DELETE' })
					);
				}

				const responses = await Promise.all(requests);
				const failed = responses.find((response) => !response.ok);
				if (failed) {
					const errorData = await failed.json().catch(() => ({}));
					throw new Error(errorData.message || errorData.error || `Error al eliminar: ${failed.statusText}`);
				}
			}
		},
		onSettled: async () => {
			await Promise.all(
				['files', 'folder-files', 'favorites', 'albums', 'collections'].map((key) =>
					queryClient.invalidateQueries({ queryKey: [key] })
				)
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
