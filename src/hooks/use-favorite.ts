/**
 * @file Hook para gestionar favoritos
 * @module hooks/use-favorite
 * @description Hook para toggle de estado favorito de entidades
 */

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { clientLogger } from '@/lib/logger/client-logger';
import { useToggleFavoriteMutation } from '@/lib/api/favorites';
import {
	getFavoriteEntityDisplayName,
	isCanonicalFavoriteEntityType,
	type FavoriteEntityType,
} from '@/types/entities/favorite';

const favoriteLogger = clientLogger.withContext('useFavorite');

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
	/** Si la entidad pertenece al perímetro canónico de Favorite */
	isSupported: boolean;
	/** Función para toggle de favorito */
	toggleFavorite: () => void;
}

/**
 * Hook para gestionar el estado de favorito de una entidad
 */
export function useFavorite(options: UseFavoriteOptions): UseFavoriteResult {
	const { entityId, entityType, initialIsFavorite = false } = options;
	const { toast } = useToast();
	const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
	const mutation = useToggleFavoriteMutation();
	const isSupported = isCanonicalFavoriteEntityType(entityType);

	useEffect(() => {
		setIsFavorite(initialIsFavorite);
	}, [entityId, initialIsFavorite]);

	const toggleFavorite = () => {
		const entityLabel = getFavoriteEntityDisplayName(entityType as FavoriteEntityType);

		if (!isSupported) {
			favoriteLogger.warn('Entidad fuera del perímetro canónico de Favorite', { entityId, entityType });
			toast({
				title: 'ℹ️ Favorito no disponible',
				description: `${entityLabel} no usa Favorite canónico en esta migración.`,
			});
			return;
		}

		const previousState = isFavorite;
		const newState = !previousState;

		setIsFavorite(newState);
		mutation.mutate(
			{
				entityId,
				entityType,
			},
			{
				onSuccess: (result) => {
					setIsFavorite(result.isFavorite);

					toast({
						title: result.isFavorite ? '❤️ Agregado a favoritos' : '💔 Removido de favoritos',
						description: result.isFavorite
							? `${entityLabel} agregado a tus favoritos.`
							: `${entityLabel} removido de tus favoritos.`,
					});
				},
				onError: (error) => {
					setIsFavorite(previousState);
					favoriteLogger.error('Error al alternar favorito:', error);
					toast({
						variant: 'destructive',
						title: '❌ Error',
						description: 'No se pudo actualizar el estado de favorito',
					});
				},
			}
		);
	};

	return {
		isFavorite,
		toggleFavorite,
		isLoading: mutation.isPending,
		isSupported,
		error: mutation.error,
	};
}
