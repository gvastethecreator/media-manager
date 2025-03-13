'use client';

import { BaseCard } from '@/components/features/entity-cards/base/base-card';
import { VisualizationConfig } from '@/components/features/entity-cards/config/visualization-config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';
import { formatBytes } from '@/lib/utils/utils';
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

export function FolderCard({
	folder,
	onEdit,
	onDelete,
	onClick,
	className,
	showVisualConfig = false,
	visualOptions,
	enableExplode = true,
}: FolderCardProps) {
	// Estado para controlar si el modal de configuración está abierto
	const [configOpen, setConfigOpen] = React.useState(false);

	// Estado y referencias
	const [isHovered, setIsHovered] = React.useState(false);

	// Estado para las opciones visuales
	const [cardOptions, setCardOptions] = React.useState({
		...DEFAULT_FOLDER_OPTIONS,
		...visualOptions,
	});

	// Valores memorizados
	const rarity = React.useMemo(() => getFolderRarity(folder._count?.images || 0), [folder._count?.images]);
	const power = React.useMemo(() => getFolderPower(folder), [folder]);
	const folderAge = React.useMemo(() => {
		if (!folder.createdAt) {
			return 'Desconocido';
		}
		const days = Math.floor((Date.now() - new Date(folder.createdAt).getTime()) / (1000 * 60 * 60 * 24));
		return days <= 0 ? 'Nuevo' : `${days}d`;
	}, [folder.createdAt]);

	return (
		<>
			<BaseCard
				onClick={onClick}
				className={cn(
					'w-full',
					{
						'aspect-[7/10]': cardOptions.designSystem?.aspectRatio === '7/10',
						'aspect-square': cardOptions.designSystem?.aspectRatio === '1/1',
						'aspect-video': cardOptions.designSystem?.aspectRatio === '16/9',
					},
					rarity.border,
					className
				)}
				options={cardOptions as unknown as Partial<BaseCardOptions>}
				onHoverStart={() => setIsHovered(true)}
				onHoverEnd={() => setIsHovered(false)}
				showVisualizationConfig={showVisualConfig}
				onVisualizationConfigClick={() => setConfigOpen(true)}
				enableExplode={enableExplode}
				explodeLayers={[
					{
						id: 'content',
						label: 'Contenido',
						icon: <div className="w-3 h-3 bg-primary rounded-sm" />,
					},
					{
						id: 'holographic',
						label: 'Efecto Holo',
						icon: <div className="w-3 h-3 bg-gradient-to-tr from-purple-400 to-blue-300 opacity-60" />,
					},
					{
						id: 'border',
						label: 'Borde',
						icon: <div className="w-3 h-3 border border-primary rounded-sm" />,
					},
					{
						id: 'filter',
						label: 'Filtro SVG',
						icon: <div className="w-3 h-3 bg-blue-300 rounded-full opacity-60" />,
					},
				]}
			>
				{/* Diseño inspirado en cartas coleccionables - contenedor con posicionamiento relativo */}
				<div
					className={cn(
						'relative h-full flex flex-col',
						cardOptions.contentLayout === 'stats-focus' && 'justify-between',
						cardOptions.contentPadding && `p-${cardOptions.contentPadding}`,
						cardOptions.contentSpacing && `gap-${cardOptions.contentSpacing}`
					)}
				>
					{/* Medidor de número/rareza como círculo en esquina superior izquierda */}
					<div className="absolute top-3 left-3 w-12 h-12 rounded-full bg-background/90 backdrop-blur-sm border-2 flex items-center justify-center z-10 shadow-lg overflow-hidden">
						<div className={cn('absolute inset-0 opacity-70', rarity.badgeClass)} />
						<span className="relative font-bold text-lg text-white drop-shadow-sm">{folder._count?.images || 0}</span>
					</div>

					{/* Nombre de la carpeta en franja superior */}
					<div className="relative px-3 py-2 bg-background/80 backdrop-blur-md shadow-sm border-b border-border z-10">
						<div className="flex items-center gap-1.5">
							{isHovered ? (
								<FolderOpenIcon className="h-4 w-4 text-primary" />
							) : (
								<FolderIcon className="h-4 w-4 text-primary" />
							)}
							<h3 className="font-bold text-base leading-tight line-clamp-1">{folder.name}</h3>
							{folder.isFavorite === true && <Star className="h-4 w-4 text-amber-400 ml-auto" />}
						</div>
						<div className="text-xs font-medium text-muted-foreground flex items-center mt-0.5">
							<span>Carpeta • {rarity.label}</span>
							{folder.autoReindex && <span className="ml-1">• Auto-Indexada</span>}
						</div>
					</div>

					{/* Área de ilustración - Imágenes en grid o imagen destacada */}
					<div className="flex-1 relative">
						{folder.featuredImage ? (
							<div className="absolute inset-0">
								<img src={folder.featuredImage} alt={folder.name} className="w-full h-full object-cover" />
								<div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
							</div>
						) : (
							<div className="grid grid-cols-3 grid-rows-3 gap-1 p-2 h-full">
								{folder.recentImages?.map((src: string | null, i: number) => (
									<div
										key={`folder-image-${folder.id || 'unknown'}-${i}-${src?.substring(0, 10) || 'empty'}`}
										className="relative rounded overflow-hidden aspect-square"
									>
										{src ? (
											<img src={src} alt={`Imagen ${i + 1}`} className="object-cover w-full h-full" />
										) : (
											<div className={cn('w-full h-full flex items-center justify-center', rarity.badgeClass)}>
												<ImageIcon className="w-3 h-3 text-white/90" />
											</div>
										)}
									</div>
								))}
							</div>
						)}

						{/* Fecha de escaneo como overlay */}
						<div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm rounded px-1.5 py-0.5 text-xs flex items-center gap-1 z-10">
							<Clock className="h-3 w-3" />
							<span>{folder.lastIndexed ? new Date(folder.lastIndexed).toLocaleDateString() : 'Nunca'}</span>
						</div>
					</div>

					{/* Panel inferior con ruta */}
					<div className="text-xs border-t border-b border-border bg-background/80 backdrop-blur-sm py-1.5 px-3">
						<div className="font-semibold mb-0.5 flex items-center text-[10px] uppercase tracking-wider text-muted-foreground">
							Ruta
						</div>
						<p className="font-mono text-[10px] truncate">{folder.path}</p>
					</div>

					{/* Área de estadísticas inferior */}
					<div className="bg-background/90 backdrop-blur-md p-3 flex flex-col gap-2">
						{/* Estadísticas principales en grid */}
						<div className="grid grid-cols-3 gap-3">
							<div className="flex flex-col items-center">
								<div className="text-2xl font-bold">{folder._count?.images || 0}</div>
								<div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
									<ImageIcon className="h-3 w-3" />
									Imágenes
								</div>
							</div>
							<div className="flex flex-col items-center">
								<div className="text-2xl font-bold">{folderAge}</div>
								<div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
									<CalendarClock className="h-3 w-3" />
									Edad
								</div>
							</div>
							<div className="flex flex-col items-center">
								<div className="text-2xl font-bold">{formatBytes(Number(folder.totalSize || 0), 0)}</div>
								<div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
									<HardDrive className="h-3 w-3" />
									Tamaño
								</div>
							</div>
						</div>

						{/* Barra de poder */}
						<div className="mt-1 flex items-center justify-between">
							<div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
								<div
									className={cn('h-full rounded-full', rarity.barClass)}
									style={{ width: `${(power / 12) * 100}%` }}
								/>
							</div>
							<div className="ml-2 text-xs font-semibold">{power}/12</div>
						</div>
					</div>

					{/* Acciones - botones flotantes */}
					{(onEdit || onDelete) && (
						<motion.div
							className="absolute bottom-2 right-2 flex gap-1 z-50"
							initial={{ opacity: 0 }}
							animate={{ opacity: isHovered ? 1 : 0 }}
							onHoverStart={() => setIsHovered(true)}
							onHoverEnd={() => setIsHovered(false)}
							onClick={(e: React.MouseEvent) => {
								e.stopPropagation();
							}}
						>
							{onEdit && (
								<Button
									variant="secondary"
									size="icon"
									className="h-8 w-8 shadow-md"
									onClick={() => {
										onEdit(folder);
									}}
								>
									<PencilIcon className="h-4 w-4" />
								</Button>
							)}
							{onDelete && (
								<Button
									variant="secondary"
									size="icon"
									className="h-8 w-8 shadow-md text-destructive"
									onClick={() => {
										if (folder.id) {
											onDelete(folder.id);
										}
									}}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							)}
						</motion.div>
					)}

					{/* Botón de explorar en hover */}
					{onClick && (
						<motion.div
							className="absolute inset-0 flex items-center justify-center z-40"
							initial={{ opacity: 0 }}
							animate={{ opacity: isHovered ? 1 : 0 }}
							onHoverStart={() => setIsHovered(true)}
							onHoverEnd={() => setIsHovered(false)}
							onClick={(e: React.MouseEvent) => {
								if ((e.target as HTMLElement).closest('button')) {
									e.stopPropagation();
								}
							}}
						>
							<motion.div
								className="bg-black/60 backdrop-blur-md rounded-full p-4 text-white shadow-lg"
								initial={{ scale: 0.8 }}
								animate={{ scale: 1 }}
								transition={{ duration: 0.2 }}
							>
								<ArrowUpRight className="h-8 w-8" />
							</motion.div>
						</motion.div>
					)}
				</div>
			</BaseCard>

			{/* Modal de configuración visual */}
			{configOpen && (
				<VisualizationConfig
					options={cardOptions as unknown as Partial<BaseCardOptions>}
					onOptionsChange={(newOptions) => {
						// Primero convertimos a unknown y luego al tipo esperado
						const typedOptions = newOptions as unknown;
						setCardOptions({
							...cardOptions,
							...(typedOptions as typeof cardOptions),
						});
					}}
					onClose={() => setConfigOpen(false)}
				/>
			)}
		</>
	);
}
