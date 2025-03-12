'use client';

import type { RarityConfig, TextureConfig } from '@/components/features/entity-cards/base/base-card-types';
import type { CardOptions } from '@/components/features/entity-cards/settings/card-settings-types';
import * as React from 'react';
import { EntityCardPreview } from './entity-card-preview';

// Adaptador para convertir CardOptions a un formato seguro para BaseCard
function adaptCardOptionsForPreview(options: CardOptions): Partial<CardOptions> {
	// Asegurarnos de que las propiedades críticas estén definidas con valores predeterminados
	return {
		...options,
		raritySystem: options.raritySystem,
		textureSystem: options.textureSystem,
		categorySystem: options.categorySystem,
		scanlinesOptions: options.scanlinesOptions || {
			opacity: 0.2,
			spacing: 4,
			direction: 'horizontal',
			animate: true,
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
	};
}

interface EntityPreviewAdapterProps {
	cardOptions: CardOptions;
	rarity?: RarityConfig | null;
	texture?: TextureConfig | null;
	showInfo?: boolean;
	className?: string;
	entityType?: string;
}

export function EntityPreviewAdapter({
	cardOptions,
	rarity,
	texture,
	showInfo = true,
	entityType = 'album',
	className,
}: EntityPreviewAdapterProps) {
	// Adaptamos las opciones para garantizar la compatibilidad
	const adaptedOptions = React.useMemo(() => adaptCardOptionsForPreview(cardOptions), [cardOptions]);

	return (
		<EntityCardPreview
			cardOptions={adaptedOptions as CardOptions}
			rarity={rarity}
			texture={texture}
			showInfo={showInfo}
			entityType={entityType}
			className={className}
		/>
	);
}
