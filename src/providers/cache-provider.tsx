'use client';

import {
	charactersCache,
	metadataCache,
	placesCache,
	searchCache,
	statsCache,
	thumbnailCache,
	worldItemsCache,
} from '@/lib/cache';
import { serverLogger } from '@/lib/logger/server-logger';
import { queryClient } from '@/lib/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

const cacheProviderLogger = serverLogger.withContext('CacheProvider');

export function CacheProvider({ children }: { children: ReactNode }) {
	useEffect(() => {
		cacheProviderLogger.info('🚀 Inicializando sistema de caché');

		return () => {
			// Limpiar todos los caches al desmontar
			Promise.all([
				thumbnailCache.stop(),
				metadataCache.stop(),
				searchCache.stop(),
				statsCache.stop(),
				charactersCache.stop(),
				placesCache.stop(),
				worldItemsCache.stop(),
			]).catch((error) => {
				cacheProviderLogger.error('❌ Error al detener caches:', error);
			});
		};
	}, []);

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
