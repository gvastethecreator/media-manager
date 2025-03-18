'use client';

/**
 * 🌈 Componente de integración de capas para EntityCard
 *
 * Este componente proporciona una integración mejorada entre EntityCard y el sistema de capas,
 * optimizando el rendimiento y añadiendo funcionalidades avanzadas.
 */

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { memo, useCallback, useMemo, useState } from 'react';
import { LayerPluginProvider, LayerRenderer, RegisterLayers } from '../../layers';
import type { CardOptions } from '../../types/card-settings-types';
import { adaptEntityCardToLayerSystem, useEntityTypeLayerConfig } from './entity-card-layer-adapter';

export interface EntityCardLayerIntegrationProps {
	title: string;
	description?: string;
	onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
	showVisualConfig?: boolean;
	onVisualConfigClick?: () => void;
	cardOptions?: Partial<CardOptions>;
	entityType: string;
	entityId?: string;
	enableExplode?: boolean;
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
	className?: string;
	children?: React.ReactNode;
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
}: EntityCardLayerIntegrationProps) {
	// Estado para el hover y posición del ratón
	const [isHovered, setIsHovered] = useState(false);
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

	// Convertir opciones de tarjeta a configuración de capas
	const layerSystemConfig = useMemo(() => {
		return adaptEntityCardToLayerSystem(cardOptions);
	}, [cardOptions]);

	// Obtener configuración específica para el tipo de entidad
	const entityTypeConfig = useEntityTypeLayerConfig(entityType, entityId, layerSystemConfig);

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

	// Configuraciones para las capas basadas en las opciones de la tarjeta
	const layerConfigs = useMemo(() => {
		return entityTypeConfig.layerConfigs;
	}, [entityTypeConfig]);

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
				<RegisterLayers />
				<LayerRenderer
					isExploded={isExploded}
					isHovered={isHovered}
					mousePosition={mousePosition}
					activeLayer={activeLayer}
					getExplodeLayerTransform={getExplodeLayerTransform}
					entityType={entityType}
					entityId={entityId}
					configs={layerConfigs}
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
			</LayerPluginProvider>
			{children}
		</motion.div>
	);
});

/**
 * Componente de control para la vista explosionada de capas
 */
export function LayerExplodeControl({
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
}

/**
 * Componente de control para seleccionar la capa activa
 */
export function LayerSelectControl({
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
}
