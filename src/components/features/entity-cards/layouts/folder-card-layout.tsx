'use client';

import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/format';
import type { Folder } from '@/types/entities/folders';
import { Calendar, Clock, FileIcon, FolderIcon, HardDrive, Image, Layers3 } from 'lucide-react';
import { EntityCardWrapper } from '../entity-card-wrapper';
import { usePreset } from '../hooks/use-preset';
import '../styles/folder-card.css';
import type { CardDesignPreset, CardOptions, RarityConfig } from '../types/base-card-types';
import type { CardOptions as CardOptionsType } from '../types/card-settings-types';

// Define rarity levels for folders
const FOLDER_RARITY = {
	common: {
		color: '#9ca3af',
		borderColor: 'rgba(156, 163, 175, 0.8)',
		glowColor: 'rgba(156, 163, 175, 0.6)',
		label: 'Básica',
		rarity: 'common' as const,
	},
	uncommon: {
		color: '#22c55e',
		borderColor: 'rgba(34, 197, 94, 0.8)',
		glowColor: 'rgba(34, 197, 94, 0.6)',
		label: 'Notable',
		rarity: 'uncommon' as const,
	},
	rare: {
		color: '#3b82f6',
		borderColor: 'rgba(59, 130, 246, 0.8)',
		glowColor: 'rgba(59, 130, 246, 0.6)',
		label: 'Avanzada',
		rarity: 'rare' as const,
	},
	legendary: {
		color: '#eab308',
		borderColor: 'rgba(234, 179, 8, 0.8)',
		glowColor: 'rgba(234, 179, 8, 0.7)',
		label: 'Premium',
		rarity: 'legendary' as const,
	},
};

// Opciones visuales optimizadas para un mejor rendimiento
const _DEFAULT_FOLDER_OPTIONS: Partial<CardOptions> = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: true,

	// Configuración de diseño específica para carpetas
	designSystem: {
		preset: 'folder' as CardDesignPreset,
		variant: 'default',
		aspectRatio: '7/10',
		cornerStyle: 'rounded',
		cornerRadius: 16,
		elevation: 3,
		shadowStyle: 'soft',
	},

	// Efectos específicos para carpetas
	holographicOptions: {
		patternType: 'geometric',
		intensity: 0.5,
		animationSpeed: 1.2,
		visibleOnHover: true,
	},

	glowOptions: {
		intensity: 0.6,
		size: 20,
		blurAmount: 15,
		animationType: 'pulse',
		pulseSpeed: 2.5,
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
		glowIntensity: 0.7,
	},

	grainOptions: {
		intensity: 0.15,
		density: 0.6,
		contrast: 1.2,
		noise: 'subtle',
		animated: true,
		visibleOnHover: true,
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
 * Layout específico para renderizar carpetas como tarjetas estilo Magic/Pokémon TCG
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
	// Verificar si folder existe y tiene las propiedades necesarias
	if (!folder) {
		console.warn('FolderCardLayout: Se recibió un objeto folder indefinido');
		// Crear un folder por defecto para evitar errores
		folder = {
			id: 'placeholder',
			name: 'Carpeta sin nombre',
			path: '/placeholder',
			totalFiles: 0,
			totalSize: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
		} as Folder;
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
		{
			id: 'effects',
			label: 'Efectos',
			icon: <Image className="h-4 w-4" />,
		},
	];

	// Obtener la rareza de la carpeta
	const rarityConfig = generateFolderRarityConfig(folder);
	const rarityKey = getFolderRarity(folder.imageCount || 0);
	const rarityClass = `folder-card-rarity-${rarityKey}`;

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

	// Formatear la fecha de creación
	const formattedCreationDate = new Date(folder.createdAt).toLocaleDateString();

	// Formatear la fecha de última indexación
	const formattedLastIndexed = folder.lastIndexed ? new Date(folder.lastIndexed).toLocaleDateString() : 'No indexada';

	return (
		<EntityCardWrapper
			className={cn('folder-card w-full h-full', rarityClass, className)}
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
			<div className="folder-card-content h-full flex flex-col">
				{/* Encabezado de la tarjeta con banner de rareza */}
				<div className={cn('folder-card-header', `folder-header-${rarityKey}`)}>
					<div className="folder-card-title-container">
						{folder.emoji && <span className="folder-card-emoji">{folder.emoji}</span>}
						<h3 className="folder-card-title">{folder.name}</h3>
					</div>

					{/* Tipo de tarjeta con badge de rareza */}
					<div className="folder-card-type-line">
						<span className="folder-type">Carpeta</span>
						<span className={cn('folder-rarity-badge', `rarity-${rarityKey}`)}>{FOLDER_RARITY[rarityKey].label}</span>
					</div>
				</div>

				{/* Cuerpo de la tarjeta */}
				<div className="folder-card-body flex-1">
					{/* Descripción con estilo mejorado */}
					{folder.description && (
						<div className="folder-card-description-container">
							<p className="folder-card-description">{folder.description}</p>
						</div>
					)}

					{/* Estadísticas visuales */}
					<div className="folder-card-stats">
						<div className="folder-stat-item">
							<FileIcon className="folder-stat-icon" />
							<span className="folder-stat-value">{folder.totalFiles || 0}</span>
							<span className="folder-stat-label">archivos</span>
						</div>

						<div className="folder-stat-item">
							<Image className="folder-stat-icon" />
							<span className="folder-stat-value">{folder.imageCount || 0}</span>
							<span className="folder-stat-label">imágenes</span>
						</div>

						<div className="folder-stat-item">
							<HardDrive className="folder-stat-icon" />
							<span className="folder-stat-value">{formatFileSize(folder.totalSize || 0)}</span>
							<span className="folder-stat-label">tamaño</span>
						</div>
					</div>

					{/* Lista de metadatos con iconos */}
					<div className="folder-card-metadata">
						<div className="folder-metadata-item">
							<Calendar className="folder-metadata-icon" />
							<span className="folder-metadata-label">Creada:</span>
							<span className="folder-metadata-value">{formattedCreationDate}</span>
						</div>

						<div className="folder-metadata-item">
							<Clock className="folder-metadata-icon" />
							<span className="folder-metadata-label">Indexada:</span>
							<span className="folder-metadata-value">{formattedLastIndexed}</span>
						</div>

						{folder.path && (
							<div className="folder-metadata-item folder-path-item">
								<FolderIcon className="folder-metadata-icon" />
								<span className="folder-metadata-label">Ruta:</span>
								<span className="folder-metadata-value folder-card-path" title={folder.path}>
									{folder.path}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Pie de la tarjeta con borde decorativo */}
				<div className={cn('folder-card-footer', `folder-footer-${rarityKey}`)}>
					<div className="folder-card-creator-line">
						<span className="folder-id">ID: {folder.id.substring(0, 8)}</span>
					</div>
				</div>
			</div>
		</EntityCardWrapper>
	);
}
