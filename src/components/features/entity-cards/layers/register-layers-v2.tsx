'use client';

/**
 * 🧩 Componente para registrar todas las capas disponibles (Versión 2)
 *
 * Este componente registra todas las capas disponibles utilizando
 * el nuevo formato LayerImplementation.
 */

import { useEffect, useMemo } from 'react';
import { useLayers } from '../modules/layers-module/use-layers';

// Importar implementaciones de capas
import { borderLayerImplementation } from './border/border-layer-implementation';
import { glowLayerImplementation } from './glow/glow-layer-implementation';
import { scanlinesLayerImplementation } from './scanlines';
import { textureLayerImplementation } from './textures';

// Otras implementaciones de capas conforme se vayan creando
// import { holographicLayerImplementation } from './holographic';
// import { grainLayerImplementation } from './grain';

/**
 * Componente que registra todas las capas disponibles usando la nueva interfaz
 */
export function RegisterLayersV2() {
	// Acceder al contexto del sistema de capas
	const { registerLayer, unregisterAllLayers } = useLayers();

	// Registrar capas en el montaje del componente
	useEffect(() => {
		// Primero limpiar cualquier capa existente
		unregisterAllLayers();

		// Registrar todas las implementaciones de capas disponibles
		registerLayer(borderLayerImplementation);
		registerLayer(glowLayerImplementation);
		registerLayer(textureLayerImplementation);
		registerLayer(scanlinesLayerImplementation);

		// Añadir más capas a medida que se implementen
		// registerLayer(holographicLayerImplementation);
		// registerLayer(grainLayerImplementation);

		// Limpiar al desmontar
		return () => {
			unregisterAllLayers();
		};
	}, [registerLayer, unregisterAllLayers]);

	// Este componente no renderiza nada, solo registra las capas
	return null;
}

/**
 * Componente que registra capas específicas según el tipo de entidad
 */
export function RegisterLayersV2ByEntityType({ entityType }: { entityType: string }) {
	// Acceder al contexto del sistema de capas
	const { registerLayer, unregisterAllLayers } = useLayers();

	// Mapa de capas compatibles con cada tipo de entidad
	const entityTypeToLayers = useMemo(() => ({
		image: [
			borderLayerImplementation,
			glowLayerImplementation,
			textureLayerImplementation,
			scanlinesLayerImplementation
		],
		folder: [
			borderLayerImplementation,
			glowLayerImplementation,
			textureLayerImplementation
		],
		album: [
			borderLayerImplementation,
			glowLayerImplementation,
			textureLayerImplementation
		],
		tag: [
			borderLayerImplementation,
			glowLayerImplementation
		],
		collection: [
			borderLayerImplementation,
			glowLayerImplementation,
			textureLayerImplementation
		],
		// Añadir más tipos según sea necesario
	}), []);

	// Registrar capas según el tipo de entidad
	useEffect(() => {
		// Primero limpiar cualquier capa existente
		unregisterAllLayers();

		// Obtener capas específicas para este tipo de entidad
		const layersToRegister = entityTypeToLayers[entityType as keyof typeof entityTypeToLayers] || [];

		// Registrar solo las capas compatibles
		for (const layer of layersToRegister) {
			// Verificar si la capa es compatible con este tipo de entidad
			const isCompatible = !layer.compatibleEntityTypes ||
				layer.compatibleEntityTypes.includes(entityType);

			if (isCompatible) {
				registerLayer(layer);
			}
		}

		// Limpiar al desmontar
		return () => {
			unregisterAllLayers();
		};
	}, [registerLayer, unregisterAllLayers, entityType, entityTypeToLayers]);

	// Este componente no renderiza nada, solo registra las capas
	return null;
}