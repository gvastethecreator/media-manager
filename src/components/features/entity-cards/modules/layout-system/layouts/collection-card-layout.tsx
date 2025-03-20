'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/format.utils';
import type { Collection } from '@/types/entities/collections';
import {
	Calendar,
	FileImage,
	FolderLock,
	GridIcon,
	Image as ImageIcon,
	Images,
	LibraryIcon,
	PencilIcon,
	Share2,
	Star,
	Tag as TagIcon,
	Trash2,
	Users
} from 'lucide-react';
import { useCallback, useMemo } from 'react';

// Importar componentes base
import {
	CardDescriptionSection,
	CardFooter,
	CardHeader,
	CardImageSection,
	CardMetadataSection
} from '../../../base';

// Importar tipos y utilidades
import { EntityCardWrapper } from '../../../entity-card-wrapper';
import { usePreset } from '../../../hooks/use-preset';
import { adaptCardOptions } from '../../../types';
import type { CardOptions } from '../../../types/unified-card-types';

import '../styles/collection-card.css';

// TIPOS DE DATOS
// ==============================

// Tipos de colecciones
interface CollectionType {
	type: string;
	icon: React.ReactNode;
	color: string;
	label: string;
	className: string;
}

const COLLECTION_TYPES: Record<string, CollectionType> = {
	gallery: {
		type: 'gallery',
		icon: <Images className="h-5 w-5" />,
		color: '#3b82f6',
		label: 'Galería',
		className: 'collection-type-gallery'
	},
	album: {
		type: 'album',
		icon: <GridIcon className="h-5 w-5" />,
		color: '#22c55e',
		label: 'Álbum',
		className: 'collection-type-album'
	},
	project: {
		type: 'project',
		icon: <FileImage className="h-5 w-5" />,
		color: '#f97316',
		label: 'Proyecto',
		className: 'collection-type-project'
	},
	shared: {
		type: 'shared',
		icon: <Share2 className="h-5 w-5" />,
		color: '#8b5cf6',
		label: 'Compartida',
		className: 'collection-type-shared'
	},
	curated: {
		type: 'curated',
		icon: <Star className="h-5 w-5" />,
		color: '#eab308',
		label: 'Curada',
		className: 'collection-type-curated'
	},
	private: {
		type: 'private',
		icon: <FolderLock className="h-5 w-5" />,
		color: '#ec4899',
		label: 'Privada',
		className: 'collection-type-private'
	},
	library: {
		type: 'library',
		icon: <LibraryIcon className="h-5 w-5" />,
		color: '#06b6d4',
		label: 'Biblioteca',
		className: 'collection-type-library'
	},
	default: {
		type: 'default',
		icon: <Images className="h-5 w-5" />,
		color: '#6b7280',
		label: 'Colección',
		className: 'collection-type-default'
	}
};

// Configuración predeterminada para tarjetas de colecciones
const DEFAULT_COLLECTION_OPTIONS: Partial<CardOptions> = {
	// Efectos principales
	enable3DEffect: true,
	enableHolographicEffect: false,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: true,

	// Configuración de diseño específica para colecciones
	designSystem: {
		preset: 'collection',
		variant: 'gallery',
		aspectRatio: '3/4',
		cornerStyle: 'rounded',
		cornerRadius: 8,
		elevation: 2,
		shadowStyle: 'soft',
	},

	// Efectos específicos para colecciones
	glowOptions: {
		intensity: 0.6,
		size: 15,
		blurAmount: 12,
		animationType: 'pulse',
		pulseSpeed: 2.5,
		visibleOnHover: true,
	},

	borderOptions: {
		width: 1.5,
		pattern: 'solid',
		animation: {
			type: 'none',
			duration: 3000,
			timing: 'ease-in-out',
			iteration: 'infinite',
		},
		glowIntensity: 0.5,
	},

	grainOptions: {
		intensity: 0.15,
		density: 0.6,
		contrast: 1,
		noise: 'subtle',
		animated: false,
	},

	// Parámetros de interactividad
	interactivity: {
		enableHoverEffects: true,
		enableClickEffects: true,
		hover: {
			scale: 1.03,
			rotate: false,
			lift: true,
			glow: true,
		}
	},

	// Configuración de estados
	states: {
		enableHover: true,
		stateDuration: 200,
	},

	// Animación
	maxRotation: 5,
};

// Añadir esta interfaz antes de CollectionCardProps (alrededor de la línea 146)
interface CollectionExtended extends Collection {
	type?: string;
	isShared?: boolean;
	isPrivate?: boolean;
	isCurated?: boolean;
	presetId?: string;
	imageCount?: number;
	totalSize?: number;
	memberCount?: number;
	tagCount?: number;
	coverImage?: string;
}

// Actualizar la interfaz de props
export interface CollectionCardProps {
	collection: CollectionExtended;
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
	onEdit?: (collection: CollectionExtended) => void;
	onDelete?: (id: string) => void;
}

// UTILIDADES Y COMPONENTES AUXILIARES
// ==============================

// Obtener el tipo de colección
function getCollectionType(collection: CollectionExtended): keyof typeof COLLECTION_TYPES {
	if (collection.isShared) return 'shared';
	if (collection.isPrivate) return 'private';
	if (collection.isCurated) return 'curated';

	const type = collection.type?.toLowerCase() || 'default';
	return type in COLLECTION_TYPES ? (type as keyof typeof COLLECTION_TYPES) : 'default';
}

// Generar configuración de color para una colección
function generateCollectionColorConfig(collection: CollectionExtended) {
	const typeKey = getCollectionType(collection);
	const typeInfo = COLLECTION_TYPES[typeKey];
	const customColor = collection.color || typeInfo.color;

	return {
		enabled: true,
		type: typeKey,
		color: customColor,
		borderColor: customColor,
		glowColor: customColor,
		borderStyle: 'solid',
		borderWidth: 2,
	};
}

// COMPONENTE PRINCIPAL
// ==============================
export function CollectionCardLayout({
	collection: initialCollection,
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
}: CollectionCardProps) {
	// Garantizar que nunca procesamos una colección undefined
	const collection = initialCollection || {
		id: 'placeholder',
		name: 'Colección sin nombre',
		emoji: '📁',
		color: '#6b7280',
		description: 'Sin descripción',
		type: 'default',
		imageCount: 0,
		totalSize: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	} as CollectionExtended;

	// Usar el hook para obtener configuración de preset
	const { cardOptions } = usePreset({
		entityType: 'collection',
		entityId: collection.id,
		presetId: typeof collection.presetId === 'string' ? collection.presetId : null,
		baseOptions: options,
	});

	// Configurar las capas para el modo explode
	const explodeLayers = [
		{ id: 'background', label: 'Fondo', icon: <GridIcon className="h-4 w-4" /> },
		{ id: 'coverImage', label: 'Portada', icon: <ImageIcon className="h-4 w-4" /> },
		{ id: 'content', label: 'Contenido', icon: <LibraryIcon className="h-4 w-4" /> },
		{ id: 'effects', label: 'Efectos', icon: <Star className="h-4 w-4" /> },
	];

	// Obtener la información de tipo
	const typeKey = getCollectionType(collection);
	const typeInfo = COLLECTION_TYPES[typeKey];
	const colorConfig = generateCollectionColorConfig(collection);
	const collectionClassName = `collection-card-type-${typeKey}`;

	// Procesar el color personalizado si existe
	const collectionColor = collection.color || typeInfo.color;

	// Manejadores de eventos
	const handleEdit = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onEdit && collection) {
			onEdit(collection);
		}
	}, [onEdit, collection]);

	const handleDelete = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDelete && collection?.id) {
			onDelete(collection.id);
		}
	}, [onDelete, collection?.id]);

	// Generar configuración avanzada basada en el tipo
	const enhancedCardOptions = useMemo(() => {
		// Valores por defecto
		const defaults = DEFAULT_COLLECTION_OPTIONS;

		// Crear opciones combinadas
		return {
			...defaults,

			// Configurar glows basados en tipo
			glowOptions: {
				...(defaults.glowOptions || {}),
				color: colorConfig.glowColor,
				intensity: 0.6,
			},

			// Configurar bordes
			borderOptions: {
				...(defaults.borderOptions || {}),
				color: colorConfig.borderColor,
			},

			// Configuración de color
			colorConfig,

			// Color primario personalizado
			primaryColor: collectionColor,
		};
	}, [colorConfig, collectionColor]);

	// Formatear fecha
	const formattedDate = useMemo(() => {
		if (!collection.createdAt) return '';

		const date = typeof collection.createdAt === 'string'
			? new Date(collection.createdAt)
			: collection.createdAt;

		return date.toLocaleDateString();
	}, [collection.createdAt]);

	// Procesar los metadatos de la colección
	const collectionMetadata = useMemo(() => {
		const metadata = [];

		if (collection.imageCount !== undefined) {
			metadata.push({
				label: 'Imágenes',
				value: collection.imageCount.toString(),
				icon: <ImageIcon className="h-3.5 w-3.5 opacity-70" />
			});
		}

		if (collection.totalSize !== undefined) {
			metadata.push({
				label: 'Tamaño',
				value: formatFileSize(collection.totalSize),
				icon: <FileImage className="h-3.5 w-3.5 opacity-70" />
			});
		}

		if (collection.memberCount !== undefined) {
			metadata.push({
				label: 'Miembros',
				value: collection.memberCount.toString(),
				icon: <Users className="h-3.5 w-3.5 opacity-70" />
			});
		}

		if (collection.tagCount !== undefined) {
			metadata.push({
				label: 'Etiquetas',
				value: collection.tagCount.toString(),
				icon: <TagIcon className="h-3.5 w-3.5 opacity-70" />
			});
		}

		return metadata;
	}, [collection.imageCount, collection.totalSize, collection.memberCount, collection.tagCount]);

	return (
		<div className={cn(
			'collection-card-container relative w-full h-full group',
			collectionClassName,
			onClick && 'cursor-pointer',
			className
		)}>
			<EntityCardWrapper
				title={collection.name}
				description={collection.description || ''}
				entityId={collection.id}
				entityType="collection"
				className={cn('collection-card-wrapper relative w-full h-full', collectionClassName)}
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
				<div className="collection-card-content flex flex-col h-full w-full relative">
					{/* Cabecera con ícono y nombre de la colección */}
					<CardHeader
						title={collection.name}
						entityType="collection"
						className="mb-2 relative z-10"
						showIcon={false}
						rightContent={
							<>
								<div className={cn(
									"collection-type px-2 py-0.5 rounded-full text-[10px] font-medium",
								)}
									style={{
										backgroundColor: `${collectionColor}20`,
										color: collectionColor
									}}>
									{typeInfo.label}
								</div>

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

					{/* Collection icon */}
					<div className="flex items-center ml-3 -mt-1 mb-3">
						<div className={cn(
							"collection-icon flex items-center justify-center w-10 h-10 rounded-full border-2 bg-background shadow-md"
						)}
							style={{ borderColor: collectionColor }}>
							<div style={{ color: collectionColor }}>
								{typeInfo.icon}
							</div>
						</div>
					</div>

					{/* Imagen de portada */}
					<div className={cn(
						"collection-cover-image relative h-40 mb-3 rounded overflow-hidden border",
					)}
						style={{ borderColor: `${collectionColor}40` }}>
						{collection.coverImage ? (
							<CardImageSection
								imageUrl={collection.coverImage}
								alt={collection.name}
								aspectRatio="wide"
								overlayContent={
									<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
								}
							/>
						) : (
							<div className={cn(
								"absolute inset-0 bg-gradient-to-br",
							)}
								style={{
									background: `linear-gradient(to bottom right, ${collectionColor}20, ${collectionColor}05)`
								}}>
								{/* Patrón decorativo */}
								<div className="absolute inset-0 opacity-10 mix-blend-overlay bg-noise-pattern" />
							</div>
						)}

						{/* Icono central si no hay imagen */}
						{!collection.coverImage && (
							<div className="absolute inset-0 flex items-center justify-center">
								<Images className="h-16 w-16 opacity-30" style={{ color: collectionColor }} />
							</div>
						)}
					</div>

					{/* Descripción de la colección */}
					{collection.description && (
						<CardDescriptionSection
							description={collection.description}
							maxLines={3}
							className="mb-3 text-sm"
						/>
					)}

					{/* Metadatos de la colección */}
					{collectionMetadata.length > 0 && (
						<CardMetadataSection
							items={collectionMetadata}
							className="flex-grow grid-cols-2 gap-2"
						/>
					)}

					{/* Pie de la tarjeta con fecha y estado */}
					<CardFooter
						className="mt-auto"
						leftContent={
							<div className="flex items-center gap-1">
								{collection.isPrivate && <FolderLock className="h-3 w-3 opacity-70" />}
								{collection.isShared && <Share2 className="h-3 w-3 opacity-70" />}
								{collection.isCurated && <Star className="h-3 w-3 opacity-70" />}
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
export function CollectionCard(props: CollectionCardProps) {
	return <CollectionCardLayout {...props} />;
}