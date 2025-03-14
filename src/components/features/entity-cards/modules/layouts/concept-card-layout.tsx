'use client';

import { VisualizationConfig } from '@/components/features/entity-cards/config/visualization-config';
import { EntityCardContent } from '@/components/features/entity-cards/entity-card-content';
import { EntityCardLayerWrapper } from '@/components/features/entity-cards/entity-card-layer-wrapper';
import type {
	CardDesignData,
	CardDesignPreset,
	CardOptions,
	RarityConfig,
} from '@/components/features/entity-cards/types/base-card-types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Concept } from '@prisma/client';
import { Book, Edit, LightbulbIcon, LinkIcon, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useState } from 'react';
import { ImageGrid } from './image-grid';

// Opciones visuales optimizadas para tarjetas de conceptos
const DEFAULT_CONCEPT_OPTIONS: Partial<CardOptions> = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: true,

	// Sistema de diseño específico para conceptos
	designSystem: {
		preset: 'concept' as CardDesignPreset,
		variant: 'default',
		aspectRatio: '4/5',
		cornerStyle: 'rounded',
		cornerRadius: 8,
		elevation: 2,
		shadowStyle: 'soft',
	},

	// Configuración de movimiento
	hoverLiftHeight: 6,
	maxRotation: 8,
	primaryColor: '217, 119, 6', // Un tono ámbar
	secondaryColor: '234, 179, 8', // Un tono dorado

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
};

// Define rarity levels for concepts
const CONCEPT_RARITY = {
	common: {
		color: '#9ca3af',
		borderColor: 'rgba(156, 163, 175, 0.5)',
		glowColor: 'rgba(156, 163, 175, 0.5)',
		label: 'Básico',
		rarity: 'common' as const,
	},
	uncommon: {
		color: '#22c55e',
		borderColor: 'rgba(34, 197, 94, 0.5)',
		glowColor: 'rgba(34, 197, 94, 0.5)',
		label: 'Notable',
		rarity: 'uncommon' as const,
	},
	rare: {
		color: '#3b82f6',
		borderColor: 'rgba(59, 130, 246, 0.5)',
		glowColor: 'rgba(59, 130, 246, 0.5)',
		label: 'Extraordinario',
		rarity: 'rare' as const,
	},
	legendary: {
		color: '#eab308',
		borderColor: 'rgba(234, 179, 8, 0.7)',
		glowColor: 'rgba(234, 179, 8, 0.7)',
		label: 'Legendario',
		rarity: 'legendary' as const,
	},
};

interface ConceptCardProps {
	concept: Concept;
	onEdit?: (concept: Concept) => void;
	onDelete?: (id: string) => void;
	onClick?: () => void;
	className?: string;
	showVisualConfig?: boolean;
	visualOptions?: Partial<CardOptions>;
}

function getConceptRarity(concept: Concept): RarityConfig {
	// Calcular rareza basada en atributos del concepto
	let points = 0;

	// Puntos por número de referencias
	const referenceCount = concept.references?.length || 0;
	if (referenceCount > 10) {
		points += 3;
	} else if (referenceCount > 5) {
		points += 2;
	} else if (referenceCount > 0) {
		points += 1;
	}

	// Puntos por complejidad (longitud de la descripción)
	const descriptionLength = concept.description?.length || 0;
	if (descriptionLength > 1000) {
		points += 3;
	} else if (descriptionLength > 500) {
		points += 2;
	} else if (descriptionLength > 200) {
		points += 1;
	}

	// Puntos por relaciones
	const relatedCount = concept.relatedConcepts?.length || 0;
	if (relatedCount > 5) {
		points += 3;
	} else if (relatedCount > 2) {
		points += 2;
	} else if (relatedCount > 0) {
		points += 1;
	}

	// Determinar nivel de rareza por puntos
	let rarityKey: keyof typeof CONCEPT_RARITY = 'common';
	if (points >= 7) {
		rarityKey = 'legendary';
	} else if (points >= 5) {
		rarityKey = 'rare';
	} else if (points >= 3) {
		rarityKey = 'uncommon';
	}

	// Obtener configuración para la rareza
	const rarity = CONCEPT_RARITY[rarityKey];
	return {
		rarity: rarityKey,
		color: rarity.color,
		borderColor: rarity.borderColor,
		glowColor: rarity.glowColor,
		label: rarity.label,
	};
}

export function ConceptCard({
	concept,
	onEdit,
	onDelete,
	onClick,
	className,
	showVisualConfig = false,
	visualOptions,
}: ConceptCardProps) {
	const [isHovered, setIsHovered] = useState(false);
	const [configOpen, setConfigOpen] = useState(false);
	const [cardOptions, setCardOptions] = useState<Partial<CardOptions>>({
		...DEFAULT_CONCEPT_OPTIONS,
		...visualOptions,
	});

	// Configuración de rareza
	const rarityConfig = getConceptRarity(concept);

	// Formato para fechas
	const formattedDate = concept.updatedAt
		? new Date(concept.updatedAt).toLocaleDateString()
		: concept.createdAt
		? new Date(concept.createdAt).toLocaleDateString()
		: null;

	// Procesamiento de referencias
	const references = concept.references || [];

	// Procesamiento de conceptos relacionados
	const relatedConcepts = concept.relatedConcepts || [];

	return (
		<>
			{configOpen && (
				<VisualizationConfig
					onClose={() => setConfigOpen(false)}
					options={cardOptions}
					onOptionsChange={setCardOptions}
					entityId={concept.id}
					entityType="concept"
				/>
			)}

			<div className={cn('min-h-[300px] relative', className)}>
				<EntityCardLayerWrapper
					title={concept.name || 'Concepto'}
					description={concept.description || 'Sin descripción'}
					onClick={onClick}
					showVisualConfig={showVisualConfig}
					visualOptions={{
						...cardOptions,
						rarityConfig
					}}
					entityType="concept"
					entityId={concept.id}
					onHoverStart={() => setIsHovered(true)}
					onHoverEnd={() => setIsHovered(false)}
					onConfigClick={() => setConfigOpen(true)}
				/>

				<EntityCardContent
					title={concept.name || 'Concepto'}
					description={concept.description}
					image={concept.image}
					isHovered={isHovered}
					isPreview={false}
					entityId={concept.id}
					onEdit={onEdit ? () => onEdit(concept) : undefined}
					onDelete={onDelete ? () => onDelete(concept.id) : undefined}
					icon={<LightbulbIcon className="h-5 w-5 text-amber-500" />}
					badges={[
						{
							key: 'type',
							label: concept.type || 'General',
							variant: 'secondary',
						},
						{
							key: 'category',
							label: concept.category || 'Sin categoría',
							variant: 'outline',
						}
					]}
					className="p-4"
				>
					{/* Contenido personalizado para conceptos */}
					<div className="mt-4 space-y-3">
						{/* Referencias */}
						{references.length > 0 && (
							<div className="bg-background/30 backdrop-blur-sm rounded-md p-2">
								<h4 className="text-xs font-semibold mb-1 flex items-center">
									<Book className="h-3 w-3 mr-1" />
									Referencias ({references.length})
								</h4>
								<ul className="text-xs space-y-1">
									{references.slice(0, 3).map((ref) => (
										<li key={`ref-${ref}`} className="flex items-center">
											<LinkIcon className="h-3 w-3 mr-1 text-muted-foreground" />
											<span className="line-clamp-1">{ref}</span>
										</li>
									))}
									{references.length > 3 && (
										<li className="text-muted-foreground italic text-xs">
											+{references.length - 3} más...
										</li>
									)}
								</ul>
							</div>
						)}

						{/* Conceptos relacionados */}
						{relatedConcepts.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{relatedConcepts.slice(0, 5).map((rel) => (
									<Badge key={`rel-${rel}`} variant="outline" className="text-xs">
										{rel}
									</Badge>
								))}
								{relatedConcepts.length > 5 && (
									<Badge variant="outline" className="text-xs">
										+{relatedConcepts.length - 5} más
									</Badge>
								)}
							</div>
						)}
					</div>

					{/* Metadatos */}
					<div className="mt-4 flex justify-between text-xs text-muted-foreground">
						<span>
							{formattedDate && (
								<span>Actualizado: {formattedDate}</span>
							)}
						</span>
						<span
							className="font-semibold"
							style={{ color: rarityConfig.color }}
						>
							{rarityConfig.label}
						</span>
					</div>
				</EntityCardContent>
			</div>
		</>
	);
}
