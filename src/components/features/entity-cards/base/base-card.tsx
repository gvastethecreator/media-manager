'use client';

import { DEFAULT_SETTINGS_OPTIONS } from '@/components/features/entity-cards/config/card-config-defaults';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
	Clock,
	FolderIcon,
	FolderOpenIcon,
	ImageIcon,
	Layers,
	PencilIcon,
	Settings2,
	Sliders,
	Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { type MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatedBorderLayer } from '../layers/animated-border/animated-border-layer';
import { CardContainer } from '../layers/card-container';
import { ChromaticAberrationLayer } from '../layers/chromatic-aberration/chromatic-aberration-layer';
import { DistortionFilter, GlowFilter, ShadowFilter } from '../layers/filters';
import { GlitchEffectLayer } from '../layers/glitch/glitch-effect-layer';
import { GlowEffectLayer } from '../layers/glow/glow-effect-layer';
import { GrainEffectLayer } from '../layers/grain/grain-effect-layer';
import { HolographicLayer } from '../layers/holographic/holographic-layer';
import { NoiseTextureLayer } from '../layers/noise-texture/noise-texture-layer';
import { DotsPattern, GridPattern, HexagonPattern, LinesPattern } from '../layers/patterns';
import { PixelateLayer } from '../layers/pixelate/pixelate-layer';
import { ScanlinesLayer } from '../layers/scanlines/scanlines-layer';
import { DistortionShader, HologramShader, ParticleShader, WaveShader } from '../layers/shaders';
import { Exploder } from '../settings/preview/exploder';
import type {
	CardOptions as BaseCardOptions,
	BaseCardProps,
	ExplodeLayerTransformFunction,
	RarityConfig,
	TextureConfig,
} from '../types/base-card-types';
import type { CardOptions as SettingsCardOptions } from '../types/	card-settings-types';
import { adaptSettingsToBaseOptions, isSettingsCardOptions } from './card-adapter';

// Importamos el archivo CSS de animaciones
import './card-animations.css';

/**
 * BaseCard - Componente que renderiza tarjetas de entidades con efectos visuales
 *
 * Este componente es la base para las tarjetas de entidades como álbumes, colecciones, etiquetas, etc.
 * Soporta múltiples efectos visuales como 3D, holográfico, granos, bordes animados y más.
 */
export function BaseCard({
	children,
	onClick,
	className,
	onHoverStart,
	onHoverEnd,
	options = DEFAULT_SETTINGS_OPTIONS as unknown as BaseCardOptions,
	rarity,
	texture,
	onVisualizationConfigClick,
	showVisualizationConfig = false,
	enableExplode = false,
	explodeLayers = [],
	isExploded: externalIsExploded,
	activeLayer: externalActiveLayer,
	onExplodedChange,
	onActiveLayerChange,
}: BaseCardProps) {
	// Si las opciones son del tipo SettingsCardOptions, adaptarlas
	const adaptedOptions = useMemo(() => {
		return isSettingsCardOptions(options) ? adaptSettingsToBaseOptions(options as SettingsCardOptions) : options;
	}, [options]);

	// Mezclamos las opciones por defecto con las proporcionadas para garantizar valores completos
	const completeOptions = useMemo(() => {
		return {
			...DEFAULT_SETTINGS_OPTIONS,
			...adaptedOptions,
		};
	}, [adaptedOptions]);

	// Estados locales
	const [isHovered, setIsHovered] = useState(false);
	const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
	const [rotateX, setRotateX] = useState(0);
	const [rotateY, setRotateY] = useState(0);

	// Estados controlados/no controlados para exploder
	const [localIsExploded, setLocalIsExploded] = useState(false);
	const isExploded = externalIsExploded !== undefined ? externalIsExploded : localIsExploded;

	// Estado controlado/no controlado para capa activa
	const [localActiveLayer, setLocalActiveLayer] = useState<string | null>(null);
	const activeLayer = externalActiveLayer !== undefined ? externalActiveLayer : localActiveLayer;

	// ID único para filtro SVG
	const filterId = React.useId();

	// Handler para movimiento del ratón (efecto 3D)
	const handleMouseMove = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!isExploded && completeOptions.enable3DEffect && completeOptions.enableHoverAnimation) {
				const rect = e.currentTarget.getBoundingClientRect();
				const x = (e.clientX - rect.left) / rect.width;
				const y = (e.clientY - rect.top) / rect.height;

				setMousePosition({ x, y });

				// Calcular rotación basada en la posición del ratón
				const maxRotation = completeOptions.maxRotation ?? 15;
				const rotateYValue = ((x - 0.5) * maxRotation).toFixed(2);
				const rotateXValue = ((y - 0.5) * -maxRotation).toFixed(2);

				setRotateX(Number.parseFloat(rotateXValue));
				setRotateY(Number.parseFloat(rotateYValue));
			}
		},
		[isExploded, completeOptions.enable3DEffect, completeOptions.maxRotation, completeOptions.enableHoverAnimation]
	);

	// Gestionar eventos de hover
	const handleHoverStart = useCallback(() => {
		if (!isExploded && completeOptions.enableHover) {
			setIsHovered(true);
			onHoverStart?.();
		}
	}, [isExploded, onHoverStart, completeOptions.enableHover]);

	const handleHoverEnd = useCallback(() => {
		if (!isExploded) {
			setIsHovered(false);
			setRotateX(0);
			setRotateY(0);
			onHoverEnd?.();
		}
	}, [isExploded, onHoverEnd]);

	// Gestionar eventos de exploder
	const toggleExploded = useCallback(() => {
		const newValue = !isExploded;
		setLocalIsExploded(newValue);
		onExplodedChange?.(newValue);
	}, [isExploded, onExplodedChange]);

	// Gestionar cambio de capa activa
	const handleLayerClick = useCallback(
		(layerId: string) => {
			const newActiveLayer = activeLayer === layerId ? null : layerId;
			setLocalActiveLayer(newActiveLayer);
			onActiveLayerChange?.(newActiveLayer);
		},
		[activeLayer, onActiveLayerChange]
	);

	// Crear estilos 3D basados en estado
	const getCardTransform = useCallback(() => {
		// Si está explotada, no aplicamos transformación 3D
		if (isExploded) {
			return { transform: 'none' };
		}

		const hoverLiftHeight = completeOptions.hoverLiftHeight ?? 10;

		// Si no estamos en hover o la animación de hover está desactivada
		if (!isHovered || !completeOptions.enableHoverAnimation) {
			return { transform: 'none' };
		}

		// Si 3D está desactivado, solo aplicamos levantamiento en hover
		if (!completeOptions.enable3DEffect) {
			return {
				transform: `translateY(-${hoverLiftHeight}px)`,
				transition: 'transform 0.3s ease',
			};
		}

		// Si tenemos efecto parallax en lugar de 3D
		if (completeOptions.enableParallaxEffect) {
			const parallaxX = (mousePosition.x - 0.5) * 15;
			const parallaxY = (mousePosition.y - 0.5) * 15;
			return {
				transform: `translateX(${parallaxX}px) translateY(${-hoverLiftHeight + parallaxY}px)`,
				transition: 'transform 0.1s ease-out',
			};
		}

		// Transformación 3D completa
		return {
			transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-${hoverLiftHeight}px)`,
			transition: 'transform 0.2s ease-out',
		};
	}, [
		isExploded,
		isHovered,
		rotateX,
		rotateY,
		mousePosition,
		completeOptions.enable3DEffect,
		completeOptions.hoverLiftHeight,
		completeOptions.enableHoverAnimation,
		completeOptions.enableParallaxEffect,
	]);

	// Crear estilo de borde para rarezas
	const getRarityBorderStyle = useCallback(() => {
		// Si no hay rareza o el sistema de rareza está desactivado
		if (!rarity || !(completeOptions.raritySystem || completeOptions.enableBorderEffect)) {
			return {};
		}

		const borderWidth = typeof rarity.borderWidth === 'string' ? rarity.borderWidth : `${rarity.borderWidth || 2}px`;

		return {
			borderColor: rarity.color,
			borderWidth,
			boxShadow: isHovered && rarity.glowColor && completeOptions.enableHover ? `0 0 10px ${rarity.glowColor}` : 'none',
		};
	}, [
		rarity,
		isHovered,
		completeOptions.raritySystem,
		completeOptions.enableBorderEffect,
		completeOptions.enableHover,
	]);

	// Función para transformar capas en modo explodado
	const getExplodeLayerTransform: ExplodeLayerTransformFunction = useCallback(
		(layerIndex: number) => {
			if (!isExploded) {
				return {};
			}

			// Crear un desplazamiento para la capa basado en su índice
			const displacement = (layerIndex + 1) * 20;

			// Offset aleatorio pero consistente para cada capa
			const offsetX = ((layerIndex * 83) % 50) - 25;
			const offsetY = ((layerIndex * 37) % 40) - 20;

			return {
				transform: `translate3d(${offsetX}px, ${offsetY}px, ${displacement}px)`,
			};
		},
		[isExploded]
	);

	// Efecto blur si está habilitado
	const getBlurEffect = useCallback(() => {
		if (!completeOptions.enableBlurEffect || !isHovered) {
			return {};
		}

		return {
			filter: 'blur(1px)',
			transition: 'filter 0.3s ease',
		};
	}, [completeOptions.enableBlurEffect, isHovered]);

	// Sombra basada en la configuración
	const getShadowStyle = useCallback(() => {
		if (!completeOptions.enableShadow) {
			return {};
		}

		// Mapa de tamaños de sombra
		const shadowSizes = {
			sm: '0 1px 2px 0',
			md: '0 4px 6px -1px',
			lg: '0 10px 15px -3px',
			xl: '0 20px 25px -5px',
			'2xl': '0 25px 50px -12px',
		};

		const shadowSize = completeOptions.cardShadowSize || 'md';
		const shadowColor = completeOptions.cardShadowColor || 'rgba(0,0,0,0.2)';

		return {
			boxShadow: `${shadowSizes[shadowSize as keyof typeof shadowSizes]} ${shadowColor}`,
		};
	}, [completeOptions.enableShadow, completeOptions.cardShadowSize, completeOptions.cardShadowColor]);

	// Función para manejar el clic en la tarjeta
	const handleCardClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			// Si estamos en modo exploder, no propagar el evento de clic
			if (isExploded) {
				e.stopPropagation();
				return;
			}

			// Llamar al manejador de clic proporcionado
			onClick?.(e);
		},
		[isExploded, onClick]
	);

	// Aplicar efectos visuales
	const getVisualEffectsStyle = useCallback(() => {
		if (!completeOptions.visualEffects) {
			return {};
		}

		const {
			brightness = 100,
			contrast = 100,
			saturate = 100,
			hueRotate = 0,
			grayscale = 0,
			sepia = 0,
			invert = 0,
			opacity = 100,
			blur = 0,
			backdropBlur = 0,
			backdropBrightness = 100,
			backdropSaturate = 100,
			backdropOpacity = 100,
		} = completeOptions.visualEffects;

		return {
			filter: `
				brightness(${brightness}%)
				contrast(${contrast}%)
				saturate(${saturate}%)
				hue-rotate(${hueRotate}deg)
				grayscale(${grayscale}%)
				sepia(${sepia}%)
				invert(${invert}%)
				opacity(${opacity}%)
				blur(${blur}px)
			`,
			backdropFilter: `
				blur(${backdropBlur}px)
				brightness(${backdropBrightness}%)
				saturate(${backdropSaturate}%)
				opacity(${backdropOpacity}%)
			`,
		};
	}, [completeOptions.visualEffects]);

	// Aplicar estados
	const getStateStyles = useCallback(() => {
		if (!completeOptions.states || !isHovered) {
			return {};
		}

		const { hoverScale = 1, hoverRotate = 0, hoverTranslateY = 0 } = completeOptions.states;

		return {
			transform: `
				scale(${hoverScale})
				rotate(${hoverRotate}deg)
				translateY(${hoverTranslateY}px)
			`,
		};
	}, [completeOptions.states, isHovered]);

	// Aplicar optimizaciones de rendimiento
	useEffect(() => {
		if (!completeOptions.performance) {
			return;
		}

		const { reducedMotion, animationDuration, animationMaxFPS, animationTimingFunction } = completeOptions.performance;

		// Aplicar configuraciones de animación
		if (reducedMotion) {
			document.documentElement.style.setProperty('--card-transition-duration', '0s');
		} else {
			document.documentElement.style.setProperty('--card-transition-duration', `${animationDuration || 300}ms`);
			document.documentElement.style.setProperty('--card-transition-timing', animationTimingFunction || 'ease-out');
		}

		// Limitar FPS si es necesario
		if (animationMaxFPS) {
			document.documentElement.style.setProperty('--card-animation-duration', `${1000 / animationMaxFPS}ms`);
		}
	}, [completeOptions.performance]);

	// Aplicar efectos avanzados
	const getAdvancedEffectsStyle = (): React.CSSProperties => {
		const { scanlinesOptions, borderGlow, holographicEffect } = completeOptions;

		const styles: React.CSSProperties = {};

		if (scanlinesOptions?.enabled) {
			styles.background = `repeating-linear-gradient(
				0deg,
				rgba(0, 0, 0, ${scanlinesOptions.opacity || 0.2}) 0px,
				rgba(0, 0, 0, ${scanlinesOptions.opacity || 0.2}) 1px,
				transparent 1px,
				transparent ${scanlinesOptions.spacing || 4}px
			)`;
		}

		if (borderGlow?.enabled) {
			styles.boxShadow = `0 0 ${borderGlow.intensity}px ${borderGlow.color}`;
		}

		if (holographicEffect?.enabled) {
			styles.background = `linear-gradient(
				45deg,
				${holographicEffect.color} ${holographicEffect.intensity}%,
				transparent ${holographicEffect.intensity + 20}%
			)`;
		}

		return styles;
	};

	return (
		<>
			{/* Filtro SVG para efecto 3D */}
			<svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true" focusable="false">
				<filter id={filterId}>
					<feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
					<feOffset in="blur" dx="0" dy="4" result="offsetBlur" />
					<feComponentTransfer in="offsetBlur" result="contrast">
						<feFuncA type="linear" slope="1.4" intercept="0" />
					</feComponentTransfer>
					<feFlood floodColor="rgba(0,0,0,0.35)" result="color" />
					<feComposite in="color" in2="contrast" operator="in" result="shadow" />
					<feMerge>
						<feMergeNode in="shadow" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</svg>

			{/* Contenedor principal */}
			<div
				className={cn('relative card-wrapper', isExploded ? 'exploded-card-wrapper' : '', className)}
				data-exploded={isExploded}
				style={{
					...getVisualEffectsStyle(),
					...getStateStyles(),
					...getAdvancedEffectsStyle(),
					position: 'relative',
					zIndex: 1,
				}}
			>
				{/* Contenedor de la tarjeta */}
				<CardContainer
					id="card-container"
					isHovered={isHovered}
					isExploded={isExploded}
					transformStyle={{
						...getCardTransform(),
						...getShadowStyle(),
						...getBlurEffect(),
					}}
					rarityBorderStyle={getRarityBorderStyle()}
					filterId={filterId}
					enable3DEffect={completeOptions.enable3DEffect}
					disabled={!!completeOptions.enableDisabled}
					rounded={completeOptions.cardRoundedSize || 'md'}
					borderSize={completeOptions.cardBorderSize || 'sm'}
					onHoverStart={handleHoverStart}
					onHoverEnd={handleHoverEnd}
					onMouseMove={handleMouseMove}
					onClick={handleCardClick}
				>
					{/* Capa de contenido principal */}
					<div
						className={cn('relative z-10 h-full pointer-events-auto', isExploded ? 'exploded-layer layer-content' : '')}
						style={{
							...(isExploded ? getExplodeLayerTransform(0) : {}),
							...getAdvancedEffectsStyle(),
						}}
						data-layer-active={activeLayer === 'content' || null}
					>
						{children}
					</div>

					{/* Capas de efectos en orden de renderizado */}
					{/* 1. Efectos de fondo */}
					{completeOptions.effects?.patterns?.enabled && (
						<>
							<DotsPattern
								isExploded={isExploded}
								isHovered={isHovered}
								activeLayer={activeLayer}
								getExplodeLayerTransform={getExplodeLayerTransform}
								options={completeOptions.effects.patterns.dots}
							/>
							<GridPattern
								isExploded={isExploded}
								isHovered={isHovered}
								activeLayer={activeLayer}
								getExplodeLayerTransform={getExplodeLayerTransform}
								options={completeOptions.effects.patterns.grid}
							/>
							<HexagonPattern
								isExploded={isExploded}
								isHovered={isHovered}
								activeLayer={activeLayer}
								getExplodeLayerTransform={getExplodeLayerTransform}
								options={completeOptions.effects.patterns.hexagons}
							/>
							<LinesPattern
								isExploded={isExploded}
								isHovered={isHovered}
								activeLayer={activeLayer}
								getExplodeLayerTransform={getExplodeLayerTransform}
								options={completeOptions.effects.patterns.lines}
							/>
						</>
					)}

					{/* 2. Efectos de textura y grano */}
					{completeOptions.enableGrainEffect && (
						<GrainEffectLayer
							isExploded={isExploded}
							isHovered={isHovered}
							activeLayer={activeLayer}
							getExplodeLayerTransform={getExplodeLayerTransform}
							texture={texture}
							options={completeOptions.grainOptions}
							visibleOnHover={completeOptions.grainOptions?.visibleOnHover}
						/>
					)}

					{completeOptions.effects?.noiseTexture?.enabled && (
						<NoiseTextureLayer
							isExploded={isExploded}
							isHovered={isHovered}
							activeLayer={activeLayer}
							getExplodeLayerTransform={getExplodeLayerTransform}
							options={completeOptions.effects.noiseTexture}
						/>
					)}

					{/* 3. Efectos de distorsión */}
					{completeOptions.effects?.glitchEffect?.enabled && (
						<GlitchEffectLayer
							isExploded={isExploded}
							isHovered={isHovered}
							activeLayer={activeLayer}
							getExplodeLayerTransform={getExplodeLayerTransform}
							options={completeOptions.effects.glitchEffect}
						/>
					)}

					{completeOptions.effects?.chromaticAberration?.enabled && (
						<ChromaticAberrationLayer
							isExploded={isExploded}
							isHovered={isHovered}
							activeLayer={activeLayer}
							getExplodeLayerTransform={getExplodeLayerTransform}
							options={completeOptions.effects.chromaticAberration}
						/>
					)}

					{completeOptions.effects?.pixelate?.enabled && (
						<PixelateLayer
							isExploded={isExploded}
							isHovered={isHovered}
							activeLayer={activeLayer}
							getExplodeLayerTransform={getExplodeLayerTransform}
							options={completeOptions.effects.pixelate}
						/>
					)}

					{/* 4. Efectos de brillo y halo */}
					{completeOptions.enableGlowEffect && (
						<GlowEffectLayer
							isExploded={isExploded}
							isHovered={isHovered}
							activeLayer={activeLayer}
							getExplodeLayerTransform={getExplodeLayerTransform}
							mousePosition={mousePosition}
							glowConfig={{
								color: rarity?.glowColor || `rgba(${completeOptions.primaryColor}, 0.35)`,
								intensity: completeOptions.glowOptions?.intensity || 1.2,
								size: completeOptions.glowOptions?.size || 120,
								animationType: completeOptions.glowOptions?.animationType || 'follow-mouse',
							}}
							options={completeOptions.glowOptions}
							visibleOnHover={completeOptions.glowOptions?.visibleOnHover}
						/>
					)}

					{/* 5. Efectos de borde */}
					{(completeOptions.enableAnimatedBorder ||
						(completeOptions.borderOptions?.animation && completeOptions.borderOptions.animation.type !== 'none')) && (
						<AnimatedBorderLayer
							isExploded={isExploded}
							isHovered={isHovered}
							activeLayer={activeLayer}
							getExplodeLayerTransform={getExplodeLayerTransform}
							borderConfig={{
								color: rarity?.color || `rgba(${completeOptions.primaryColor}, 0.7)`,
								width: rarity?.borderWidth
									? typeof rarity.borderWidth === 'string'
										? Number.parseInt(rarity.borderWidth)
										: rarity.borderWidth
									: completeOptions.borderOptions?.width || 2,
								pattern: completeOptions.borderOptions?.pattern || 'solid',
								animationType:
									rarity?.borderEffect === 'animated' ? 'flow' : completeOptions.borderOptions?.animationType || 'none',
								animation: {
									type:
										rarity?.borderEffect === 'animated'
											? 'flow'
											: completeOptions.borderOptions?.animation?.type || 'none',
									duration: completeOptions.borderOptions?.animation?.duration || 3000,
									timing: completeOptions.borderOptions?.animation?.timing || 'linear',
									iteration: completeOptions.borderOptions?.animation?.iteration || 'infinite',
								},
								glowColor: rarity?.glowColor || completeOptions.borderOptions?.glowColor,
								glowIntensity: completeOptions.borderOptions?.glowIntensity || 8,
							}}
							visibleOnHover={completeOptions.borderOptions?.glowOnHover}
						/>
					)}

					{/* 6. Efectos de escaneo */}
					{(completeOptions.enableScanlines || completeOptions.enableScanlinesEffect) && (
						<ScanlinesLayer
							isExploded={isExploded}
							isHovered={isHovered}
							activeLayer={activeLayer}
							getExplodeLayerTransform={getExplodeLayerTransform}
							options={completeOptions.scanlinesOptions}
							visibleOnHover={completeOptions.scanlinesOptions?.visibleOnHover}
						/>
					)}

					{/* 7. Efectos holográficos */}
					{completeOptions.enableHolographicEffect && (
						<HolographicLayer
							isExploded={isExploded}
							isHovered={isHovered}
							primaryColor={`rgba(${completeOptions.primaryColor}, 0.1)`}
							secondaryColor={`rgba(${completeOptions.secondaryColor}, 0.2)`}
							mousePosition={mousePosition}
							activeLayer={activeLayer}
							getExplodeLayerTransform={getExplodeLayerTransform}
							options={completeOptions.holographicOptions}
							visibleOnHover={completeOptions.holographicOptions?.visibleOnHover}
						/>
					)}

					{/* 8. Shaders */}
					{completeOptions.effects?.shaders?.enabled && (
						<>
							<DistortionShader
								isExploded={isExploded}
								isHovered={isHovered}
								activeLayer={activeLayer}
								getExplodeLayerTransform={getExplodeLayerTransform}
								options={completeOptions.effects.shaders.distortion}
							/>
							<HologramShader
								isExploded={isExploded}
								isHovered={isHovered}
								activeLayer={activeLayer}
								getExplodeLayerTransform={getExplodeLayerTransform}
								options={completeOptions.effects.shaders.hologram}
							/>
							<ParticleShader
								isExploded={isExploded}
								isHovered={isHovered}
								activeLayer={activeLayer}
								getExplodeLayerTransform={getExplodeLayerTransform}
								options={completeOptions.effects.shaders.particles}
							/>
							<WaveShader
								isExploded={isExploded}
								isHovered={isHovered}
								activeLayer={activeLayer}
								getExplodeLayerTransform={getExplodeLayerTransform}
								options={completeOptions.effects.shaders.waves}
							/>
						</>
					)}

					{/* 9. Filtros */}
					{completeOptions.effects?.filters?.enabled && (
						<>
							<DistortionFilter
								isExploded={isExploded}
								isHovered={isHovered}
								activeLayer={activeLayer}
								getExplodeLayerTransform={getExplodeLayerTransform}
								options={completeOptions.effects.filters.distortion}
							/>
							<GlowFilter
								isExploded={isExploded}
								isHovered={isHovered}
								activeLayer={activeLayer}
								getExplodeLayerTransform={getExplodeLayerTransform}
								options={completeOptions.effects.filters.glow}
							/>
							<ShadowFilter
								isExploded={isExploded}
								isHovered={isHovered}
								activeLayer={activeLayer}
								getExplodeLayerTransform={getExplodeLayerTransform}
								options={completeOptions.effects.filters.shadow}
							/>
						</>
					)}
				</CardContainer>

				{/* Controles de visualización */}
				{showVisualizationConfig && (
					<div className="absolute top-2 right-2 z-50">
						<Button
							size="icon"
							variant="ghost"
							onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
								e.stopPropagation();
								onVisualizationConfigClick?.(e);
							}}
							className="h-7 w-7 bg-background/80 backdrop-blur-sm"
						>
							<Layers className="h-4 w-4" />
						</Button>
					</div>
				)}

				{/* Controles de explosión */}
				{enableExplode && explodeLayers.length > 0 && (
					<div className="absolute bottom-2 right-2 z-50">
						<div className="flex items-center gap-2">
							{/* Botón para alternar vista explosionada */}
							<Button
								size="sm"
								variant={isExploded ? 'default' : 'outline'}
								onClick={() => {
									toggleExploded();
								}}
								className="h-7 py-0 px-2 text-xs"
							>
								{isExploded ? 'Ver normal' : 'Explosionar'}
							</Button>

							{/* Controles de capas (solo visible en modo explotado) */}
							{isExploded && (
								<div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-md">
									{explodeLayers.map((layer: { id: string; icon: React.ReactNode }) => (
										<Button
											key={layer.id}
											size="icon"
											variant={activeLayer === layer.id ? 'default' : 'ghost'}
											className="h-6 w-6"
											onClick={() => {
												handleLayerClick(layer.id);
											}}
										>
											{layer.icon}
										</Button>
									))}
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</>
	);
}
