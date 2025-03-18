'use client';

/**
 * 🌈 Registro de capas para el módulo de capas
 *
 * Este componente registra todas las capas disponibles en el sistema de plugins.
 * Incluye optimizaciones para carga diferida y configuración por tipo de entidad.
 */

import { useEffect, useMemo } from 'react';
import { useLayerPlugin } from '../../layers/layer-plugin-system';

// Importar todas las capas disponibles
import { animatedBorderLayer } from '../../layers/animated-border';
import { borderLayer } from '../../layers/border';
import { chromaticAberrationLayer } from '../../layers/chromatic-aberration';
import { filterLayer } from '../../layers/filters';
import { glitchLayer } from '../../layers/glitch';
import { glowLayer } from '../../layers/glow';
import { grainLayer } from '../../layers/grain';
import { holographicLayer } from '../../layers/holographic';
import { noiseTextureLayer } from '../../layers/noise-texture';
import { patternLayer } from '../../layers/patterns';
import { pixelateLayer } from '../../layers/pixelate';
import { scanlinesLayer } from '../../layers/scanlines';
import { shaderLayer } from '../../layers/shaders';
import { textureLayer } from '../../layers/textures';

// Definir capas por tipo de entidad
const ENTITY_TYPE_LAYERS = {
	// Capas para imágenes
	image: [
		'border',
		'glow',
		'grain',
		'holographic',
		'scanlines',
		'texture',
		'animatedBorder',
		'chromaticAberration',
		'glitch',
		'noiseTexture',
		'filter',
		'pattern',
		'pixelate',
		'shader',
	],
	// Capas para carpetas
	folder: ['border', 'glow', 'grain', 'texture', 'pattern'],
	// Capas para álbumes
	album: ['border', 'glow', 'grain', 'holographic', 'texture', 'animatedBorder', 'pattern'],
	// Capas para etiquetas
	tag: ['border', 'glow', 'grain', 'texture'],
	// Capas para otros tipos
	default: ['border', 'glow', 'texture'],
};

// Mapeo de capas a sus implementaciones
const LAYER_MAP = {
	border: borderLayer,
	glow: glowLayer,
	grain: grainLayer,
	holographic: holographicLayer,
	scanlines: scanlinesLayer,
	texture: textureLayer,
	animatedBorder: animatedBorderLayer,
	chromaticAberration: chromaticAberrationLayer,
	glitch: glitchLayer,
	noiseTexture: noiseTextureLayer,
	filter: filterLayer,
	pattern: patternLayer,
	pixelate: pixelateLayer,
	shader: shaderLayer,
};

interface RegisterLayersProps {
	entityType?: string;
	registerAll?: boolean;
}

/**
 * Componente que registra las capas disponibles en el sistema de plugins.
 * Puede registrar todas las capas o solo las específicas para un tipo de entidad.
 */
export function RegisterLayers({ entityType = 'default', registerAll = false }: RegisterLayersProps) {
	const { registerLayer } = useLayerPlugin();

	// Determinar qué capas registrar
	const layersToRegister = useMemo(() => {
		if (registerAll) {
			return Object.values(LAYER_MAP);
		}

		// Obtener lista de capas para el tipo de entidad
		const layerIds = ENTITY_TYPE_LAYERS[entityType as keyof typeof ENTITY_TYPE_LAYERS] || ENTITY_TYPE_LAYERS.default;

		// Mapear IDs a implementaciones de capa
		return layerIds.map((id) => LAYER_MAP[id as keyof typeof LAYER_MAP]).filter(Boolean);
	}, [entityType, registerAll]);

	// Registrar las capas
	useEffect(() => {
		// Registrar todas las capas seleccionadas
		for (const layer of layersToRegister) {
			if (layer) {
				registerLayer(layer);
			}
		}

		// No es necesaria una función de limpieza porque las capas deben estar
		// disponibles mientras la aplicación esté en ejecución
		// Sin embargo, podríamos implementar una limpieza si fuera necesario
	}, [registerLayer, layersToRegister]);

	// Este componente no renderiza nada
	return null;
}

/**
 * Componente que registra todas las capas disponibles
 */
export function RegisterAllLayers() {
	return <RegisterLayers registerAll={true} />;
}

/**
 * Componente que registra capas específicas para un tipo de entidad
 */
export function RegisterEntityTypeLayers({ entityType }: { entityType: string }) {
	return <RegisterLayers entityType={entityType} />;
}
