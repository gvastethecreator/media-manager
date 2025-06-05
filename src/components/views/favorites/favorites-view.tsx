'use client';

import { getFavorites } from '@/app/actions/favorites/favorite.actions';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import { useUnifiedFileManager } from '@/store/unified-file-manager.store';
import type { FileItem } from '@/types/file-item';
import { Star } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';

const viewLogger = clientLogger.withContext('FavoritesView');

export function FavoritesView() {
	// 🌟 Usar el store unificado con métodos específicos para favoritos
	const {
		currentItems: items,
		toggleItemSelection,
		isLoading,
		setIsLoading,
		setCurrentItems,
	} = useUnifiedFileManager();

	// Usar el hook de eventos optimistas del cliente
	const [optimisticItems, _addEvent] = clientEvents.useEvents<FileItem[]>(items);

	const loadFavorites = useCallback(async () => {
		try {
			viewLogger.info('🔄 Cargando favoritos...');
			setIsLoading(true);

			// Obtener favoritos desde la API
			const favorites = await getFavorites();

			// Transformar a FileItem[] con isFavorite: true
			const favoriteItems: FileItem[] = favorites.map((f) => ({
				...f.image,
				isFavorite: true, // Asegurar que todos los favoritos tengan esta propiedad
			}));

			// 🌟 Actualizar el store unificado con los favoritos
			setCurrentItems(favoriteItems);

			viewLogger.info('✅ Favoritos cargados:', { count: favoriteItems.length });
		} catch (error) {
			viewLogger.error('❌ Error cargando favoritos:', error);
		} finally {
			setIsLoading(false);
		}
	}, [setIsLoading, setCurrentItems]);

	useEffect(() => {
		loadFavorites();

		const handleFavoriteChange = () => {
			viewLogger.info('📢 Evento de cambio en favoritos recibido');
			loadFavorites();
		};

		statsEventEmitter.on(STATS_EVENTS.FAVORITE_CHANGE, handleFavoriteChange);

		return () => {
			statsEventEmitter.off(STATS_EVENTS.FAVORITE_CHANGE, handleFavoriteChange);
		};
	}, [loadFavorites]);

	const favoriteItems = useMemo(() => {
		const filtered = optimisticItems.filter((item) => item.isFavorite);
		viewLogger.debug('🔍 Filtrando favoritos:', { total: filtered.length });
		return filtered;
	}, [optimisticItems]);

	const contentProps: BaseContentProps = {
		items: favoriteItems,
		isLoading,
		toggleItemSelection,
		emptyState: {
			icon: Star,
			title: 'No hay favoritos',
			description:
				'No se encontraron imágenes favoritas. Marca tus imágenes favoritas haciendo clic en el ícono de estrella.',
		},
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}
