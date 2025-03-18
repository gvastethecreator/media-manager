'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Collection } from '@prisma/client';
import {
	BookOpen,
	Clock,
	FolderIcon,
	Globe,
	Grid3x3,
	ImageIcon,
	Layers,
	PencilIcon,
	Star,
	TagIcon,
	Trash2,
} from 'lucide-react';
import Image from 'next/image';
import type * as React from 'react';
import { useState } from 'react';
import { VisualizationConfig } from '../config/visualization-config';
import { EntityCardLayerWrapper } from '../entity-card-layer-wrapper';
import type { CollectionFormData } from '../types/forms-types';
import type { CardDesignPreset, CardOptions, RarityConfig, TextureConfig } from '../types/shared-card-types';
import { ImageGrid } from './image-grid';

// Definimos un tipo para los datos de la colección más específico
type CardData =
	| (Collection & {
			_count?: { images: number };
			totalSize?: number;
			recentImages?: string[];
			topTags?: { name: string; count: number }[];
			rating?: number; // Añadimos explícitamente rating aquí
	  })
	| CollectionFormData;

// Opciones visuales optimizadas para tarjetas de colecciones inspiradas en Magic
const DEFAULT_COLLECTION_OPTIONS: Partial<CardOptions> = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: false,

	// Sistema de diseño específico para colecciones
	designSystem: {
		preset: 'collection' as CardDesignPreset,
		variant: 'default',
		aspectRatio: '16/9',
		cornerStyle: 'rounded',
		cornerRadius: 8,
		elevation: 2,
		shadowStyle: 'soft',
	},

	// Configuración de movimiento
	hoverLiftHeight: 6,
	maxRotation: 8,
	primaryColor: '22, 163, 74', // Un tono verde
	secondaryColor: '34, 197, 94', // Un tono verde claro

	// Opciones de efectos
	holographicOptions: {
		patternType: 'linear',
		intensity: 0.5,
		animationSpeed: 1,
		visibleOnHover: true,
	},

	glowOptions: {
		intensity: 0.7,
		size: 15,
		blurAmount: 10,
		animationType: 'pulse',
		pulseSpeed: 1.5,
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
		glowIntensity: 0.6,
	},

	grainOptions: {
		intensity: 0.12,
		density: 0.5,
		contrast: 1.1,
		noise: 'light',
		animated: false,
		visibleOnHover: true,
	},

	// Opciones de imagen
	useImageGrid: false, // Por defecto no usamos grid
	imageGridLayout: 'grid',
	imageGridGap: 4,
	imageGridStyle: 'standard',
};

// Define rarity levels for collections
const COLLECTION_RARITY = {
	common: {
		color: '#9ca3af',
		borderColor: 'rgba(156, 163, 175, 0.5)',
		glowColor: 'rgba(156, 163, 175, 0.5)',
		label: 'Común',
	},
	uncommon: {
		color: '#22c55e',
		borderColor: 'rgba(34, 197, 94, 0.5)',
		glowColor: 'rgba(34, 197, 94, 0.5)',
		label: 'Poco común',
	},
	rare: {
		color: '#3b82f6',
		borderColor: 'rgba(59, 130, 246, 0.5)',
		glowColor: 'rgba(59, 130, 246, 0.5)',
		label: 'Raro',
	},
	mythic: {
		color: '#db2777',
		borderColor: 'rgba(219, 39, 119, 0.5)',
		glowColor: 'rgba(219, 39, 119, 0.5)',
		label: 'Mítico',
	},
	legendary: {
		color: '#eab308',
		borderColor: 'rgba(234, 179, 8, 0.7)',
		glowColor: 'rgba(234, 179, 8, 0.7)',
		label: 'Legendario',
	},
};

// Helper to determine collection rarity based on image count
function determineCollectionRarity(imageCount: number, _totalSize = 0): keyof typeof COLLECTION_RARITY {
	// Determinate based on image count
	if (imageCount >= 500) {
		return 'legendary';
	}
	if (imageCount >= 200) {
		return 'mythic';
	}
	if (imageCount >= 100) {
		return 'rare';
	}
	if (imageCount >= 20) {
		return 'uncommon';
	}
	return 'common';
}

// Helper to generate a RarityConfig from a rarity key
function generateRarityConfig(rarityKey: keyof typeof COLLECTION_RARITY): RarityConfig {
	const rarity = COLLECTION_RARITY[rarityKey];
	return {
		color: rarity.color,
		borderColor: rarity.borderColor,
		glowColor: rarity.glowColor,
		label: rarity.label,
		rarity: rarityKey,
	};
}

interface CollectionCardProps {
	data: CardData;
	isPreview?: boolean;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
	className?: string;
	showVisualizationConfig?: boolean;
	options?: Partial<CardOptions>;
	rarity?: RarityConfig | null;
	texture?: TextureConfig | null;
}

/**
 * Componente CollectionCard - Diseñado con inspiración en cartas de colección de juegos
 *
 * Características:
 * - Diseño con marco ornamentado y elementos decorativos
 * - Visualización de imagen de portada con efectos
 * - Información sobre el número de elementos en la colección
 * - Soporte para efectos visuales y rareza
 */
export function CollectionCard({
	data,
	isPreview = false,
	onEdit,
	onDelete,
	onClick,
	className,
	showVisualizationConfig = false,
	options,
	rarity: initialRarity,
	texture: initialTexture,
}: CollectionCardProps) {
	// Verificar si data existe y tiene las propiedades necesarias
	if (!data) {
		console.warn('CollectionCard: Se recibió un objeto data indefinido');
		// Crear un data por defecto para evitar errores
		data = {
			id: 'placeholder',
			name: 'Colección sin nombre',
			description: 'Sin descripción',
			createdAt: new Date(),
			updatedAt: new Date(),
			_count: { images: 0 },
		} as CardData;
	}

	const [isHovered, _setIsHovered] = useState(false);
	const [configOpen, setConfigOpen] = useState(false);
	const [cardOptions, setCardOptions] = useState<Partial<CardOptions>>({
		...DEFAULT_COLLECTION_OPTIONS,
		...options,
	});

	// Get image count and size from data or defaults
	const imageCount = '_count' in data && data._count ? data._count.images || 0 : 0;
	const totalSize = 'totalSize' in data ? data.totalSize || 0 : 0;

	// Determine collection rarity based on data
	const rarityKey = determineCollectionRarity(imageCount, totalSize);

	// Generate rarity config
	const rarityConfig = initialRarity || generateRarityConfig(rarityKey);

	// Get featured image if available
	const featuredImage =
		'recentImages' in data && data.recentImages && data.recentImages.length > 0
			? data.recentImages[0]
			: 'featuredImage' in data && data.featuredImage
				? data.featuredImage
				: null;

	// Helper to determine the collection type icon
	const determineCollectionType = () => {
		const name = data.name?.toLowerCase() || '';
		const desc = 'description' in data ? data.description?.toLowerCase() || '' : '';

		if (name.includes('folder') || desc.includes('folder')) {
			return <FolderIcon />;
		}
		if (name.includes('tag') || desc.includes('tag') || desc.includes('etiqueta')) {
			return <TagIcon />;
		}
		if (name.includes('book') || desc.includes('book') || desc.includes('libro')) {
			return <BookOpen />;
		}
		if (name.includes('world') || desc.includes('world') || desc.includes('mundo')) {
			return <Globe />;
		}
		if (name.includes('grid') || desc.includes('grid') || desc.includes('cuadrícula')) {
			return <Grid3x3 />;
		}

		// Default icon
		return <Layers />;
	};

	// Get collection name or default
	const collectionName = data.name || 'Colección sin nombre';

	// Format date if available
	const formattedDate = 'createdAt' in data && data.createdAt ? new Date(data.createdAt).toLocaleDateString() : null;

	return (
		<>
			{configOpen && (
				<VisualizationConfig
					onClose={() => setConfigOpen(false)}
					options={cardOptions}
					onOptionsChange={(newOptions) => setCardOptions(newOptions)}
					entityId={data.id as string}
					entityType="collection"
				/>
			)}

			<div className={cn('min-h-[250px] relative', className)}>
				{/* Capa base con EntityCardLayerWrapper */}
				<EntityCardLayerWrapper
					title={collectionName}
					description={'description' in data ? data.description || 'Sin descripción' : 'Sin descripción'}
					onClick={onClick}
					showVisualConfig={showVisualizationConfig}
					visualOptions={{
						...cardOptions,
						rarityConfig,
						textureConfig: initialTexture || undefined,
					}}
					entityType="collection"
					entityId={data.id}
				/>

				{/* Contenido de la tarjeta */}
				<div className="relative z-20 h-full p-4 flex flex-col pointer-events-none">
					{/* Cabecera con título y tipo */}
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center">
							<div
								className={cn(
									'w-10 h-10 rounded-lg flex items-center justify-center',
									'bg-gradient-to-br from-background/40 to-background/20 backdrop-blur-sm'
								)}
								style={{ borderColor: rarityConfig.color }}
							>
								{determineCollectionType()}
							</div>
							<div className="ml-3">
								<h3 className="font-bold text-lg truncate">{collectionName}</h3>
								<div className="flex items-center text-muted-foreground text-xs">
									{formattedDate && (
										<span className="flex items-center">
											<Clock className="h-3 w-3 mr-1" />
											{formattedDate}
										</span>
									)}
								</div>
							</div>
						</div>

						{/* Estrellas de rating */}
						<div className="flex">
							{[1, 2, 3, 4, 5].map((starPosition) => (
								<Star
									key={`rating-star-${starPosition}`}
									className={cn(
										'h-4 w-4',
										starPosition <= (('rating' in data ? data.rating : 0) || 0)
											? 'text-yellow-400 fill-yellow-400'
											: 'text-muted-foreground'
									)}
								/>
							))}
						</div>
					</div>

					{/* Imagen destacada o grid de imágenes */}
					<div className="flex-1 rounded-lg overflow-hidden bg-muted/20 mb-3 min-h-[120px]">
						{'recentImages' in data && data.recentImages && data.recentImages.length > 0 && cardOptions.useImageGrid ? (
							<ImageGrid
								layout={
									cardOptions.imageGridLayout === 'grid' || cardOptions.imageGridLayout === 'masonry'
										? 'quad'
										: 'single'
								}
								gap={cardOptions.imageGridGap || 4}
								style={
									cardOptions.imageGridStyle === 'standard' || cardOptions.imageGridStyle === 'polaroid'
										? cardOptions.imageGridStyle
										: 'standard'
								}
								images={data.recentImages.map((path: string, idx: number) => ({
									id: `img-${idx}`,
									path,
									thumbnail: path,
								}))}
							/>
						) : featuredImage ? (
							<Image
								src={featuredImage}
								alt={collectionName}
								fill
								sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
								className="object-cover"
								priority={false}
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center">
								<ImageIcon className="h-16 w-16 opacity-20" />
							</div>
						)}
					</div>

					{/* Metadata */}
					<div className="mt-auto">
						{/* Tags principales */}
						{'topTags' in data && data.topTags && data.topTags.length > 0 && (
							<div className="flex flex-wrap gap-1 mb-2">
								{data.topTags.slice(0, 3).map((tag: { name: string; count: number }) => (
									<span key={tag.name} className="px-1.5 py-0.5 bg-background/40 backdrop-blur-sm text-xs rounded">
										#{tag.name} ({tag.count})
									</span>
								))}
							</div>
						)}

						{/* Footer con estadísticas */}
						<div className="flex justify-between items-center">
							<p className="text-sm flex items-center">
								<ImageIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
								{imageCount} {imageCount === 1 ? 'elemento' : 'elementos'}
							</p>

							{/* Sello de rareza */}
							<div
								className={cn(
									'px-2 py-0.5 text-xs rounded-sm',
									'border border-white/30',
									'bg-black/30 backdrop-blur-sm'
								)}
							>
								{COLLECTION_RARITY[rarityKey].label.toUpperCase()}
							</div>
						</div>

						{'description' in data && data.description && (
							<p className={cn('text-xs mt-2 line-clamp-2 opacity-80')}>{data.description}</p>
						)}
					</div>

					{/* Botones de edición/eliminación */}
					{!isPreview && isHovered && 'id' in data && data.id && (
						<div className="absolute top-2 right-2 flex gap-1 pointer-events-auto">
							{onEdit && (
								<Button
									size="icon"
									variant="ghost"
									className="h-7 w-7 rounded-full bg-background/80 hover:bg-background"
									onClick={(e) => {
										e.stopPropagation();
										onEdit(data.id as string);
									}}
								>
									<PencilIcon className="h-3.5 w-3.5" />
								</Button>
							)}
							{onDelete && (
								<Button
									size="icon"
									variant="ghost"
									className="h-7 w-7 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
									onClick={(e) => {
										e.stopPropagation();
										onDelete(data.id as string);
									}}
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							)}
						</div>
					)}
				</div>
			</div>
		</>
	);
}
