'use client';

import { type RandomImage, getRandomImagesForEntity } from '@/app/actions/images/images-random.action';
import { BaseCard } from '@/components/features/entity-cards/entity-card-base';
import { EntityCardWrapper } from '@/components/features/entity-cards/entity-card-wrapper';
import { VisualizationConfig } from '@/components/features/entity-cards/config/visualization-config';
import { ImageGrid } from '@/components/features/entity-cards/settings/preview/entity-card-preview';
import { Button } from '@/components/ui/button';
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
	PencilIcon,
	Sparkles,
	Star,
	Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import type { CardOptions as BaseCardOptions } from '../types/base-card-types';
import type { CardDesignPreset, RarityConfig, TextureConfig } from '../types/base-card-types';

// Opciones visuales optimizadas para un mejor rendimiento
const DEFAULT_FOLDER_OPTIONS = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlines: false,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: false,

	// Configuración de diseño específica para carpetas
	designSystem: {
		preset: 'folder',
		variant: 'default',
		aspectRatio: '7/10',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 2,
		shadowStyle: 'soft',
	},

	// Sistema de capas optimizado para carpetas
	layerSystem: {
		order: ['content', 'holographic', 'border', 'filter'],
		layerBlending: 'normal',
	},

	// Interactividad específica para carpetas
	interactivity: {
		hover: {
			scale: 1.02,
			rotate: true,
			lift: true,
			glow: true,
		},
		click: {
			feedback: 'scale',
		},
	},

	// Estados específicos para carpetas
	states: {
		loading: {
			skeleton: true,
			blur: true,
		},
		selected: {
			style: 'border',
		},
	},

	// Rendimiento optimizado
	performance: {
		lazyLoad: true,
		imageOptimization: true,
		animationOptimization: true,
		renderQuality: 'high',
	},

	// Configuración visual básica
	hoverLiftHeight: 10,
	maxRotation: 12,
	primaryColor: '0, 153, 255',
	secondaryColor: '128, 0, 255',

	// Contenido y estructura
	contentLayout: 'stats-focus',
	contentPadding: '1rem',
	contentSpacing: '0.5rem',
	contentAlignment: 'start',
	imageStyle: 'grid',
	imageOverlay: true,
	imageOverlayOpacity: 0.3,
	imageOverlayGradient: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))',

	// Configuración del grid de imágenes
	imageGridLayout: 'quad',
	imageGridGap: 4,
	imageGridStyle: 'standard',
	showImageCount: true,
	imageGridAspectRatio: '1:1',
};

// Tipos de rareza basados en la cantidad de imágenes con colores ajustados para mayor legibilidad
const RARITY_TYPES = {
	mythic: {
		min: 100,
		color: 'from-orange-600/20 to-red-600/20',
		border: 'border-orange-500/70',
		label: 'Mítico',
		badgeClass: 'bg-gradient-to-r from-orange-500 to-red-500',
		barClass: 'bg-gradient-to-r from-red-500 to-orange-500',
	},
	rare: {
		min: 50,
		color: 'from-amber-500/20 to-yellow-600/20',
		border: 'border-amber-500/70',
		label: 'Raro',
		badgeClass: 'bg-gradient-to-r from-amber-500 to-yellow-500',
		barClass: 'bg-gradient-to-r from-amber-500 to-yellow-500',
	},
	uncommon: {
		min: 20,
		color: 'from-emerald-500/20 to-teal-600/20',
		border: 'border-emerald-500/70',
		label: 'Poco común',
		badgeClass: 'bg-gradient-to-r from-emerald-500 to-teal-500',
		barClass: 'bg-gradient-to-r from-emerald-500 to-teal-500',
	},
	common: {
		min: 1,
		color: 'from-blue-500/20 to-sky-600/20',
		border: 'border-blue-500/70',
		label: 'Común',
		badgeClass: 'bg-gradient-to-r from-blue-500 to-sky-500',
		barClass: 'bg-gradient-to-r from-blue-500 to-cyan-500',
	},
	empty: {
		min: 0,
		color: 'from-slate-500/20 to-gray-600/20',
		border: 'border-slate-500/50',
		label: 'Vacío',
		badgeClass: 'bg-gradient-to-r from-slate-500 to-gray-500',
		barClass: 'bg-gradient-to-r from-slate-500 to-gray-500',
	},
};

// Definimos los componentes para las capas en modo explodido
const folderExplodeLayers = [
	{
		id: 'content',
		label: 'Contenido',
		icon: <FolderOpenIcon className="h-3 w-3" />,
	},
	{
		id: 'scanlines',
		label: 'Líneas',
		icon: <Sparkles className="h-3 w-3" />,
	},
	{
		id: 'holographic',
		label: 'Holo',
		icon: <Star className="h-3 w-3" />,
	},
	{
		id: 'grain',
		label: 'Grano',
		icon: <HardDrive className="h-3 w-3" />,
	},
	{
		id: 'glow',
		label: 'Brillo',
		icon: <Sparkles className="h-3 w-3" />,
	},
	{
		id: 'border',
		label: 'Borde',
		icon: <Star className="h-3 w-3" />,
	},
];

interface FolderCardProps {
	folder: Folder;
	onEdit?: (folder: Folder) => void;
	onDelete?: (id: string) => void;
	onClick?: () => void;
	className?: string;
	/** Indica si se debe mostrar el botón de configuración visual */
	showVisualConfig?: boolean;
	/** Opciones visuales personalizadas, si no se proporcionan se usarán valores predeterminados */
	visualOptions?: typeof DEFAULT_FOLDER_OPTIONS;
	/** Activa/desactiva la funcionalidad de vista explosionada */
	enableExplode?: boolean;
	/** Estado controlado para modo explodido */
	isExploded?: boolean;
	/** Capa activa en modo explodido */
	activeLayer?: string | null;
	/** Callback para cambios en el estado explodido */
	onExplodedChange?: (isExploded: boolean) => void;
	/** Callback para cambios en la capa activa */
	onActiveLayerChange?: (layerId: string | null) => void;
}

// Función para obtener la rareza basada en el conteo de imágenes
function getFolderRarity(imageCount: number) {
	if (imageCount >= RARITY_TYPES.mythic.min) {
		return RARITY_TYPES.mythic;
	}
	if (imageCount >= RARITY_TYPES.rare.min) {
		return RARITY_TYPES.rare;
	}
	if (imageCount >= RARITY_TYPES.uncommon.min) {
		return RARITY_TYPES.uncommon;
	}
	if (imageCount >= RARITY_TYPES.common.min) {
		return RARITY_TYPES.common;
	}
	return RARITY_TYPES.empty;
}

// Función para determinar el nivel de potencia del folder
function getFolderPower(folder: Folder) {
	const imageCount = folder._count?.images || 0;
	const sizeInGB = Number(folder.totalSize || 0) / (1024 * 1024 * 1024);

	// Fórmula simplificada: considerar cantidad de imágenes y tamaño
	const basePower = Math.min(9, Math.ceil(imageCount / 20));
	const sizeBonus = Math.min(3, Math.ceil(sizeInGB));

	// Valor entre 1-12
	return Math.max(1, Math.min(12, basePower + sizeBonus));
}

/**
 * Genera una configuración de rareza para la carpeta
 */
function generateFolderRarityConfig(folder: Folder): RarityConfig | null {
	const rarityLevel = getFolderRarity(folder._count?.images || 0);

	// Si no tiene rareza, retornar null
	if (rarityLevel === RARITY_TYPES.common) {
		return null;
	}

	// Configuraciones de color por rareza
	const rarityColors = {
		[RARITY_TYPES.mythic]: {
			color: '#f97316',
			glowColor: 'rgba(249, 115, 22, 0.6)',
		},
		[RARITY_TYPES.rare]: {
			color: '#f59e0b',
			glowColor: 'rgba(245, 158, 11, 0.6)',
		},
		[RARITY_TYPES.uncommon]: {
			color: '#10b981',
			glowColor: 'rgba(16, 185, 129, 0.6)',
		},
		[RARITY_TYPES.common]: {
			color: '#3b82f6',
			glowColor: 'rgba(59, 130, 246, 0.6)',
		},
		[RARITY_TYPES.empty]: {
			color: '#64748b',
			glowColor: 'rgba(100, 116, 139, 0.6)',
		},
	};

	// Retornar la configuración de rareza
	return {
		level: rarityLevel.label,
		color: rarityColors[rarityLevel].color,
		glowColor: rarityColors[rarityLevel].glowColor,
		borderWidth: 2,
		borderEffect: 'animated',
	};
}

/**
 * Genera una configuración de textura para la carpeta
 */
function generateFolderTextureConfig(folder: Folder): TextureConfig | null {
	// Solo aplicar textura a carpetas con suficientes imágenes
	if ((folder._count?.images || 0) < 20) {
		return null;
	}

	return {
		id: `folder-texture-${folder.id}`,
		name: 'Folder Texture',
		type: 'custom',
		color: '#1a7e77',
		opacity: 0.15,
		blendMode: 'overlay',
		noiseType: 'perlin',
		noiseIntensity: 0.3,
		noiseScale: 1.2,
		isAnimated: folder._count?.images && folder._count.images > 50,
		animationSpeed: 0.2,
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
	enableExplode = true,
	isExploded,
	activeLayer,
	onExplodedChange,
	onActiveLayerChange,
}: FolderCardProps) {
	// Los estados locales para la tarjeta
	const [isOpen, setIsOpen] = React.useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
	const [images, setImages] = React.useState<RandomImage[]>([]);
	const [loading, setLoading] = React.useState(false);

	// Preparar opciones visuales personalizadas
	const mergedOptions = React.useMemo(
		() => ({
			...DEFAULT_FOLDER_OPTIONS,
			...visualOptions,
		}),
		[visualOptions]
	);

	// Generar configuración de rareza basada en la carpeta
	const rarityConfig = React.useMemo(() => generateFolderRarityConfig(folder), [folder]);

	// Generar configuración de textura basada en la carpeta
	const textureConfig = React.useMemo(() => generateFolderTextureConfig(folder), [folder]);

	// Cargar imágenes recientes cuando cambie el folder o el layout
	React.useEffect(() => {
		const loadImages = async () => {
			setLoading(true);
			try {
				// Determinar cuántas imágenes necesitamos según el layout
				const neededImages =
					mergedOptions.imageGridLayout === 'single'
						? 1
						: mergedOptions.imageGridLayout === 'dual'
							? 2
							: mergedOptions.imageGridLayout === 'quad'
								? 4
								: 6;

				// Si tenemos imágenes recientes, usarlas
				if (folder.recentImages && folder.recentImages.length > 0) {
					const recentImages = folder.recentImages.slice(0, neededImages).map((thumbnail, index) => ({
						id: `recent-${index}`,
						path: `recent-${index}`,
						// Usar directamente el thumbnail como base64
						thumbnail: thumbnail.startsWith('data:') ? thumbnail : `data:image/webp;base64,${thumbnail}`,
						width: 300,
						height: 300,
					}));
					setImages(recentImages);
				} else {
					// Si no hay imágenes recientes, crear placeholders
					const placeholders = Array(neededImages)
						.fill(null)
						.map((_, index) => ({
							id: `placeholder-${index}`,
							path: '',
							thumbnail: null,
							width: 300,
							height: 300,
						}));
					setImages(placeholders);
				}
			} catch (error) {
				console.error('Error al cargar imágenes:', error);
				// En caso de error, crear placeholders
				const placeholders = Array(6)
					.fill(null)
					.map((_, index) => ({
						id: `placeholder-${index}`,
						path: '',
						thumbnail: null,
						width: 300,
						height: 300,
					}));
				setImages(placeholders);
			} finally {
				setLoading(false);
			}
		};

		loadImages();
	}, [folder.recentImages, mergedOptions.imageGridLayout]);

	// Manejar clic en botón de edición
	const handleEditClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		onEdit?.(folder);
	};

	// Manejar clic en botón de eliminación
	const handleDeleteClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		onDelete?.(folder.id);
	};

	// Manejar clic en la tarjeta
	const handleCardClick = (e?: React.MouseEvent<HTMLDivElement>) => {
		if (e) {
			e.stopPropagation();
		}
		onClick?.();
	};

	// Determinar la configuración de visualización
	const handleVisualizationConfigClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		setIsSettingsOpen(!isSettingsOpen);
	};

	// Stats de la carpeta para mostrar
	const folderStats = React.useMemo(() => {
		return [
			{
				id: 'images',
				label: 'Imágenes',
				value: folder._count?.images ?? 0,
				icon: <ImageIcon className="h-3 w-3" />,
			},
			{
				id: 'updated',
				label: 'Actualizada',
				value: folder.updatedAt ? new Date(folder.updatedAt).toLocaleDateString() : 'N/A',
				icon: <Clock className="h-3 w-3" />,
			},
			{
				id: 'size',
				label: 'Tamaño',
				value: folder.size ? formatBytes(folder.size) : 'N/A',
				icon: <HardDrive className="h-3 w-3" />,
			},
		];
	}, [folder]);

	// Renderizar la tarjeta de carpeta
	return (
		<>
			<EntityCardWrapper
				className={cn(
					'folder-card relative overflow-hidden text-card-foreground transition-colors',
					isOpen ? 'folder-open' : 'folder-closed',
					className
				)}
				options={mergedOptions}
				entityType="folder"
				rarity={rarityConfig}
				texture={textureConfig}
				onClick={handleCardClick}
				showVisualizationConfig={showVisualConfig}
				onVisualizationConfigClick={handleVisualizationConfigClick}
				enableExplode={enableExplode}
				explodeLayers={folderExplodeLayers}
				isExploded={isExploded}
				activeLayer={activeLayer}
				onExplodedChange={onExplodedChange}
				onActiveLayerChange={onActiveLayerChange}
			>
				{/* Sección de cabecera */}
				<header className="relative flex items-center justify-between p-4 mb-1">
					<div className="flex items-center gap-2">
						<div className="folder-icon-wrapper relative">
							{isOpen ? (
								<FolderOpenIcon className="h-6 w-6 text-card-foreground/80" />
							) : (
								<FolderIcon className="h-6 w-6 text-card-foreground/80" />
							)}
							{(folder._count?.images ?? 0) > 0 && (
								<span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
									{folder._count?.images ?? 0}
								</span>
							)}
						</div>
						<h3 className="text-sm font-medium leading-none text-card-foreground">{folder.name}</h3>
					</div>

					{/* Indicador de rareza */}
					{rarityConfig && (
						<div className="rarity-indicator h-3 w-3 rounded-full" style={{ backgroundColor: rarityConfig.color }} />
					)}
				</header>

				{/* Grid de imágenes */}
				<div className="px-4 mb-2">
					<ImageGrid
						layout={mergedOptions.imageGridLayout}
						gap={mergedOptions.imageGridGap}
						images={images}
						loading={loading}
						style={mergedOptions.imageGridStyle}
					/>
				</div>

				{/* Sección de poder */}
				<div className="px-4 mb-2">
					<div className="folder-power relative flex items-center justify-between rounded-md bg-card-foreground/5 p-2">
						<span className="text-xs font-semibold text-card-foreground/70">Poder</span>
						<div className="folder-power-value flex items-center gap-1">
							<span className="text-xs font-bold text-card-foreground">{getFolderPower(folder)}</span>
							<Sparkles className="h-3 w-3 text-yellow-400" />
						</div>
					</div>
				</div>

				{/* Sección de descripción */}
				{folder.description && (
					<div className="px-4 mb-3">
						<p className="text-xs text-card-foreground/60 line-clamp-2">{folder.description}</p>
					</div>
				)}

				{/* Lista de estadísticas */}
				<div className="mt-auto">
					<div className="folder-stats grid grid-cols-3 gap-1 px-2 mt-2">
						{folderStats.map((stat) => (
							<div
								key={stat.id}
								className="stat-item flex flex-col items-center justify-center rounded-sm p-2 text-center bg-card-foreground/5"
							>
								<div className="mb-1 rounded-full bg-card-foreground/10 p-1">{stat.icon}</div>
								<span className="stat-value text-xs font-semibold text-card-foreground">{stat.value}</span>
								<span className="stat-label text-[10px] text-card-foreground/50">{stat.label}</span>
							</div>
						))}
					</div>
				</div>

				{/* Sección inferior con botones de acción */}
				<div className="folder-footer mt-3 flex items-center justify-between bg-card-foreground/5 px-4 py-2">
					<Button
						size="icon"
						variant="ghost"
						className="h-7 w-7 rounded-full"
						onClick={(e) => {
							e.stopPropagation();
							setIsOpen(!isOpen);
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.stopPropagation();
								setIsOpen(!isOpen);
							}
						}}
						aria-label={isOpen ? 'Cerrar carpeta' : 'Abrir carpeta'}
					>
						{isOpen ? <FolderOpenIcon className="h-4 w-4" /> : <FolderIcon className="h-4 w-4" />}
					</Button>

					<div className="flex gap-1">
						{onEdit && (
							<Button
								size="icon"
								variant="ghost"
								className="h-7 w-7 rounded-full"
								onClick={handleEditClick}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.stopPropagation();
										handleEditClick(e as unknown as React.MouseEvent);
									}
								}}
								aria-label="Editar carpeta"
							>
								<PencilIcon className="h-3 w-3" />
							</Button>
						)}
						{onDelete && (
							<Button
								size="icon"
								variant="ghost"
								className="h-7 w-7 rounded-full text-destructive hover:text-destructive"
								onClick={handleDeleteClick}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.stopPropagation();
										handleDeleteClick(e as unknown as React.MouseEvent);
									}
								}}
								aria-label="Eliminar carpeta"
							>
								<Trash2 className="h-3 w-3" />
							</Button>
						)}
					</div>
				</div>
			</EntityCardWrapper>

			{/* Panel de configuración visual */}
			{isSettingsOpen && (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={{ duration: 0.15 }}
					className="visualization-modal fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
					onClick={() => setIsSettingsOpen(false)}
					onKeyDown={(e) => {
						if (e.key === 'Escape') {
							setIsSettingsOpen(false);
						}
					}}
				>
					<dialog
						className="visualization-config-wrapper max-h-[80vh] max-w-4xl overflow-auto rounded-lg border bg-card p-4 shadow-lg"
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => {
							if (e.key === 'Escape') {
								e.stopPropagation();
								setIsSettingsOpen(false);
							}
						}}
						open
					>
						<VisualizationConfig
							options={mergedOptions}
							onChange={() => {
								// Implementar lógica de cambio si es necesario
							}}
							onClose={() => setIsSettingsOpen(false)}
						/>
					</dialog>
				</motion.div>
			)}
		</>
	);
}
