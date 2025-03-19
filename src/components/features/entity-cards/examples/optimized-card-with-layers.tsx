'use client';

/**
 * 🧠 Ejemplo de tarjeta optimizada con el sistema de capas
 *
 * Este componente muestra cómo integrar el sistema de capas optimizado
 * en una tarjeta de entidad con técnicas de memoización.
 */

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { EntityCardLayersIntegration } from '../modules/layers-module/entity-card-layers-integration';

// Interfaz para las propiedades del componente
interface OptimizedCardWithLayersProps {
	entityType: string;
	entityId?: string;
	title: string;
	subtitle?: string;
	imageUrl?: string;
	width?: number;
	height?: number;
	className?: string;
	cardOptions?: Record<string, unknown>;
	onClick?: () => void;
}

/**
 * Componente de tarjeta optimizado que utiliza el sistema de capas
 */
export function OptimizedCardWithLayers({
	entityType,
	entityId,
	title,
	subtitle,
	imageUrl,
	width = 300,
	height = 400,
	className,
	cardOptions,
	onClick,
}: OptimizedCardWithLayersProps) {
	// Estado para controlar hover y selección
	const [isHovered, setIsHovered] = useState(false);
	const [isActive, setIsActive] = useState(false);
	const [isExploded, setIsExploded] = useState(false);
	const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

	// Memoizar las opciones de la tarjeta para evitar rerenderizados
	const memoizedCardOptions = useMemo(() => {
		return {
			...cardOptions,
			// Podemos añadir opciones adicionales aquí
			layerSystem: {
				enabled: true,
				renderStrategy: 'stacked',
				compositionMode: 'normal',
				...(cardOptions?.layerSystem || {})
			},
		};
	}, [cardOptions]);

	// Handlers optimizados con useCallback
	const handleMouseEnter = useCallback(() => {
		setIsHovered(true);
	}, []);

	const handleMouseLeave = useCallback(() => {
		setIsHovered(false);
		// Resetear posición del ratón
		setMousePosition({ x: 50, y: 50 });
	}, []);

	const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		// Calcular posición relativa del ratón dentro de la tarjeta
		const rect = e.currentTarget.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		setMousePosition({ x, y });
	}, []);

	const handleClick = useCallback(() => {
		setIsActive(prev => !prev);
		onClick?.();
	}, [onClick]);

	const toggleExploded = useCallback(() => {
		setIsExploded(prev => !prev);
	}, []);

	// Contenido base de la tarjeta (podría ser memoizado si es complejo)
	const baseContent = (
		<div className="flex flex-col h-full">
			{/* Imagen (si existe) */}
			{imageUrl && (
				<div className="relative aspect-video overflow-hidden">
					<img
						src={imageUrl}
						alt={title}
						className="w-full h-full object-cover"
					/>
				</div>
			)}

			{/* Contenido */}
			<div className="flex-1 p-4">
				<h3 className="text-lg font-semibold">{title}</h3>
				{subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
			</div>

			{/* Botón de modo explotado (solo para debug) */}
			<button
				type="button"
				onClick={toggleExploded}
				className="absolute top-0 right-0 m-1 text-xs p-1 bg-gray-800 text-white rounded opacity-50 hover:opacity-100"
			>
				{isExploded ? '🔄 Normal' : '💥 Explode'}
			</button>
		</div>
	);

	return (
		<Card
			className={cn("relative overflow-hidden cursor-pointer", className)}
			style={{ width, height }}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onMouseMove={handleMouseMove}
			onClick={handleClick}
		>
			<EntityCardLayersIntegration
				entityType={entityType}
				entityId={entityId}
				cardOptions={memoizedCardOptions}
				isHovered={isHovered}
				isActive={isActive}
				isExploded={isExploded}
				mousePosition={mousePosition}
				className="h-full"
			>
				{baseContent}
			</EntityCardLayersIntegration>
		</Card>
	);
}

// Ejemplo de uso
export function LayerCardExampleGallery() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
			{/* Tarjeta de imagen con efectos de brillo y borde */}
			<OptimizedCardWithLayers
				entityType="image"
				entityId="img1"
				title="Imagen con efectos"
				subtitle="Brillo + borde + textura"
				imageUrl="https://source.unsplash.com/random/800x600/?nature"
				cardOptions={{
					layerConfigs: {
						glow: {
							enabled: true,
							color: 'rgba(0, 153, 255, 0.5)',
							intensity: 0.7
						},
						border: {
							enabled: true,
							width: 3,
							color: '#0099ff'
						}
					}
				}}
			/>

			{/* Tarjeta de carpeta con efectos de borde y scanlines */}
			<OptimizedCardWithLayers
				entityType="folder"
				entityId="folder1"
				title="Carpeta retro"
				subtitle="Borde + scanlines"
				imageUrl="https://source.unsplash.com/random/800x600/?folder"
				cardOptions={{
					layerConfigs: {
						border: {
							enabled: true,
							style: 'dashed',
							color: '#ff9900'
						},
						scanlines: {
							enabled: true,
							opacity: 0.3,
							direction: 'horizontal'
						}
					}
				}}
			/>

			{/* Tarjeta de álbum con textura */}
			<OptimizedCardWithLayers
				entityType="album"
				entityId="album1"
				title="Álbum con textura"
				subtitle="Textura de ruido + borde"
				imageUrl="https://source.unsplash.com/random/800x600/?album"
				cardOptions={{
					layerConfigs: {
						texture: {
							enabled: true,
							textureType: 'noise',
							opacity: 0.2
						},
						border: {
							enabled: true,
							radius: 12
						}
					}
				}}
			/>
		</div>
	);
}