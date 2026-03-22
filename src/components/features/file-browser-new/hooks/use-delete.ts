/**
 * @file Hook para eliminar archivos
 * @module file-browser-new/hooks/use-delete
 *
 * Provee funcionalidad para eliminar múltiples archivos
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api';

interface DeleteInput {
	itemIds: string[];
}

interface DeleteResult {
	deleteItems: (itemIds: string[]) => Promise<void>;
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
		mutationFn: async ({ itemIds }) => {
			const response = await fetch(`${API_BASE}/files`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ ids: itemIds }),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `Error al eliminar: ${response.statusText}`);
			}
		},
		onSuccess: () => {
			// Invalidar queries relevantes para que se actualicen los datos
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['folder-files'] });
			queryClient.invalidateQueries({ queryKey: ['favorites'] });
			queryClient.invalidateQueries({ queryKey: ['albums'] });
			queryClient.invalidateQueries({ queryKey: ['collections'] });
		},
	});

	const deleteItems = async (itemIds: string[]): Promise<void> => {
		await mutation.mutateAsync({ itemIds });
	};

	return {
		deleteItems,
		isLoading: mutation.isPending,
		error: mutation.error,
		isSuccess: mutation.isSuccess,
	};
}
