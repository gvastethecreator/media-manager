'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Concept } from '@prisma/client';
import {
	Book,
	BookOpen,
	Brain,
	Calendar,
	FileText,
	LightbulbIcon,
	LinkIcon,
	PencilIcon,
	Puzzle,
	Sparkles,
	Star,
	Trash2,
	Zap
} from 'lucide-react';
import { useCallback, useMemo } from 'react';

// Importar componentes base
import {
	CardDescriptionSection,
	CardFooter,
	CardHeader,
	CardImageSection
} from '../base';

// Importar tipos y utilidades
import { EntityCardWrapper } from '../entity-card-wrapper';
import { usePreset } from '../hooks/use-preset';
import { adaptCardOptions } from '../types';
import type { BorderOptions } from '../types/shared-card-types';
import type { CardOptions } from '../types/unified-card-types';

import '../../styles/concept-card.css';

// TIPOS DE DATOS
// ==============================

// Extender el tipo Concept para incluir campos adicionales que usamos
interface ExtendedConcept extends Concept {
	references?: string | string[];
	relatedConcepts?: string | string[];
	image?: string;
}

// Define rarity levels for concepts with TCG styling
interface ConceptRarity {
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

const CONCEPT_RARITY: Record<string, ConceptRarity> = {
	common: {
		color: '#9ca3af',
		borderColor: 'rgba(156, 163, 175, 0.8)',
		glowColor: 'rgba(156, 163, 175, 0.6)',
		label: 'Básico',
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
		label: 'Notable',
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
		label: 'Extraordinario',
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
		label: 'Legendario',
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
		label: 'Trascendental',
		rarity: 'mythic' as const,
		stars: 5,
		holographic: true,
		textureType: 'rainbow',
		glowIntensity: 1,
		textureOpacity: 0.35,
		borderAnimation: 'rainbow'
	},
};

// Opciones predeterminadas para la tarjeta de conceptos con estilo TCG
const DEFAULT_CONCEPT_OPTIONS: Partial<CardOptions> = {
	// Efectos principales
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: true,

	// Configuración de diseño específica para conceptos
	designSystem: {
		preset: 'concept',
		variant: 'tcg',
		aspectRatio: '7/10', // Proporción estándar de cartas coleccionables
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 3,
		shadowStyle: 'soft',
	},

	// Efectos específicos para conceptos
	holographicOptions: {
		patternType: 'geometric',
		intensity: 0.6,
		animationSpeed: 1.2,
		visibleOnHover: true,
	},

	glowOptions: {
		intensity: 0.7,
		size: 20,
		blurAmount: 15,
		animationType: 'pulse',
		pulseSpeed: 2.5,
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

export interface ConceptCardProps {
	concept: ExtendedConcept;
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
	onEdit?: (concept: ExtendedConcept) => void;
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

// Determinar la rareza basada en características del concepto
function calculateConceptRarity(concept: ExtendedConcept): keyof typeof CONCEPT_RARITY {
	// Calcular puntos basados en atributos del concepto
	let points = 0;

	// Puntos por presencia y longitud de descripción
	const descriptionLength = concept.description?.length || 0;
	if (descriptionLength > 1000) {
		points += 3;
	} else if (descriptionLength > 500) {
		points += 2;
	} else if (descriptionLength > 200) {
		points += 1;
	}

	// Puntos por referencias
	let referenceCount = 0;
	if (concept.references) {
		try {
			const refs = typeof concept.references === 'string'
				? JSON.parse(concept.references)
				: concept.references;
			referenceCount = Array.isArray(refs) ? refs.length : 0;
		} catch {
			referenceCount = 0;
		}
	}

	if (referenceCount > 10) {
		points += 3;
	} else if (referenceCount > 5) {
		points += 2;
	} else if (referenceCount > 0) {
		points += 1;
	}

	// Puntos por conceptos relacionados
	let relatedCount = 0;
	if (concept.relatedConcepts) {
		try {
			const related = typeof concept.relatedConcepts === 'string'
				? JSON.parse(concept.relatedConcepts)
				: concept.relatedConcepts;
			relatedCount = Array.isArray(related) ? related.length : 0;
		} catch {
			relatedCount = 0;
		}
	}

	if (relatedCount > 5) {
		points += 3;
	} else if (relatedCount > 2) {
		points += 2;
	} else if (relatedCount > 0) {
		points += 1;
	}

	// Determinar rareza por puntos acumulados
	if (points >= 7) return 'mythic';
	if (points >= 5) return 'legendary';
	if (points >= 3) return 'rare';
	if (points >= 1) return 'uncommon';
	return 'common';
}

function generateConceptRarityConfig(concept: ExtendedConcept) {
	const rarityKey = calculateConceptRarity(concept);
	const rarity = CONCEPT_RARITY[rarityKey];

	return {
		enabled: true,
		rarity: rarityKey,
		color: rarity.color,
		borderColor: rarity.borderColor,
		glowColor: rarity.glowColor,
		borderStyle: 'solid',
		borderWidth: 2,
		frameType: 'standard',
	};
}

// Obtener el icono para la categoría del concepto
function getConceptCategoryIcon(category = '') {
	const categoryIcons: Record<string, React.ReactNode> = {
		'historia': <BookOpen className="h-full w-full" />,
		'sistema': <Puzzle className="h-full w-full" />,
		'personaje': <Brain className="h-full w-full" />,
		'mecánica': <Zap className="h-full w-full" />,
		'lore': <Book className="h-full w-full" />,
		'general': <FileText className="h-full w-full" />,
	};

	const normalizedCategory = category.toLowerCase();
	return categoryIcons[normalizedCategory] || <LightbulbIcon className="h-full w-full" />;
}

// COMPONENTE PRINCIPAL
// ==============================
export function ConceptCardLayout({
	concept: initialConcept,
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
}: ConceptCardProps) {
	// Verificar si concept existe y tiene las propiedades necesarias
	const concept = initialConcept || {
		id: 'placeholder',
		name: 'Concepto sin nombre',
		description: 'Sin descripción',
		category: 'general',
		content: '',
		emoji: '💡',
		color: '#3b82f6',
		tags: 'empty_array',
		isFavorite: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	} as ExtendedConcept;

	// Usar el hook para obtener configuración de preset si existe
	const { cardOptions } = usePreset({
		entityType: 'concept',
		entityId: concept.id,
		presetId: concept.presetId || null,
		baseOptions: options,
	});

	// Obtener la rareza del concepto
	const rarityKey = calculateConceptRarity(concept);
	const rarityInfo = CONCEPT_RARITY[rarityKey];
	const rarityConfig = generateConceptRarityConfig(concept);
	const rarityClass = `concept-card-rarity-${rarityKey}`;

	// Procesar referencias si están disponibles
	const references = useMemo(() => {
		if (!concept.references) return [];
		try {
			return typeof concept.references === 'string'
				? JSON.parse(concept.references)
				: concept.references;
		} catch {
			return [];
		}
	}, [concept.references]);

	// Procesar conceptos relacionados si están disponibles
	const relatedConcepts = useMemo(() => {
		if (!concept.relatedConcepts) return [];
		try {
			return typeof concept.relatedConcepts === 'string'
				? JSON.parse(concept.relatedConcepts)
				: concept.relatedConcepts;
		} catch {
			return [];
		}
	}, [concept.relatedConcepts]);

	// Manejadores de eventos
	const handleEdit = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onEdit) {
			onEdit(concept);
		}
	}, [onEdit, concept]);

	const handleDelete = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDelete && concept.id) {
			onDelete(concept.id);
		}
	}, [onDelete, concept.id]);

	// Generar configuración avanzada basada en la rareza
	const enhancedCardOptions = useMemo(() => {
		// Valores por defecto
		const defaults = DEFAULT_CONCEPT_OPTIONS;

		// Ajustar intensidad de efectos según rareza
		const intensity = rarityInfo.glowIntensity || 0.5;

		// Habilitar efectos especiales para conceptos legendarios y míticos
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
				pattern: 'solid',
				animationType: rarityInfo.borderAnimation || 'none',
				glowIntensity: intensity,
			} as BorderOptions,

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
		{ id: 'frame', label: 'Marco', icon: <Brain className="h-4 w-4" /> },
		{ id: 'content', label: 'Contenido', icon: <BookOpen className="h-4 w-4" /> },
		{ id: 'effects', label: 'Efectos', icon: <Sparkles className="h-4 w-4" /> },
	];

	// Formatear fecha
	const formattedDate = useMemo(() => {
		if (!concept.createdAt) return '';

		const date = typeof concept.createdAt === 'string'
			? new Date(concept.createdAt)
			: concept.createdAt;

		return date.toLocaleDateString();
	}, [concept.createdAt]);

	return (
		<div className={cn(
			'concept-card-container relative w-full h-full group',
			rarityClass,
			onClick && 'cursor-pointer',
			className
		)}>
			<EntityCardWrapper
				title={concept.name}
				description={concept.description || ''}
				entityId={concept.id}
				entityType="concept"
				className={cn('concept-card-wrapper relative w-full h-full', rarityClass)}
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
				<div className="concept-card-content flex flex-col h-full w-full relative">
					{/* Cabecera con el emblema y nombre del concepto usando CardHeader */}
					<CardHeader
						title={concept.name}
						entityType="concept"
						subtitle={concept.category || 'General'}
						className="mb-2 relative z-10"
						showIcon={false}
						rightContent={
							<>
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

					{/* Concept emoji */}
					<div className="flex items-center ml-3 -mt-1 mb-3">
						<div className={cn(
							"concept-emoji flex items-center justify-center w-10 h-10 rounded-full border-2 z-10 relative text-xl bg-background shadow-md",
							`border-${rarityKey === 'mythic' ? 'fuchsia' :
								rarityKey === 'legendary' ? 'amber' :
									rarityKey === 'rare' ? 'blue' :
										rarityKey === 'uncommon' ? 'green' : 'gray'}-500`
						)}>
							{concept.emoji || <LightbulbIcon className="h-5 w-5" />}
						</div>
					</div>

					{/* Imagen o ilustración del concepto usando CardImageSection */}
					{concept.image ? (
						<CardImageSection
							imageUrl={concept.image}
							alt={concept.name}
							aspectRatio="video"
							className={cn(
								"mb-2 border rounded overflow-hidden",
								`border-${rarityKey === 'mythic' ? 'fuchsia' :
									rarityKey === 'legendary' ? 'amber' :
										rarityKey === 'rare' ? 'blue' :
											rarityKey === 'uncommon' ? 'green' : 'gray'}-500`
							)}
						/>
					) : (
						<div className={cn(
							"relative h-28 mb-2 rounded overflow-hidden border",
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

							{/* Icono central si no hay imagen */}
							<div className="absolute inset-0 flex items-center justify-center">
								{getConceptCategoryIcon(concept.category)}
							</div>
						</div>
					)}

					{/* Descripción del concepto usando CardDescriptionSection */}
					<CardDescriptionSection
						description={concept.description || 'Sin descripción disponible'}
						maxLines={4}
						className="flex-grow p-2 bg-card/80 rounded border border-stone-800/30"
					/>

					{/* Referencias en sección de metadatos */}
					{references.length > 0 && (
						<div className="mt-2 p-2 bg-card/80 rounded border border-stone-800/30">
							<div className="text-[10px] font-medium flex items-center mb-1">
								<Book className="h-3 w-3 mr-1 opacity-70" />
								Referencias:
							</div>
							<ul className="text-[9px] space-y-0.5">
								{references.slice(0, 2).map((ref: string, index: number) => (
									<li key={`ref-${index}`} className="flex items-center truncate">
										<LinkIcon className="h-2.5 w-2.5 mr-1 opacity-70" />
										<span className="truncate">{ref}</span>
									</li>
								))}
								{references.length > 2 && (
									<span className="text-[9px] opacity-70">+{references.length - 2}</span>
								)}
							</ul>
						</div>
					)}

					{/* Conceptos relacionados como etiquetas */}
					{relatedConcepts.length > 0 && (
						<div className="concept-related-concepts mb-1 mt-2 flex flex-wrap gap-1">
							{relatedConcepts.slice(0, 3).map((rel: string, index: number) => (
								<span
									key={`rel-${index}`}
									className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary-foreground"
								>
									{rel}
								</span>
							))}
							{relatedConcepts.length > 3 && (
								<span className="text-[9px] opacity-70">+{relatedConcepts.length - 3}</span>
							)}
						</div>
					)}

					{/* Pie de la tarjeta con sello de rareza usando CardFooter */}
					<CardFooter
						className="mt-auto"
						leftContent={
							<div className={cn(
								"concept-rarity px-3 py-1 rounded-full text-[10px] font-medium",
								rarityKey === 'mythic' ? "bg-fuchsia-500/20 text-fuchsia-200" :
									rarityKey === 'legendary' ? "bg-amber-500/20 text-amber-200" :
										rarityKey === 'rare' ? "bg-blue-500/20 text-blue-200" :
											rarityKey === 'uncommon' ? "bg-green-500/20 text-green-200" :
												"bg-gray-500/20 text-gray-200"
							)}>
								{CONCEPT_RARITY[rarityKey].label}
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
export function ConceptCard(props: ConceptCardProps) {
	return <ConceptCardLayout {...props} />;
}