'use client';

import { type RandomImage, getRandomImagesForEntity } from '@/app/actions/images/images-random.action';
import { VisualizationConfig } from '@/components/features/entity-cards/config/visualization-config';
import { EntityCardContent } from '@/components/features/entity-cards/entity-card-content';
import { EntityCardLayerWrapper } from '@/components/features/entity-cards/entity-card-layer-wrapper';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import type { Folder } from '@/types/entities/folders';
import {
	ArrowUpRight,
	CalendarClock,
	Clock,
	FolderIcon,
	FolderOpenIcon,
	HardDrive,
	ImageIcon,
	Sparkles,
	Star,
} from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useEffect, useState } from 'react';
import type { CardDesignPreset, CardOptions, RarityConfig } from '../types/base-card-types';

// Opciones visuales optimizadas para un mejor rendimiento
const DEFAULT_FOLDER_OPTIONS: Partial<CardOptions> = {
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
		rarity: rarityKey,
		color: rarity.color,
		borderColor: rarity.borderColor,
		glowColor: rarity.glowColor,
		label: rarity.label,
	};
}

export function FolderCard({
	folder,
	onEdit,
	onDelete,
	onClick,
	className,
	showVisualConfig = false,
	visualOptions,
}: FolderCardProps) {
	const [isHovered, setIsHovered] = useState(false);
	const [configOpen, setConfigOpen] = useState(false);
	const [cardOptions, setCardOptions] = useState<Partial<CardOptions>>({
		...DEFAULT_FOLDER_OPTIONS,
		...visualOptions,
	});
	const [folderImages, setFolderImages] = useState<RandomImage[]>([]);
	const [_loading, setLoading] = useState(false);

	// Calcular configuración de rareza
	const rarityConfig = generateFolderRarityConfig(folder);

	// Cargar imágenes de la carpeta
	useEffect(() => {
		const loadImages = async () => {
			if (!folder.id) {
				return;
			}

			try {
				setLoading(true);
				const images = await getRandomImagesForEntity({
					entityId: folder.id,
					entityType: 'folder',
					limit: 4,
				});

				if (images && images.length > 0) {
					setFolderImages(images);
				}
			} catch (error) {
				console.error('Error loading folder images:', error);
			} finally {
				setLoading(false);
			}
		};

		loadImages();
	}, [folder.id]);

	// Formatear fecha de creación/actualización
	const formattedDate = folder.updatedAt
		? new Date(folder.updatedAt).toLocaleDateString()
		: folder.createdAt
			? new Date(folder.createdAt).toLocaleDateString()
			: null;

	// Formatear tamaño
	const formattedSize = folder.size ? formatBytes(folder.size) : null;

	return (
		<>
			{configOpen && (
				<VisualizationConfig
					onClose={() => setConfigOpen(false)}
					options={cardOptions}
					onOptionsChange={setCardOptions}
					entityId={folder.id}
					entityType="folder"
				/>
			)}

			<div className={cn('min-h-[300px] relative', className)}>
				<EntityCardLayerWrapper
					title={folder.name || 'Carpeta'}
					description={folder.description || 'Sin descripción'}
					onClick={onClick}
					showVisualConfig={showVisualConfig}
					visualOptions={{
						...cardOptions,
						rarityConfig,
					}}
					entityType="folder"
					entityId={folder.id}
					onHoverStart={() => setIsHovered(true)}
					onHoverEnd={() => setIsHovered(false)}
					onConfigClick={() => setConfigOpen(true)}
				/>

				<EntityCardContent
					title={folder.name || 'Carpeta'}
					description={folder.description}
					isHovered={isHovered}
					isPreview={false}
					entityId={folder.id}
					onEdit={onEdit ? () => onEdit(folder) : undefined}
					onDelete={onDelete ? () => onDelete(folder.id) : undefined}
					icon={<FolderIcon className="h-5 w-5 text-blue-500" />}
					badges={[
						{
							key: 'type',
							label: folder.type || 'Carpeta',
							variant: 'secondary',
						},
						folder.isPublic !== undefined && {
							key: 'visibility',
							label: folder.isPublic ? 'Pública' : 'Privada',
							variant: 'outline',
						},
					].filter(Boolean)}
					className="p-4"
				>
					{/* Contenido personalizado para carpetas */}
					<div className="mt-4 space-y-3">
						{/* Grid de imágenes si hay disponibles */}
						{folderImages.length > 0 && (
							<div className="grid grid-cols-2 gap-1 h-32">
								{folderImages.map((img) => (
									<div
										key={img.id}
										className="bg-cover bg-center rounded-md overflow-hidden border border-border/30"
										style={{ backgroundImage: `url(${img.url})` }}
									/>
								))}
							</div>
						)}

						{/* Estadísticas de la carpeta */}
						<div className="bg-background/30 backdrop-blur-sm rounded-md p-2 space-y-1">
							<div className="flex items-center justify-between text-xs">
								<span className="flex items-center text-muted-foreground">
									<ImageIcon className="h-3 w-3 mr-1" />
									Imágenes:
								</span>
								<span className="font-medium">{folder.imageCount || 0}</span>
							</div>

							{formattedSize && (
								<div className="flex items-center justify-between text-xs">
									<span className="flex items-center text-muted-foreground">
										<HardDrive className="h-3 w-3 mr-1" />
										Tamaño:
									</span>
									<span className="font-medium">{formattedSize}</span>
								</div>
							)}

							{folder.path && (
								<div className="flex items-center justify-between text-xs">
									<span className="flex items-center text-muted-foreground">
										<ArrowUpRight className="h-3 w-3 mr-1" />
										Ruta:
									</span>
									<span className="font-medium truncate max-w-[120px]" title={folder.path}>
										{folder.path}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Metadatos */}
					<div className="mt-4 flex justify-between text-xs text-muted-foreground">
						<span>
							{formattedDate && (
								<span className="flex items-center">
									<Clock className="h-3 w-3 mr-1" />
									{formattedDate}
								</span>
							)}
						</span>
						<span className="font-semibold" style={{ color: rarityConfig.color }}>
							{rarityConfig.label}
						</span>
					</div>
				</EntityCardContent>
			</div>
		</>
	);
}
