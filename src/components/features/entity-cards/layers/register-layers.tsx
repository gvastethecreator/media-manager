'use client';

import { useEffect } from 'react';
import { useLayerPlugin } from './layer-plugin-system';
import type { LayerImplementation } from './types';

// Importar solo las implementaciones que están funcionando correctamente
import { borderLayerImplementation } from './border/border-layer-implementation';
import { chromaticAberrationLayerImplementation } from './chromatic-aberration';
import { filterLayerImplementation } from './filters';
import { glowLayerImplementation } from './glow/glow-layer-implementation';
import { holographicLayerImplementation } from './holographic/holographic-layer-implementation';
import { scanlinesLayerImplementation } from './scanlines';
import { textureLayerImplementation } from './textures';

// Mapa con todas las capas disponibles
// Solo incluir capas que estén correctamente implementadas y probadas
const VERIFIED_LAYERS: Record<string, LayerImplementation> = {
	// Capas básicas
	border: borderLayerImplementation,

	// Capas de efectos visuales
	glow: glowLayerImplementation,
	scanlines: scanlinesLayerImplementation,
	texture: textureLayerImplementation,

	// Capas de efectos especiales
	'chromatic-aberration': chromaticAberrationLayerImplementation,
	'holographic': holographicLayerImplementation,

	// Otras capas
	'filter': filterLayerImplementation
};

/**
 * Componente que registra automáticamente las capas disponibles en el sistema de plugins.
 * Debe ser incluido en la aplicación en un nivel alto para que las capas estén disponibles globalmente.
 */
export function RegisterLayers({
	entityType,
	additionalLayers
}: {
	entityType?: string;
	additionalLayers?: Record<string, LayerImplementation>;
}) {
	// Obtenemos tanto registerLayer como clearLayers del hook
	const { registerLayer, clearLayers } = useLayerPlugin();

	useEffect(() => {
		// Intentamos limpiar capas solo si clearLayers existe
		if (typeof clearLayers === 'function') {
			clearLayers();
			console.log('🧹 Capas existentes limpiadas');
		} else {
			console.warn('⚠️ clearLayers no está disponible, omitiendo limpieza');
		}
		console.log('⚙️ Iniciando registro de capas...');

		// Definimos un helper para registrar capas de forma segura
		const safeRegister = (implementation: LayerImplementation | undefined, name: string) => {
			try {
				if (!implementation) {
					console.warn(`⚠️ Capa ${name} no disponible o indefinida`);
					return false;
				}

				// Verificar que la implementación tenga propiedades básicas válidas
				if (!implementation.type || typeof implementation.render !== 'function') {
					console.error(`❌ Capa ${name} inválida: falta tipo o función render`, implementation);
					return false;
				}

				registerLayer(implementation);
				console.log(`✅ Capa registrada: ${name}`);
				return true;
			} catch (error) {
				console.error(`❌ Error al registrar capa ${name}:`, error);
				return false;
			}
		};

		// Registrar capas principales que sabemos que funcionan
		let successCount = 0;
		let failCount = 0;

		for (const [name, layer] of Object.entries(VERIFIED_LAYERS)) {
			if (safeRegister(layer, name)) {
				successCount++;
			} else {
				failCount++;
			}
		}

		// Registrar capas adicionales si se proporcionan
		if (additionalLayers) {
			for (const [name, layer] of Object.entries(additionalLayers)) {
				if (safeRegister(layer, name)) {
					successCount++;
				} else {
					failCount++;
				}
			}
		}

		console.log(`📊 Registro de capas completado: ${successCount} exitosas, ${failCount} fallidas`);

		// Función de limpieza al desmontar
		return () => {
			// También verificamos si existe clearLayers antes de llamarlo
			if (typeof clearLayers === 'function') {
				clearLayers();
				console.log('🧹 Limpiando registro de capas...');
			}
		};
	}, [registerLayer, clearLayers, additionalLayers]);

	// Este componente no renderiza nada
	return null;
}
