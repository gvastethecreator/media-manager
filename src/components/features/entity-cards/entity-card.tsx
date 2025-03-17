'use client';

import { cn, deepMerge } from '@/lib/utils';
import type * as React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { EntityCardContent } from './entity-card-content';
import { LayerPluginProvider, LayerRenderer } from './layers/layer-plugin-system';
import { useAnimationSystem } from './modules/animation';
import { CoreLayer } from './modules/core';
import { useDesignSystem } from './modules/design';
import './styles/card-borders.css';
// Importar tipos desde el archivo centralizado
import type { AnimationSystemType, BacksideOptionsType, CardOptions } from './types';
// Importar tipo DesignSystem desde el módulo de diseño
import type { DesignSystem } from './modules/design/types';
// Importar tipos de imagen desde el componente ImageGrid
import type { ImageGridImage, ImageGridProps } from './layouts/image-grid';
// Tipo de alias para compatibilidad
type ImageGridLayout = ImageGridProps['layout'];
type ImageGridStyle = ImageGridProps['style'];
// Importar CoreConfig desde el módulo core
import type { CoreConfig } from './modules/core/core-config';
// Importar sistema de manejo de errores
import { RegisterLayers } from './layers/register-layers';
import { CardError, CardErrorDisplay, createErrorHandler } from './utils/error-handler';

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
					{enableCore && <CoreLayer entityData={{ id: 'core-layer', name: 'Core Layer' }} config={coreConfig} />}

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
						<div className="backside-content p-4">{backsideContent}</div>
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
	design?: Partial<DesignSystem>;
	animation?: AnimationSystemType;
	backside?: BacksideOptionsType;
	// Flags para habilitar/deshabilitar módulos
	enableLayers?: boolean;
	enableDesign?: boolean;
	enableAnimation?: boolean;
	enableBackside?: boolean;
	// Manejadores de eventos
	onError?: (error: CardError) => void;
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
	// Manejadores de eventos
	onError,
}: EntityCardProps) {
	// Estado para el flip de la tarjeta
	const [isFlipped, setIsFlipped] = useState(false);
	const [error, setError] = useState<CardError | null>(null);

	// Estados para interacción con capas
	const [isHovered, setIsHovered] = useState(false);
	const [isExploded, setIsExploded] = useState(false);
	const [activeLayer, setActiveLayer] = useState<string | null>(null);
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

	// Referencia al contenedor para calcular posición del mouse
	const containerRef = useRef<HTMLDivElement>(null);

	// Crear manejador de errores
	const errorHandler = createErrorHandler({
		onError: (err) => {
			setError(err);
			onError?.(err);
		},
		logErrors: true,
	});

	// Opciones por defecto para asegurar que siempre haya valores válidos
	const defaultOptions = {
		layerSystem: {
			order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
			layerBlending: 'normal',
			layerSpacing: 2,
		},
		designSystem: {
			preset: 'default',
			variant: 'default',
			aspectRatio: '1/1',
			cornerStyle: 'rounded',
			cornerRadius: 12,
			elevation: 2,
			shadowStyle: 'soft',
		},
		primaryColor: '#3b82f6',
		secondaryColor: '#1d4ed8',
		hoverLiftHeight: 10,
		maxRotation: 15,
	};

	// Combinar opciones por defecto con las proporcionadas
	const mergedOptions = useMemo(() => {
		return deepMerge(defaultOptions, options);
	}, [options]);

	// Obtener clases y estilos del sistema de diseño
	const { designClasses, designStyles, colorClasses } = useDesignSystem({
		designSystem: mergedOptions.designSystem,
		primaryColor: mergedOptions.primaryColor,
		secondaryColor: mergedOptions.secondaryColor,
		entityType: mergedOptions.entityType || 'default',
	});

	// Obtener clases y estilos del sistema de animación
	const { animationClasses, getAnimationStyles } = useAnimationSystem({
		enabled: enableAnimation,
		hoverEffect: true,
		clickEffect: true,
		entranceAnimation: 'fade-in',
		exitAnimation: 'fade-out',
		transitionDuration: 300,
		timingFunction: 'ease-in-out',
		hoverScale: mergedOptions.hoverScale || 1.05,
		liftHeight: mergedOptions.hoverLiftHeight || 10,
		maxRotation: mergedOptions.maxRotation || 15,
	});

	// Clase específica para el tipo de entidad
	const entityTypeClass = useMemo(() => {
		return mergedOptions.entityType ? `entity-type-${mergedOptions.entityType}` : '';
	}, [mergedOptions.entityType]);

	// Manejar eventos de mouse para efectos de hover
	const handleMouseEnter = useCallback(() => {
		setIsHovered(true);
	}, []);

	const handleMouseLeave = useCallback(() => {
		setIsHovered(false);
		setMousePosition({ x: 0, y: 0 });
	}, []);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!containerRef.current) return;

			const rect = containerRef.current.getBoundingClientRect();
			const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

			setMousePosition({ x, y });
		},
		[containerRef]
	);

	// Manejar flip de la tarjeta
	const handleFlip = useCallback(() => {
		if (enableBackside || mergedOptions.backside?.enabled) {
			setIsFlipped((prev) => !prev);
		}
	}, [enableBackside, mergedOptions.backside?.enabled]);

	// Manejar navegación por teclado
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' || e.key === ' ') {
				handleFlip();
			}
		},
		[handleFlip]
	);

	// Calcular transformación para modo explodido
	const getExplodeLayerTransform = useCallback(
		(index: number) => {
			if (!isExploded) return {};

			const spacing = mergedOptions.layerSystem?.layerSpacing || 2;
			const offset = index * spacing;
			const perspective = 800;

			return {
				transform: `translateZ(${offset}px)`,
				zIndex: index,
				transition: 'transform 0.3s ease-out',
				perspective: `${perspective}px`,
			};
		},
		[isExploded, mergedOptions.layerSystem?.layerSpacing]
	);

	// Obtener capas configuradas
	const layers = useMemo(() => {
		if (!enableLayers) return [];

		// Obtener orden de capas desde las opciones o usar orden por defecto
		const layerOrder = mergedOptions.layerSystem?.order || defaultOptions.layerSystem.order;

		// Filtrar capas habilitadas
		return layerOrder.filter((layerId) => {
			const layerConfig = mergedOptions.layerConfigs?.[layerId];
			return layerConfig?.enabled !== false;
		});
	}, [enableLayers, mergedOptions.layerSystem?.order, mergedOptions.layerConfigs]);

	// Si hay un error, mostrar mensaje utilizando CardErrorDisplay
	if (error) {
		return <CardErrorDisplay error={error} className="w-full h-full" onRetry={() => setError(null)} />;
	}

	// Renderizar tarjeta
	try {
		// Configuraciones para las capas
		const layerConfigs = {
			container: {
				enabled: true,
				layerIndex: 0,
			},
			texture: {
				enabled: mergedOptions.textureConfig?.enabled ?? true,
				layerIndex: 1,
				textureConfig: mergedOptions.textureConfig,
			},
			border: {
				enabled: mergedOptions.rarityConfig?.enabled ?? true,
				layerIndex: 2,
				borderConfig: mergedOptions.rarityConfig,
			},
			glow: {
				enabled: mergedOptions.enableGlowEffect || false,
				layerIndex: 3,
				glowOptions: mergedOptions.glowOptions,
			},
			grain: {
				enabled: mergedOptions.enableGrainEffect || false,
				layerIndex: 4,
				grainOptions: mergedOptions.grainOptions,
			},
			holographic: {
				enabled: mergedOptions.enableHolographicEffect || false,
				layerIndex: 5,
				holographicOptions: mergedOptions.holographicOptions,
			},
			scanlines: {
				enabled: mergedOptions.enableScanlinesEffect || false,
				layerIndex: 6,
			},
			explode: {
				enabled: enableLayers,
				layerIndex: 7,
			},
			...mergedOptions.layerConfigs,
		};

		return (
			<div
				ref={containerRef}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onMouseMove={handleMouseMove}
				className={cn('entity-card-container w-full h-full', entityTypeClass)}
				style={{
					...getAnimationStyles(),
					...(designStyles as React.CSSProperties),
				}}
			>
				<button
					type="button"
					className={cn(
						'entity-card w-full h-full',
						designClasses,
						animationClasses,
						colorClasses,
						entityTypeClass,
						className
					)}
					onClick={handleFlip}
					onKeyDown={handleKeyDown}
					aria-label={typeof title === 'string' ? title : 'Tarjeta de entidad'}
				>
					{/* Cara Frontal */}
					<div className="entity-card-front w-full h-full">
						{/* Sistema de capas */}
						{enableLayers && layers.length > 0 && (
							<LayerPluginProvider>
								{/* Registrar las capas necesarias */}
								<RegisterLayers />

								{/* Renderizar las capas */}
								<LayerRenderer
									isExploded={isExploded}
									isHovered={isHovered}
									mousePosition={mousePosition}
									activeLayer={activeLayer}
									getExplodeLayerTransform={getExplodeLayerTransform}
									entityType={mergedOptions.entityType || 'default'}
									entityId={id}
									configs={layerConfigs}
									context={{
										title,
										description,
										image,
										options: mergedOptions,
									}}
								/>
							</LayerPluginProvider>
						)}

						{/* Contenido de la tarjeta usando el componente separado */}
						<EntityCardContent
							title={title}
							description={description}
							image={typeof image === 'string' ? image : undefined}
							images={Array.isArray(image) ? image : []}
							imageLayout={imageLayout}
							imageStyle={imageStyle}
							options={mergedOptions}
						>
							{children}
						</EntityCardContent>
					</div>

					{/* Cara Posterior */}
					{(enableBackside || mergedOptions.backside?.enabled) && (
						<div className="entity-card-back w-full h-full">
							<div className="backside-content w-full h-full">{backsideContent}</div>
						</div>
					)}
				</button>
			</div>
		);
	} catch (err) {
		// Capturar errores durante el renderizado
		errorHandler(err as Error);
		return null;
	}
}
