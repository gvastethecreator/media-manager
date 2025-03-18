'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type * as React from 'react';
import { useRef, useState } from 'react';
import { LayerPluginProvider, LayerRenderer } from './layers/layer-plugin-system';

interface EntityCardLayerWrapperProps {
	title: string;
	description?: string;
	onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
	showVisualConfig?: boolean;
	onVisualConfigClick?: () => void;
	visualOptions?: any;
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

export function EntityCardLayerWrapper({
	title,
	description,
	onClick,
	showVisualConfig = false,
	onVisualConfigClick,
	visualOptions = {},
	entityType,
	entityId,
	enableExplode = false,
	isExploded = false,
	activeLayer = null,
	onExplodedChange,
	onActiveLayerChange,
	className,
	children,
}: EntityCardLayerWrapperProps) {
	const [isHovered, setIsHovered] = useState(false);
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
	const cardRef = useRef<HTMLDivElement>(null);

	// Manejar el movimiento del mouse para efectos 3D
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!cardRef.current) return;

		const rect = cardRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		setMousePosition({ x, y });
	};

	// Función para transformar capas explotadas
	const getExplodeLayerTransform = (index: number) => {
		if (!isExploded) return {};

		// Calcular desplazamiento basado en el índice
		const translateY = index * 20; // 20px por capa
		return {
			transform: `translateY(${translateY}px)`,
			transition: 'transform 0.3s ease-out',
		};
	};

	// Configuraciones para las capas
	const configs = {
		container: {
			enabled: true,
			layerIndex: 0,
		},
		texture: {
			enabled: true,
			layerIndex: 1,
			textureConfig: visualOptions.textureConfig,
		},
		border: {
			enabled: true,
			layerIndex: 2,
			borderConfig: visualOptions.rarityConfig,
		},
		glow: {
			enabled: visualOptions.enableGlowEffect || false,
			layerIndex: 3,
			glowOptions: visualOptions.glowOptions,
		},
		grain: {
			enabled: visualOptions.enableGrainEffect || false,
			layerIndex: 4,
			grainOptions: visualOptions.grainOptions,
		},
		holographic: {
			enabled: visualOptions.enableHolographicEffect || false,
			layerIndex: 5,
			holographicOptions: visualOptions.holographicOptions,
		},
		scanlines: {
			enabled: visualOptions.enableScanlinesEffect || false,
			layerIndex: 6,
		},
		explode: {
			enabled: enableExplode,
			layerIndex: 7,
		},
	};

	return (
		<motion.div
			ref={cardRef}
			className={cn('card-wrapper relative w-full h-full', className)}
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onMouseMove={handleMouseMove}
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.2 }}
		>
			<LayerPluginProvider>
				<LayerRenderer
					isExploded={isExploded}
					isHovered={isHovered}
					mousePosition={mousePosition}
					activeLayer={activeLayer}
					getExplodeLayerTransform={getExplodeLayerTransform}
					entityType={entityType}
					entityId={entityId}
					configs={configs}
					context={{
						title,
						description,
						showVisualConfig,
						onVisualConfigClick,
						visualOptions,
						enableExplode,
						onExplodedChange,
						onActiveLayerChange,
					}}
				/>
			</LayerPluginProvider>
			{children}
		</motion.div>
	);
}
