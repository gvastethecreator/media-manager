'use client';

import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';
import { EntityCard } from './entity-card';
import type { CardOptions } from './types/unified-card-types';

// Opciones por defecto para todas las tarjetas
const DEFAULT_CARD_OPTIONS: Partial<CardOptions> = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlines: false,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: false,
	designSystem: {
		preset: 'default',
		variant: 'default',
		aspectRatio: '1/1',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 2,
		shadowStyle: 'soft',
	},
	layerSystem: {
		order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
		layerBlending: 'normal',
		layerSpacing: 2,
	},
	primaryColor: '#3b82f6',
	secondaryColor: '#1d4ed8',
	hoverLiftHeight: 10,
	maxRotation: 15,
};

// Opciones específicas por tipo de entidad
const ENTITY_TYPE_OPTIONS: Record<string, Partial<CardOptions>> = {
	folder: {
		designSystem: {
			preset: 'folder',
			variant: 'default',
			aspectRatio: '7/10',
			cornerStyle: 'rounded',
			cornerRadius: 12,
			elevation: 2,
			shadowStyle: 'soft',
		},
		layerSystem: {
			order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
			layerBlending: 'screen',
			layerSpacing: 2,
		},
	},
	album: {
		designSystem: {
			preset: 'album',
			variant: 'default',
			aspectRatio: '1/1',
			cornerStyle: 'rounded',
			cornerRadius: 12,
			elevation: 2,
			shadowStyle: 'soft',
		},
	},
	tag: {
		designSystem: {
			preset: 'tag',
			variant: 'default',
			aspectRatio: '3/1',
			cornerStyle: 'rounded',
			cornerRadius: 12,
			elevation: 1,
			shadowStyle: 'soft',
		},
	},
	// Añadir más tipos según sea necesario
};

export interface EntityCardWrapperProps {
	entityType: string;
	entityId?: string;
	title?: string;
	description?: string;
	image?: string;
	options?: Partial<CardOptions>;
	className?: string;
	children?: React.ReactNode;
	onClick?: () => void;
	showVisualConfig?: boolean;
	onVisualConfigClick?: () => void;
	enableExplode?: boolean;
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
}

/**
 * Wrapper para EntityCard que maneja opciones por defecto según el tipo de entidad
 */
export function EntityCardWrapper({
	entityType,
	entityId,
	title,
	description,
	image,
	options = {},
	className,
	children,
	onClick,
	showVisualConfig = false,
	onVisualConfigClick,
	enableExplode = false,
	isExploded = false,
	activeLayer = null,
	onExplodedChange,
	onActiveLayerChange,
}: EntityCardWrapperProps) {
	// Estado para controlar la explosión de capas
	const [internalIsExploded, setInternalIsExploded] = useState(isExploded);
	const [internalActiveLayer, setInternalActiveLayer] = useState<string | null>(activeLayer);

	// Manejar cambios en el estado de explosión
	const handleExplodedChange = useCallback(
		(newIsExploded: boolean) => {
			setInternalIsExploded(newIsExploded);
			onExplodedChange?.(newIsExploded);
		},
		[onExplodedChange]
	);

	// Manejar cambios en la capa activa
	const handleActiveLayerChange = useCallback(
		(layerId: string | null) => {
			setInternalActiveLayer(layerId);
			onActiveLayerChange?.(layerId);
		},
		[onActiveLayerChange]
	);

	// Combinar opciones por defecto con opciones específicas del tipo y opciones proporcionadas
	const typeOptions = ENTITY_TYPE_OPTIONS[entityType] || {};
	const mergedOptions = {
		...DEFAULT_CARD_OPTIONS,
		...typeOptions,
		...options,
		// Asegurar que las propiedades anidadas se combinen correctamente
		designSystem: {
			...(DEFAULT_CARD_OPTIONS.designSystem || {}),
			...(typeOptions.designSystem || {}),
			...(options.designSystem || {}),
		},
		layerSystem: {
			...(DEFAULT_CARD_OPTIONS.layerSystem || {}),
			...(typeOptions.layerSystem || {}),
			...(options.layerSystem || {}),
		},
	};

	return (
		<EntityCard
			id={entityId}
			className={cn('entity-card-wrapper', className)}
			title={title}
			description={description}
			image={image}
			options={mergedOptions}
			enableLayers={enableExplode}
			enableDesign={true}
			enableAnimation={true}
			enableBackside={false}
			onClick={onClick}
			onError={(error) => console.error('Error en EntityCard:', error)}
		>
			{children}
		</EntityCard>
	);
}
