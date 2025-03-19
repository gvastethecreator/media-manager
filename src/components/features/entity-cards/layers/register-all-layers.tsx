'use client';

/**
 * 🔄 Sistema unificado para registrar todas las capas disponibles
 *
 * Este componente centraliza el registro de todas las capas implementadas,
 * simplificando la integración con los componentes que utilizan el sistema de capas.
 * Soporta registro general o filtrado por tipo de entidad.
 */

import { useEffect, useMemo } from 'react';
import { useLayerPlugin } from './layer-plugin-system';

// Importar todas las implementaciones de capas
import { animatedBorderLayerImplementation } from './animated-border';
import { borderLayerImplementation } from './border/border-layer-implementation';
import { chromaticAberrationLayerImplementation } from './chromatic-aberration';
import { contentLayerImplementation } from './content';
import { distortionLayerImplementation } from './distortion';
import { filterLayerImplementation } from './filters';
import { glitchLayer } from './glitch';
import { glowLayerImplementation } from './glow/glow-layer-implementation';
import { grainLayer } from './grain';
import { holographicLayer } from './holographic';
import { imageLayerImplementation } from './image';
import { metadataLayerImplementation } from './metadata';
import { noiseTextureLayer } from './noise-texture';
import { patternLayer } from './patterns';
import { pixelateLayer } from './pixelate';
import { scanlinesLayerImplementation } from './scanlines';
import { shaderLayer } from './shaders';
import { textureLayerImplementation } from './textures';

/**
 * Mapeo de capas específicas por tipo de entidad
 */
const ENTITY_TYPE_LAYERS = {
	image: [
		borderLayerImplementation,
		glowLayerImplementation,
		textureLayerImplementation,
		scanlinesLayerImplementation,
		chromaticAberrationLayerImplementation,
		imageLayerImplementation,
		contentLayerImplementation
	],
	folder: [
		borderLayerImplementation,
		glowLayerImplementation,
		textureLayerImplementation,
		chromaticAberrationLayerImplementation,
		contentLayerImplementation,
		metadataLayerImplementation
	],
	album: [
		borderLayerImplementation,
		glowLayerImplementation,
		textureLayerImplementation,
		chromaticAberrationLayerImplementation,
		contentLayerImplementation,
		imageLayerImplementation
	],
	tag: [
		borderLayerImplementation,
		glowLayerImplementation,
		chromaticAberrationLayerImplementation,
		contentLayerImplementation
	],
	collection: [
		borderLayerImplementation,
		glowLayerImplementation,
		textureLayerImplementation,
		chromaticAberrationLayerImplementation,
		contentLayerImplementation,
		metadataLayerImplementation
	],
	// Añadir más tipos según sea necesario
};

/**
 * Adaptador para convertir implementaciones con 'render' al formato con 'Component'
 * que espera el sistema de plugins de capas
 */
function adaptLayerImplementation(implementation: any) {
	// Validar que la implementación existe
	if (!implementation) {
		console.error('❌ Se intentó adaptar una implementación de capa undefined o null');
		return null;
	}

	// Verificar las propiedades obligatorias
	if (!implementation.type) {
		console.error('❌ La implementación de capa no tiene un tipo definido:', implementation);
		return implementation; // Dejar que falle en la validación del sistema
	}

	if (!implementation.defaultConfig) {
		console.warn(`⚠️ La capa ${implementation.type} no tiene configuración por defecto`);
		// Añadir una configuración mínima
		implementation.defaultConfig = {
			enabled: true,
			layerIndex: 0
		};
	}

	// Si ya tiene Component, devolver tal cual
	if (implementation.Component) {
		return implementation;
	}

	// Si tiene render pero no Component, crear un adaptador
	if (implementation.render && typeof implementation.render === 'function') {
		console.log(`ℹ️ Adaptando capa ${implementation.type} de formato render a Component`);
		return {
			...implementation,
			Component: (props: any) => implementation.render(props),
			// Asegurarnos de que el resto de propiedades se mantienen
			type: implementation.type,
			defaultConfig: implementation.defaultConfig
		};
	}

	// Si no tiene ni Component ni render válidos, mostrar error
	console.error(`❌ La capa ${implementation.type} no tiene ni Component ni render válidos`);

	// Si no tiene ni Component ni render, devolver tal cual (fallará la validación)
	return implementation;
}

/**
 * Componente que registra automáticamente todas las capas disponibles
 */
export function RegisterAllLayers() {
	const { registerLayer, clearLayers } = useLayerPlugin();

	useEffect(() => {
		// Limpiar capas existentes
		clearLayers();

		// Registrar capas con la nueva implementación (LayerImplementation)
		// adaptando al formato que espera el sistema de plugins
		registerLayer(adaptLayerImplementation(animatedBorderLayerImplementation));
		registerLayer(adaptLayerImplementation(borderLayerImplementation));
		registerLayer(adaptLayerImplementation(chromaticAberrationLayerImplementation));
		registerLayer(adaptLayerImplementation(contentLayerImplementation));
		registerLayer(adaptLayerImplementation(distortionLayerImplementation));
		registerLayer(adaptLayerImplementation(glowLayerImplementation));
		registerLayer(adaptLayerImplementation(imageLayerImplementation));
		registerLayer(adaptLayerImplementation(metadataLayerImplementation));
		registerLayer(adaptLayerImplementation(scanlinesLayerImplementation));
		registerLayer(adaptLayerImplementation(textureLayerImplementation));

		// Registrar capas con la implementación legacy
		registerLayer({
			type: 'filter',
			Component: filterLayerImplementation.Component,
			defaultConfig: filterLayerImplementation.defaultConfig,
		});

		registerLayer({
			type: 'glitch',
			Component: glitchLayer.Component,
			defaultConfig: glitchLayer.defaultConfig,
		});

		registerLayer({
			type: 'grain',
			Component: grainLayer.Component,
			defaultConfig: grainLayer.defaultConfig,
		});

		registerLayer({
			type: 'holographic',
			Component: holographicLayer.Component,
			defaultConfig: holographicLayer.defaultConfig,
		});

		registerLayer({
			type: 'noise-texture',
			Component: noiseTextureLayer.Component,
			defaultConfig: noiseTextureLayer.defaultConfig,
		});

		registerLayer({
			type: 'pattern',
			Component: patternLayer.Component,
			defaultConfig: patternLayer.defaultConfig,
		});

		registerLayer({
			type: 'pixelate',
			Component: pixelateLayer.Component,
			defaultConfig: pixelateLayer.defaultConfig,
		});

		registerLayer({
			type: 'shader',
			Component: shaderLayer.Component,
			defaultConfig: shaderLayer.defaultConfig,
		});

		// Limpiar al desmontar
		return () => {
			clearLayers();
		};
	}, [registerLayer, clearLayers]);

	// Este componente no renderiza nada
	return null;
}

/**
 * Componente que registra capas específicas según el tipo de entidad
 * Reemplaza a RegisterLayersV2ByEntityType con funcionalidad mejorada
 */
export function RegisterLayersByEntityType({ entityType }: { entityType: string }) {
	const { registerLayer, clearLayers } = useLayerPlugin();

	// Mapa de capas compatibles con cada tipo de entidad
	const entityTypeToLayers = useMemo(() => ENTITY_TYPE_LAYERS, []);

	// Registrar capas según el tipo de entidad
	useEffect(() => {
		// Primero limpiar cualquier capa existente
		clearLayers();

		// Obtener capas específicas para este tipo de entidad
		const layersToRegister = entityTypeToLayers[entityType as keyof typeof entityTypeToLayers] || [];

		// Registrar solo las capas compatibles
		for (const layer of layersToRegister) {
			// Verificar si la capa es compatible con este tipo de entidad
			const isCompatible = !layer.compatibleEntityTypes ||
				layer.compatibleEntityTypes.includes(entityType);

			if (isCompatible) {
				registerLayer(adaptLayerImplementation(layer));
			}
		}

		// Limpiar al desmontar
		return () => {
			clearLayers();
		};
	}, [registerLayer, clearLayers, entityType, entityTypeToLayers]);

	// Este componente no renderiza nada
	return null;
}