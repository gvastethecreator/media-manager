'use client';

/**
 * 🧩 Integración de capas para tarjetas de entidad
 *
 * Este componente integra el sistema de capas con las tarjetas de entidad,
 * permitiendo configurar y renderizar capas específicas para cada tipo de entidad.
 */

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { Fragment, memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { EntityType } from '../../adapters/preset-adapter';
import { LayerPluginProvider } from '../../layers/layer-plugin-system';
import type { CardOptions } from '../../types/card-settings-types';
import {
	adaptEntityCardConfigToLayersModuleConfig,
	adaptEntityCardToLayerSystem,
	type EntityCardLayerSystemConfig
} from './entity-card-layer-adapter';
import { RegisterLayers } from './register-layers';
import { LayersProvider, useLayers } from './use-layers';

// Interfaz para la configuración específica por tipo de entidad
interface EntityTypeLayerConfig {
	layerSystem?: Record<string, unknown>;
	layerConfigs?: Record<string, unknown>;
}

// Hook mejorado para obtener la configuración específica por tipo de entidad
function useEntityTypeLayers(entityType: string, entityId?: string) {
	// Este hook podría extenderse para cargar configuraciones desde la API
	// Por ahora devuelve un estado simulado
	return useMemo(() => ({
		config: null as EntityTypeLayerConfig | null,
		isLoading: false
	}), []); // No necesitamos las dependencias pues son valores de retorno constantes
}

export interface EntityCardLayerIntegrationProps {
	title: string;
	description?: string;
	onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
	showVisualConfig?: boolean;
	onVisualConfigClick?: () => void;
	cardOptions?: Partial<CardOptions>;
	entityType: EntityType;
	entityId?: string;
	enableExplode?: boolean;
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
	className?: string;
	children?: React.ReactNode;
	onCardOptionsChange?: (options: Partial<CardOptions>) => void;
	interactive?: boolean;
	enableEffects?: boolean;
}

/**
 * Componente optimizado para la integración de capas en EntityCard
 */
export const EntityCardLayerIntegration = memo(function EntityCardLayerIntegration({
	title,
	description,
	onClick,
	showVisualConfig = false,
	onVisualConfigClick,
	cardOptions = {},
	entityType,
	entityId,
	enableExplode = false,
	isExploded = false,
	activeLayer = null,
	onExplodedChange,
	onActiveLayerChange,
	className,
	children,
	onCardOptionsChange,
	interactive = true,
	enableEffects = true,
}: EntityCardLayerIntegrationProps) {
	// Estado para el hover y posición del ratón
	const [isHovered, setIsHovered] = useState(false);
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

	// Convertir opciones de tarjeta a configuración de capas
	const entityLayerConfig = useMemo((): EntityCardLayerSystemConfig => {
		return adaptEntityCardToLayerSystem(cardOptions);
	}, [cardOptions]);

	// Convertir la configuración de EntityCard a LayersModuleConfig
	const layersModuleConfig = useMemo(() => {
		return adaptEntityCardConfigToLayersModuleConfig(entityLayerConfig);
	}, [entityLayerConfig]);

	// Manejar movimiento del ratón para efectos 3D
	const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width;
		const y = (e.clientY - rect.top) / rect.height;
		setMousePosition({ x, y });
	}, []);

	// Función para calcular transformaciones en modo explosión
	const getExplodeLayerTransform = useCallback((index: number): React.CSSProperties => {
		const baseDistance = 30; // Distancia base entre capas
		const angle = 5; // Ángulo de rotación
		const translateZ = index * baseDistance;
		const translateX = index * 5;
		const translateY = index * 5;
		const rotateX = index % 2 === 0 ? angle : -angle;
		const rotateY = index % 2 === 0 ? -angle : angle;

		return {
			transform: `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
			zIndex: 100 - index,
		};
	}, []);

	// Estado para controlar si el sistema está activo
	const [isActive, setIsActive] = useState(enableEffects);

	// Obtener configuración específica para este tipo de entidad
	const { config: entityTypeConfig, isLoading } = useEntityTypeLayers(entityType, entityId);

	// Fusionar la configuración específica del tipo con la configuración base
	const finalConfig = useMemo(() => {
		if (isLoading) {
			return layersModuleConfig;
		}

		return {
			...layersModuleConfig,
			layerSystem: {
				...layersModuleConfig.layerSystem,
				...(entityTypeConfig?.layerSystem || {}),
			},
			layerConfigs: {
				...layersModuleConfig.layerConfigs,
				...(entityTypeConfig?.layerConfigs || {}),
			},
		};
	}, [layersModuleConfig, entityTypeConfig, isLoading]);

	// Actualizar el estado activo cuando cambian las props
	useEffect(() => {
		setIsActive(enableEffects);
	}, [enableEffects]);

	// Manejar cambios en la configuración
	const handleConfigChange = useCallback((newConfig: typeof finalConfig) => {
		if (onCardOptionsChange) {
			// Convertir de vuelta al formato de CardOptions
			onCardOptionsChange({
				visualOptions: {
					layerSystem: newConfig.layerSystem,
					layerConfigs: newConfig.layerConfigs,
				},
			});
		}
	}, [onCardOptionsChange]);

	// Si las capas no están activas, mostrar solo el contenido sin capas
	if (!isActive || isLoading) {
		return <div className="card-layer-wrapper relative w-full h-full">{children}</div>;
	}

	return (
		<motion.div
			className={cn('card-layer-wrapper relative w-full h-full', className)}
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onMouseMove={handleMouseMove}
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.2 }}
		>
			<LayerPluginProvider>
				<RegisterLayers entityType={entityType} />
				<LayersProvider initialConfig={finalConfig}>
					<div className="entity-card-layers-root relative">
						{/* Renderizar el contenido principal */}
						<div className="entity-card-content-wrapper">
							{children}
						</div>

						{/* Propagar contextos necesarios para capas individuales */}
						{finalConfig.layerSystem.enabled && interactive && (
							<Fragment>
								<LayerRenderer
									isExploded={isExploded}
									isHovered={isHovered}
									mousePosition={mousePosition}
									activeLayer={activeLayer}
									getExplodeLayerTransform={getExplodeLayerTransform}
									entityType={entityType}
									entityId={entityId}
									context={{
										title,
										description,
										showVisualConfig,
										onVisualConfigClick,
										visualOptions: cardOptions.visualOptions || {},
										enableExplode,
										onExplodedChange,
										onActiveLayerChange,
									}}
								/>
							</Fragment>
						)}
					</div>
				</LayersProvider>
			</LayerPluginProvider>
		</motion.div>
	);
});

/**
 * Componente para renderizar las capas registradas
 */
const LayerRenderer = memo(function LayerRenderer({
	isExploded,
	isHovered,
	mousePosition,
	activeLayer,
	getExplodeLayerTransform,
	entityType,
	entityId,
	context,
}: {
	isExploded: boolean;
	isHovered: boolean;
	mousePosition: { x: number; y: number };
	activeLayer: string | null;
	getExplodeLayerTransform: (index: number) => React.CSSProperties;
	entityType: string;
	entityId?: string;
	context: Record<string, unknown>;
}) {
	// Obtener configuración de capas del contexto
	const { config } = useLayers();
	const layerSystem = config?.layerSystem || { layerOrder: [], enabledLayers: {} };
	const layerConfigs = config?.layerConfigs || {};
	const layers = config?.layers || {};

	// Obtener capas habilitadas y en orden
	const enabledLayers = useMemo(() => {
		// Asegurar que tengamos arrays y objetos válidos para evitar errores
		const layerOrder = layerSystem.layerOrder || [];
		const enabledLayersMap = layerSystem.enabledLayers || {};

		return layerOrder
			.filter(layerId => enabledLayersMap[layerId])
			.map(layerId => ({
				id: layerId,
				layerConfig: layerConfigs[layerId] || {},
				implementation: layers[layerId],
			}))
			.filter(layer => layer.implementation !== undefined);
	}, [layerSystem.layerOrder, layerSystem.enabledLayers, layerConfigs, layers]);

	// Si no hay capas para renderizar, mostrar un contenedor vacío
	if (enabledLayers.length === 0) {
		return <div className="card-layer-container w-full h-full relative" />;
	}

	// Renderizar capas en orden
	return (
		<div
			className={cn(
				'card-layer-container w-full h-full relative',
				isExploded && 'exploded perspective-1000'
			)}
		>
			{enabledLayers.map((layer, index) => {
				if (!layer.implementation || !layer.implementation.render) {
					return null;
				}

				// Propiedades de la capa
				const isActive = activeLayer === layer.id;
				const style = isExploded ? getExplodeLayerTransform(index) : undefined;

				return (
					<div
						key={layer.id}
						className={cn(
							'card-layer absolute inset-0',
							isActive && 'layer-active',
							isExploded && 'layer-exploded transition-transform duration-300'
						)}
						style={style}
						data-layer-id={layer.id}
					>
						{layer.implementation.render({
							config: layer.layerConfig,
							isHovered,
							mousePosition,
							isActive,
							isExploded,
							entityType,
							entityId,
							context,
						})}
					</div>
				);
			})}
		</div>
	);
});

/**
 * Componente de control para la vista explosionada de capas
 */
export const LayerExplodeControl = memo(function LayerExplodeControl({
	isExploded,
	onToggle,
	className,
}: {
	isExploded: boolean;
	onToggle: () => void;
	className?: string;
}) {
	return (
		<button
			type="button"
			className={cn(
				'flex items-center justify-center p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors',
				isExploded && 'bg-primary/20 ring-2 ring-primary/50',
				className
			)}
			onClick={onToggle}
			title={isExploded ? 'Desactivar vista explosionada' : 'Activar vista explosionada'}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
				role="img"
			>
				<title>{isExploded ? 'Desactivar vista explosionada' : 'Activar vista explosionada'}</title>
				{isExploded ? (
					<>
						<rect x="4" y="4" width="16" height="16" rx="2" />
						<path d="M4 12h16" />
					</>
				) : (
					<>
						<rect x="2" y="2" width="8" height="8" rx="2" />
						<rect x="14" y="2" width="8" height="8" rx="2" />
						<rect x="2" y="14" width="8" height="8" rx="2" />
						<rect x="14" y="14" width="8" height="8" rx="2" />
					</>
				)}
			</svg>
		</button>
	);
});

/**
 * Componente de control para seleccionar la capa activa
 */
export const LayerSelectControl = memo(function LayerSelectControl({
	layers,
	activeLayer,
	onLayerSelect,
	className,
}: {
	layers: Array<{ id: string; name: string; icon?: React.ReactNode }>;
	activeLayer: string | null;
	onLayerSelect: (layerId: string | null) => void;
	className?: string;
}) {
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{layers.map((layer) => (
				<button
					type="button"
					key={layer.id}
					className={cn(
						'flex items-center gap-2 p-2 rounded-md hover:bg-primary/10 transition-colors',
						activeLayer === layer.id && 'bg-primary/20 ring-1 ring-primary/50'
					)}
					onClick={() => onLayerSelect(activeLayer === layer.id ? null : layer.id)}
					title={`Seleccionar capa: ${layer.name}`}
				>
					{layer.icon || (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
							role="img"
						>
							<title>{`Capa: ${layer.name}`}</title>
							<path d="M12 3L2 12L12 21L22 12L12 3Z" />
						</svg>
					)}
					<span className="text-sm">{layer.name}</span>
				</button>
			))}
		</div>
	);
});