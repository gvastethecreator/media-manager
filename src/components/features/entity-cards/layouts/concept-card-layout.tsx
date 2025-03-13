'use client';

import { BaseCard } from '@/components/features/entity-cards/base/base-card';
import { VisualizationConfig } from '@/components/features/entity-cards/config/visualization-config';
import type {
	CardDesignData,
	CardDesignPreset,
	CardOptions,
	RarityConfig,
} from '@/components/features/entity-cards/types/base-card-types';
import { cn } from '@/lib/utils/utils';
import type { Concept } from '@prisma/client';
import { Book, Edit, LightbulbIcon, LinkIcon, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useState } from 'react';

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

// Tipos de rareza para conceptos
const CONCEPT_RARITY_TYPES = {
	legendary: {
		color: '#DC2626', // Rojo
		glowColor: 'rgba(220, 38, 38, 0.7)',
		borderWidth: '3px',
		borderEffect: 'animated',
	},
	rare: {
		color: '#F59E0B', // Ámbar
		glowColor: 'rgba(245, 158, 11, 0.6)',
		borderWidth: '2px',
		borderEffect: 'animated',
	},
	uncommon: {
		color: '#10B981', // Esmeralda
		glowColor: 'rgba(16, 185, 129, 0.5)',
		borderWidth: '2px',
		borderEffect: 'static',
	},
	common: {
		color: '#6366F1', // Indigo
		glowColor: 'rgba(99, 102, 241, 0.4)',
		borderWidth: '1px',
		borderEffect: 'static',
	},
};

// Interfaz para las propiedades de la tarjeta de concepto
interface ConceptCardProps {
	concept: Concept;
	onEdit?: (concept: Concept) => void;
	onDelete?: (id: string) => void;
	onClick?: () => void;
	className?: string;
	showVisualConfig?: boolean;
	visualOptions?: Partial<CardOptions>;
	enableExplode?: boolean;
}

// Determinar la rareza de un concepto basada en su contenido
function getConceptRarity(concept: Concept): RarityConfig {
	// Extraer tags si existen
	const tags = concept.tags ? (typeof concept.tags === 'string' ? JSON.parse(concept.tags) : concept.tags) : [];

	// Calcular puntuación de rareza basada en longitud del contenido y número de tags
	const contentLength = concept.content?.length || 0;
	const tagCount = Array.isArray(tags) ? tags.length : 0;

	let rarityKey: keyof typeof CONCEPT_RARITY_TYPES = 'common';

	if (contentLength > 1000 && tagCount >= 5) {
		rarityKey = 'legendary';
	} else if (contentLength > 500 || tagCount >= 3) {
		rarityKey = 'rare';
	} else if (contentLength > 200 || tagCount >= 1) {
		rarityKey = 'uncommon';
	}

	// Usar rareza explícita si está definida (accedemos con notación de índice para evitar error)
	const conceptRarity = (concept as unknown as { rarity: string }).rarity;
	if (conceptRarity && conceptRarity in CONCEPT_RARITY_TYPES) {
		rarityKey = conceptRarity as keyof typeof CONCEPT_RARITY_TYPES;
	}

	// Usar rareza explícita si está definida
	// Usamos una verificación segura de tipo
	if ('rarity' in concept && typeof concept.rarity === 'string' && concept.rarity in CONCEPT_RARITY_TYPES) {
		rarityKey = concept.rarity as keyof typeof CONCEPT_RARITY_TYPES;
	}

	return {
		name: rarityKey,
		...CONCEPT_RARITY_TYPES[rarityKey],
	};
}

// Componente principal de tarjeta de concepto
export function ConceptCard({
	concept,
	onEdit,
	onDelete,
	onClick,
	className,
	showVisualConfig = false,
	visualOptions,
	enableExplode = false,
}: ConceptCardProps) {
	// Estado local
	const [showConfig, setShowConfig] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	// Estado para las opciones visuales
	const [cardOptions, setCardOptions] = useState<Partial<CardOptions>>({
		...DEFAULT_CONCEPT_OPTIONS,
		...visualOptions,
	});

	// Extraer tags si existen
	const tags = React.useMemo(() => {
		if (!concept.tags) {
			return [];
		}
		return typeof concept.tags === 'string' ? JSON.parse(concept.tags) : concept.tags;
	}, [concept.tags]);

	// Generar configuración de rareza
	const rarityConfig = React.useMemo(() => getConceptRarity(concept), [concept]);

	// Calcular nivel de importancia (1-10)
	const importanceLevel = React.useMemo(() => {
		const contentLength = concept.content?.length || 0;
		const tagCount = tags.length;

		// Fórmula simple: Longitud de contenido + (número de tags x 10)
		const score = Math.min(contentLength / 100, 7) + Math.min(tagCount, 3);
		return Math.min(Math.max(Math.round(score), 1), 10);
	}, [concept.content, tags]);

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

			<BaseCard
				onClick={onClick}
				className={cn(
					'w-full',
					{
						'aspect-[4/5]': cardOptions.designSystem?.aspectRatio === '4/5',
						'aspect-square': cardOptions.designSystem?.aspectRatio === '1/1',
						'aspect-video': cardOptions.designSystem?.aspectRatio === '16/9',
					},
					className
				)}
				options={cardOptions}
				rarity={rarityConfig}
				onHoverStart={() => setIsHovered(true)}
				onHoverEnd={() => setIsHovered(false)}
				showVisualizationConfig={showVisualConfig}
				onVisualizationConfigClick={() => setShowConfig(true)}
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
						icon: <div className="w-3 h-3 bg-gradient-to-tr from-amber-400 to-yellow-300 opacity-60" />,
					},
					{
						id: 'grain',
						label: 'Textura',
						icon: <div className="w-3 h-3 bg-neutral-300 rounded-sm opacity-60" />,
					},
					{
						id: 'border',
						label: 'Borde',
						icon: <div className="w-3 h-3 border border-primary rounded-sm" />,
					},
				]}
			>
				{/* Estructura principal de la carta de concepto (inspirada en cartas de artefacto de MTG) */}
				<div className="relative flex flex-col h-full text-gray-800">
					{/* Barra superior con título y tipo */}
					<div className="relative px-3 py-2 border-b border-amber-200/30 bg-gradient-to-r from-amber-50/90 to-amber-100/90">
						<div className="flex items-center justify-between">
							<h3 className="text-base font-medium text-amber-900 truncate">{concept.name}</h3>
							<div className="flex items-center space-x-1">
								{concept.emoji && (
									<span className="text-lg" role="img" aria-label="emoji">
										{concept.emoji}
									</span>
								)}
								<div className="bg-amber-200/50 text-amber-800 text-xs px-2 py-0.5 rounded-full">
									{concept.category || 'Concepto'}
								</div>
							</div>
						</div>
					</div>

					{/* Área principal de la carta */}
					<div className="flex-1 flex flex-col p-3 bg-gradient-to-b from-amber-50/90 to-amber-100/80 backdrop-blur-sm">
						{/* Imagen destacada si existe */}
						{concept.featuredImage && (
							<div className="mb-3 rounded-md overflow-hidden border border-amber-200/60">
								<div
									className="w-full h-24 bg-center bg-cover"
									style={{ backgroundImage: `url(${concept.featuredImage})` }}
								/>
							</div>
						)}

						{/* Contenido principal */}
						<div className="flex-1 overflow-auto mb-2 text-sm text-amber-900/90 scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-amber-50/50">
							{concept.content ? (
								<p className="line-clamp-6 text-sm">{concept.content}</p>
							) : (
								<p className="text-amber-500/70 italic text-sm">Sin contenido</p>
							)}
						</div>

						{/* Barra de nivel de importancia */}
						<div className="py-1 mb-2">
							<div className="flex items-center space-x-2 text-xs">
								<LightbulbIcon className="h-3.5 w-3.5 text-amber-600" />
								<span className="text-amber-700">Nivel de importancia:</span>
								<div className="flex-1 bg-amber-100 rounded-full h-1.5">
									<div
										className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
										style={{ width: `${importanceLevel * 10}%` }}
									/>
								</div>
								<span className="font-medium text-amber-700">{importanceLevel}</span>
							</div>
						</div>

						{/* Área de tags */}
						{tags.length > 0 && (
							<div className="py-1 mb-2 border-t border-amber-200/40">
								<div className="flex flex-wrap gap-1 mt-1">
									{tags.map((tag: string) => (
										<span
											key={`tag-${tag}`}
											className="inline-flex items-center text-xs px-2 py-0.5 bg-amber-100/80 text-amber-800 rounded-full"
										>
											#{tag}
										</span>
									))}
								</div>
							</div>
						)}

						{/* Pie de carta con botones de acción y rareza */}
						<div className="flex items-center justify-between pt-1 border-t border-amber-200/40">
							<div className="text-xs text-amber-600">
								{rarityConfig.name === 'legendary' ? (
									<span className="text-red-600 font-semibold">Legendario</span>
								) : rarityConfig.name === 'rare' ? (
									<span className="text-amber-600 font-semibold">Raro</span>
								) : rarityConfig.name === 'uncommon' ? (
									<span className="text-emerald-600 font-semibold">Poco común</span>
								) : (
									<span className="text-indigo-600 font-semibold">Común</span>
								)}
							</div>

							{/* Botones de acción - solo visibles al hacer hover */}
							<div className={`flex space-x-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
								{onEdit && (
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											onEdit(concept);
										}}
										className="p-1 text-amber-700 hover:text-amber-900 rounded-full hover:bg-amber-200/60"
									>
										<Edit className="h-3.5 w-3.5" />
									</button>
								)}

								{onDelete && (
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											onDelete(concept.id);
										}}
										className="p-1 text-amber-700 hover:text-red-600 rounded-full hover:bg-amber-200/60"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
			</BaseCard>
		</>
	);
}
