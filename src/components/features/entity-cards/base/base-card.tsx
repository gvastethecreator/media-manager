'use client';

import { DEFAULT_SETTINGS_OPTIONS } from '@/components/features/entity-cards/settings/card-config-defaults';
import { Button } from '@/components/ui/button';
import type { ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';
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
import { AnimatedBorderLayer } from '../layers/animated-border-layer';
import { CardContainer } from '../layers/card-container';
import { GlowEffectLayer } from '../layers/glow-effect-layer';
import { GrainEffectLayer } from '../layers/grain-effect-layer';
import { HolographicLayer } from '../layers/holographic-layer';
import { ScanlinesLayer } from '../layers/scanlines-layer';
import type { CardOptions as SettingsCardOptions } from '../settings/card-settings-types';
import type { BaseCardOptions } from '../types/card-types';
import { adaptSettingsToBaseOptions, isSettingsCardOptions } from './card-adapter';
import { Exploder } from './exploder';

// Importamos el archivo CSS de animaciones
import './card-animations.css';

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
	const adaptedOptions = isSettingsCardOptions(options)
		? adaptSettingsToBaseOptions(options as SettingsCardOptions)
		: options;

	// Mezclamos las opciones por defecto con las proporcionadas
	const completeOptions = {
		...DEFAULT_SETTINGS_OPTIONS,
		...adaptedOptions,
	};

	// Estado local
	const [isHovered, setIsHovered] = React.useState(false);
	const [mousePosition, setMousePosition] = React.useState({ x: 0.5, y: 0.5 });
	const [rotateX, setRotateX] = React.useState(0);
	const [rotateY, setRotateY] = React.useState(0);

	// Estado controlado/no controlado para explosión
	const [localIsExploded, setLocalIsExploded] = React.useState(false);
	const isExploded = externalIsExploded !== undefined ? externalIsExploded : localIsExploded;

	// Estado controlado/no controlado para capa activa
	const [localActiveLayer, setLocalActiveLayer] = React.useState<string | null>(null);
	const activeLayer = externalActiveLayer !== undefined ? externalActiveLayer : localActiveLayer;

	// Filtro SVG para efecto 3D (podría extraerse a un componente)
	const filterId = React.useId();

	// Gestionar cambios en la posición del ratón
	const handleMouseMove = React.useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!isExploded && completeOptions.enable3DEffect) {
				const rect = e.currentTarget.getBoundingClientRect();
				const x = (e.clientX - rect.left) / rect.width;
				const y = (e.clientY - rect.top) / rect.height;

				setMousePosition({ x, y });

				// Calcular rotación basada en la posición del ratón
				const rotateYValue = ((x - 0.5) * (completeOptions.maxRotation ?? 15)).toFixed(2);
				const rotateXValue = ((y - 0.5) * -(completeOptions.maxRotation ?? 15)).toFixed(2);

				setRotateX(Number.parseFloat(rotateXValue));
				setRotateY(Number.parseFloat(rotateYValue));
			}
		},
		[isExploded, completeOptions.enable3DEffect, completeOptions.maxRotation]
	);

	// Gestionar eventos de hover
	const handleHoverStart = React.useCallback(() => {
		setIsHovered(true);
		onHoverStart?.();
	}, [onHoverStart]);

	const handleHoverEnd = React.useCallback(() => {
		setIsHovered(false);
		setRotateX(0);
		setRotateY(0);
		onHoverEnd?.();
	}, [onHoverEnd]);

	// Gestionar eventos de explosión
	const toggleExploded = React.useCallback(() => {
		const newValue = !isExploded;
		setLocalIsExploded(newValue);
		onExplodedChange?.(newValue);
	}, [isExploded, onExplodedChange]);

	// Gestionar cambio de capa activa
	const handleLayerClick = React.useCallback(
		(layerId: string) => {
			const newActiveLayer = activeLayer === layerId ? null : layerId;
			setLocalActiveLayer(newActiveLayer);
			onActiveLayerChange?.(newActiveLayer);
		},
		[activeLayer, onActiveLayerChange]
	);

	// Crear estilos 3D basados en estado
	const getCardTransform = React.useCallback(() => {
		// Si está explotada, no aplicamos transformación 3D
		if (isExploded) {
			return { transform: 'none' };
		}

		// Si 3D está desactivado, solo aplicamos levantamiento en hover
		if (!completeOptions.enable3DEffect) {
			return {
				transform: isHovered ? `translateY(-${completeOptions.hoverLiftHeight}px)` : 'none',
			};
		}

		// Transformación 3D completa
		return {
			transform: isHovered
				? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-${completeOptions.hoverLiftHeight}px)`
				: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)',
		};
	}, [isExploded, isHovered, rotateX, rotateY, completeOptions.enable3DEffect, completeOptions.hoverLiftHeight]);

	// Crear estilo de borde para rarezas
	const getRarityBorderStyle = React.useCallback(() => {
		if (!rarity || !(completeOptions.raritySystem || completeOptions.enableBorderEffect)) {
			return {};
		}

		return {
			borderColor: rarity.color,
			borderWidth: rarity.borderWidth || '2px',
			boxShadow: isHovered && rarity.glowColor ? `0 0 10px ${rarity.glowColor}` : 'none',
		};
	}, [rarity, isHovered, completeOptions.raritySystem, completeOptions.enableBorderEffect]);

	// Función para transformar capas en modo explodado
	const getExplodeLayerTransform: ExplodeLayerTransformFunction = React.useCallback(
		(layerIndex: number) => {
			if (!isExploded) {
				return {};
			}

			// Crear un desplazamiento para la capa basado en su índice
			// Cada capa se separa más que la anterior
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
			>
				{/* Contenedor de la tarjeta */}
				<CardContainer
					id="card-container"
					isHovered={isHovered}
					isExploded={isExploded}
					transformStyle={getCardTransform()}
					rarityBorderStyle={getRarityBorderStyle()}
					filterId={filterId}
					enable3DEffect={completeOptions.enable3DEffect}
					onHoverStart={handleHoverStart}
					onHoverEnd={handleHoverEnd}
					onMouseMove={handleMouseMove}
					onClick={onClick}
				>
					{/* Capa de contenido principal */}
					<div
						className={cn('relative z-10 h-full pointer-events-auto', isExploded ? 'exploded-layer layer-content' : '')}
						style={isExploded ? getExplodeLayerTransform(0) : {}}
						data-layer-active={activeLayer === 'content' || null}
					>
						{children}
					</div>

					{/* Capa de escaneo (scanlines) */}
					{(completeOptions.enableScanlines || completeOptions.enableScanlinesEffect) && (
						<ScanlinesLayer
							isExploded={isExploded}
							isHovered={isHovered}
							activeLayer={activeLayer}
							getExplodeLayerTransform={getExplodeLayerTransform}
							options={completeOptions.scanlinesOptions}
						/>
					)}

					{/* Capa holográfica */}
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
						/>
					)}

					{/* Capa de grano/textura */}
					{completeOptions.enableGrainEffect && (
						<GrainEffectLayer
							isExploded={isExploded}
							isHovered={isHovered}
							activeLayer={activeLayer}
							getExplodeLayerTransform={getExplodeLayerTransform}
							texture={texture}
							options={completeOptions.grainOptions}
						/>
					)}

					{/* Capa de halo luminoso */}
					{completeOptions.enableGlowEffect && (
						<GlowEffectLayer
							isExploded={isExploded}
							isHovered={isHovered}
							activeLayer={activeLayer}
							getExplodeLayerTransform={getExplodeLayerTransform}
							mousePosition={mousePosition}
							glowConfig={{
								color: rarity?.glowColor || `rgba(${completeOptions.primaryColor}, 0.35)`,
								intensity: 1.2,
								size: 120,
								animationType: 'follow-mouse',
							}}
							options={completeOptions.glowOptions}
						/>
					)}

					{/* Capa de borde animado */}
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
									: 2,
								pattern: 'solid',
								animationType: rarity?.borderEffect === 'animated' ? 'flow' : 'none',
								animation: {
									type: rarity?.borderEffect === 'animated' ? 'flow' : 'none',
									duration: 3000,
									timing: 'linear',
									iteration: 'infinite',
								},
								glowColor: rarity?.glowColor,
								glowIntensity: 8,
							}}
						/>
					)}
				</CardContainer>

				{/* Controles de visualización */}
				{showVisualizationConfig && (
					<div className="absolute top-2 right-2 z-50">
						<Button
							size="icon"
							variant="ghost"
							// @ts-ignore - Solución temporal para problema de tipo con button
							onClick={(e) => {
								e.stopPropagation();
								onVisualizationConfigClick?.(e as React.MouseEvent<HTMLButtonElement>);
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
