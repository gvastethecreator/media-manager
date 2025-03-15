'use client';

/**
 * @deprecated Este módulo está obsoleto. Usar el sistema de capas de @/components/features/entity-cards/layers/layer-plugin-system.tsx en su lugar.
 *
 * Este archivo se mantiene por compatibilidad con código existente, pero todas las implementaciones
 * deberían migrar al nuevo sistema de capas.
 */

import {
	BaseLayerConfig,
	LayerComponent as NewLayerComponent,
	LayerComponentProps,
	LayerPluginProvider as NewLayerPluginProvider,
	LayerRenderer as NewLayerRenderer,
	LayerSettingsProps,
	useLayerPlugin as useNewLayerPlugin
} from '../../layers/layer-plugin-system';
import React, { createContext, ReactNode, useContext, useMemo } from 'react';

// Tipo para el resultado del servidor
export interface ServerResult<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}

// Re-exportar la configuración base de capa
export { BaseLayerConfig };

// Componente de capa (versión antigua)
export interface LayerComponent {
	type: string;
	defaultConfig: BaseLayerConfig;
	component: React.ComponentType<any>;
	getServerActions?: () => {
		getConfig: (entityType: string, entityId?: string) => Promise<ServerResult<BaseLayerConfig>>;
		saveConfig?: (config: BaseLayerConfig, entityType: string, entityId?: string) => Promise<ServerResult>;
	};
}

// Adaptador para convertir componentes antiguos al nuevo formato
export function adaptLegacyLayer(legacyLayer: LayerComponent): NewLayerComponent {
	return {
		type: legacyLayer.type,
		Component: (props: LayerComponentProps) => {
			const LegacyComponent = legacyLayer.component;
			return <LegacyComponent config={props.config} context={{
				isExploded: props.isExploded,
				isHovered: props.isHovered,
				mousePosition: props.mousePosition,
				activeLayer: props.activeLayer,
				entityType: props.entityType,
				entityId: props.entityId
			}} />;
		},
		defaultConfig: legacyLayer.defaultConfig,
		getServerActions: legacyLayer.getServerActions ? () => {
			const actions = legacyLayer.getServerActions!();
			return {
				getConfig: actions.getConfig,
				updateConfig: async (entityType: string, config: BaseLayerConfig, entityId?: string) => {
					if (actions.saveConfig) {
						const result = await actions.saveConfig(config, entityType, entityId);
						return { success: result.success, data: config, error: result.error };
					}
					return { success: true, data: config };
				},
				deleteConfig: async () => ({ success: true })
			};
		} : undefined
	};
}

// Contexto para el sistema de plugins de capas (mantenido por compatibilidad)
interface LayerPluginContextType {
	registerLayer: (layer: LayerComponent) => void;
	unregisterLayer: (type: string) => void;
	getLayers: () => LayerComponent[];
	getLayer: (type: string) => LayerComponent | undefined;
}

// Crear el contexto
const LayerPluginContext = createContext<LayerPluginContextType | null>(null);

// Proveedor del sistema de plugins de capas que utiliza el nuevo sistema internamente
export function LayerPluginProvider({ children }: { children: ReactNode }) {
	// Almacenamiento local de capas para mantener la API antigua
	const [legacyLayers, setLegacyLayers] = React.useState<Map<string, LayerComponent>>(new Map());

	// Usar el nuevo sistema de plugins
	const newLayerPlugin = useNewLayerPlugin();

	// Funciones para gestionar capas
	const registerLayer = (layer: LayerComponent) => {
		// Registrar en el sistema local
		setLegacyLayers((prev) => {
			const newMap = new Map(prev);
			newMap.set(layer.type, layer);
			return newMap;
		});

		// Registrar en el nuevo sistema
		newLayerPlugin.registerLayer(adaptLegacyLayer(layer));
	};

	const unregisterLayer = (type: string) => {
		setLegacyLayers((prev) => {
			const newMap = new Map(prev);
			newMap.delete(type);
			return newMap;
		});

		// Desregistrar del nuevo sistema
		newLayerPlugin.unregisterLayer(type);
	};

	const getLayers = () => Array.from(legacyLayers.values());

	const getLayer = (type: string) => legacyLayers.get(type);

	// Valor del contexto
	const value = useMemo(
		() => ({
			registerLayer,
			unregisterLayer,
			getLayers,
			getLayer,
		}),
		[legacyLayers]
	);

	return <LayerPluginContext.Provider value={value}>{children}</LayerPluginContext.Provider>;
}

// Hook para usar el sistema de plugins de capas
export function useLayerPlugin() {
	console.warn(
		'[Deprecation Warning] useLayerPlugin está obsoleto. Usar useLayerPlugin de layers/layer-plugin-system.tsx en su lugar.'
	);

	const context = useContext(LayerPluginContext);
	if (!context) {
		throw new Error('useLayerPlugin debe usarse dentro de un LayerPluginProvider');
	}
	return context;
}

/**
 * @deprecated Este componente está obsoleto. Usar LayerRenderer de layers/layer-plugin-system.tsx en su lugar.
 * Componente para renderizar capas
 */
export function LayerRenderer({ layers, context }: { layers: LayerComponent[]; context: Record<string, unknown> }) {
	console.warn(
		'[Deprecation Warning] Este LayerRenderer está obsoleto. Usar LayerRenderer de layers/layer-plugin-system.tsx en su lugar.'
	);

	// Convertir las capas antiguas al nuevo formato
	const adaptedLayers = layers.map(adaptLegacyLayer);

	// Extraer propiedades del contexto para el nuevo renderer
	const {
		isExploded = false,
		isHovered = false,
		mousePosition = { x: 0, y: 0 },
		activeLayer = null,
		entityType = 'unknown',
		entityId,
	} = context;

	// Crear una función para transformar capas explotadas
	const getExplodeLayerTransform = (index: number) => ({
		transform: isExploded ? `translateY(${index * 20}px)` : 'none',
	});

	// Crear configuraciones para el nuevo renderer
	const configs = adaptedLayers.reduce((acc, layer) => {
		acc[layer.type] = layer.defaultConfig;
		return acc;
	}, {} as Record<string, BaseLayerConfig>);

	// Usar el nuevo renderer
	return (
		<NewLayerRenderer
			isExploded={isExploded as boolean}
			isHovered={isHovered as boolean}
			mousePosition={mousePosition as { x: number; y: number }}
			activeLayer={activeLayer as string | null}
			getExplodeLayerTransform={getExplodeLayerTransform}
			entityType={entityType as string}
			entityId={entityId as string | undefined}
			configs={configs}
			context={context}
		/>
	);
}
