"use client";

import { useEffect } from "react";
import {
	thumbnailCache,
	metadataCache,
	searchCache,
	statsCache,
	charactersCache,
	placesCache,
	objectsCache,
} from "@/lib/cache";
import { logger } from "@/lib/logger";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/react-query";

const cacheProviderLogger = logger.withContext("CacheProvider");

export function CacheProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		cacheProviderLogger.info("🚀 Inicializando sistema de caché");

		return () => {
			// Limpiar todos los caches al desmontar
			Promise.all([
				thumbnailCache.stop(),
				metadataCache.stop(),
				searchCache.stop(),
				statsCache.stop(),
				charactersCache.stop(),
				placesCache.stop(),
				objectsCache.stop(),
			]).catch((error) => {
				cacheProviderLogger.error("❌ Error al detener caches:", error);
			});
		};
	}, []);

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
