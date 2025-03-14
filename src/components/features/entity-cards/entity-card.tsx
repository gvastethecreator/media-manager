'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type * as React from 'react';
import { useEffect, useState } from 'react';
import { EntityCardContent } from './entity-card-content';
import { CardContainer } from './layers/card-container';
import { LayerRenderer } from './layers/layer-plugin-system';
import type { BaseLayerConfig } from './layers/layer-plugin-system';
import { useAnimationSystem } from './modules/animation';
import type { AnimationSystem } from './modules/animation/types';
import { BacksideLayer } from './modules/backside';
import type { BacksideOptions } from './modules/backside/types';
import type { ColorPalette } from './modules/colors';
import { useColors } from './modules/colors';
import { CoreLayer } from './modules/core';
import type { CoreConfig } from './modules/core/core-config';
import { useDesignSystem } from './modules/design';
import type { DesignSystem as DesignSystemType } from './modules/design/types';
import type { ImageGridImage, ImageGridLayout, ImageGridStyle } from './modules/image-grid';
import { useLayersSystem } from './modules/layers';
import type { RarityDefinition } from './modules/rarities';
import type { CardOptions } from './types/card-settings-types';

export interface BaseCardProps {
	children: React.ReactNode;
	className?: string;
	// Propiedades específicas de Backside
	enableBackside?: boolean;
	backsideContent?: React.ReactNode;
	backsideOptions?: {
		layoutType?: string;
		colorMode?: string;
		customColor?: string;
		opacity?: number;
		blurBackground?: boolean;
		blurAmount?: number;
		animation?: string;
		animationDuration?: number;
		showBackContent?: boolean;
	};
	// Propiedades específicas de Core
	coreConfig?: CoreConfig;
	enableCore?: boolean;
}

export function BaseCard({
	children,
	className,
	enableBackside = false,
	backsideContent,
	backsideOptions,
	enableCore = false,
	coreConfig,
}: BaseCardProps) {
	// Estado para el flip de la tarjeta
	const [isFlipped, setIsFlipped] = useState(false);

	// Función para voltear la tarjeta
	const handleFlip = () => {
		if (enableBackside) {
			setIsFlipped(!isFlipped);
		}
	};

	// Manejar eventos de teclado para accesibilidad
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			handleFlip();
			e.preventDefault();
		}
	};

	return (
		<button
			type="button"
			className={cn('relative w-full h-full perspective-1000 bg-transparent border-0 p-0 cursor-pointer', className)}
			onClick={handleFlip}
			onKeyDown={handleKeyDown}
			disabled={!enableBackside}
		>
			{/* Contenedor para el efecto 3D */}
			<div className={cn('relative w-full h-full transition-transform duration-500', isFlipped && 'rotateY-180')}>
				{/* Cara Frontal */}
				<div
					className={cn('absolute inset-0 backface-hidden', isFlipped ? 'pointer-events-none' : 'pointer-events-auto')}
				>
					{/* Core Layer - Se incluye solo si está habilitado */}
					{enableCore && <CoreLayer config={coreConfig} />}

					{/* Contenido principal de la tarjeta */}
					{children}
				</div>

				{/* Cara Posterior - Solo se muestra si backside está habilitado */}
				{enableBackside && (
					<div
						className={cn(
							'absolute inset-0 backface-hidden rotateY-180',
							!isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
						)}
					>
						<BacksideLayer content={backsideContent} options={backsideOptions} />
					</div>
				)}
			</div>
		</button>
	);
}

// Propiedades para el nuevo componente EntityCard que aprovecha todos los módulos
export interface EntityCardProps {
	id?: string;
	className?: string;
	children?: React.ReactNode;
	options?: CardOptions;
	// Contenido específico para módulos
	title?: string;
	description?: string;
	image?: string | ImageGridImage[];
	imageLayout?: ImageGridLayout;
	imageStyle?: ImageGridStyle;
	backsideContent?: React.ReactNode;
	design?: DesignSystemType;
	animation?: AnimationSystem;
	backside?: BacksideOptions;
	// Flags para habilitar/deshabilitar módulos
	enableLayers?: boolean;
	enableDesign?: boolean;
	enableAnimation?: boolean;
	enableBackside?: boolean;
}

/**
 * Componente EntityCard que aprovecha todos los módulos migrados
 * Esta implementación integra todos los sistemas modulares desarrollados
 * 🚀 Versión optimizada con separación de responsabilidades
 */
export function EntityCard({
	id,
	className,
	children,
	options = {},
	// Contenido específico
	title,
	description,
	image,
	imageLayout = 'single',
	imageStyle = 'standard',
	backsideContent,
	design,
	animation,
	backside,
	// Flags de módulos
	enableLayers = true,
	enableDesign = true,
	enableAnimation = true,
	enableBackside = false,
}: EntityCardProps) {
	// Estado para el flip de la tarjeta
	const [isFlipped, setIsFlipped] = useState(false);

	// Incorporar hooks de los módulos
	const { designSystem } = useDesignSystem({ designSystem: design || options.designSystem });
	const { animationSystem } = useAnimationSystem({ animationSystem: animation || options.animation });
	const { colorSystem } = useColors({ colors: options.colors });
	const { layersSystem } = useLayersSystem({ layers: options.layers });

	// Determinar clases CSS basadas en los sistemas modulares
	const designClasses = enableDesign ? designSystem.getClasses() : '';
	const animationClasses = enableAnimation ? animationSystem.getClasses(isFlipped) : '';
	const colorClasses = colorSystem.getClasses();

	// Función para voltear la tarjeta
	const handleFlip = () => {
		if (enableBackside) {
			setIsFlipped(!isFlipped);
		}
	};

	// Manejar eventos de teclado para accesibilidad
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			handleFlip();
			e.preventDefault();
		}
	};

	// Sistema de capas para renderizado
	const layers = enableLayers && layersSystem ? layersSystem.getLayers() : [];

	return (
		<CardContainer
			id={id}
			className={cn('entity-card', designClasses, animationClasses, colorClasses, className)}
			onClick={handleFlip}
			onKeyDown={handleKeyDown}
			aria-label={title}
			options={options}
			flipped={isFlipped}
			enableBackside={enableBackside}
		>
			{/* Cara Frontal */}
			<div className="entity-card-front">
				{/* Sistema de capas */}
				{enableLayers && layers.length > 0 && <LayerRenderer layers={layers} context={{ options, isFlipped }} />}

				{/* Contenido de la tarjeta usando el componente separado */}
				<EntityCardContent
					title={title}
					description={description}
					image={image}
					imageLayout={imageLayout}
					imageStyle={imageStyle}
					options={options}
				>
					{children}
				</EntityCardContent>
			</div>

			{/* Cara Posterior */}
			{enableBackside && (
				<div className="entity-card-back">
					<BacksideLayer content={backsideContent} options={backside || options.backside} />
				</div>
			)}
		</CardContainer>
	);
}
