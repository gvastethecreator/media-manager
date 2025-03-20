'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/format.utils';
import type { Folder } from '@/types/entities/folders';
import {
	Calendar,
	Clock,
	FileIcon,
	FolderIcon,
	HardDrive,
	Image,
	Layers3,
	PencilIcon,
	Sparkles,
	Star,
	Trash2
} from 'lucide-react';
import { useCallback, useMemo } from 'react';

// Importar componentes base
import {
	CardDescriptionSection,
	CardFooter,
	CardHeader,
	CardMetadataSection
} from '../../../base';

// Importar tipos y utilidades
import { EntityCardWrapper } from '../../../entity-card-wrapper';
import { usePreset } from '../../../hooks/use-preset';
import { adaptCardOptions } from '../../../types';
import type { CardOptions } from '../../../types/unified-card-types';

import '../styles/folder-card.css';

// TIPOS DE DATOS
// ==============================

// Define niveles de rareza para carpetas con estilo TCG
interface FolderRarity {
	color: string;
	borderColor: string;
	glowColor: string;
	label: string;
	rarity: 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythic';
	stars: number;
	textureType: string;
	glowIntensity: number;
	textureOpacity: number;
	holographic?: boolean;
	borderAnimation?: string;
}

const FOLDER_RARITY: Record<string, FolderRarity> = {
	common: {
		color: '#9ca3af',
		borderColor: 'rgba(156, 163, 175, 0.8)',
		glowColor: 'rgba(156, 163, 175, 0.6)',
		label: 'Común',
		rarity: 'common' as const,
		stars: 1,
		textureType: 'noise',
		glowIntensity: 0.4,
		textureOpacity: 0.15
	},
	uncommon: {
		color: '#22c55e',
		borderColor: 'rgba(34, 197, 94, 0.8)',
		glowColor: 'rgba(34, 197, 94, 0.6)',
		label: 'Poco Común',
		rarity: 'uncommon' as const,
		stars: 2,
		textureType: 'dots',
		glowIntensity: 0.5,
		textureOpacity: 0.2
	},
	rare: {
		color: '#3b82f6',
		borderColor: 'rgba(59, 130, 246, 0.8)',
		glowColor: 'rgba(59, 130, 246, 0.6)',
		label: 'Rara',
		rarity: 'rare' as const,
		stars: 3,
		textureType: 'grid',
		glowIntensity: 0.65,
		textureOpacity: 0.25,
		borderAnimation: 'pulse'
	},
	legendary: {
		color: '#eab308',
		borderColor: 'rgba(234, 179, 8, 0.8)',
		glowColor: 'rgba(234, 179, 8, 0.7)',
		label: 'Legendaria',
		rarity: 'legendary' as const,
		stars: 4,
		holographic: true,
		textureType: 'sparkle',
		glowIntensity: 0.8,
		textureOpacity: 0.3,
		borderAnimation: 'flow'
	},
	mythic: {
		color: '#d946ef',
		borderColor: 'rgba(217, 70, 239, 0.8)',
		glowColor: 'rgba(217, 70, 239, 0.7)',
		label: 'Mítica',
		rarity: 'mythic' as const,
		stars: 5,
		holographic: true,
		textureType: 'rainbow',
		glowIntensity: 1,
		textureOpacity: 0.35,
		borderAnimation: 'rainbow'
	},
};

// Opciones visuales optimizadas para tarjetas de carpetas
const DEFAULT_FOLDER_OPTIONS: Partial<CardOptions> = {
	// Efectos principales
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: true,

	// Configuración de diseño específica para carpetas
	designSystem: {
		preset: 'folder',
		variant: 'default',
		aspectRatio: '3/4',
		cornerStyle: 'rounded',
		cornerRadius: 12,
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
		pattern: 'gradient',
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

	// Parámetros de interactividad
	interactivity: {
		enableHoverEffects: true,
		enableClickEffects: true,
		hover: {
			scale: 1.05,
			rotate: true,
			lift: true,
			glow: true,
		}
	},

	// Configuración de estados
	states: {
		enableHover: true,
		stateDuration: 300,
	},

	// Animación
	maxRotation: 15,
};

export interface FolderCardProps {
	folder: Folder;
	options?: Partial<CardOptions>;
	onClick?: () => void;
	showVisualConfig?: boolean;
	onVisualConfigClick?: () => void;
	enableExplode?: boolean;
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
	className?: string;
	onEdit?: (folder: Folder) => void;
	onDelete?: (id: string) => void;
}

// UTILIDADES Y COMPONENTES AUXILIARES
// ==============================

// Componente para mostrar estrellas de rareza
function RarityStars({ count }: { count: number }) {
	return (
		<div className="flex items-center justify-center mt-1">
			{Array.from({ length: count }).map((_, i) => (
				<Star
					key={`star-${i}-${count}`}
					className={cn(
						"h-3 w-3 mx-0.5",
						count >= 5 ? "text-fuchsia-400" :
							count >= 4 ? "text-yellow-400" :
								count >= 3 ? "text-blue-400" :
									count >= 2 ? "text-green-400" :
										"text-gray-400"
					)}
					fill="currentColor"
				/>
			))}
		</div>
	);
}

// Determinar la rareza basada en varios factores
function getFolderRarity(imageCount: number): keyof typeof FOLDER_RARITY {
	// Determinar rareza basada en cantidad de imágenes
	if (imageCount >= 1000) return 'mythic';
	if (imageCount >= 500) return 'legendary';
	if (imageCount >= 100) return 'rare';
	if (imageCount >= 10) return 'uncommon';
	return 'common';
}

// Generar configuración de rareza para una carpeta
function generateFolderRarityConfig(folder: Folder) {
	const imageCount = folder.imageCount || 0;
	const rarityKey = getFolderRarity(imageCount);
	const rarity = FOLDER_RARITY[rarityKey];

	return {
		enabled: true,
		rarity: rarityKey,
		color: rarity.color,
		borderColor: rarity.borderColor,
		glowColor: rarity.glowColor,
		borderStyle: 'solid',
		borderWidth: 2,
		frameType: 'standard',
		label: rarity.label,
		stars: rarity.stars
	};
}

// COMPONENTE PRINCIPAL
// ==============================
export function FolderCardLayout({
	folder: initialFolder,
	options = {},
	onClick,
	showVisualConfig = false,
	onVisualConfigClick,
	enableExplode = false,
	isExploded,
	activeLayer,
	onExplodedChange,
	onActiveLayerChange,
	className,
	onEdit,
	onDelete,
}: FolderCardProps) {
	// Garantizar que nunca procesamos una carpeta undefined
	const folder = initialFolder || {
		id: 'placeholder',
		name: 'Carpeta sin nombre',
		path: '/placeholder',
		totalFiles: 0,
		totalSize: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	} as Folder;

	// Usar el hook para obtener configuración de preset
	const { cardOptions } = usePreset({
		entityType: 'folder',
		entityId: folder.id,
		presetId: 'presetId' in folder && folder.presetId ? folder.presetId : null,
		baseOptions: options,
	});

	// Configurar las capas para el modo explode
	const explodeLayers = [
		{ id: 'background', label: 'Fondo', icon: <Layers3 className="h-4 w-4" /> },
		{ id: 'frame', label: 'Marco', icon: <FolderIcon className="h-4 w-4" /> },
		{ id: 'content', label: 'Contenido', icon: <FileIcon className="h-4 w-4" /> },
		{ id: 'effects', label: 'Efectos', icon: <Image className="h-4 w-4" /> },
	];

	// Obtener la rareza de la carpeta
	const imageCount = folder.imageCount || 0;
	const rarityKey = getFolderRarity(imageCount);
	const rarityInfo = FOLDER_RARITY[rarityKey];
	const rarityConfig = generateFolderRarityConfig(folder);
	const rarityClass = `folder-card-rarity-${rarityKey}`;

	// Manejadores de eventos
	const handleEdit = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onEdit && folder) {
			onEdit(folder);
		}
	}, [onEdit, folder]);

	const handleDelete = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDelete && folder?.id) {
			onDelete(folder.id);
		}
	}, [onDelete, folder?.id]);

	// Generar configuración avanzada basada en la rareza
	const enhancedCardOptions = useMemo(() => {
		// Valores por defecto
		const defaults = DEFAULT_FOLDER_OPTIONS;

		// Ajustar intensidad de efectos según rareza
		const intensity = rarityInfo.glowIntensity || 0.5;

		// Habilitar efectos especiales para carpetas legendarias y míticas
		const isSpecial = rarityKey === 'legendary' || rarityKey === 'mythic';

		// Crear opciones combinadas
		return {
			...defaults,
			enableHolographicEffect: isSpecial,
			enableScanlinesEffect: isSpecial,

			// Configurar glows basados en rareza
			glowOptions: {
				...(defaults.glowOptions || {}),
				intensity: intensity,
				color: rarityInfo.glowColor,
				size: 20 + (rarityInfo.stars * 2),
				visibleOnIdle: rarityKey === 'mythic',
				animationType: isSpecial ? 'pulse' : 'static',
			},

			// Configurar bordes animados
			borderOptions: {
				...(defaults.borderOptions || {}),
				width: rarityInfo.stars * 0.5,
				color: rarityInfo.borderColor,
				pattern: isSpecial ? 'gradient' : 'solid',
				animationType: rarityInfo.borderAnimation || 'none',
				glowIntensity: intensity,
			},

			// Configurar texturas específicas
			textureConfig: {
				type: rarityInfo.textureType || 'noise',
				intensity: rarityInfo.textureOpacity || 0.15,
				scale: 1 + (rarityInfo.stars * 0.1),
				blendMode: 'overlay',
			},

			// Configuración de rareza
			rarityConfig,

			// Efectos adicionales
			effects: {
				...(defaults.effects || {}),
				chromaticAberration: {
					enabled: isSpecial,
					visibleOnHover: true,
					intensity: rarityKey === 'mythic' ? 0.4 : 0.2,
				},
				noiseTexture: {
					enabled: true,
					visibleOnHover: !isSpecial,
					intensity: rarityInfo.textureOpacity || 0.15,
				},
				glitchEffect: {
					enabled: rarityKey === 'mythic',
					visibleOnHover: true,
					intensity: 0.3,
					frequency: 0.1,
				},
			},
		};
	}, [rarityKey, rarityInfo, rarityConfig]);

	// Crear los elementos de metadatos para la sección de estadísticas
	const metadataItems = useMemo(() => {
		const items = [
			{
				label: 'Imágenes',
				value: imageCount.toString(),
				icon: <Image className="h-3.5 w-3.5 opacity-70" />
			}
		];

		if (folder.totalSize !== undefined) {
			items.push({
				label: 'Tamaño',
				value: formatFileSize(folder.totalSize),
				icon: <HardDrive className="h-3.5 w-3.5 opacity-70" />
			});
		}

		if (folder.lastIndexed) {
			items.push({
				label: 'Indexado',
				value: typeof folder.lastIndexed === 'string'
					? new Date(folder.lastIndexed).toLocaleDateString()
					: folder.lastIndexed.toLocaleDateString(),
				icon: <Clock className="h-3.5 w-3.5 opacity-70" />
			});
		}

		return items;
	}, [imageCount, folder.totalSize, folder.lastIndexed]);

	// Formatear fecha
	const formattedDate = useMemo(() => {
		if (!folder.createdAt) return '';

		const date = typeof folder.createdAt === 'string'
			? new Date(folder.createdAt)
			: folder.createdAt;

		return date.toLocaleDateString();
	}, [folder.createdAt]);

	return (
		<div className={cn(
			'folder-card-container relative w-full h-full group',
			rarityClass,
			onClick && 'cursor-pointer',
			className
		)}>
			<EntityCardWrapper
				title={folder.name}
				description={folder.description || ''}
				entityId={folder.id}
				entityType="folder"
				className={cn('folder-card-wrapper relative w-full h-full', rarityClass)}
				options={adaptCardOptions(enhancedCardOptions)}
				showVisualConfig={showVisualConfig}
				onVisualConfigClick={onVisualConfigClick}
				enableExplode={enableExplode}
				isExploded={isExploded}
				activeLayer={activeLayer}
				onExplodedChange={onExplodedChange}
				onActiveLayerChange={onActiveLayerChange}
				explodeLayers={explodeLayers}
				onClick={onClick}
			>
				<div className="folder-card-content flex flex-col h-full w-full relative">
					{/* Cabecera con el emblema y nombre de la carpeta */}
					<CardHeader
						title={folder.name}
						entityType="folder"
						className="mb-2 relative z-10"
						showIcon={false}
						rightContent={
							<>
								{/* Indicador de rareza */}
								<RarityStars count={rarityInfo.stars} />

								{/* Botones de acción */}
								{(onEdit || onDelete) && (
									<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-50">
										{onEdit && (
											<Button
												size="icon"
												variant="ghost"
												className="h-7 w-7 p-0 bg-background/80"
												onClick={handleEdit}
											>
												<PencilIcon className="h-3.5 w-3.5" />
											</Button>
										)}
										{onDelete && (
											<Button
												size="icon"
												variant="ghost"
												className="h-7 w-7 p-0 bg-background/80 hover:bg-destructive/20"
												onClick={handleDelete}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										)}
									</div>
								)}
							</>
						}
					/>

					{/* Folder icon */}
					<div className="flex items-center ml-3 -mt-1 mb-3">
						<div className={cn(
							"folder-emoji flex items-center justify-center w-10 h-10 rounded-full border-2 z-10 relative text-xl bg-background shadow-md",
							`border-${rarityKey === 'mythic' ? 'fuchsia' :
								rarityKey === 'legendary' ? 'amber' :
									rarityKey === 'rare' ? 'blue' :
										rarityKey === 'uncommon' ? 'green' : 'gray'}-500`
						)}>
							{folder.emoji || <FolderIcon className="h-5 w-5" />}
						</div>
					</div>

					{/* Imagen o ilustración de la carpeta (simulada) */}
					<div className={cn(
						"folder-card-image relative h-28 mb-3 rounded overflow-hidden border",
						`border-${rarityKey === 'mythic' ? 'fuchsia' :
							rarityKey === 'legendary' ? 'amber' :
								rarityKey === 'rare' ? 'blue' :
									rarityKey === 'uncommon' ? 'green' : 'gray'}-500`,
					)}>
						<div className={cn(
							"absolute inset-0 bg-gradient-to-br",
							rarityKey === 'mythic' ? "from-fuchsia-500/20 to-purple-900/40" :
								rarityKey === 'legendary' ? "from-amber-500/20 to-yellow-900/40" :
									rarityKey === 'rare' ? "from-blue-500/20 to-blue-900/40" :
										rarityKey === 'uncommon' ? "from-green-500/20 to-green-900/40" :
											"from-gray-500/20 to-gray-900/40"
						)}>
							{/* Patrón decorativo según la rareza */}
							<div className={cn(
								"absolute inset-0 opacity-10 mix-blend-overlay",
								rarityKey === 'mythic' || rarityKey === 'legendary' ? "bg-sparkle-pattern" : "bg-noise-pattern"
							)} />
						</div>

						{/* Icono central */}
						<div className="absolute inset-0 flex items-center justify-center">
							{rarityKey === 'mythic' ? (
								<Sparkles className="h-12 w-12 text-white/40" />
							) : (
								<FolderIcon className="h-12 w-12 text-white/40" />
							)}
						</div>
					</div>

					{/* Estadísticas de la carpeta */}
					<CardMetadataSection
						items={metadataItems}
						className="flex-grow relative p-2 border border-stone-800/30 rounded bg-card/80"
					/>

					{/* Descripción de la carpeta */}
					{folder.description && (
						<CardDescriptionSection
							description={folder.description}
							maxLines={2}
							className="mt-2 text-xs"
						/>
					)}

					{/* Pie de la tarjeta con sello de rareza */}
					<CardFooter
						className="mt-2 text-xs"
						leftContent={
							<div className={cn(
								"folder-rarity px-3 py-1 rounded-full text-[10px] font-medium",
								rarityKey === 'mythic' ? "bg-fuchsia-500/20 text-fuchsia-200" :
									rarityKey === 'legendary' ? "bg-amber-500/20 text-amber-200" :
										rarityKey === 'rare' ? "bg-blue-500/20 text-blue-200" :
											rarityKey === 'uncommon' ? "bg-green-500/20 text-green-200" :
												"bg-gray-500/20 text-gray-200"
							)}>
								{FOLDER_RARITY[rarityKey].label}
							</div>
						}
						rightContent={
							<div className="flex items-center gap-1">
								<Calendar className="h-3 w-3 opacity-70" />
								<span className="text-[10px] opacity-70">{formattedDate}</span>
							</div>
						}
					/>
				</div>
			</EntityCardWrapper>
		</div>
	);
}

// Componente público para usar en la aplicación
export function FolderCard(props: FolderCardProps) {
	return <FolderCardLayout {...props} />;
}