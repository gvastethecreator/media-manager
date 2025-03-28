/**
 * 🔌 Sistema de plugins para capas visuales
 * @module LayerPluginSystem
 */

'use client';

import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { BaseLayerConfig } from './layer-config-base';

interface LayerRegistration<T extends BaseLayerConfig = BaseLayerConfig> {
	type: string;
	name: string;
	description?: string;
	component: React.ComponentType<any>;
	settings?: React.ComponentType<{
		config: T;
		onConfigChange: (config: Partial<T>) => void;
	}>;
	defaultConfig: T;
	icon?: string;
}

interface LayerPluginContextType {
	layers: Map<string, LayerRegistration>;
	registerLayer: (layer: LayerRegistration) => void;
	unregisterLayer: (type: string) => void;
	getLayer: (type: string) => LayerRegistration | undefined;
	activeLayer: string | null;
	setActiveLayer: (type: string | null) => void;
	getLayers: () => LayerRegistration[];
	getOrderedLayers: (order?: string[]) => LayerRegistration[];
}

const LayerPluginContext = React.createContext<LayerPluginContextType | null>(null);

/**
 * 🎨 Proveedor del sistema de plugins de capas
 */
export function LayerPluginProvider({
	children,
}: {
	children: React.ReactNode;
}): React.ReactElement {
	// Estado para almacenar las capas registradas
	const [layers, setLayers] = React.useState<Map<string, LayerRegistration>>(new Map());

	// Estado para la capa activa
	const [activeLayer, setActiveLayer] = React.useState<string | null>(null);

	// Función para registrar una nueva capa
	const registerLayer = React.useCallback((layer: LayerRegistration) => {
		setLayers((current) => {
			const newLayers = new Map(current);
			newLayers.set(layer.type, layer);
			return newLayers;
		});
		console.log(`✅ Capa registrada: ${layer.name} (${layer.type})`);
	}, []);

	// Función para eliminar una capa
	const unregisterLayer = React.useCallback((type: string) => {
		setLayers((current) => {
			const newLayers = new Map(current);
			newLayers.delete(type);
			return newLayers;
		});
		console.log(`🗑️ Capa eliminada: ${type}`);
	}, []);

	// Función para obtener una capa
	const getLayer = React.useCallback(
		(type: string) => {
			return layers.get(type);
		},
		[layers]
	);

	// Función para obtener todas las capas
	const getLayers = React.useCallback(() => {
		return Array.from(layers.values());
	}, [layers]);

	// Función para obtener capas ordenadas
	const getOrderedLayers = React.useCallback(
		(order?: string[]) => {
			const allLayers = Array.from(layers.values());
			if (!order || order.length === 0) return allLayers;

			const orderedLayers: LayerRegistration[] = [];
			// Primero agregamos las capas en el orden especificado
			order.forEach((type) => {
				const layer = layers.get(type);
				if (layer) orderedLayers.push(layer);
			});

			// Luego agregamos las capas restantes que no estaban en el orden
			allLayers.forEach((layer) => {
				if (!order.includes(layer.type)) {
					orderedLayers.push(layer);
				}
			});

			return orderedLayers;
		},
		[layers]
	);

	// Crear el valor del contexto
	const contextValue = React.useMemo(
		() => ({
			layers,
			registerLayer,
			unregisterLayer,
			getLayer,
			activeLayer,
			setActiveLayer,
			getLayers,
			getOrderedLayers,
		}),
		[layers, registerLayer, unregisterLayer, getLayer, activeLayer, setActiveLayer, getLayers, getOrderedLayers]
	);

	return <LayerPluginContext.Provider value={contextValue}>{children}</LayerPluginContext.Provider>;
}

/**
 * 🔌 Hook para usar el sistema de plugins de capas
 */
export function useLayerPlugin(): LayerPluginContextType {
	const context = React.useContext(LayerPluginContext);
	if (!context) {
		throw new Error('useLayerPlugin debe ser usado dentro de un LayerPluginProvider');
	}
	return context;
}

/**
 * 🎨 Componente para renderizar una capa
 */
export function SingleLayerRenderer<T extends BaseLayerConfig>({
	type,
	config,
	...props
}: {
	type: string;
	config: T;
} & Omit<React.ComponentProps<any>, 'config'>): React.ReactElement | null {
	const { getLayer } = useLayerPlugin();
	const layer = getLayer(type);

	if (!layer) {
		console.warn(`⚠️ Capa no encontrada: ${type}`);
		return null;
	}

	const { component: Component, defaultConfig } = layer;

	return <Component {...props} config={config} defaultConfig={defaultConfig} />;
}

/**
 * 🎛️ Componente para renderizar la configuración de una capa
 */
export function LayerSettings<T extends BaseLayerConfig>({
	type,
	config,
	onConfigChange,
}: {
	type: string;
	config: T;
	onConfigChange: (config: Partial<T>) => void;
}): React.ReactElement | null {
	const { getLayer } = useLayerPlugin();
	const layer = getLayer(type);

	if (!layer || !layer.settings) {
		return null;
	}

	const Settings = layer.settings;

	return <Settings config={config} onConfigChange={onConfigChange as (config: Partial<BaseLayerConfig>) => void} />;
}

/**
 * 📋 Componente para listar las capas disponibles
 */
export function LayerList({
	onSelect,
	selectedType,
}: {
	onSelect: (type: string) => void;
	selectedType?: string;
}): React.ReactElement {
	const { layers } = useLayerPlugin();

	return (
		<div className="space-y-2">
			{Array.from(layers.values()).map((layer) => (
				<button
					key={layer.type}
					onClick={() => onSelect(layer.type)}
					className={`flex items-center gap-2 p-2 w-full rounded ${
						selectedType === layer.type ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
					}`}
				>
					{layer.icon && <span>{layer.icon}</span>}
					<span>{layer.name}</span>
				</button>
			))}
		</div>
	);
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
	const { getLayer } = useLayerPlugin();
	const layer = getLayer(entityType);

	if (!layer) {
		console.warn(`⚠️ Capa no encontrada: ${entityType}`);
		return null;
	}

	const { component: Component, defaultConfig } = layer;

	return (
		<ErrorBoundary
			fallback={<div className="layer-error" data-error-layer={entityType} />}
			onError={(error) => console.error(`Error en capa ${entityType}:`, error)}
		>
			<Component
				isExploded={isExploded}
				isHovered={isHovered}
				mousePosition={mousePosition}
				activeLayer={activeLayer}
				getExplodeLayerTransform={getExplodeLayerTransform}
				config={configs[entityType] || defaultConfig}
				entityType={entityType}
				entityId={entityId}
			/>
		</ErrorBoundary>
	);
}
