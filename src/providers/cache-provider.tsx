"use client";

import { useEffect } from "react";
import { thumbnailCache, metadataCache, searchCache } from "@/lib/cache";
import { logger } from "@/lib/logger";

const cacheProviderLogger = logger.withContext("CacheProvider");

export function CacheProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		cacheProviderLogger.info("🚀 Inicializando sistema de caché");

		return () => {
			// Limpiar caches al desmontar
			Promise.all([
				thumbnailCache.stop(),
				metadataCache.stop(),
				searchCache.stop(),
			]).catch((error) => {
				cacheProviderLogger.error("❌ Error al detener caches:", error);
			});
		};
	}, []);

	return <>{children}</>;
}
