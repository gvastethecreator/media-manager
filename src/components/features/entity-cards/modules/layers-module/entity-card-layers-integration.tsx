'use client';

/**
 * 🔄 Integración entre el sistema de capas y las tarjetas de entidad
 *
 * Este componente proporciona una integración optimizada entre el sistema de capas
 * y las tarjetas de entidad, permitiendo renderizar las capas de manera eficiente.
 */

import { cn } from '@/lib/utils';
import React, { memo, useCallback, useMemo } from 'react';
import { RegisterLayersV2ByEntityType } from '../../layers/register-layers-v2';
import { LayersProvider, adaptCardOptionsToLayersConfig, useLayers } from './use-layers';

// Importar tipos para reemplazar any
import type { LayerConfig, LayerImplementation } from '../../layers/types';

// Interfaz para las propiedades del componente
interface EntityCardLayersIntegrationProps {
	children: React.ReactNode;
	entityType: string;
	entityId?: string;
	cardOptions?: Record<string, unknown>;
	isHovered?: boolean;
	isActive?: boolean;
	isExploded?: boolean;
	mousePosition?: { x: number; y: number };
	className?: string;
}

// Interfaz para el renderizador de capas
interface LayerRendererProps extends Omit<EntityCardLayersIntegrationProps, 'cardOptions'> { }

// Interfaz para una capa a renderizar
interface LayerToRender {
	type: string;
	implementation: LayerImplementation;
	config: LayerConfig;
	zIndex?: number;
}

/**
 * Componente principal para integrar el sistema de capas con las tarjetas de entidad
 */
export function EntityCardLayersIntegration({
	children,
	entityType,
	entityId,
	cardOptions,
	isHovered = false,
	isActive = false,
	isExploded = false,
	mousePosition,
	className,
}: EntityCardLayersIntegrationProps) {
	// Convertir cardOptions a la configuración del sistema de capas
	const initialConfig = useMemo(() => {
		return adaptCardOptionsToLayersConfig(cardOptions);
	}, [cardOptions]);

	return (
		<LayersProvider initialConfig={initialConfig}>
			<RegisterLayersV2ByEntityType entityType={entityType} />
			<MemoizedLayerRenderer
				entityType={entityType}
				entityId={entityId}
				isHovered={isHovered}
				isActive={isActive}
				isExploded={isExploded}
				mousePosition={mousePosition}
				className={className}
			>
				{children}
			</MemoizedLayerRenderer>
		</LayersProvider>
	);
}

/**
 * Componente para renderizar las capas en el orden correcto
 */
function LayerRenderer({
	children,
	entityType,
	entityId,
	isHovered,
	isActive,
	isExploded,
	mousePosition,
	className,
}: LayerRendererProps) {
	// Acceder al sistema de capas
	const { config } = useLayers();

	// Obtener la configuración del sistema
	const {
		enabled: systemEnabled = true,
		layerOrder = [],
		enabledLayers = {}
	} = config.layerSystem;

	// Si el sistema no está habilitado, solo renderizar los hijos
	if (!systemEnabled) {
		return <>{children}</>;
	}

	// Función para renderizar una capa individual
	const renderLayer = useCallback((layer: LayerToRender) => {
		const { type, implementation, config } = layer;

		return (
			<React.Fragment key={`layer-${type}`}>
				{implementation.render({
					config,
					isHovered,
					isActive,
					isExploded,
					mousePosition,
					entityType,
					entityId,
					context: {
						layerType: type
					}
				})}
			</React.Fragment>
		);
	}, [isHovered, isActive, isExploded, mousePosition, entityType, entityId]);

	// Calcular las capas a renderizar usando useMemo
	const layersToRender = useMemo(() => {
		const result = layerOrder
			.filter(layerType => {
				const isEnabled = enabledLayers[layerType] !== false;
				const hasImplementation = config.layers[layerType] !== undefined;
				return isEnabled && hasImplementation;
			})
			.map(layerType => {
				const layerImpl = config.layers[layerType];
				const layerConfig = config.layerConfigs[layerType] || layerImpl.defaultConfig || {};

				if (layerConfig.enabled === false) {
					return null;
				}

				return {
					type: layerType,
					implementation: layerImpl,
					config: layerConfig,
					zIndex: layerConfig.layerIndex || 0
				};
			})
			.filter(Boolean) as LayerToRender[];

		return result.sort((a, b) => (a?.zIndex || 0) - (b?.zIndex || 0));
	}, [layerOrder, enabledLayers, config.layers, config.layerConfigs]);

	// Renderizar las capas en orden
	return (
		<div className={cn('relative w-full h-full', className)}>
			{/* Renderizar los hijos primero como base */}
			{children}

			{/* Renderizar cada capa en el orden correcto */}
			{layersToRender.map(layer => renderLayer(layer))}
		</div>
	);
}

// Función de comparación personalizada para el memo
const arePropsEqual = (prevProps: LayerRendererProps, nextProps: LayerRendererProps): boolean => {
	// Comparar propiedades básicas
	if (
		prevProps.entityType !== nextProps.entityType ||
		prevProps.entityId !== nextProps.entityId ||
		prevProps.isHovered !== nextProps.isHovered ||
		prevProps.isActive !== nextProps.isActive ||
		prevProps.isExploded !== nextProps.isExploded ||
		prevProps.className !== nextProps.className
	) {
		return false;
	}

	// Comparar posición del ratón (puede ser undefined)
	if (prevProps.mousePosition && nextProps.mousePosition) {
		if (
			prevProps.mousePosition.x !== nextProps.mousePosition.x ||
			prevProps.mousePosition.y !== nextProps.mousePosition.y
		) {
			return false;
		}
	} else if (prevProps.mousePosition !== nextProps.mousePosition) {
		return false;
	}

	// Comparar children (esta es una comparación superficial)
	if (prevProps.children !== nextProps.children) {
		return false;
	}

	return true;
};

// Versión memoizada del renderizador de capas
const MemoizedLayerRenderer = memo(LayerRenderer, arePropsEqual);

// Re-exportar componentes y hooks útiles
export { LayersProvider, useLayers };

