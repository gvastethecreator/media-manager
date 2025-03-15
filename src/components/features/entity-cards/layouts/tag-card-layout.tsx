'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { ArrowUpRight, Edit, Star, Tag, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import type * as React from 'react';
import { useState } from 'react';
import { DEFAULT_SETTINGS_OPTIONS } from '../config/card-config-defaults';
import { VisualizationConfig } from '../config/visualization-config';
import { EntityCardWrapper } from '../entity-card-wrapper';
import type { CardDesignData, CardDesignPreset, CardOptions, RarityConfig } from '../types/base-card-types';
import { ImageGrid } from './image-grid';

// Variantes para la tarjeta de etiqueta inspirada en Yu-Gi-Oh
const tagCardVariants = cva('', {
	variants: {
		type: {
			trap: 'bg-gradient-to-b from-[#7d2547] to-[#551a31]', // Púrpura/Violeta para trampas
			spell: 'bg-gradient-to-b from-[#1e7854] to-[#145235]', // Verde para hechizos
			effect: 'bg-gradient-to-b from-[#8B4513] to-[#654321]', // Marrón para efectos
			ritual: 'bg-gradient-to-b from-[#4169E1] to-[#0000CD]', // Azul para rituales
			normal: 'bg-gradient-to-b from-[#bebebe] to-[#8a8a8a]', // Gris para normales
		},
		rarity: {
			common: 'text-gray-800',
			uncommon: 'text-indigo-700',
			rare: 'text-amber-500',
			epic: 'text-purple-600',
			legendary: 'text-red-600',
		},
	},
	defaultVariants: {
		type: 'normal',
		rarity: 'common',
	},
});

// Opciones visuales optimizadas para tarjetas de etiquetas
const DEFAULT_TAG_OPTIONS: Partial<CardOptions> = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: false,

	// Sistema de diseño específico para etiquetas
	designSystem: {
		preset: 'tag' as CardDesignPreset,
		variant: 'default',
		aspectRatio: '3/4',
		cornerStyle: 'rounded',
		cornerRadius: 8,
		elevation: 2,
		shadowStyle: 'soft',
	},

	// Configuración de movimiento
	hoverLiftHeight: 6,
	maxRotation: 10,
	primaryColor: '64, 64, 64',
	secondaryColor: '180, 180, 180',

	// Opciones de efectos
	holographicOptions: {
		patternType: 'rainbow',
		intensity: 0.6,
		animationSpeed: 1.2,
		visibleOnHover: true,
	},

	glowOptions: {
		intensity: 0.8,
		size: 15,
		animationType: 'follow-mouse',
		visibleOnHover: true,
	},

	grainOptions: {
		intensity: 0.1,
		density: 0.4,
		animated: false,
		noise: 'light',
	},
};

// Sistema de rareza para etiquetas
const TAG_RARITY_CONFIG = {
	common: {
		color: '#8a8a8a',
		borderWidth: '1px',
		borderEffect: 'static',
		glowColor: undefined,
		label: 'Común',
	},
	uncommon: {
		color: '#1e90ff',
		borderWidth: '1px',
		borderEffect: 'static',
		glowColor: undefined,
		label: 'Poco común',
	},
	rare: {
		color: '#ffd700',
		borderWidth: '1px',
		borderEffect: 'static',
		glowColor: '#ffd700',
		label: 'Raro',
	},
	epic: {
		color: '#9932cc',
		borderWidth: '2px',
		borderEffect: 'static',
		glowColor: '#9932cc',
		label: 'Épico',
	},
	legendary: {
		color: '#ff4500',
		borderWidth: '2px',
		borderEffect: 'animated',
		glowColor: '#ff4500',
		label: 'Legendario',
	},
};

export interface TagCardProps {
	tag: {
		id: string;
		name: string;
		type?: 'trap' | 'spell' | 'effect' | 'ritual' | 'normal';
		description?: string;
		count?: number;
		color?: string;
		rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
		categories?: string[];
		icon?: string;
		attributes?: string[];
		relatedCategories?: string[];
		featuredImage?: string;
		emoji?: string;
	};
	className?: string;
	options?: Partial<CardOptions>;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
	showVisualizationConfig?: boolean;
}

export function TagCard({
	tag,
	className,
	options,
	onEdit,
	onDelete,
	onClick,
	showVisualizationConfig = false,
}: TagCardProps) {
	const [showConfig, setShowConfig] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [cardOptions, setCardOptions] = useState<Partial<CardOptions>>({
		...DEFAULT_TAG_OPTIONS,
		...options,
	});

	// Preparar la configuración de rareza basada en la rareza del tag
	const rarityConfig: RarityConfig = {
		name: tag.rarity || 'common',
		color:
			tag.rarity && TAG_RARITY_CONFIG[tag.rarity as keyof typeof TAG_RARITY_CONFIG]
				? TAG_RARITY_CONFIG[tag.rarity as keyof typeof TAG_RARITY_CONFIG].color
				: tag.color || '#3b82f6',
		borderWidth: tag.rarity === 'legendary' || tag.rarity === 'epic' ? '2px' : '1px',
		borderEffect: tag.rarity === 'legendary' ? 'animated' : 'static',
		glowColor:
			tag.rarity && TAG_RARITY_CONFIG[tag.rarity as keyof typeof TAG_RARITY_CONFIG]
				? TAG_RARITY_CONFIG[tag.rarity as keyof typeof TAG_RARITY_CONFIG].glowColor
				: undefined,
	};

	// Obtener la variante de color basada en el tipo
	const typeVariant = tag.type || 'normal';

	return (
		<>
			{showConfig && (
				<VisualizationConfig
					options={cardOptions}
					onOptionsChange={(newOptions) => {
						setCardOptions({
							...cardOptions,
							...newOptions,
						});
					}}
					onClose={() => setShowConfig(false)}
				/>
			)}

			<EntityCardWrapper
				className={cn(tagCardVariants({ type: typeVariant, rarity: tag.rarity }), className)}
				options={cardOptions}
				entityType="tag"
				rarity={rarityConfig}
				onClick={onClick}
				onHoverStart={() => setIsHovered(true)}
				onHoverEnd={() => setIsHovered(false)}
				showVisualizationConfig={showVisualizationConfig}
				onVisualizationConfigClick={() => setShowConfig(true)}
			>
				{/* Estructura principal de la carta de etiqueta (inspirada en Yu-Gi-Oh) */}
				<div className="flex flex-col h-full p-3">
					{/* Cabecera con nombre y tipo */}
					<div className="flex items-center justify-between mb-2 border-b border-white/20 pb-2">
						<div className="flex items-center gap-2">
							<div
								className={cn(
									'flex items-center justify-center w-7 h-7 rounded-full',
									tag.color ? 'bg-opacity-20' : 'bg-primary/20'
								)}
								style={{ backgroundColor: tag.color || undefined }}
							>
								{tag.emoji ? (
									<span className="text-lg">{tag.emoji}</span>
								) : (
									<Tag
										className={cn('h-4 w-4', tag.color ? 'text-opacity-90' : 'text-primary')}
										style={{ color: tag.color || undefined }}
									/>
								)}
							</div>
							<div>
								<h3 className="text-sm font-semibold leading-tight line-clamp-1 text-card-foreground">{tag.name}</h3>
								<div className="flex items-center text-xs text-muted-foreground space-x-1">
									<span
										className={cn(
											'capitalize',
											typeVariant === 'trap'
												? 'text-purple-600'
												: typeVariant === 'spell'
													? 'text-green-600'
													: typeVariant === 'effect'
														? 'text-amber-600'
														: typeVariant === 'ritual'
															? 'text-blue-600'
															: 'text-gray-600'
										)}
									>
										{typeVariant}
									</span>
									{tag.count !== undefined && (
										<>
											<span>•</span>
											<span>
												{tag.count} {tag.count === 1 ? 'imagen' : 'imágenes'}
											</span>
										</>
									)}
								</div>
							</div>
						</div>

						{/* Indicador de rareza */}
						<div className="px-1.5 py-0.5 text-[10px] bg-white/10 backdrop-blur-sm rounded-full">
							{TAG_RARITY_CONFIG[tag.rarity as keyof typeof TAG_RARITY_CONFIG]?.label || 'Común'}
						</div>
					</div>

					{/* Área de imagen o ilustración */}
					<div className="flex-1 mb-2 rounded-md overflow-hidden bg-card-foreground/5 border border-border/40">
						{cardOptions.useImageGrid && tag.featuredImage ? (
							<ImageGrid
								layout={cardOptions.imageGridLayout || 'single'}
								gap={cardOptions.imageGridGap || 2}
								style={{ height: '100%' }}
								images={[{ src: tag.featuredImage, alt: tag.name }]}
							/>
						) : tag.featuredImage ? (
							<img src={tag.featuredImage} alt={tag.name} className="w-full h-full object-cover" />
						) : (
							<div className="flex items-center justify-center w-full h-full p-4">
								<div
									className={cn(
										'w-20 h-20 rounded-full flex items-center justify-center',
										tag.color ? 'bg-opacity-10' : 'bg-primary/10'
									)}
									style={{ backgroundColor: tag.color || undefined }}
								>
									{tag.emoji ? (
										<span className="text-4xl">{tag.emoji}</span>
									) : (
										<Tag
											className={cn('h-10 w-10', tag.color ? 'text-opacity-80' : 'text-primary/80')}
											style={{ color: tag.color || undefined }}
										/>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Descripción y atributos */}
					<div className="mb-2">
						{tag.description && <p className="text-xs text-card-foreground mb-2 line-clamp-3">{tag.description}</p>}

						{/* Atributos como pequeñas píldoras */}
						{tag.attributes && tag.attributes.length > 0 && (
							<div className="flex flex-wrap gap-1 mt-1">
								{tag.attributes.map((attr) => (
									<span
										key={`attr-${attr}`}
										className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary"
									>
										{attr}
									</span>
								))}
							</div>
						)}
					</div>

					{/* Footer con categorías relacionadas */}
					{tag.relatedCategories && tag.relatedCategories.length > 0 && (
						<div className="mt-auto text-[10px] text-muted-foreground">
							<p>Categorías relacionadas:</p>
							<div className="flex flex-wrap gap-1 mt-1">
								{tag.relatedCategories.map((category) => (
									<span key={`category-${category}`} className="text-primary/80">
										{category}
									</span>
								))}
							</div>
						</div>
					)}

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
										if (tag.id) {
											onEdit(tag.id);
										}
									}}
								>
									<Edit className="h-4 w-4" />
								</Button>
							)}
							{onDelete && (
								<Button
									variant="secondary"
									size="icon"
									className="h-8 w-8 shadow-md text-destructive"
									onClick={() => {
										if (tag.id) {
											onDelete(tag.id);
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
			</EntityCardWrapper>
		</>
	);
}
