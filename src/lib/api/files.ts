import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FavoriteEntityType } from '@/types/entities/favorite';

const API_BASE = '/api';

// Hook para alternar el estado de favorito de un archivo
export const useToggleFavorite = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (fileId: string) => {
			const response = await fetch(`${API_BASE}/favorites/toggle`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					entityId: fileId,
					entityType: FavoriteEntityType.IMAGE,
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to toggle favorite');
			}

			return response.json();
		},
		onSuccess: () => {
			// Invalidar queries relevantes para que se actualicen los datos
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['favorites'] });
		},
	});
};

// Hook para añadir un archivo a una colección
export const useAddToCollection = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ fileId, collectionId }: { fileId: string; collectionId: string }) => {
			const response = await fetch(`${API_BASE}/collections/${collectionId}/images/${fileId}`, {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('Failed to add to collection');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['collections'] });
		},
	});
};

// Hook para remover un archivo de una colección
export const useRemoveFromCollection = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ fileId, collectionId }: { fileId: string; collectionId: string }) => {
			const response = await fetch(`${API_BASE}/collections/${collectionId}/images/${fileId}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error('Failed to remove from collection');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['collections'] });
		},
	});
};

// Hook para añadir etiquetas a un archivo
export const useAddTags = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ fileId, tags }: { fileId: string; tags: string[] }) => {
			const response = await fetch(`${API_BASE}/images/${fileId}/tags`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ tagIds: tags }),
			});

			if (!response.ok) {
				throw new Error('Failed to add tags');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['tags'] });
		},
	});
};

// Hook para remover etiquetas de un archivo
export const useRemoveTags = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ fileId, tags }: { fileId: string; tags: string[] }) => {
			const response = await fetch(`${API_BASE}/images/${fileId}/tags`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ tagIds: tags }),
			});

			if (!response.ok) {
				throw new Error('Failed to remove tags');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['tags'] });
		},
	});
};
