'use client';

import { cn } from '@/lib/utils/utils';
import { cva } from 'class-variance-authority';
import { Edit, Tag, Trash2 } from 'lucide-react';
import type * as React from 'react';
import { useState } from 'react';
import type { CardDesignData, CardDesignPreset, CardOptions, RarityConfig } from '../base/base-card-types';
import { EntityCardWrapper } from '../base/entity-card-wrapper';
import { DEFAULT_SETTINGS_OPTIONS } from '../settings/card-config-defaults';
import { VisualizationConfig } from '../settings/visualization-config';

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
			tag.rarity === 'legendary'
				? '#ff4500'
				: tag.rarity === 'epic'
					? '#9932cc'
					: tag.rarity === 'rare'
						? '#ffd700'
						: tag.rarity === 'uncommon'
							? '#1e90ff'
							: tag.color || '#3b82f6',
		borderWidth: tag.rarity === 'legendary' || tag.rarity === 'epic' ? '2px' : '1px',
		borderEffect: tag.rarity === 'legendary' ? 'animated' : 'static',
		glowColor:
			tag.rarity === 'legendary'
				? '#ff4500'
				: tag.rarity === 'epic'
					? '#9932cc'
					: tag.rarity === 'rare'
						? '#ffd700'
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
					<div className="flex items-center justify-between mb-2">
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

						{/* Acciones solo visibles en hover */}
						{(isHovered || onDelete || onEdit) && (
							<div
								className={cn('flex items-center gap-1 transition-opacity', isHovered ? 'opacity-100' : 'opacity-0')}
							>
								{onEdit && (
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											onEdit(tag.id);
										}}
										className="p-1 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
									>
										<Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
									</button>
								)}
								{onDelete && (
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											onDelete(tag.id);
										}}
										className="p-1 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
									>
										<Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
									</button>
								)}
							</div>
						)}
					</div>

					{/* Área de imagen o ilustración */}
					<div className="flex-1 mb-2 rounded-md overflow-hidden bg-card-foreground/5 border border-border/40">
						{tag.featuredImage ? (
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
								{tag.attributes.map((attr, index) => (
									<span
										key={`attr-${attr}-${index}`}
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
								{tag.relatedCategories.map((category, index) => (
									<span key={`category-${category}-${index}`} className="text-primary/80">
										{index > 0 && '• '}
										{category}
									</span>
								))}
							</div>
						</div>
					)}
				</div>
			</EntityCardWrapper>
		</>
	);
}
