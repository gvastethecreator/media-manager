'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
/**
 * @deprecated `@/lib/database/cache` está en zona de deprecación (ver `@/lib/database/`).
 * Migrar a `@/lib/drizzle` o a un módulo de cache específico cuando se consolide.
 */
import {
	charactersCache,
	metadataCache,
	placesCache,
	searchCache,
	statsCache,
	thumbnailCache,
	worldItemsCache,
} from '@/lib/database/cache';
import { clientLogger } from '@/lib/logger/client-logger';

const cacheProviderLogger = clientLogger.withContext('CacheProvider');

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

	return <>{children}</>;
}
