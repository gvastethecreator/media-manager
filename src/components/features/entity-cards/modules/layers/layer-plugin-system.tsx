'use client';

import type * as React from 'react';
import { createContext, useContext, useState } from 'react';
import type { LayerConfigResponse } from '../types/card-layer-types';

// Tipo base para la configuración de una capa
export interface BaseLayerConfig {
	enabled: boolean;
	layerIndex: number;
	[key: string]: unknown;
}

// Interfaz para el componente de capa
export interface LayerComponent<T extends BaseLayerConfig = BaseLayerConfig> {
	type: string;
	Component: React.ComponentType<LayerComponentProps<T>>;
	defaultConfig: T;
	SettingsComponent?: React.ComponentType<LayerSettingsProps<T>>;
	getServerActions?: () => {
		getConfig: (entityType: string, entityId?: string) => Promise<LayerConfigResponse<T>>;
		updateConfig: (entityType: string, config: T, entityId?: string) => Promise<LayerConfigResponse<T>>;
		deleteConfig: (entityType: string, entityId?: string) => Promise<LayerConfigResponse<unknown>>;
	};
}

// Props comunes para todos los componentes de capa
export interface LayerComponentProps<T extends BaseLayerConfig = BaseLayerConfig> {
	isExploded: boolean;
	isHovered: boolean;
	mousePosition: { x: number; y: number };
	activeLayer: string | null;
	getExplodeLayerTransform: (index: number) => React.CSSProperties;
	config: T;
	entityType: string;
	entityId?: string;
}

// Props para componentes de configuración
export interface LayerSettingsProps<T extends BaseLayerConfig = BaseLayerConfig> {
	entityType: string;
	entityId?: string;
	className?: string;
	onConfigUpdate?: (config: T) => void;
}

// Interfaz extendida para componentes que usan el sistema legacy
export interface LegacyLayerComponentProps {
	config: BaseLayerConfig;
	context: Record<string, unknown>;
}

// Contexto para el sistema de capas
interface LayerPluginContextType {
	registerLayer: (layer: LayerComponent) => void;
	unregisterLayer: (layerType: string) => void;
	getLayer: (layerType: string) => LayerComponent | undefined;
	getLayers: () => LayerComponent[];
	getOrderedLayers: () => LayerComponent[];
}

const LayerPluginContext = createContext<LayerPluginContextType | undefined>(undefined);

export function LayerPluginProvider({ children }: { children: React.ReactNode }) {
	const [layers, setLayers] = useState<Record<string, LayerComponent>>({});

	// Registrar una nueva capa
	const registerLayer = (layer: LayerComponent) => {
		setLayers((prev) => ({
			...prev,
			[layer.type]: layer,
		}));
	};

	// Eliminar una capa
	const unregisterLayer = (layerType: string) => {
		setLayers((prev) => {
			const newLayers = { ...prev };
			delete newLayers[layerType];
			return newLayers;
		});
	};

	// Obtener una capa específica
	const getLayer = (layerType: string) => {
		return layers[layerType];
	};

	// Obtener todas las capas
	const getLayers = () => {
		return Object.values(layers);
	};

	// Obtener capas ordenadas por índice
	const getOrderedLayers = () => {
		return Object.values(layers).sort((a, b) => a.defaultConfig.layerIndex - b.defaultConfig.layerIndex);
	};

	return (
		<LayerPluginContext.Provider
			value={{
				registerLayer,
				unregisterLayer,
				getLayer,
				getLayers,
				getOrderedLayers,
			}}
		>
			{children}
		</LayerPluginContext.Provider>
	);
}

// Hook para utilizar el contexto de capas
export function useLayerPlugin() {
	const context = useContext(LayerPluginContext);
	if (!context) {
		throw new Error('useLayerPlugin debe ser usado dentro de un LayerPluginProvider');
	}
	return context;
}

// Componente para renderizar todas las capas ordenadas
export function LayerRenderer({
	isExploded,
	isHovered,
	mousePosition,
	activeLayer,
	getExplodeLayerTransform,
	entityType,
	entityId,
	configs = {},
	context = {},
}: {
	isExploded: boolean;
	isHovered: boolean;
	mousePosition: { x: number; y: number };
	activeLayer: string | null;
	getExplodeLayerTransform: (index: number) => React.CSSProperties;
	entityType: string;
	entityId?: string;
	configs?: Record<string, BaseLayerConfig>;
	context?: Record<string, unknown>;
}) {
	const { getOrderedLayers } = useLayerPlugin();
	const orderedLayers = getOrderedLayers();

	// Combinar contexto con otras propiedades para compatibilidad con ambas implementaciones
	const combinedContext = {
		...context,
		isExploded,
		isHovered,
		mousePosition,
		activeLayer,
		entityType,
		entityId,
	};

	return (
		<>
			{orderedLayers.map((layer) => {
				const LayerComp = layer.Component;
				const config = configs[layer.type] || layer.defaultConfig;

				if (!config.enabled) {
					return null;
				}

				// Verificar si el componente espera la interfaz antigua o nueva
				// Si el componente tiene una propiedad 'usesLegacyInterface', usar el contexto combinado
				if ((layer as any).usesLegacyInterface) {
					// Usar type assertion para manejar componentes legacy
					return (
						<LayerComp
							key={`layer-${layer.type}`}
							config={config}
							context={combinedContext}
							{...({} as any)} // Hack para evitar errores de tipo
						/>
					);
				}

				// De lo contrario, usar la interfaz estándar
				return (
					<LayerComp
						key={`layer-${layer.type}`}
						isExploded={isExploded}
						isHovered={isHovered}
						mousePosition={mousePosition}
						activeLayer={activeLayer}
						getExplodeLayerTransform={getExplodeLayerTransform}
						config={config}
						entityType={entityType}
						entityId={entityId}
					/>
				);
			})}
		</>
	);
}
