'use client';

import * as React from 'react';
import { useLayerPlugin } from './layer-plugin-system';
import type { LayerImplementation } from './types';

// Importaciones de capas verificadas
import { animatedBorderImplementation } from './animated-border';
import { contentLayerImplementation } from './content';
import { filterLayerImplementation } from './filters';
import { glowLayer } from './glow';
import { imageLayerImplementation } from './image';
import { metadataLayerImplementation } from './metadata';
import { patternImplementation } from './patterns';
import { scanlinesImplementation } from './scanlines';
import { textureImplementation } from './textures';

// Adaptador para convertir implementaciones antiguas a LayerImplementation
const adaptLayerImplementation = (implementation: any): LayerImplementation => {
	// Si ya tiene la propiedad render, asumimos que es una implementación correcta
	if (implementation.render) {
		return implementation;
	}

	// Si tiene Component, es una implementación antigua que usa el patrón LayerComponent
	if (implementation.Component) {
		return {
			type: implementation.type,
			name: implementation.name || implementation.type,
			description: implementation.description,
			defaultConfig: implementation.defaultConfig,
			render: implementation.Component,
			settings: implementation.SettingsComponent,
			serverActions: implementation.getServerActions?.(),
			icon: implementation.icon,
		};
	}

	// Si tiene component, es una implementación intermedia
	if (implementation.component) {
		return {
			...implementation,
			render: implementation.component,
		};
	}

	throw new Error(`Invalid layer implementation for type: ${implementation.type}`);
};

// Mapa con todas las capas disponibles y verificadas
const VERIFIED_LAYERS: Record<string, LayerImplementation> = {
	// Capas básicas
	'animated-border': adaptLayerImplementation(animatedBorderImplementation),
	'content': adaptLayerImplementation(contentLayerImplementation),
	'image': adaptLayerImplementation(imageLayerImplementation),
	'metadata': adaptLayerImplementation(metadataLayerImplementation),

	// Capas de efectos visuales
	'glow': adaptLayerImplementation(glowLayer),
	'scanlines': adaptLayerImplementation(scanlinesImplementation),
	'texture': adaptLayerImplementation(textureImplementation),
	'pattern': adaptLayerImplementation(patternImplementation),
	'filter': adaptLayerImplementation(filterLayerImplementation),
};

/**
 * 🔌 Registro de capas del sistema
 * @module RegisterLayers
 */
export function RegisterLayers(): null {
	const { registerLayer } = useLayerPlugin();

	React.useEffect(() => {
		// Registrar todas las capas verificadas
		Object.entries(VERIFIED_LAYERS).forEach(([type, implementation]) => {
			registerLayer({
				type,
				name: implementation.name,
				description: implementation.description,
				component: implementation.render,
				settings: implementation.settings,
				defaultConfig: implementation.defaultConfig,
				icon: implementation.icon,
			});
		});
	}, [registerLayer]);

	return null;
}
