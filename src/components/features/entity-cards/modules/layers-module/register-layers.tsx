'use client';

/**
 * 🧩 Componente unificado para registrar todas las capas disponibles
 *
 * Este componente registra automáticamente todas las capas disponibles en el sistema,
 * facilitando su uso en diferentes partes de la aplicación y asegurando
 * compatibilidad entre el sistema de plugins y el módulo de capas.
 */

import { useEffect } from 'react';
import { useLayerPlugin } from '../../layers/layer-plugin-system';
import type { LayerImplementation } from '../../layers/types';
import { adaptLayerImplementationToComponent } from './layer-adapter';

// Importar implementaciones de las capas individuales
import { animatedBorderLayerImplementation } from '../../layers/animated-border';
import { borderLayerImplementation } from '../../layers/border/border-layer-implementation';
import { chromaticAberrationLayerImplementation } from '../../layers/chromatic-aberration';
import { contentLayerImplementation } from '../../layers/content';
import { distortionLayerImplementation } from '../../layers/distortion';
import { filterLayerImplementation } from '../../layers/filters';
import { glowLayerImplementation } from '../../layers/glow/glow-layer-implementation';
import { holographicLayerImplementation } from '../../layers/holographic/holographic-layer-implementation';
import { imageLayerImplementation } from '../../layers/image';
import { metadataLayerImplementation } from '../../layers/metadata';
import { scanlinesLayerImplementation } from '../../layers/scanlines';
import { textureLayerImplementation } from '../../layers/textures';

// Mapa con todas las capas disponibles
const ALL_LAYERS: Record<string, LayerImplementation> = {
	border: borderLayerImplementation,
	content: contentLayerImplementation,
	glow: glowLayerImplementation,
	holographic: holographicLayerImplementation,
	image: imageLayerImplementation,
	metadata: metadataLayerImplementation,
	scanlines: scanlinesLayerImplementation,
	texture: textureLayerImplementation,
	'animated-border': animatedBorderLayerImplementation,
	'chromatic-aberration': chromaticAberrationLayerImplementation,
	'distortion': distortionLayerImplementation,
	'filter': filterLayerImplementation
};

// Función auxiliar para registrar de forma segura
function safeRegisterLayer(
	registerFn: (layer: LayerImplementation) => void,
	layer: LayerImplementation | undefined,
	layerName: string
) {
	if (!layer) {
		console.warn(`⚠️ Capa ${layerName} no disponible o indefinida`);
		return false;
	}

	// Verificar que la implementación tenga propiedades básicas válidas
	if (!layer.type || typeof layer.render !== 'function') {
		console.error(`❌ Capa ${layerName} inválida: falta tipo o función render`, layer);
		return false;
	}

	try {
		// Adaptar la implementación al formato de componente
		const adaptedLayer = adaptLayerImplementationToComponent(layer);

		// Verificar que la adaptación generó un componente válido
		if (!adaptedLayer || !adaptedLayer.Component) {
			console.error(`❌ Adaptación fallida para ${layerName}: no se generó un componente válido`);
			return false;
		}

		// Registrar la capa adaptada
		registerFn(adaptedLayer);
		console.log(`✅ Capa registrada: ${layerName}`);
		return true;
	} catch (error) {
		console.error(`❌ Error al registrar capa ${layerName}:`, error);
		return false;
	}
}

/**
 * Componente que registra todas las capas disponibles en el sistema
 */
export function RegisterAllLayers({ additionalLayers }: { additionalLayers?: Record<string, LayerImplementation> }) {
	// Acceder al contexto de plugins de capas
	const { registerLayer, clearLayers } = useLayerPlugin();

	// Registrar capas en el montaje del componente
	useEffect(() => {
		try {
			// Limpiar capas existentes para evitar duplicados
			if (typeof clearLayers === 'function') {
				clearLayers();
			} else {
				console.warn('⚠️ clearLayers no está disponible, omitiendo limpieza');
			}

			// Registrar todas las capas estándar disponibles
			for (const [name, layer] of Object.entries(ALL_LAYERS)) {
				safeRegisterLayer(registerLayer, layer, name);
			}

			// Registrar capas adicionales si se proporcionan
			if (additionalLayers) {
				for (const [name, layer] of Object.entries(additionalLayers)) {
					safeRegisterLayer(registerLayer, layer, name);
				}
			}

			console.log('✅ Todas las capas registradas correctamente');
		} catch (error) {
			console.error("Error general al registrar capas:", error);
		}

		// Limpiar al desmontar
		return () => {
			if (typeof clearLayers === 'function') {
				clearLayers();
			}
		};
	}, [registerLayer, clearLayers, additionalLayers]);

	// Este componente no renderiza nada, solo registra las capas
	return null;
}

/**
 * Mapeo de capas por tipo de entidad para mejor organización
 */
const ENTITY_TYPE_LAYERS: Record<string, string[]> = {
	image: ['border', 'content', 'glow', 'holographic', 'image', 'scanlines'],
	folder: ['border', 'content', 'glow', 'texture', 'metadata'],
	album: ['border', 'content', 'glow', 'image', 'metadata'],
	tag: ['border', 'content', 'glow'],
	collection: ['border', 'content', 'glow', 'texture', 'metadata'],
	character: ['border', 'content', 'glow', 'image', 'holographic'],
	place: ['border', 'content', 'glow', 'image', 'metadata'],
	concept: ['border', 'content', 'glow', 'texture'],
	default: ['border', 'content', 'glow', 'holographic', 'image', 'metadata', 'scanlines', 'texture']
};

/**
 * Componente que registra solo un subconjunto de capas según el tipo de entidad
 */
export function RegisterLayers({
	entityType,
	additionalLayers
}: {
	entityType?: string;
	additionalLayers?: Record<string, LayerImplementation>;
}) {
	// Acceder al contexto de plugins de capas
	const { registerLayer, clearLayers } = useLayerPlugin();

	// Registrar capas según el tipo de entidad
	useEffect(() => {
		try {
			// Limpiar capas existentes
			if (typeof clearLayers === 'function') {
				clearLayers();
			} else {
				console.warn('⚠️ clearLayers no está disponible, omitiendo limpieza');
			}

			// Determinar qué capas registrar
			const layersToRegister = entityType
				? ENTITY_TYPE_LAYERS[entityType] || ENTITY_TYPE_LAYERS.default
				: ENTITY_TYPE_LAYERS.default;

			// Registrar las capas seleccionadas
			for (const layerName of layersToRegister) {
				const layer = ALL_LAYERS[layerName];

				// Verificar si la capa existe y es compatible con este tipo de entidad
				if (layer) {
					const isCompatible = !layer.compatibleEntityTypes ||
						layer.compatibleEntityTypes.includes(entityType || 'default');

					if (isCompatible) {
						safeRegisterLayer(registerLayer, layer, layerName);
					}
				}
			}

			// Registrar capas adicionales si se proporcionan
			if (additionalLayers) {
				for (const [name, layer] of Object.entries(additionalLayers)) {
					safeRegisterLayer(registerLayer, layer, name);
				}
			}

			console.log(`✅ Capas para el tipo ${entityType || 'default'} registradas correctamente`);
		} catch (error) {
			console.error("Error general al registrar capas específicas:", error);
		}

		// Limpiar al desmontar
		return () => {
			if (typeof clearLayers === 'function') {
				clearLayers();
			}
		};
	}, [registerLayer, clearLayers, entityType, additionalLayers]);

	// Este componente no renderiza nada, solo registra las capas
	return null;
}

/**
 * Componente que registra capas con capacidad de personalización completa
 */
export function RegisterCustomLayers({
	layers,
	clearExisting = true
}: {
	layers: LayerImplementation[];
	clearExisting?: boolean;
}) {
	// Acceder al contexto de plugins de capas
	const { registerLayer, clearLayers } = useLayerPlugin();

	// Registrar capas personalizadas
	useEffect(() => {
		try {
			// Limpiar capas existentes si se solicita
			if (clearExisting && typeof clearLayers === 'function') {
				clearLayers();
			} else if (clearExisting) {
				console.warn('⚠️ clearLayers no está disponible, omitiendo limpieza');
			}

			// Registrar las capas proporcionadas
			for (const layer of layers) {
				if (layer?.type) {
					safeRegisterLayer(registerLayer, layer, layer.type);
				}
			}

			console.log(`✅ Capas personalizadas registradas correctamente (${layers.length})`);
		} catch (error) {
			console.error("Error al registrar capas personalizadas:", error);
		}

		// Limpiar al desmontar si se solicitó limpieza
		return () => {
			if (clearExisting && typeof clearLayers === 'function') {
				clearLayers();
			}
		};
	}, [registerLayer, clearLayers, layers, clearExisting]);

	// Este componente no renderiza nada, solo registra las capas
	return null;
}
