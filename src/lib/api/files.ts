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

// Hook para agregar archivo a un álbum
export const useAddToAlbum = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ fileId, albumId }: { fileId: string; albumId: string }) => {
			const response = await fetch(`${API_BASE}/albums/${albumId}/images/${fileId}`, {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('Failed to add to album');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['albums'] });
		},
	});
};

// Hook para agregar archivo a un grupo
export const useAddToGroup = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ fileId, groupId }: { fileId: string; groupId: string }) => {
			const response = await fetch(`${API_BASE}/groups/${groupId}/files/${fileId}`, {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('Failed to add to group');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['groups'] });
		},
	});
};

// Hook para agregar archivo a un personaje
export const useAddToCharacter = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ fileId, characterId }: { fileId: string; characterId: string }) => {
			const response = await fetch(`${API_BASE}/characters/${characterId}/files/${fileId}`, {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('Failed to add to character');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['characters'] });
		},
	});
};

// Hook para agregar archivo a un lugar
export const useAddToPlace = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ fileId, placeId }: { fileId: string; placeId: string }) => {
			const response = await fetch(`${API_BASE}/places/${placeId}/files/${fileId}`, {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('Failed to add to place');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['places'] });
		},
	});
};

// Hook para agregar archivo a un concepto
export const useAddToConcept = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ fileId, conceptId }: { fileId: string; conceptId: string }) => {
			const response = await fetch(`${API_BASE}/concepts/${conceptId}/files/${fileId}`, {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('Failed to add to concept');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['concepts'] });
		},
	});
};

// Hook para agregar archivo a un world item
export const useAddToWorldItem = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ fileId, worldItemId }: { fileId: string; worldItemId: string }) => {
			const response = await fetch(`${API_BASE}/world-items/${worldItemId}/files/${fileId}`, {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('Failed to add to world item');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['world-items'] });
		},
	});
};

// Hook para agregar archivo a una nota
export const useAddToNote = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ fileId, noteId }: { fileId: string; noteId: string }) => {
			const response = await fetch(`${API_BASE}/notes/${noteId}/files/${fileId}`, {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('Failed to add to note');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['notes'] });
		},
	});
};

// Hook para agregar archivo a un prompt
export const useAddToPrompt = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ fileId, promptId }: { fileId: string; promptId: string }) => {
			const response = await fetch(`${API_BASE}/prompts/${promptId}/files/${fileId}`, {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('Failed to add to prompt');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['prompts'] });
		},
	});
};

// Hook para agregar archivo a una propiedad
export const useAddToProperty = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ fileId, propertyId }: { fileId: string; propertyId: string }) => {
			const response = await fetch(`${API_BASE}/properties/${propertyId}/files/${fileId}`, {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('Failed to add to property');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['properties'] });
		},
	});
};

// Hook para agregar archivo a un wildcard
export const useAddToWildcard = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ fileId, wildcardId }: { fileId: string; wildcardId: string }) => {
			const response = await fetch(`${API_BASE}/wildcards/${wildcardId}/files/${fileId}`, {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('Failed to add to wildcard');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['wildcards'] });
		},
	});
};
