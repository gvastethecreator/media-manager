/**
 * @file Hook para gestionar favoritos
 * @module hooks/use-favorite
 * @description Hook para toggle de estado favorito de entidades
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
	/** Error si ocurrió */
	error: Error | null;
	/** Si es favorito actualmente */
	isFavorite: boolean;
	/** Si está procesando */
	isLoading: boolean;
	/** Función para toggle de favorito */
	toggleFavorite: () => void;
}

/**
 * Hook para gestionar el estado de favorito de una entidad
 */
export function useFavorite(options: UseFavoriteOptions): UseFavoriteResult {
	const { entityId, entityType, initialIsFavorite = false } = options;
	const queryClient = useQueryClient();
	const { toast } = useToast();
	const [isFavorite, setIsFavorite] = useState(initialIsFavorite);

	useEffect(() => {
		setIsFavorite(initialIsFavorite);
	}, [entityId, initialIsFavorite]);

	const mutation = useMutation<unknown, Error, boolean, { previousState: boolean }>({
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
		onMutate: async (newState) => {
			const previousState = isFavorite;
			setIsFavorite(newState);
			return { previousState };
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
		onError: (error, _newState, context) => {
			setIsFavorite(context?.previousState ?? initialIsFavorite);
			clientLogger.error('Error al toggle favorito:', error);
			toast({
				variant: 'destructive',
				title: '❌ Error',
				description: 'No se pudo actualizar el estado de favorito',
			});
		},
	});

	const toggleFavorite = () => {
		const newState = !isFavorite;
		mutation.mutate(newState);
	};

	return {
		isFavorite,
		toggleFavorite,
		isLoading: mutation.isPending,
		error: mutation.error,
	};
}
