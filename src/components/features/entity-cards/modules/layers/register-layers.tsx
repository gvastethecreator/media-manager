'use client';

import * as React from 'react';
import { useLayerPlugin } from './layer-plugin-system';
import type { LayerImplementation } from './types';

// Importaciones de capas verificadas
import { animatedBorderImplementation } from './animated-border';
// Comentar importaciones que causan errores hasta que los módulos estén disponibles
// import { contentLayerImplementation } from './content';
import { default as glowLayer } from './glow';
import { gridImplementation } from './grid/grid-implementation';
import { imageLayerImplementation } from './image';
// import { metadataLayerImplementation } from './metadata';
import { patternImplementation } from './patterns';
import { scanlinesImplementation } from './scanlines';
import { textureImplementation } from './textures';
import { borderImplementation } from './border';
import { blurImplementation } from './blur/blur-implementation';

// Definición simple de filtro para evitar error de importación
const filterImplementation = {
	type: 'filter',
	name: 'Filtros',
	description: 'Aplicar filtros visuales a la tarjeta',
	defaultConfig: {
		enabled: false,
		layerIndex: 3,
	},
	render: () => null,
	settings: () => null,
};

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
			icon: implementation.icon as string,
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
	border: adaptLayerImplementation(borderImplementation),
	blur: adaptLayerImplementation(blurImplementation),
	grid: adaptLayerImplementation(gridImplementation),

	// Capas de efectos visuales
	glow: adaptLayerImplementation(glowLayer),
	scanlines: adaptLayerImplementation(scanlinesImplementation),
	texture: adaptLayerImplementation(textureImplementation),
	pattern: adaptLayerImplementation(patternImplementation),
	filter: adaptLayerImplementation(filterImplementation),
};

/**
 * 🔌 Registro de capas del sistema
 * @module RegisterLayers
 */
export function RegisterLayers(): React.ReactElement | null {
	const { registerLayer } = useLayerPlugin();

	React.useEffect(() => {
		// Registrar todas las capas verificadas
		Object.entries(VERIFIED_LAYERS).forEach(([type, implementation]) => {
			// Crear un objeto sin settings si es undefined para evitar errores de tipo
			const layerToRegister = {
				type,
				name: implementation.name,
				description: implementation.description,
				component: implementation.render,
				defaultConfig: implementation.defaultConfig,
				icon: implementation.icon as string,
			};

			// Solo añadir settings si existe
			if (implementation.settings) {
				registerLayer({
					...layerToRegister,
					settings: implementation.settings as any,
				});
			} else {
				registerLayer(layerToRegister);
			}
		});
	}, [registerLayer]);

	return null;
}
