'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
	Album as AlbumIcon,
	Calendar,
	Camera,
	Images,
	PencilIcon,
	Star,
	Tag,
	Trash2
} from 'lucide-react';
import { useCallback, useMemo } from 'react';

// Importar componentes base
import {
	CardFooter,
	CardHeader,
	CardImageSection,
	CardMetadataSection
} from '../base';

// Importar tipos y utilidades
import type { AlbumWithStats } from '@/app/actions/albums/album.actions';
import { VisualizationConfig } from '../config/visualization-config';
import { EntityCardWrapper } from '../entity-card-wrapper';
import { usePreset } from '../hooks/use-preset';
import { adaptCardOptions } from '../types';
import type { CardOptions } from '../types/unified-card-types';
import type { AlbumFormData } from './forms/entity-types';

import '../../styles/album-card.css';

// TIPOS DE DATOS
// ==============================

// Definir CardData para manejar diferentes formas de datos de álbum
export type CardData =
	| (AlbumWithStats & {
		_count?: { images: number };
		totalSize?: number;
		coverImage?: string;
		recentImages?: string[];
		rating?: number;
		createdAt: Date | string;
	})
	| (AlbumFormData & {
		createdAt?: Date | string;
	});

// Props para AlbumCard (componente público)
export interface AlbumCardProps {
	data: CardData;
	isPreview?: boolean;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	onClick?: () => void;
	className?: string;
	showVisualizationConfig?: boolean;
	options?: Partial<CardOptions>;
}

// Props para AlbumCardLayout (componente interno)
export interface AlbumCardLayoutProps {
	album: CardData;
	onClick?: () => void;
	className?: string;
	showVisualConfig?: boolean;
	onVisualConfigClick?: () => void;
	enableExplode?: boolean;
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
	options?: Partial<CardOptions>;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
}

// SISTEMAS DE RAREZA
// ==============================

// Define rarity levels for albums with TCG styling
interface AlbumRarity {
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

const ALBUM_RARITY: Record<string, AlbumRarity> = {
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
		textureType: 'noise',
		glowIntensity: 0.5,
		textureOpacity: 0.2
	},
	rare: {
		color: '#3b82f6',
		borderColor: 'rgba(59, 130, 246, 0.8)',
		glowColor: 'rgba(59, 130, 246, 0.7)',
		label: 'Raro',
		rarity: 'rare' as const,
		stars: 3,
		textureType: 'hexagons',
		glowIntensity: 0.6,
		textureOpacity: 0.25
	},
	legendary: {
		color: '#f59e0b',
		borderColor: 'rgba(245, 158, 11, 0.8)',
		glowColor: 'rgba(245, 158, 11, 0.8)',
		label: 'Legendario',
		rarity: 'legendary' as const,
		stars: 4,
		textureType: 'dots',
		glowIntensity: 0.8,
		textureOpacity: 0.3,
		holographic: true,
		borderAnimation: 'flow'
	},
	mythic: {
		color: '#d946ef',
		borderColor: 'rgba(217, 70, 239, 0.8)',
		glowColor: 'rgba(217, 70, 239, 0.9)',
		label: 'Mítico',
		rarity: 'mythic' as const,
		stars: 5,
		textureType: 'stars',
		glowIntensity: 1,
		textureOpacity: 0.35,
		holographic: true,
		borderAnimation: 'rainbow'
	}
};

// Configuración visual por defecto para álbumes en estilo TCG
const DEFAULT_ALBUM_OPTIONS: Partial<CardOptions> = {
	// Efectos principales
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: false,

	// Sistema de diseño inspirado en cartas coleccionables
	designSystem: {
		preset: 'album',
		variant: 'tcg',
		aspectRatio: '7/10', // Proporción estándar de cartas coleccionables
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 3,
		shadowStyle: 'soft',
	},

	// Efectos holográficos y de brillo
	holographicOptions: {
		patternType: 'geometric',
		intensity: 0.6,
		animationSpeed: 1.5,
		visibleOnHover: true,
	},

	// Efectos de brillo
	glowOptions: {
		intensity: 0.7,
		size: 25,
		blurAmount: 18,
		animationType: 'pulse',
		pulseSpeed: 2,
		color: 'auto', // Toma el color de la rareza
		visibleOnHover: true,
	},

	// Bordes animados
	borderOptions: {
		width: 2.5,
		pattern: 'gradient',
		animationType: 'flow',
		animation: {
			type: 'flow',
			duration: 3000,
			timing: 'ease-in-out',
			iteration: 'infinite',
		},
		glowIntensity: 0.8,
	},

	// Textura de fondo
	textureConfig: {
		type: 'noise',
		intensity: 0.15,
		scale: 1.2,
		blendMode: 'overlay',
	},

	// Rotación máxima
	maxRotation: 15,

	// Colores base
	primaryColor: '#3b82f6',
	secondaryColor: '#1e40af',
	accentColor: '#60a5fa',
	backgroundColor: '#1e293b',
};

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
						count >= 4 ? "text-yellow-400" :
							count >= 3 ? "text-blue-400" :
								count >= 2 ? "text-green-400" : "text-gray-400"
					)}
					fill="currentColor"
				/>
			))}
		</div>
	);
}

// Determinar la rareza del álbum basado en cantidad de imágenes
function getAlbumRarity(imageCount: number): keyof typeof ALBUM_RARITY {
	if (imageCount >= 200) return 'mythic';
	if (imageCount >= 100) return 'legendary';
	if (imageCount >= 50) return 'rare';
	if (imageCount >= 20) return 'uncommon';
	return 'common';
}

// Generar configuración de rareza para el álbum
function generateAlbumRarityConfig(album: CardData) {
	const imageCount = ('_count' in album && album._count) ? album._count.images : 0;
	const rarityKey = getAlbumRarity(imageCount);
	const rarity = ALBUM_RARITY[rarityKey];

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
	};
}

// COMPONENTE PRINCIPAL
// ==============================
export function AlbumCardLayout({
	album,
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
	onEdit,
	onDelete,
}: AlbumCardLayoutProps) {
	// Verificar si album existe y tiene las propiedades necesarias
	if (!album) {
		console.warn('AlbumCardLayout: Se recibió un objeto album indefinido');
		// Crear un album por defecto para evitar errores
		album = {
			id: 'placeholder',
			name: 'Álbum sin nombre',
			description: 'Sin descripción',
			createdAt: new Date(),
			updatedAt: new Date(),
			_count: { images: 0 },
		} as CardData;
	}

	// Usar el hook para obtener configuración de preset
	const { cardOptions } = usePreset({
		entityType: 'album',
		entityId: album.id as string,
		presetId: 'presetId' in album && album.presetId ? album.presetId : null,
		baseOptions: options,
	});

	// Obtener la rareza del álbum
	const imageCount = ('_count' in album && album._count) ? album._count.images : 0;
	const rarityKey = getAlbumRarity(imageCount);
	const rarityInfo = ALBUM_RARITY[rarityKey];
	const rarityConfig = generateAlbumRarityConfig(album);
	const rarityClass = `album-card-rarity-${rarityKey}`;

	// Generar opciones de tarjeta mejoradas basadas en rareza
	const enhancedCardOptions = useMemo(() => {
		// Valores por defecto
		const defaults = DEFAULT_ALBUM_OPTIONS;

		// Ajustar intensidad de efectos según rareza
		const intensity = rarityInfo.glowIntensity || 0.5;

		// Habilitar efectos especiales para álbumes legendarios y míticos
		const isSpecial = rarityKey === 'legendary' || rarityKey === 'mythic';

		// Crear opciones combinadas con valores específicos de rareza
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

	// Configurar las capas para el modo explode
	const explodeLayers = [
		{ id: 'background', label: 'Fondo', icon: <Star className="h-4 w-4" /> },
		{ id: 'frame', label: 'Marco', icon: <AlbumIcon className="h-4 w-4" /> },
		{ id: 'content', label: 'Contenido', icon: <Camera className="h-4 w-4" /> },
		{ id: 'effects', label: 'Efectos', icon: <Star className="h-4 w-4" /> },
	];

	// Manejadores de eventos
	const handleEdit = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onEdit && album?.id) {
			onEdit(String(album.id));
		}
	}, [onEdit, album?.id]);

	const handleDelete = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDelete && album?.id) {
			onDelete(String(album.id));
		}
	}, [onDelete, album?.id]);

	// Obtener la URL de la imagen de portada
	const coverImageUrl = 'coverImage' in album && album.coverImage ? album.coverImage : null;

	// Generar metadatos para la sección de metadatos
	const metadataItems = [
		{
			label: 'Imágenes',
			value: imageCount,
			icon: <Images className="h-3.5 w-3.5 opacity-70" />
		},
		...('category' in album && album.category ? [{
			label: 'Categoría',
			value: album.category,
			icon: <Tag className="h-3.5 w-3.5 opacity-70" />
		}] : []),
		...('createdAt' in album && album.createdAt ? [{
			label: 'Creado',
			value: typeof album.createdAt === 'string'
				? new Date(album.createdAt).toLocaleDateString()
				: album.createdAt.toLocaleDateString(),
			icon: <Calendar className="h-3.5 w-3.5 opacity-70" />
		}] : [])
	];

	return (
		<>
			{showVisualConfig && (
				<VisualizationConfig
					onClose={() => { }}
					options={adaptCardOptions(cardOptions)}
					onOptionsChange={() => { }}
					entityId={album.id as string}
					entityType="album"
				/>
			)}

			<div className={cn(
				'album-card-container relative w-full h-full group',
				rarityClass,
				onClick && 'cursor-pointer',
				className
			)}>
				<EntityCardWrapper
					title={album.name || 'Álbum'}
					description={album.description || ''}
					entityId={album.id as string}
					entityType="album"
					className={cn('album-card-wrapper relative w-full h-full', rarityClass)}
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
					<div className="album-card-content flex flex-col h-full w-full relative">
						{/* Cabecera de la tarjeta */}
						<CardHeader
							title={album.name || 'Álbum'}
							entityType="album"
							showIcon={true}
							className="mb-3 pt-5 relative z-10"
							rightContent={
								(onEdit || onDelete) ? (
									<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
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
								) : undefined
							}
						/>

						{/* Indicador de rareza */}
						<RarityStars count={rarityInfo.stars} />

						{/* Imagen o ilustración del álbum */}
						<CardImageSection
							imageUrl={coverImageUrl || ''}
							alt={album.name || 'Álbum'}
							aspectRatio="video"
							className={cn(
								"mb-3 border",
								`border-${rarityKey === 'mythic' ? 'fuchsia' :
									rarityKey === 'legendary' ? 'amber' :
										rarityKey === 'rare' ? 'blue' :
											rarityKey === 'uncommon' ? 'green' : 'gray'}-500`
							)}
							overlayContent={!coverImageUrl ?
								<Camera className="h-12 w-12 text-white/40" /> : undefined
							}
						/>

						{/* Metadatos del álbum */}
						<CardMetadataSection
							items={metadataItems}
							className="flex-grow bg-card/80 rounded"
						/>

						{/* Pie de página con indicador de rareza */}
						<CardFooter
							className="mt-2 px-0"
							leftContent={
								<div className={cn(
									"album-rarity px-3 py-1 rounded-full text-[10px] font-medium",
									rarityKey === 'mythic' ? "bg-fuchsia-500/20 text-fuchsia-200" :
										rarityKey === 'legendary' ? "bg-amber-500/20 text-amber-200" :
											rarityKey === 'rare' ? "bg-blue-500/20 text-blue-200" :
												rarityKey === 'uncommon' ? "bg-green-500/20 text-green-200" :
													"bg-gray-500/20 text-gray-200"
								)}>
									{ALBUM_RARITY[rarityKey].label}
								</div>
							}
							rightContent={
								<span className="text-[10px] opacity-70">
									#{(album?.id ? String(album.id).substring(0, 6) : 'unkn')}
								</span>
							}
						/>
					</div>
				</EntityCardWrapper>
			</div>
		</>
	);
}

// Componente público para usar en la aplicación
export function AlbumCard(props: AlbumCardProps) {
	const { data, ...rest } = props;
	return <AlbumCardLayout album={data} {...rest} />;
}