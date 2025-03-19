'use client';

import { cn } from '@/lib/utils';
import { useCallback, useRef, useState } from 'react';
import { EntityCard } from './entity-card';
import type { CardOptions } from './types/unified-card-types';
import type { CardError } from './utils/error-handler';

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
		primaryColor: '#3b82f6',
		secondaryColor: '#1d4ed8',
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
		primaryColor: '#ec4899',
		secondaryColor: '#db2777',
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
		primaryColor: '#8b5cf6',
		secondaryColor: '#7c3aed',
	},
	collection: {
		designSystem: {
			preset: 'collection',
			variant: 'default',
			aspectRatio: '3/2',
			cornerStyle: 'rounded',
			cornerRadius: 12,
			elevation: 3,
			shadowStyle: 'soft',
		},
		primaryColor: '#f97316',
		secondaryColor: '#ea580c',
	},
	character: {
		designSystem: {
			preset: 'character',
			variant: 'default',
			aspectRatio: '3/4',
			cornerStyle: 'rounded',
			cornerRadius: 12,
			elevation: 3,
			shadowStyle: 'soft',
		},
		primaryColor: '#ef4444',
		secondaryColor: '#dc2626',
	},
	place: {
		designSystem: {
			preset: 'place',
			variant: 'default',
			aspectRatio: '3/2',
			cornerStyle: 'rounded',
			cornerRadius: 12,
			elevation: 3,
			shadowStyle: 'soft',
		},
		primaryColor: '#0ea5e9',
		secondaryColor: '#06b6d4',
	},
	worldItem: {
		designSystem: {
			preset: 'worldItem',
			variant: 'default',
			aspectRatio: '3/2',
			cornerStyle: 'rounded',
			cornerRadius: 12,
			elevation: 3,
			shadowStyle: 'soft',
		},
		primaryColor: '#f59e0b',
		secondaryColor: '#d97706',
	},
	concept: {
		designSystem: {
			preset: 'concept',
			variant: 'default',
			aspectRatio: '3/2',
			cornerStyle: 'rounded',
			cornerRadius: 12,
			elevation: 3,
			shadowStyle: 'soft',
		},
		primaryColor: '#a855f7',
		secondaryColor: '#8b5cf6',
	},
	prompt: {
		designSystem: {
			preset: 'prompt',
			variant: 'default',
			aspectRatio: '3/2',
			cornerStyle: 'rounded',
			cornerRadius: 12,
			elevation: 3,
			shadowStyle: 'soft',
		},
		primaryColor: '#10b981',
		secondaryColor: '#059669',
	},
	note: {
		designSystem: {
			preset: 'note',
			variant: 'default',
			aspectRatio: '3/2',
			cornerStyle: 'rounded',
			cornerRadius: 12,
			elevation: 3,
			shadowStyle: 'soft',
		},
		primaryColor: '#ec4899',
		secondaryColor: '#db2777',
	},
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
	explodeLayers?: Array<{ id: string; label: string; icon?: React.ReactNode }>;
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
	explodeLayers,
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

	// Agregar un manejo de errores
	const [hasRenderError, setHasRenderError] = useState(false);
	const errorRef = useRef<CardError | null>(null);

	// Función para manejar errores de renderizado
	const handleRenderError = useCallback((error: CardError) => {
		console.error('Error de renderizado en EntityCard:', error);
		errorRef.current = error;
		setHasRenderError(true);
	}, []);

	// Si hay un error, mostrar una versión simplificada
	if (hasRenderError) {
		return (
			<div className="entity-card-error p-4 border border-destructive/50 rounded-lg flex flex-col h-full shadow-lg">
				<div className="text-destructive text-sm font-medium mb-2">
					Error de renderizado
				</div>
				<div className="text-xs text-muted-foreground mb-4">
					{errorRef.current?.message || 'Error desconocido'}
				</div>
				<div className="flex-1 flex items-center justify-center rounded bg-muted/30 overflow-hidden">
					{image ? (
						typeof image === 'string' ? (
							<img
								src={image}
								alt={title || 'Imagen'}
								className="object-cover h-full w-full"
							/>
						) : (
							<div className="grid grid-cols-2 gap-1 p-1 h-full w-full">
								{(image as Array<{ src?: string } | string>).slice(0, 4).map((img, idx) => (
									<img
										key={`img-${entityId || ''}-${idx}`}
										src={typeof img === 'string' ? img : img.src || ''}
										alt={`Imagen ${idx + 1}`}
										className="object-cover h-full w-full rounded-sm"
									/>
								))}
							</div>
						)
					) : (
						<div className="text-muted-foreground">Sin imagen</div>
					)}
				</div>
				<div className="mt-2 text-sm font-medium truncate">{title || 'Sin título'}</div>
				{description && (
					<div className="text-xs text-muted-foreground line-clamp-2 mt-1">{description}</div>
				)}
			</div>
		);
	}

	// Renderizado normal
	return (
		<EntityCard
			id={entityId}
			className={cn('entity-card-wrapper w-full h-full', className)}
			title={title}
			description={description}
			image={image}
			options={mergedOptions}
			enableLayers={enableExplode}
			enableDesign={true}
			enableAnimation={true}
			enableBackside={false}
			onClick={onClick}
			onError={handleRenderError}
		>
			{children}
		</EntityCard>
	);
}
