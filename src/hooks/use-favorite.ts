/**
 * @file Hook para gestionar favoritos
 * @module hooks/use-favorite
 * @description Hook para toggle de estado favorito de entidades
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { clientLogger } from '@/lib/logger/client-logger';

export interface UseFavoriteOptions {
	/** ID de la entidad */
	entityId: string;
	/** Tipo de entidad */
	entityType: string;
	/** Estado inicial del favorito */
	initialIsFavorite?: boolean;
}

export interface UseFavoriteResult {
	/** Si es favorito actualmente */
	isFavorite: boolean;
	/** Función para toggle de favorito */
	toggleFavorite: () => void;
	/** Si está procesando */
	isLoading: boolean;
	/** Error si ocurrió */
	error: Error | null;
}

/**
 * Hook para gestionar el estado de favorito de una entidad
 */
export function useFavorite(options: UseFavoriteOptions): UseFavoriteResult {
	const { entityId, entityType, initialIsFavorite = false } = options;
	const queryClient = useQueryClient();
	const { toast } = useToast();

	const mutation = useMutation({
		mutationFn: async (newState: boolean) => {
			const response = await fetch('/api/favorites/toggle', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					entityId,
					entityType,
					isFavorite: newState,
				}),
			});

			if (!response.ok) {
				throw new Error('Error al actualizar favorito');
			}

			return response.json();
		},
		onSuccess: (_, newState) => {
			// Invalidar queries relacionadas
			queryClient.invalidateQueries({ queryKey: ['favorites'] });
			queryClient.invalidateQueries({ queryKey: [entityType, entityId] });

			toast({
				title: newState ? '❤️ Agregado a favoritos' : '💔 Removido de favoritos',
				description: newState
					? 'La imagen ha sido agregada a tus favoritos'
					: 'La imagen ha sido removida de tus favoritos',
			});
		},
		onError: (error) => {
			clientLogger.error('Error al toggle favorito:', error);
			toast({
				variant: 'destructive',
				title: '❌ Error',
				description: 'No se pudo actualizar el estado de favorito',
			});
		},
	});

	const toggleFavorite = () => {
		const newState = !initialIsFavorite;
		mutation.mutate(newState);
	};

	return {
		isFavorite: initialIsFavorite,
		toggleFavorite,
		isLoading: mutation.isPending,
		error: mutation.error,
	};
}
