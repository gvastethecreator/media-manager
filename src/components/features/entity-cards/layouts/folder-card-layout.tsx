'use client';

import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/format';
import type { Folder } from '@/types/entities/folders';
import { FileIcon, FolderIcon, Layers3 } from 'lucide-react';
import { Fragment } from 'react';
import { EntityCardWrapper } from '../entity-card-wrapper';
import { usePreset } from '../hooks/use-preset';
import type { CardDesignPreset, CardOptions, RarityConfig } from '../types/base-card-types';
import type { CardOptions as CardOptionsType } from '../types/card-settings-types';

// Opciones visuales optimizadas para un mejor rendimiento
const _DEFAULT_FOLDER_OPTIONS: Partial<CardOptions> = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: false,

	// Configuración de diseño específica para carpetas
	designSystem: {
		preset: 'folder' as CardDesignPreset,
		variant: 'default',
		aspectRatio: '7/10',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 2,
		shadowStyle: 'soft',
	},

	// Efectos específicos para carpetas
	holographicOptions: {
		patternType: 'geometric',
		intensity: 0.4,
		animationSpeed: 1,
		visibleOnHover: true,
	},

	glowOptions: {
		intensity: 0.5,
		size: 15,
		blurAmount: 10,
		animationType: 'pulse',
		pulseSpeed: 2,
		visibleOnHover: true,
	},

	borderOptions: {
		width: 2,
		pattern: 'solid',
		animationType: 'pulse',
		animation: {
			type: 'flow',
			duration: 3000,
			timing: 'ease-in-out',
			iteration: 'infinite',
		},
		glowIntensity: 0.5,
	},

	grainOptions: {
		intensity: 0.1,
		density: 0.5,
		contrast: 1,
		noise: 'subtle',
		animated: false,
		visibleOnHover: true,
	},
};

// Define rarity levels for folders
const FOLDER_RARITY = {
	common: {
		color: '#9ca3af',
		borderColor: 'rgba(156, 163, 175, 0.5)',
		glowColor: 'rgba(156, 163, 175, 0.5)',
		label: 'Básica',
		rarity: 'common' as const,
	},
	uncommon: {
		color: '#22c55e',
		borderColor: 'rgba(34, 197, 94, 0.5)',
		glowColor: 'rgba(34, 197, 94, 0.5)',
		label: 'Notable',
		rarity: 'uncommon' as const,
	},
	rare: {
		color: '#3b82f6',
		borderColor: 'rgba(59, 130, 246, 0.5)',
		glowColor: 'rgba(59, 130, 246, 0.5)',
		label: 'Avanzada',
		rarity: 'rare' as const,
	},
	legendary: {
		color: '#eab308',
		borderColor: 'rgba(234, 179, 8, 0.7)',
		glowColor: 'rgba(234, 179, 8, 0.7)',
		label: 'Premium',
		rarity: 'legendary' as const,
	},
};

interface FolderCardProps {
	folder: Folder;
	onEdit?: (folder: Folder) => void;
	onDelete?: (id: string) => void;
	onClick?: () => void;
	className?: string;
	showVisualConfig?: boolean;
	visualOptions?: Partial<CardOptions>;
}

function getFolderRarity(imageCount: number): keyof typeof FOLDER_RARITY {
	if (imageCount >= 100) {
		return 'legendary';
	}
	if (imageCount >= 50) {
		return 'rare';
	}
	if (imageCount >= 20) {
		return 'uncommon';
	}
	return 'common';
}

function generateFolderRarityConfig(folder: Folder): RarityConfig {
	// Determinar rareza basada en el número de imágenes
	const imageCount = folder.imageCount || 0;
	const rarityKey = getFolderRarity(imageCount);
	const rarity = FOLDER_RARITY[rarityKey];

	return {
		color: rarity.color,
		borderColor: rarity.borderColor,
		glowColor: rarity.glowColor,
		label: rarity.label,
	};
}

export interface FolderCardLayoutProps {
	folder: Folder;
	onClick?: () => void;
	className?: string;
	showVisualConfig?: boolean;
	onVisualConfigClick?: () => void;
	enableExplode?: boolean;
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
	options?: Partial<CardOptionsType>;
}

/**
 * Layout específico para renderizar carpetas como tarjetas estilo Magic
 * Este componente utiliza EntityCardWrapper para la integración con el sistema de tarjetas
 */
export function FolderCardLayout({
	folder,
	onClick,
	className,
	showVisualConfig = false,
	onVisualConfigClick,
	enableExplode = false,
	isExploded,
	activeLayer,
	onExplodedChange,
	onActiveLayerChange,
	options = {},
}: FolderCardLayoutProps) {
	// Verificar si folder existe y tiene un id
	if (!folder || !folder.id) {
		console.error('Error: La carpeta es undefined o no tiene un id');
		return (
			<div className="error-card p-4 border border-red-500 rounded-md">
				<h3 className="text-red-500 font-medium">Error de datos</h3>
				<p className="text-sm text-gray-500">No se pudo cargar la información de la carpeta</p>
			</div>
		);
	}

	// Usar el hook para obtener configuración de preset si existe
	const { cardOptions } = usePreset({
		entityType: 'folder',
		entityId: folder.id,
		presetId: folder.presetId || null,
		baseOptions: options,
	});

	// Configurar las capas para el modo explode
	const explodeLayers = [
		{
			id: 'background',
			label: 'Fondo',
			icon: <Layers3 className="h-4 w-4" />,
		},
		{
			id: 'frame',
			label: 'Marco',
			icon: <FolderIcon className="h-4 w-4" />,
		},
		{
			id: 'content',
			label: 'Contenido',
			icon: <FileIcon className="h-4 w-4" />,
		},
	];

	// En lugar de forzar tipos, usamos destructuring y reconstruimos el objeto
	// para evitar problemas de incompatibilidad de tipos
	const {
		enable3DEffect,
		enableHolographicEffect,
		enableScanlinesEffect,
		enableGlowEffect,
		enableBorderEffect,
		enableGrainEffect,
		designSystem,
		holographicOptions,
		glowOptions,
		borderOptions,
		grainOptions,
		...restOptions
	} = cardOptions;

	// Crear un nuevo objeto compatible
	const compatibleOptions = {
		enable3DEffect,
		enableHolographicEffect,
		enableScanlinesEffect,
		enableGlowEffect,
		enableBorderEffect,
		enableGrainEffect,
		designSystem: designSystem
			? {
					...designSystem,
					// Asegurarnos de que preset sea compatible
					preset: designSystem.preset as CardDesignPreset,
				}
			: undefined,
		holographicOptions,
		glowOptions,
		borderOptions,
		grainOptions,
		...restOptions,
	};

	return (
		<EntityCardWrapper
			className={cn('folder-card', className)}
			entityType="folder"
			entityId={folder.id}
			title={folder.name}
			description={folder.description || ''}
			options={compatibleOptions}
			onClick={onClick}
			showVisualConfig={showVisualConfig}
			onVisualConfigClick={onVisualConfigClick}
			enableExplode={enableExplode}
			isExploded={isExploded}
			activeLayer={activeLayer}
			onExplodedChange={onExplodedChange}
			onActiveLayerChange={onActiveLayerChange}
		>
			<div className="folder-card-content">
				{/* Encabezado de la tarjeta */}
				<div className="folder-card-header">
					<div className="folder-card-title-container">
						{folder.emoji && <span className="folder-card-emoji">{folder.emoji}</span>}
						<h3 className="folder-card-title">{folder.name}</h3>
					</div>

					{/* Tipo de tarjeta (al estilo Magic) */}
					<div className="folder-card-type-line">
						Carpeta {folder.totalFiles > 0 && `• ${folder.totalFiles} archivos`}
					</div>
				</div>

				{/* Cuerpo de la tarjeta */}
				<div className="folder-card-body">
					{folder.description && <p className="folder-card-description">{folder.description}</p>}

					{/* Lista de metadatos */}
					<div className="folder-card-metadata">
						{folder.totalSize > 0 && (
							<Fragment>
								<span className="folder-card-metadata-label">Tamaño:</span>
								<span className="folder-card-metadata-value">{formatFileSize(folder.totalSize)}</span>
							</Fragment>
						)}

						{folder.lastIndexed && (
							<Fragment>
								<span className="folder-card-metadata-label">Última indexación:</span>
								<span className="folder-card-metadata-value">{new Date(folder.lastIndexed).toLocaleDateString()}</span>
							</Fragment>
						)}

						{folder.path && (
							<Fragment>
								<span className="folder-card-metadata-label">Ruta:</span>
								<span className="folder-card-metadata-value folder-card-path">{folder.path}</span>
							</Fragment>
						)}
					</div>
				</div>

				{/* Pie de la tarjeta (al estilo Magic) */}
				<div className="folder-card-footer">
					<div className="folder-card-creator-line">
						<span>{`Creada: ${new Date(folder.createdAt).toLocaleDateString()}`}</span>
					</div>
				</div>
			</div>
		</EntityCardWrapper>
	);
}
