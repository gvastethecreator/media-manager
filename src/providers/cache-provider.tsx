"use client";

import { useEffect } from "react";
import {
	thumbnailCache,
	metadataCache,
	searchCache,
	CacheManager,
} from "@/lib/cache";
import { logger } from "@/lib/logger";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/react-query";

const cacheProviderLogger = logger.withContext("CacheProvider");

// Asegurar que TypeScript reconozca las instancias como CacheManager
const typedThumbnailCache = thumbnailCache as CacheManager<string>;
const typedMetadataCache = metadataCache as CacheManager<
	Record<string, unknown>
>;
const typedSearchCache = searchCache as CacheManager<unknown[]>;

export function CacheProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		cacheProviderLogger.info(" Inicializando sistema de cach");

		return () => {
			// Limpiar caches al desmontar
			Promise.all([
				typedThumbnailCache.stop(),
				typedMetadataCache.stop(),
				typedSearchCache.stop(),
			]).catch((error) => {
				cacheProviderLogger.error(" Error al detener caches:", error);
			});
		};
	}, []);

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
