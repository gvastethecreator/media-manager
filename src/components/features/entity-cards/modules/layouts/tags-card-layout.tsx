'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Tag } from '@/types/entities/tags';
import {
	Calendar,
	Hash,
	Image as ImageIcon,
	Info,
	Layers,
	PencilIcon,
	Tag as TagIcon,
	Trash2
} from 'lucide-react';
import { useCallback, useMemo } from 'react';

// Importar componentes base
import {
	CardDescriptionSection,
	CardFooter,
	CardHeader,
	CardMetadataSection
} from '../../base';

// Importar tipos y utilidades
import { EntityCardWrapper } from '../../entity-card-wrapper';
import { usePreset } from '../../hooks/use-preset';
import { adaptCardOptions } from '../../types';
import type { CardOptions } from '../../types/unified-card-types';

import '../styles/tag-card.css';

// TIPOS DE DATOS
// ==============================

// Tipos de etiquetas con sus colores
interface TagCategory {
	color: string;
	borderColor: string;
	glowColor: string;
	label: string;
	category: string;
}

const TAG_CATEGORIES: Record<string, TagCategory> = {
	person: {
		color: '#3b82f6',
		borderColor: 'rgba(59, 130, 246, 0.8)',
		glowColor: 'rgba(59, 130, 246, 0.6)',
		label: 'Persona',
		category: 'person'
	},
	location: {
		color: '#22c55e',
		borderColor: 'rgba(34, 197, 94, 0.8)',
		glowColor: 'rgba(34, 197, 94, 0.6)',
		label: 'Ubicación',
		category: 'location'
	},
	event: {
		color: '#eab308',
		borderColor: 'rgba(234, 179, 8, 0.8)',
		glowColor: 'rgba(234, 179, 8, 0.7)',
		label: 'Evento',
		category: 'event'
	},
	concept: {
		color: '#8b5cf6',
		borderColor: 'rgba(139, 92, 246, 0.8)',
		glowColor: 'rgba(139, 92, 246, 0.6)',
		label: 'Concepto',
		category: 'concept'
	},
	object: {
		color: '#ec4899',
		borderColor: 'rgba(236, 72, 153, 0.8)',
		glowColor: 'rgba(236, 72, 153, 0.6)',
		label: 'Objeto',
		category: 'object'
	},
	style: {
		color: '#f97316',
		borderColor: 'rgba(249, 115, 22, 0.8)',
		glowColor: 'rgba(249, 115, 22, 0.6)',
		label: 'Estilo',
		category: 'style'
	},
	subject: {
		color: '#06b6d4',
		borderColor: 'rgba(6, 182, 212, 0.8)',
		glowColor: 'rgba(6, 182, 212, 0.6)',
		label: 'Tema',
		category: 'subject'
	},
	generic: {
		color: '#6b7280',
		borderColor: 'rgba(107, 114, 128, 0.8)',
		glowColor: 'rgba(107, 114, 128, 0.6)',
		label: 'Genérico',
		category: 'generic'
	}
};

// Configuración predeterminada para tarjetas de etiquetas
const DEFAULT_TAG_OPTIONS: Partial<CardOptions> = {
	// Efectos principales
	enable3DEffect: true,
	enableHolographicEffect: false,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: false,

	// Configuración de diseño específica para etiquetas
	designSystem: {
		preset: 'tag',
		variant: 'clean',
		aspectRatio: '1/1', // Tarjetas de etiquetas con forma cuadrada
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 2,
		shadowStyle: 'soft',
	},

	// Efectos específicos para etiquetas
	glowOptions: {
		intensity: 0.5,
		size: 15,
		blurAmount: 12,
		animationType: 'pulse',
		pulseSpeed: 2,
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

	// Parámetros de interactividad
	interactivity: {
		enableHoverEffects: true,
		enableClickEffects: true,
		hover: {
			scale: 1.05,
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

interface TagExtended extends Tag {
	count?: number;
	imageCount?: number;
	collections?: number;
	value?: string;
	presetId?: string;
}

export interface TagsCardProps {
	tag: TagExtended;
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
	onEdit?: (tag: TagExtended) => void;
	onDelete?: (id: string) => void;
}

// UTILIDADES Y COMPONENTES AUXILIARES
// ==============================

// Obtener categoría de etiqueta
function getTagCategory(tag: TagExtended): keyof typeof TAG_CATEGORIES {
	const category = tag.category?.toLowerCase() || 'generic';
	return category in TAG_CATEGORIES ? (category as keyof typeof TAG_CATEGORIES) : 'generic';
}

// Generar configuración de color para una etiqueta
function generateTagColorConfig(tag: TagExtended) {
	const categoryKey = getTagCategory(tag);
	const category = TAG_CATEGORIES[categoryKey];
	const customColor = tag.color || category.color;

	return {
		enabled: true,
		category: categoryKey,
		color: customColor,
		borderColor: category.borderColor,
		glowColor: category.glowColor,
		borderStyle: 'solid',
		borderWidth: 2,
	};
}

// COMPONENTE PRINCIPAL
// ==============================
export function TagsCardLayout({
	tag: initialTag,
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
}: TagsCardProps) {
	// Garantizar que nunca procesamos una etiqueta undefined
	const tag = initialTag || {
		id: 'placeholder',
		name: 'Etiqueta sin nombre',
		value: 'sin-valor',
		category: 'generic',
		count: 0,
		emoji: '🏷️',
		color: '#6b7280',
		createdAt: new Date(),
		updatedAt: new Date(),
	} as TagExtended;

	// Usar el hook para obtener configuración de preset
	const { cardOptions } = usePreset({
		entityType: 'tag',
		entityId: tag.id,
		presetId: typeof tag.presetId === 'string' ? tag.presetId : null,
		baseOptions: options,
	});

	// Configurar las capas para el modo explode
	const explodeLayers = [
		{ id: 'background', label: 'Fondo', icon: <Layers className="h-4 w-4" /> },
		{ id: 'content', label: 'Contenido', icon: <TagIcon className="h-4 w-4" /> },
		{ id: 'effects', label: 'Efectos', icon: <Info className="h-4 w-4" /> },
	];

	// Obtener la información de categoría
	const categoryKey = getTagCategory(tag);
	const categoryInfo = TAG_CATEGORIES[categoryKey];
	const colorConfig = generateTagColorConfig(tag);
	const tagClassName = `tag-card-category-${categoryKey}`;

	// Procesar el color personalizado si existe
	const tagColor = tag.color || categoryInfo.color;

	// Manejadores de eventos
	const handleEdit = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onEdit && tag) {
			onEdit(tag);
		}
	}, [onEdit, tag]);

	const handleDelete = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDelete && tag?.id) {
			onDelete(tag.id);
		}
	}, [onDelete, tag?.id]);

	// Generar configuración avanzada basada en la categoría
	const enhancedCardOptions = useMemo(() => {
		// Valores por defecto
		const defaults = DEFAULT_TAG_OPTIONS;

		// Crear opciones combinadas
		return {
			...defaults,

			// Configurar glows basados en categoría
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
			primaryColor: tagColor,
		};
	}, [colorConfig, tagColor]);

	// Formatear fecha
	const formattedDate = useMemo(() => {
		if (!tag.createdAt) return '';

		const date = typeof tag.createdAt === 'string'
			? new Date(tag.createdAt)
			: tag.createdAt;

		return date.toLocaleDateString();
	}, [tag.createdAt]);

	// Procesar los metadatos de la etiqueta
	const tagMetadata = useMemo(() => {
		const metadata = [];

		if (tag.count !== undefined) {
			metadata.push({
				label: 'Usos',
				value: tag.count.toString(),
				icon: <Hash className="h-3.5 w-3.5 opacity-70" />
			});
		}

		if (tag.imageCount !== undefined) {
			metadata.push({
				label: 'Imágenes',
				value: tag.imageCount.toString(),
				icon: <ImageIcon className="h-3.5 w-3.5 opacity-70" />
			});
		}

		if (tag.collections !== undefined && tag.collections > 0) {
			metadata.push({
				label: 'Colecciones',
				value: tag.collections.toString(),
				icon: <Layers className="h-3.5 w-3.5 opacity-70" />
			});
		}

		return metadata;
	}, [tag.count, tag.imageCount, tag.collections]);

	return (
		<div className={cn(
			'tag-card-container relative w-full h-full group',
			tagClassName,
			onClick && 'cursor-pointer',
			className
		)}>
			<EntityCardWrapper
				title={tag.name}
				description={tag.description || ''}
				entityId={tag.id}
				entityType="tag"
				className={cn('tag-card-wrapper relative w-full h-full', tagClassName)}
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
				<div className="tag-card-content flex flex-col h-full w-full relative p-3">
					{/* Cabecera con símbolo y nombre de la etiqueta */}
					<CardHeader
						title={tag.name}
						entityType="tag"
						className="mb-3 relative z-10"
						showIcon={false}
						rightContent={
							<>
								<div className={cn(
									"tag-category px-2 py-0.5 rounded-full text-[10px] font-medium",
									`bg-${categoryKey}-500/20 text-${categoryKey}-200`
								)}
									style={{
										backgroundColor: `${tagColor}20`,
										color: tagColor
									}}>
									{categoryInfo.label}
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

					{/* Tag symbol icon */}
					<div className="flex items-center ml-3 -mt-1 mb-3">
						<div className={cn(
							"tag-symbol flex items-center justify-center w-10 h-10 rounded-full border-2 bg-background shadow-md"
						)}
							style={{ borderColor: tagColor }}>
							<div style={{ color: tagColor }}>
								<TagIcon className="h-5 w-5" />
							</div>
						</div>
					</div>

					{/* Valor de la etiqueta (hashtag) */}
					<div className={cn(
						"tag-value flex items-center justify-center p-4 mb-3 rounded-md border",
						"bg-card/30"
					)}
						style={{ borderColor: `${tagColor}30` }}>
						<div className="text-lg font-semibold flex items-center gap-1">
							<Hash className="h-4 w-4 opacity-70" />
							<span>{tag.value || tag.name?.toLowerCase().replace(/\s+/g, '-')}</span>
						</div>
					</div>

					{/* Descripción de la etiqueta */}
					{tag.description && (
						<CardDescriptionSection
							description={tag.description}
							maxLines={3}
							className="mb-3 text-sm"
						/>
					)}

					{/* Metadatos de la etiqueta */}
					{tagMetadata.length > 0 && (
						<CardMetadataSection
							items={tagMetadata}
							className="mb-auto grid-cols-3 gap-2"
						/>
					)}

					{/* Pie de la tarjeta con fecha */}
					<CardFooter
						className="mt-auto"
						leftContent={
							<div className="text-xs opacity-70">
								#{tag.value || tag.name?.toLowerCase().replace(/\s+/g, '-')}
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
export function TagsCard(props: TagsCardProps) {
	return <TagsCardLayout {...props} />;
}