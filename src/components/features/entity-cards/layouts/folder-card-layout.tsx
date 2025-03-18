'use client';

import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/format';
import type { Folder } from '@/types/entities/folders';
import { Calendar, Clock, FileIcon, FolderIcon, HardDrive, Image, Layers3 } from 'lucide-react';
import { useCallback } from 'react';
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
		designSystem: designSystem || {
			preset: 'folder',
			variant: 'default',
			aspectRatio: '7/10',
			cornerStyle: 'rounded',
			cornerRadius: 16,
		},
		holographicOptions,
		glowOptions,
		borderOptions,
		grainOptions,
		...restOptions,
		rarityConfig,
	};

	// Manejar el clic en la carpeta de manera segura
	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			// Si existe una función onClick, la llamamos
			if (onClick) {
				e.preventDefault();
				e.stopPropagation();
				onClick();
			}
		},
		[onClick]
	);

	return (
		<div
			className={cn(
				'folder-card-container relative w-full h-full group',
				rarityClass,
				onClick && 'cursor-pointer',
				className
			)}
			onClick={handleClick}
			role={onClick ? 'button' : undefined}
			tabIndex={onClick ? 0 : undefined}
			onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
		>
			<EntityCardWrapper
				title={folder.name}
				description={folder.description || ''}
				entity={folder}
				entityType="folder"
				className={cn('folder-card-wrapper relative w-full h-full', rarityClass)}
				options={compatibleOptions}
			>
				<div className="folder-card-content p-3 flex flex-col h-full w-full">
					{/* Cabecera de la tarjeta con emoji e información principal */}
					<div className="folder-card-header mb-2">
						<div className="folder-emoji text-2xl">{folder.emoji || <FolderIcon className="h-6 w-6" />}</div>
						<h3 className="folder-title text-base font-bold line-clamp-1 mt-1">{folder.name}</h3>
					</div>

					{/* Cuerpo de la tarjeta con información detallada */}
					<div className="folder-card-body flex-grow">
						<div className="folder-stats text-xs space-y-1">
							{/* Estadísticas principales */}
							<div className="flex items-center gap-1">
								<Image className="h-3 w-3 opacity-70" />
								<span className="flex-grow">{folder._count?.images || folder.imageCount || 0} imágenes</span>
							</div>

							{folder.totalSize !== undefined && (
								<div className="flex items-center gap-1">
									<HardDrive className="h-3 w-3 opacity-70" />
									<span className="flex-grow">{formatFileSize(folder.totalSize)}</span>
								</div>
							)}

							{/* Fecha de indexación */}
							{folder.lastIndexed && (
								<div className="flex items-center gap-1">
									<Clock className="h-3 w-3 opacity-70" />
									<span className="flex-grow text-xs">
										Indexado:{' '}
										{typeof folder.lastIndexed === 'string'
											? new Date(folder.lastIndexed).toLocaleDateString()
											: folder.lastIndexed.toLocaleDateString()}
									</span>
								</div>
							)}

							{/* Fecha de creación */}
							<div className="flex items-center gap-1">
								<Calendar className="h-3 w-3 opacity-70" />
								<span className="flex-grow text-xs">
									Creado:{' '}
									{typeof folder.createdAt === 'string'
										? new Date(folder.createdAt).toLocaleDateString()
										: folder.createdAt.toLocaleDateString()}
								</span>
							</div>
						</div>
					</div>

					{/* Pie de la tarjeta con acciones e información adicional */}
					<div className="folder-card-footer mt-2 text-xs flex items-center justify-between">
						<div className="folder-rarity">
							<span className="inline-block px-2 py-0.5 rounded-full bg-opacity-20 text-[10px]">
								{FOLDER_RARITY[rarityKey].label}
							</span>
						</div>
					</div>
				</div>
			</EntityCardWrapper>

			{/* Capa para manejo de clics que garantiza que toda el área sea clickeable */}
			{onClick && <div className="absolute inset-0 z-10 opacity-0" onClick={handleClick} aria-hidden="true" />}
		</div>
	);
}
