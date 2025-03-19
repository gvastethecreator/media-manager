'use client';

import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/format';
import type { Folder } from '@/types/entities/folders';
import { Calendar, Clock, FileIcon, FolderIcon, HardDrive, Image, Layers3, Sparkles, Star } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { EntityCardWrapper } from '../entity-card-wrapper';
import { usePreset } from '../hooks/use-preset';
import '../styles/folder-card.css';
import type { CardDesignPreset, CardOptions, RarityConfig } from '../types/base-card-types';
import type { CardOptions as CardOptionsType } from '../types/card-settings-types';

// Define rarity levels for folders with improved TCG styling
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

// Opciones visuales optimizadas para un mejor rendimiento
const _DEFAULT_FOLDER_OPTIONS: Partial<CardOptions> = {
	// Efectos principales
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
		aspectRatio: '3/4',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 3,
		shadowStyle: 'soft' as const,
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

	// Efectos adicionales avanzados
	effects: {
		noiseTexture: {
			enabled: true,
			visibleOnHover: true,
			intensity: 0.2,
			scale: 1.5,
		},
		chromaticAberration: {
			enabled: true,
			visibleOnHover: true,
			intensity: 0.3,
		},
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

	// Configuración de textura como parte de layerSystem
	layerSystem: {
		order: ['background', 'content', 'effects', 'texture', 'border'],
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
	if (imageCount >= 200) {
		return 'mythic';
	}
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

	// Crear configuración de rareza mejorada
	return {
		color: rarity.color,
		borderColor: rarity.borderColor,
		glowColor: rarity.glowColor,
		label: rarity.label
	};
}

// Componente para mostrar estrellas de rareza
function RarityStars({ count }: { count: number }) {
	return (
		<div className="flex items-center justify-center mt-1">
			{Array.from({ length: count }).map((_, i) => (
				<Star
					key={`star-${i}-${count}`}
					className={cn(
						"h-3 w-3 mx-0.5",
						count >= 4 ? "text-yellow-400" : count >= 3 ? "text-blue-400" : count >= 2 ? "text-green-400" : "text-gray-400"
					)}
					fill="currentColor"
				/>
			))}
		</div>
	);
}

// Definir una interfaz específica para las opciones de tarjeta de carpeta
interface FolderCardOptions extends Partial<CardOptionsType> {
	textureConfig?: {
		type: string;
		intensity: number;
		scale: number;
		blendMode: string;
	};
	effects?: {
		noiseTexture?: {
			enabled: boolean;
			visibleOnHover: boolean;
			intensity: number;
		};
		chromaticAberration?: {
			enabled: boolean;
			visibleOnHover: boolean;
			intensity: number;
		};
		glitchEffect?: {
			enabled: boolean;
			visibleOnHover: boolean;
			intensity: number;
			frequency: number;
		};
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
	const imageCount = folder.imageCount || 0;
	const rarityKey = getFolderRarity(imageCount);
	const rarityInfo = FOLDER_RARITY[rarityKey];
	const rarityConfig = generateFolderRarityConfig(folder);
	const rarityClass = `folder-card-rarity-${rarityKey}`;

	// Generar configuración avanzada basada en la rareza
	const enhancedCardOptions = useMemo(() => {
		// Valores por defecto
		const defaults = _DEFAULT_FOLDER_OPTIONS;

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
				size: 20 + (rarityInfo.stars * 2), // Más estrellas = más grande el glow
				visibleOnIdle: rarityKey === 'mythic', // Solo visible por defecto en míticas
				animationType: isSpecial ? 'pulse' : 'static',
			},

			// Configurar bordes animados
			borderOptions: {
				...(defaults.borderOptions || {}),
				width: rarityInfo.stars * 0.5, // Más estrellas = borde más grueso
				color: rarityInfo.borderColor,
				pattern: isSpecial ? 'gradient' : 'solid',
				animationType: rarityInfo.borderAnimation || 'none',
				glowIntensity: intensity,
			},

			// Configurar texturas específicas
			textureConfig: {
				type: rarityInfo.textureType || 'noise',
				intensity: rarityInfo.textureOpacity || 0.15,
				scale: 1 + (rarityInfo.stars * 0.1), // Escala aumenta con rareza
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
					visibleOnHover: !isSpecial, // Siempre visible en carpetas especiales
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
				entityId={folder.id}
				entityType="folder"
				className={cn('folder-card-wrapper relative w-full h-full', rarityClass)}
				options={enhancedCardOptions as Partial<CardOptionsType>}
				showVisualConfig={showVisualConfig}
				onVisualConfigClick={onVisualConfigClick}
				enableExplode={enableExplode}
				isExploded={isExploded}
				activeLayer={activeLayer}
				onExplodedChange={onExplodedChange}
				onActiveLayerChange={onActiveLayerChange}
				explodeLayers={explodeLayers}
			>
				{/* Diseño mejorado tipo TCG */}
				<div className="folder-card-content p-3 flex flex-col h-full w-full relative">
					{/* Cabecera con el emblema y nombre de la carpeta */}
					<div className="folder-card-header mb-3 relative">
						{/* Marco superior con estilo TCG */}
						<div className={cn(
							"absolute -top-1.5 -left-1.5 -right-1.5 h-12 rounded-t-md bg-gradient-to-r",
							rarityKey === 'mythic' ? "from-purple-900 via-fuchsia-600 to-purple-900" :
								rarityKey === 'legendary' ? "from-yellow-900 via-amber-600 to-yellow-900" :
									rarityKey === 'rare' ? "from-blue-900 via-blue-600 to-blue-900" :
										rarityKey === 'uncommon' ? "from-green-900 via-green-600 to-green-900" :
											"from-gray-800 via-gray-600 to-gray-800"
						)}>
							<div className="absolute inset-0 opacity-20 bg-grid-pattern" />
						</div>

						{/* Emblema de la carpeta */}
						<div className={cn(
							"folder-emoji flex items-center justify-center w-10 h-10 rounded-full border-2 z-10 relative",
							"text-xl bg-background shadow-md",
							`border-${rarityKey === 'mythic' ? 'fuchsia' :
								rarityKey === 'legendary' ? 'amber' :
									rarityKey === 'rare' ? 'blue' :
										rarityKey === 'uncommon' ? 'green' : 'gray'}-500`
						)}>
							{folder.emoji || <FolderIcon className="h-5 w-5" />}
						</div>

						{/* Nombre de la carpeta */}
						<h3 className="folder-title text-base font-bold line-clamp-1 mt-2.5 pt-5 relative z-10">
							{folder.name}
						</h3>

						{/* Indicador de rareza */}
						<RarityStars count={rarityInfo.stars} />
					</div>

					{/* Imagen o ilustración de la carpeta (simulada) */}
					<div className={cn(
						"folder-card-image relative h-24 mb-3 rounded overflow-hidden border",
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

					{/* Cuerpo de la tarjeta con información de estadísticas */}
					<div className="folder-card-body flex-grow relative">
						{/* Marco tipo TCG para datos */}
						<div className="absolute -left-1 -right-1 top-0 bottom-0 border border-stone-800/30 rounded bg-card/80 -z-10" />

						<div className="folder-stats text-xs space-y-1.5 p-1.5">
							{/* Estadísticas de la carpeta */}
							<div className="flex items-center gap-1.5 border-b border-stone-800/10 pb-1">
								<Image className="h-3.5 w-3.5 opacity-70" />
								<span className="flex-grow font-medium">{imageCount} imágenes</span>
							</div>

							{folder.totalSize !== undefined && (
								<div className="flex items-center gap-1.5">
									<HardDrive className="h-3.5 w-3.5 opacity-70" />
									<span className="flex-grow">{formatFileSize(folder.totalSize)}</span>
								</div>
							)}

							{/* Fecha de indexación */}
							{folder.lastIndexed && (
								<div className="flex items-center gap-1.5">
									<Clock className="h-3.5 w-3.5 opacity-70" />
									<span className="flex-grow text-xs">
										Indexado:{' '}
										{typeof folder.lastIndexed === 'string'
											? new Date(folder.lastIndexed).toLocaleDateString()
											: folder.lastIndexed.toLocaleDateString()}
									</span>
								</div>
							)}

							{/* Fecha de creación */}
							<div className="flex items-center gap-1.5">
								<Calendar className="h-3.5 w-3.5 opacity-70" />
								<span className="flex-grow text-xs">
									Creado:{' '}
									{typeof folder.createdAt === 'string'
										? new Date(folder.createdAt).toLocaleDateString()
										: folder.createdAt.toLocaleDateString()}
								</span>
							</div>
						</div>
					</div>

					{/* Pie de la tarjeta con sello de rareza */}
					<div className="folder-card-footer mt-2 text-xs flex items-center justify-between">
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

						{/* Número de colección (simulado) */}
						<span className="text-[10px] opacity-70">#{folder.id.substring(0, 6)}</span>
					</div>
				</div>
			</EntityCardWrapper>
		</div>
	);
}
