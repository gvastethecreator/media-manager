'use client';

import { cn } from '@/lib/utils';
import { useCallback, useState, type MouseEvent } from 'react';
import type { EntityBasicInfo } from '../../types/unified-types';
import { LayerPluginProvider, useLayerPlugin } from './layer-plugin-system';
import { RegisterLayers } from './register-layers';

interface EntityCardLayersProps {
	entity: EntityBasicInfo;
	entityType: string;
	entityId?: string;
	activeLayer?: string | null;
	isExploded?: boolean;
	className?: string;
	onClick?: (e: MouseEvent<HTMLDivElement>) => void;
	children?: React.ReactNode;
}

/**
 * Componente que renderiza todas las capas disponibles para una entidad
 */
export function LayerRenderer({
	entityType,
	entityId,
	activeLayer,
	isExploded,
	isHovered,
	mousePosition = { x: 50, y: 50 },
	onClick,
	className,
}: {
	entityType: string;
	entityId?: string;
	activeLayer?: string | null;
	isExploded?: boolean;
	isHovered?: boolean;
	mousePosition?: { x: number; y: number };
	onClick?: (layerId: string) => void;
	className?: string;
}) {
	const { layers } = useLayerPlugin();

	// Transformación para capas en vista explotada
	const getExplodeTransform = (index: number) => {
		if (!isExploded) return {};

		const offset = 10 * (index + 1);
		return {
			transform: `translateY(${offset}px)`,
			opacity: 1 - index * 0.05,
		};
	};

	// Obtener todas las capas ordenadas por layerIndex
	const sortedLayers = Array.from(layers.values())
		.sort((a, b) => {
			const indexA = a.defaultConfig.layerIndex || 0;
			const indexB = b.defaultConfig.layerIndex || 0;
			return indexA - indexB;
		});

	return (
		<div className={cn("relative w-full h-full", className)}>
			{sortedLayers.map((layer, index) => {
				// Verificar si la capa debe mostrarse
				const shouldRender =
					layer.defaultConfig.enabled &&
					(!layer.defaultConfig.visibleOnHover || isHovered);

				if (!shouldRender) return null;

				// Estilo para la capa actual
				const style = {
					position: 'absolute',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					zIndex: layer.defaultConfig.layerIndex,
					...(isExploded ? getExplodeTransform(index) : {}),
				} as React.CSSProperties;

				// Resaltar la capa activa
				const isActive = activeLayer === layer.type;

				return (
					<div
						key={layer.type}
						className={cn(
							"absolute inset-0 transition-all duration-300",
							isActive && "ring-2 ring-primary"
						)}
						style={style}
						onClick={onClick ? () => onClick(layer.type) : undefined}
						data-layer-id={layer.type}
					>
						{layer.component && (
							<layer.component
								isHovered={isHovered}
								isExploded={isExploded}
								mousePosition={mousePosition}
								activeLayer={activeLayer}
								style={style}
								config={layer.defaultConfig}
								entityType={entityType}
								entityId={entityId}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}

/**
 * Contenedor principal que integra el sistema de capas con EntityCard
 */
export function EntityCardLayers({
	entity,
	entityType,
	entityId,
	activeLayer,
	isExploded,
	className,
	onClick,
	children,
}: EntityCardLayersProps) {
	// Estado para seguir la posición del mouse
	const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
	const [isHovered, setIsHovered] = useState(false);

	// Manejo del movimiento del ratón
	const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		setMousePosition({ x, y });
	}, []);

	return (
		<div
			className={cn(
				"relative w-full h-full",
				className
			)}
			onMouseMove={handleMouseMove}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={onClick}
		>
			<LayerRenderer
				entityType={entityType}
				entityId={entityId}
				activeLayer={activeLayer}
				isExploded={isExploded}
				isHovered={isHovered}
				mousePosition={mousePosition}
			/>
			{children}
		</div>
	);
}

/**
 * Componente de proveedor que inicializa el sistema de capas
 */
export function EntityCardLayersProvider({ children }: { children: React.ReactNode }) {
	return (
		<LayerPluginProvider>
			<RegisterLayers />
			{children}
		</LayerPluginProvider>
	);
}