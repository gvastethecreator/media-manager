'use client';

import type { RarityConfig, TextureConfig } from '@/components/features/entity-cards/types/base-card-types';
import type { CardOptions } from '@/components/features/entity-cards/types/card-settings-types';
import * as React from 'react';
import { EntityCardPreview } from './entity-card-preview';

// Interfaz para las props del adaptador
interface EntityPreviewAdapterProps {
	cardOptions: CardOptions;
	options?: CardOptions; // Soporte para ambas formas de pasar opciones
	rarity?: RarityConfig | null;
	texture?: TextureConfig | null;
	showInfo?: boolean;
	showBackside?: boolean;
	previewMode?: 'full' | 'thumbnail' | 'compact';
	entityType?: string;
	className?: string;
}

// Adaptador para convertir CardOptions a un formato seguro para BaseCard
function adaptCardOptionsForPreview(options: CardOptions): Partial<CardOptions> {
	// Asegurarnos de que las propiedades críticas estén definidas con valores predeterminados
	return {
		...options,
		raritySystem: options.raritySystem ?? true,
		textureSystem: options.textureSystem ?? true,
		categorySystem: options.categorySystem ?? false,
		enable3DEffect: options.enable3DEffect ?? true,
		enableHolographicEffect: options.enableHolographicEffect ?? true,
		enableScanlines: options.enableScanlines ?? true,
		enableLightHalo: options.enableLightHalo ?? true,
		enableAnimatedBorder: options.enableAnimatedBorder ?? true,
		enableGlowEffect: options.enableGlowEffect ?? true,
		enableGrainEffect: options.enableGrainEffect ?? false,
		scanlinesOptions: options.scanlinesOptions || {
			opacity: 0.2,
			spacing: 4,
			direction: 'horizontal',
			animated: true,
		},
		grainOptions: options.grainOptions || {
			intensity: 0.2,
			density: 0.5,
			noise: 'light',
			animated: false,
		},
		borderOptions: options.borderOptions || {
			width: 2,
			pattern: 'solid',
			animationType: 'pulse',
			animation: {
				type: 'pulse',
				duration: 3000,
				timing: 'linear',
				iteration: 'infinite',
			},
		},
		holographicOptions: options.holographicOptions || {
			intensity: 0.5,
			speed: 1,
			pattern: 'rainbow',
		},
		glowOptions: options.glowOptions || {
			color: 'auto',
			intensity: 0.5,
			blur: 15,
			animated: true,
		},
		// Asegurar que designSystem tenga valores predeterminados
		designSystem: {
			preset: 'default',
			variant: 'default',
			aspectRatio: '7/10',
			cornerStyle: 'rounded',
			cornerRadius: 12,
			elevation: 2,
			shadowStyle: 'soft',
			...(options.designSystem || {}),
		},
		// Asegurar que layerSystem tenga valores predeterminados
		layerSystem: {
			order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
			layerBlending: 'screen',
			layerSpacing: 2,
			...(options.layerSystem || {}),
		},
		// Asegurar que imageGridLayout tenga valores predeterminados
		imageGridLayout: options.imageGridLayout || 'quad',
		imageGridGap: options.imageGridGap ?? 4,
		imageGridStyle: options.imageGridStyle || 'standard',
		showImageCount: options.showImageCount ?? true,
		imageGridAspectRatio: options.imageGridAspectRatio || '1/1',
	};
}

/**
 * Adaptador para la vista previa de entidades
 * Garantiza la compatibilidad entre diferentes formatos de opciones
 */
export function EntityPreviewAdapter({
	cardOptions,
	options, // Soporte para ambas formas de pasar opciones
	rarity,
	texture,
	showInfo = true,
	showBackside = false,
	previewMode = 'full',
	entityType = 'card-album',
	className,
}: EntityPreviewAdapterProps) {
	// Usar cardOptions o options, lo que esté disponible
	const effectiveOptions = options || cardOptions;

	// Adaptamos las opciones para garantizar la compatibilidad
	const adaptedOptions = React.useMemo(() => adaptCardOptionsForPreview(effectiveOptions), [effectiveOptions]);

	// Añadir propiedades específicas según el modo de vista previa
	const previewOptions = React.useMemo(() => {
		let opts = { ...adaptedOptions };

		// Ajustar opciones según el modo de vista previa
		if (previewMode === 'thumbnail') {
			// Simplificar efectos para miniaturas
			opts.enableHolographicEffect = false;
			opts.enableScanlines = false;
			opts.enableGrainEffect = false;
			opts.enable3DEffect = false;
		} else if (previewMode === 'compact') {
			// Reducir efectos para vista compacta
			opts.enableGrainEffect = false;
			opts.enableScanlines = false;
		}

		return opts;
	}, [adaptedOptions, previewMode]);

	return (
		<EntityCardPreview
			cardOptions={previewOptions as CardOptions}
			rarity={rarity}
			texture={texture}
			entityType={entityType}
			className={className}
		/>
	);
}
