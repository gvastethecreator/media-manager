'use client';

import React, { createContext, ReactNode, useContext, useMemo } from 'react';

// Configuración básica de capa
export interface BaseLayerConfig {
	enabled: boolean;
	layerIndex: number;
	[key: string]: unknown;
}

// Tipo para el resultado del servidor
export interface ServerResult<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}

// Componente de capa
export interface LayerComponent {
	type: string;
	defaultConfig: BaseLayerConfig;
	component: React.ComponentType<any>;
	getServerActions?: () => {
		getConfig: (entityType: string, entityId?: string) => Promise<ServerResult<BaseLayerConfig>>;
		saveConfig?: (config: BaseLayerConfig, entityType: string, entityId?: string) => Promise<ServerResult>;
	};
}

// Contexto para el sistema de plugins de capas
interface LayerPluginContextType {
	registerLayer: (layer: LayerComponent) => void;
	unregisterLayer: (type: string) => void;
	getLayers: () => LayerComponent[];
	getLayer: (type: string) => LayerComponent | undefined;
}

// Crear el contexto
const LayerPluginContext = createContext<LayerPluginContextType | null>(null);

// Proveedor del sistema de plugins de capas
export function LayerPluginProvider({ children }: { children: ReactNode }) {
	// Almacenamiento de capas registradas
	const [layers, setLayers] = React.useState<Map<string, LayerComponent>>(new Map());

	// Funciones para gestionar capas
	const registerLayer = (layer: LayerComponent) => {
		setLayers((prev) => {
			const newMap = new Map(prev);
			newMap.set(layer.type, layer);
			return newMap;
		});
	};

	const unregisterLayer = (type: string) => {
		setLayers((prev) => {
			const newMap = new Map(prev);
			newMap.delete(type);
			return newMap;
		});
	};

	const getLayers = () => Array.from(layers.values());

	const getLayer = (type: string) => layers.get(type);

	// Valor del contexto
	const value = useMemo(
		() => ({
			registerLayer,
			unregisterLayer,
			getLayers,
			getLayer,
		}),
		[layers]
	);

	return <LayerPluginContext.Provider value={value}>{children}</LayerPluginContext.Provider>;
}

// Hook para usar el sistema de plugins de capas
export function useLayerPlugin() {
	const context = useContext(LayerPluginContext);
	if (!context) {
		throw new Error('useLayerPlugin debe usarse dentro de un LayerPluginProvider');
	}
	return context;
}

// Componente para renderizar capas
export function LayerRenderer({ layers, context }: { layers: LayerComponent[]; context: Record<string, unknown> }) {
	// Ordenar las capas por su índice
	const sortedLayers = [...layers].sort((a, b) => {
		const indexA = a.defaultConfig.layerIndex || 0;
		const indexB = b.defaultConfig.layerIndex || 0;
		return indexA - indexB;
	});

	return (
		<>
			{sortedLayers.map((layer) => {
				const LayerComp = layer.component;
				return <LayerComp key={layer.type} config={layer.defaultConfig} context={context} />;
			})}
		</>
	);
}
