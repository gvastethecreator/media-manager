/**
 * @file Feature Flags Configuration
 * @module config/features
 * @description Feature flags para habilitar/deshabilitar funcionalidades experimentales
 * @created 2025-10-11
 */

/**
 * Feature flags disponibles en la aplicación
 */
export const FEATURES = {
	/**
	 * USE_EFFECT_TAGS - Habilita la implementación de TagService con Effect-TS
	 *
	 * Cuando está habilitado, usa src/server/routes/tags.effect.ts
	 * Cuando está deshabilitado, usa src/server/routes/tags.ts (legacy)
	 *
	 * @default true (predeterminado desde 2025-10-11)
	 * @note Para usar legacy: USE_EFFECT_TAGS=false
	 */
	USE_EFFECT_TAGS: process.env.USE_EFFECT_TAGS !== 'false',

	/**
	 * USE_EFFECT_IMAGES - Habilita la implementación de ImageService con Effect-TS
	 *
	 * Cuando está habilitado, usa src/server/routes/images.effect.ts
	 * Cuando está deshabilitado, usa src/server/routes/images.ts (legacy)
	 *
	 * @default true (predeterminado desde 2025-10-12 - Phase 6.1)
	 * @note Para usar legacy: USE_EFFECT_IMAGES=false
	 */
	USE_EFFECT_IMAGES: process.env.USE_EFFECT_IMAGES !== 'false',

	/**
	 * USE_EFFECT_VIDEOS - Habilita la implementación de VideoService con Effect-TS
	 *
	 * Cuando está habilitado, usa src/server/routes/videos.effect.ts
	 * Cuando está deshabilitado, usa src/server/routes/videos.ts (legacy)
	 *
	 * @default true (predeterminado desde 2025-01-10 - Phase 6.2)
	 * @note Para usar legacy: USE_EFFECT_VIDEOS=false
	 */
	USE_EFFECT_VIDEOS: process.env.USE_EFFECT_VIDEOS !== 'false',

	/**
	 * USE_EFFECT_AUDIOS - Habilita la implementación de AudioService con Effect-TS
	 *
	 * Cuando está habilitado, usa src/server/routes/audios.effect.ts
	 * Cuando está deshabilitado, usa src/server/routes/audios.ts (legacy)
	 *
	 * @default true (predeterminado desde 2025-01-10 - Phase 6.3)
	 * @note Para usar legacy: USE_EFFECT_AUDIOS=false
	 */
	USE_EFFECT_AUDIOS: process.env.USE_EFFECT_AUDIOS !== 'false',

	/**
	 * USE_EFFECT_FOLDERS - Habilita la implementación de FolderService con Effect-TS
	 *
	 * @default false
	 * @future Fase 3 de implementación Effect
	 */
	USE_EFFECT_FOLDERS: process.env.USE_EFFECT_FOLDERS === 'true',
} as const;

/**
 * Función helper para verificar si una feature está habilitada
 */
export const isFeatureEnabled = (featureName: keyof typeof FEATURES): boolean => {
	return FEATURES[featureName];
};

/**
 * Log de features habilitadas (útil para debugging)
 */
export const logEnabledFeatures = (logger?: { info: (msg: string, ctx?: any) => void }) => {
	const enabledFeatures = Object.entries(FEATURES)
		.filter(([_, enabled]) => enabled)
		.map(([name]) => name);

	const message =
		enabledFeatures.length > 0
			? `Features habilitadas: ${enabledFeatures.join(', ')}`
			: 'No hay features experimentales habilitadas';

	if (logger) {
		logger.info(message);
	} else {
		console.log(`✨ ${message}`);
	}

	return enabledFeatures;
};

// Log automático en desarrollo
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
	logEnabledFeatures();
}
