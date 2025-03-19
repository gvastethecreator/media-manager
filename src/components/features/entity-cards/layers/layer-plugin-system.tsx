'use client';

import type * as React from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
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
	config?: T;
	onConfigUpdate?: (config: Partial<T>) => void;
}

// Interfaz extendida para componentes que usan el sistema legacy
export interface LegacyLayerComponentProps {
	config: BaseLayerConfig;
	context: Record<string, unknown>;
}

// Componente con tipo para componentes legacy
type LegacyLayerComponent = {
	type: string;
	Component: React.ComponentType<LegacyLayerComponentProps>;
	defaultConfig: BaseLayerConfig;
	usesLegacyInterface?: boolean;
};

// Contexto para el sistema de capas
interface LayerPluginContextType {
	registerLayer: (layer: LayerComponent) => void;
	unregisterLayer: (layerType: string) => void;
	clearLayers: () => void;
	getLayer: (layerType: string) => LayerComponent | undefined;
	getLayers: () => LayerComponent[];
	getOrderedLayers: () => LayerComponent[];
}

const LayerPluginContext = createContext<LayerPluginContextType | undefined>(undefined);

export function LayerPluginProvider({ children }: { children: React.ReactNode }) {
	const [layers, setLayers] = useState<Record<string, LayerComponent>>({});

	// Registrar una nueva capa
	const registerLayer = useCallback((layer: LayerComponent) => {
		setLayers((prev) => {
			// Si la capa ya está registrada, no hacer nada
			if (prev[layer.type]) {
				return prev;
			}
			// Si no, añadirla
			return {
				...prev,
				[layer.type]: layer,
			};
		});
	}, []);

	// Eliminar una capa
	const unregisterLayer = useCallback((layerType: string) => {
		setLayers((prev) => {
			const newLayers = { ...prev };
			delete newLayers[layerType];
			return newLayers;
		});
	}, []);

	// Limpiar todas las capas
	const clearLayers = useCallback(() => {
		setLayers(prevLayers => {
			// Solo actualizar si realmente hay capas para limpiar
			if (Object.keys(prevLayers).length > 0) {
				return {};
			}
			// Si no hay capas, devolver el mismo objeto para evitar re-renderizados
			return prevLayers;
		});
	}, []);

	// Obtener una capa específica
	const getLayer = useCallback(
		(layerType: string) => {
			return layers[layerType];
		},
		[layers]
	);

	// Obtener todas las capas
	const getLayers = useCallback(() => {
		return Object.values(layers);
	}, [layers]);

	// Obtener capas ordenadas por índice
	const getOrderedLayers = useCallback(() => {
		return Object.values(layers).sort((a, b) => a.defaultConfig.layerIndex - b.defaultConfig.layerIndex);
	}, [layers]);

	const contextValue = useMemo(
		() => ({
			registerLayer,
			unregisterLayer,
			clearLayers,
			getLayer,
			getLayers,
			getOrderedLayers,
		}),
		[registerLayer, unregisterLayer, clearLayers, getLayer, getLayers, getOrderedLayers]
	);

	return <LayerPluginContext.Provider value={contextValue}>{children}</LayerPluginContext.Provider>;
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

	// Verificar que haya capas para renderizar
	if (!orderedLayers || orderedLayers.length === 0) {
		console.log('ℹ️ No hay capas disponibles para renderizar');
		return null;
	}

	// Antes de renderizar, filtrar las capas inválidas
	const validLayers = orderedLayers.filter(layer => {
		if (!layer) {
			console.warn('⚠️ Se encontró una capa indefinida');
			return false;
		}

		if (!layer.Component) {
			console.error(`❌ La capa ${layer?.type || 'desconocida'} no tiene un componente válido.`);
			return false;
		}

		return true;
	});

	return (
		<>
			{validLayers.map((layer) => {
				// Este punto ya debería ser seguro, pero añadimos una verificación adicional
				if (!layer || !layer.Component) {
					return null;
				}

				const LayerComp = layer.Component;
				const config = configs[layer.type] || layer.defaultConfig;

				if (!config.enabled) {
					return null;
				}

				// Agregar manejo de errores para cada capa individual
				try {
					// Verificar si el componente espera la interfaz antigua o nueva
					// Si el componente tiene una propiedad 'usesLegacyInterface', usar el contexto combinado
					if ((layer as { usesLegacyInterface?: boolean }).usesLegacyInterface) {
						// Primero convertimos a unknown y luego al tipo esperado
						const LegacyComp = (layer.Component as unknown) as React.ComponentType<LegacyLayerComponentProps>;
						return (
							<ErrorBoundary
								key={`layer-${layer.type}`}
								fallback={<div className="layer-error" data-error-layer={layer.type} />}
								onError={(error) => console.error(`Error en capa ${layer.type}:`, error)}
							>
								<LegacyComp
									key={`layer-${layer.type}`}
									config={config}
									context={combinedContext}
								/>
							</ErrorBoundary>
						);
					}

					// De lo contrario, usar la interfaz estándar
					return (
						<ErrorBoundary
							key={`layer-${layer.type}`}
							fallback={<div className="layer-error" data-error-layer={layer.type} />}
							onError={(error) => console.error(`Error en capa ${layer.type}:`, error)}
						>
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
						</ErrorBoundary>
					);
				} catch (err) {
					console.error(`Error renderizando capa ${layer.type}:`, err);
					return <div key={`layer-error-${layer.type}`} className="layer-error" data-error-layer={layer.type} />;
				}
			})}
		</>
	);
}
