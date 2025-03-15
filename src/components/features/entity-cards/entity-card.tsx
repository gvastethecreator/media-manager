'use client';

import { cn } from '@/lib/utils';
import type * as React from 'react';
import { useRef, useState } from 'react';
import { EntityCardContent } from './entity-card-content';
import { useLayersSystem } from './layers/hooks/layers-system';
import { LayerRenderer } from './layers/layer-plugin-system';
import { useAnimationSystem } from './modules/animation';
import { useColors } from './modules/colors';
import { CoreLayer } from './modules/core';
import { legacyToDesignSystem, useDesignSystem } from './modules/design';
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
	const mergedOptions = {
		...defaultOptions,
		...options,
		// Asegurar que las propiedades anidadas se combinen correctamente
		layerSystem: {
			...(defaultOptions.layerSystem || {}),
			...(options.layerSystem || {}),
		},
		designSystem: {
			...(defaultOptions.designSystem || {}),
			...(options.designSystem || {}),
		},
	};

	// Incorporar hooks de los módulos con manejo de errores
	try {
		// Inicializar hooks con valores predeterminados o proporcionados
		const designSystemHook = useDesignSystem(
			design || (mergedOptions.designSystem ? legacyToDesignSystem(mergedOptions) : {})
		);

		const animationSystemHook = useAnimationSystem(animation || {});
		const colorsHook = useColors({
			initialOptions: mergedOptions.colors
				? { colorPalette: typeof mergedOptions.colors === 'string' ? mergedOptions.colors : undefined }
				: {},
		});
		const layersHook = useLayersSystem({
			layers: mergedOptions.layers || [],
			// Asegurar que se proporcionen valores por defecto para el sistema de capas
			layerOrder: mergedOptions.layerSystem?.order || [
				'background',
				'content',
				'effects',
				'holographic',
				'border',
				'filter',
			],
			layerBlending: mergedOptions.layerSystem?.layerBlending || 'normal',
			layerSpacing: mergedOptions.layerSystem?.layerSpacing || 2,
		});

		// Función para reintentar después de un error
		const handleRetry = () => {
			setError(null);
		};

		// Determinar clases CSS basadas en los sistemas modulares
		const designClasses = enableDesign ? cn('design-system') : '';
		const animationClasses = enableAnimation ? cn('animation-system') : '';
		const colorClasses = cn('color-system');

		// Función para voltear la tarjeta
		const handleFlip = () => {
			if (enableBackside || mergedOptions.backside?.enabled) {
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

		// Manejar eventos de mouse para interacción con capas
		const handleMouseEnter = () => {
			setIsHovered(true);
		};

		const handleMouseLeave = () => {
			setIsHovered(false);
		};

		const handleMouseMove = (e: React.MouseEvent) => {
			if (containerRef.current) {
				const rect = containerRef.current.getBoundingClientRect();
				setMousePosition({
					x: e.clientX - rect.left,
					y: e.clientY - rect.top,
				});
			}
		};

		// Función para calcular transformación de capas en modo explotado
		const getExplodeLayerTransform = (index: number): React.CSSProperties => {
			if (!isExploded) return {};

			const distance = 20; // Distancia base entre capas
			const offset = index * distance;

			return {
				transform: `translateZ(${offset}px)`,
				zIndex: index * 10,
			};
		};

		// Sistema de capas para renderizado
		const layers = enableLayers && layersHook.layersSystem ? layersHook.layersSystem.getLayers() : [];

		// Si hay un error, mostrar mensaje
		if (error) {
			return <CardErrorDisplay error={error} onRetry={handleRetry} />;
		}

		// Aplicar estilos del sistema de diseño si está habilitado
		const designStyles = enableDesign ? designSystemHook.generateCssStyles() : {};

		return (
			<div
				ref={containerRef}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onMouseMove={handleMouseMove}
				className="entity-card-container"
				style={designStyles as React.CSSProperties}
			>
				<button
					type="button"
					className={cn('entity-card', designClasses, animationClasses, colorClasses, className)}
					onClick={handleFlip}
					onKeyDown={handleKeyDown}
					aria-label={typeof title === 'string' ? title : 'Tarjeta de entidad'}
				>
					{/* Cara Frontal */}
					<div className="entity-card-front">
						{/* Sistema de capas */}
						{enableLayers && layers.length > 0 && (
							<LayerRenderer
								isExploded={isExploded}
								isHovered={isHovered}
								mousePosition={mousePosition}
								activeLayer={activeLayer}
								getExplodeLayerTransform={getExplodeLayerTransform}
								entityType={mergedOptions.entityType || 'default'}
								entityId={id}
								configs={mergedOptions.layerConfigs}
							/>
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
						<div className="entity-card-back">
							<div className="backside-content">{backsideContent}</div>
						</div>
					)}
				</button>
			</div>
		);
	} catch (err) {
		// Capturar cualquier error durante el renderizado
		const cardError = errorHandler.handleError(err);
		return <CardErrorDisplay error={cardError} onRetry={() => setError(null)} />;
	}
}
