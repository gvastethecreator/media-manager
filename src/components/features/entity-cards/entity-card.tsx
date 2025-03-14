'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type * as React from 'react';
import { useState } from 'react';
import { CardContainer } from './layers/card-container';
import { LayerRenderer } from './layers/layer-plugin-system';
import type { BaseLayerConfig } from './layers/layer-plugin-system';
import { BacksideLayer } from './modules/backside';
import type { ColorPalette } from './modules/colors';
import { CoreLayer } from './modules/core';
import type { CoreConfig } from './modules/core/core-config';
import { ImageGrid, type ImageGridImage, type ImageGridLayout, type ImageGridStyle } from './modules/image-grid';
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
