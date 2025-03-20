'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
	Bot,
	Code,
	Copy,
	FileText,
	Image as ImageIcon,
	MessageSquare,
	PencilIcon,
	Star,
	Trash2,
	Wand2
} from 'lucide-react';
import { useCallback, useMemo } from 'react';

// Importar componentes base
import {
	CardDescriptionSection,
	CardFooter,
	CardHeader,
	CardImageSection,
	CardMetadataSection
} from '../base';

// Importar tipos y utilidades
import { EntityCardWrapper } from '../entity-card-wrapper';
import { usePreset } from '../hooks/use-preset';
import { adaptCardOptions } from '../types';
import type { CardOptions } from '../types/unified-card-types';

import '../styles/prompt-card.css';

// TIPOS DE DATOS
// ==============================

// Corregir la definición de ExtendedPrompt para que pueda tener presetId opcional
export interface ExtendedPrompt {
	id: string;
	name: string;
	description?: string | null;
	content?: string;
	emoji?: string;
	color?: string;
	presetId?: string | null;
	createdAt: Date | string;
	updatedAt: Date | string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	platform?: string;
	type?: string;
	category?: string;
	_count?: { uses: number };
	tags: string[] | string;
	title?: string;
}

// Definimos la interfaz para la configuración de rareza de prompts
interface PromptRarity {
	color: string;
	borderColor: string;
	glowColor: string;
	label: string;
	rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
	stars: number;
	textureType: string;
	glowIntensity: number;
	textureOpacity: number;
	holographic?: boolean;
	borderAnimation?: string;
}

// Sistema de rareza detallado para prompts en formato TCG futurista
const PROMPT_RARITY: Record<string, PromptRarity> = {
	common: {
		color: '#6366f1', // Indigo
		borderColor: 'rgba(99, 102, 241, 0.5)',
		glowColor: 'rgba(99, 102, 241, 0.3)',
		label: 'Común',
		rarity: 'common',
		stars: 1,
		textureType: 'noise',
		glowIntensity: 0.2,
		textureOpacity: 0.05
	},
	uncommon: {
		color: '#4f46e5', // Indigo más oscuro
		borderColor: 'rgba(79, 70, 229, 0.5)',
		glowColor: 'rgba(79, 70, 229, 0.3)',
		label: 'Poco común',
		rarity: 'uncommon',
		stars: 2,
		textureType: 'grid',
		glowIntensity: 0.3,
		textureOpacity: 0.08
	},
	rare: {
		color: '#7c3aed', // Violeta
		borderColor: 'rgba(124, 58, 237, 0.5)',
		glowColor: 'rgba(124, 58, 237, 0.4)',
		label: 'Raro',
		rarity: 'rare',
		stars: 3,
		textureType: 'circuit',
		glowIntensity: 0.5,
		textureOpacity: 0.1,
		borderAnimation: 'pulse'
	},
	epic: {
		color: '#a855f7', // Púrpura
		borderColor: 'rgba(168, 85, 247, 0.5)',
		glowColor: 'rgba(168, 85, 247, 0.5)',
		label: 'Épico',
		rarity: 'epic',
		stars: 4,
		textureType: 'dots',
		glowIntensity: 0.7,
		textureOpacity: 0.15,
		holographic: true,
		borderAnimation: 'flow'
	},
	legendary: {
		color: '#d946ef', // Fucsia
		borderColor: 'rgba(217, 70, 239, 0.5)',
		glowColor: 'rgba(217, 70, 239, 0.6)',
		label: 'Legendario',
		rarity: 'legendary',
		stars: 5,
		textureType: 'hologram',
		glowIntensity: 0.9,
		textureOpacity: 0.2,
		holographic: true,
		borderAnimation: 'rainbow'
	},
};

// Opciones visuales optimizadas para tarjetas de prompts con estilo futurista
const DEFAULT_PROMPT_OPTIONS: Partial<CardOptions> = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: false,

	// Sistema de diseño específico para prompts
	designSystem: {
		preset: 'prompt',
		variant: 'default',
		aspectRatio: '9/16',
		cornerStyle: 'rounded',
		cornerRadius: 8,
		elevation: 3,
		shadowStyle: 'soft',
	},

	// Efectos específicos para prompts
	holographicOptions: {
		patternType: 'rainbow',
		intensity: 0.6,
		animationSpeed: 1.5,
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

	// Configuración de movimiento
	hoverLiftHeight: 10,
	maxRotation: 10,
	primaryColor: '#6366f1', // Indigo
	secondaryColor: '#7c3aed', // Violeta

	// Sistema de capas
	layerSystem: {
		order: ['base', 'content', 'gloss', 'filter', 'effects', 'border'],
		layerBlending: 'normal',
		layerSpacing: 2,
	},
};

export interface PromptCardProps {
	prompt: ExtendedPrompt;
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
	onEdit?: (prompt: ExtendedPrompt) => void;
	onDelete?: (id: string) => void;
	onCopy?: (text: string) => void;
	isPreview?: boolean;
}

// UTILIDADES Y COMPONENTES AUXILIARES
// ==============================

// Componente para mostrar estrellas de rareza
function RarityStars({ count }: { count: number }) {
	return (
		<div className="flex items-center justify-center mt-1">
			{Array.from({ length: 5 }).map((_, i) => (
				<Star
					key={`rarity-star-${i}`}
					className={cn(
						"h-3 w-3 mx-0.5",
						i < count ? "text-primary fill-current" : "text-muted-foreground/30"
					)}
				/>
			))}
		</div>
	);
}

// Determinar la rareza del prompt basado en varios factores
function calculatePromptRarity(prompt: ExtendedPrompt): keyof typeof PROMPT_RARITY {
	const content = prompt.content || '';
	const usesCount = prompt._count?.uses || 0;

	const isComplex = content.length > 300;
	const hasSystemInstructions = content.toLowerCase().includes('system:') ||
		content.toLowerCase().includes('system instructions:');
	const hasTags = prompt.tags &&
		(typeof prompt.tags === 'string'
			? prompt.tags !== '[]' && prompt.tags !== ''
			: prompt.tags.length > 0);

	// Calculamos puntuación de rareza
	let rarityScore = 0;

	// Puntuación basada en uso
	if (usesCount >= 50) rarityScore += 4;
	else if (usesCount >= 30) rarityScore += 3;
	else if (usesCount >= 15) rarityScore += 2;
	else if (usesCount >= 5) rarityScore += 1;

	// Factores adicionales
	if (isComplex) rarityScore += 1;
	if (hasSystemInstructions) rarityScore += 1;
	if (hasTags) rarityScore += 1;

	// Determinamos la rareza final
	if (rarityScore >= 5) return 'legendary';
	if (rarityScore >= 4) return 'epic';
	if (rarityScore >= 2) return 'rare';
	if (rarityScore >= 1) return 'uncommon';
	return 'common';
}

// Corregir los errores en el rarityConfig con las propiedades que faltan
function generatePromptRarityConfig(prompt: ExtendedPrompt) {
	const rarityKey = calculatePromptRarity(prompt);
	const rarity = PROMPT_RARITY[rarityKey];

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
		stars: rarity.stars,
		textureType: rarity.textureType,
		textureOpacity: rarity.textureOpacity,
		glowIntensity: rarity.glowIntensity,
		borderAnimation: rarity.borderAnimation
	};
}

// Determinar el tipo de prompt basado en el contenido o categoría
function getPromptTypeInfo(prompt: ExtendedPrompt) {
	const content = prompt.content?.toLowerCase() || '';
	const title = prompt.title?.toLowerCase() || '';
	const category = prompt.category?.toLowerCase() || '';

	const textToAnalyze = `${title} ${content} ${category}`;

	if (
		textToAnalyze.includes('imagen') ||
		textToAnalyze.includes('dibujo') ||
		textToAnalyze.includes('visual') ||
		textToAnalyze.includes('arte') ||
		textToAnalyze.includes('photo') ||
		textToAnalyze.includes('imagen')
	) {
		return {
			type: 'image',
			icon: <ImageIcon className="h-5 w-5" />,
			label: 'Imagen',
			className: 'prompt-type-image'
		};
	}

	if (
		textToAnalyze.includes('código') ||
		textToAnalyze.includes('programación') ||
		textToAnalyze.includes('function') ||
		textToAnalyze.includes('class') ||
		textToAnalyze.includes('script') ||
		textToAnalyze.includes('desarrolla')
	) {
		return {
			type: 'code',
			icon: <Code className="h-5 w-5" />,
			label: 'Código',
			className: 'prompt-type-code'
		};
	}

	if (
		textToAnalyze.includes('texto') ||
		textToAnalyze.includes('escribe') ||
		textToAnalyze.includes('redacta') ||
		textToAnalyze.includes('artículo') ||
		textToAnalyze.includes('ensayo') ||
		textToAnalyze.includes('historia')
	) {
		return {
			type: 'text',
			icon: <FileText className="h-5 w-5" />,
			label: 'Texto',
			className: 'prompt-type-text'
		};
	}

	if (
		textToAnalyze.includes('chat') ||
		textToAnalyze.includes('conversación') ||
		textToAnalyze.includes('diálogo') ||
		textToAnalyze.includes('pregunta') ||
		textToAnalyze.includes('responde')
	) {
		return {
			type: 'chat',
			icon: <MessageSquare className="h-5 w-5" />,
			label: 'Chat',
			className: 'prompt-type-chat'
		};
	}

	// Por defecto, asumimos que es un prompt creativo general
	return {
		type: 'creative',
		icon: <Wand2 className="h-5 w-5" />,
		label: 'Creativo',
		className: 'prompt-type-creative'
	};
}

// COMPONENTE PRINCIPAL
// ==============================
export function PromptCardLayout({
	prompt: initialPrompt,
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
	onCopy,
	isPreview = false,
}: PromptCardProps) {
	// Garantizar que nunca procesamos un prompt undefined
	const prompt = initialPrompt || {
		id: 'placeholder',
		title: 'Prompt sin nombre',
		name: 'Prompt sin nombre',
		emoji: '🎯',
		description: '',
		color: '#3b82f6',
		createdAt: new Date(),
		updatedAt: new Date(),
		category: 'general',
		presetId: null,
		content: 'Sin contenido',
		parameters: '{}',
		tags: [],
		featuredImage: null,
		isFavorite: false
	} as ExtendedPrompt;

	// Usar el hook para obtener configuración de preset
	const { cardOptions } = usePreset({
		entityType: 'prompt',
		entityId: prompt.id as string,
		presetId: prompt.presetId || null,
		baseOptions: options,
	});

	// Obtener la rareza del prompt
	const rarityConfig = generatePromptRarityConfig(prompt);
	const rarityClass = `prompt-card-rarity-${rarityConfig.rarity}`;

	// Obtener información del tipo de prompt
	const promptTypeInfo = getPromptTypeInfo(prompt);

	// Configurar las capas para el modo explode
	const explodeLayers = [
		{ id: 'background', label: 'Fondo', icon: <Wand2 className="h-4 w-4" /> },
		{ id: 'frame', label: 'Marco', icon: <FileText className="h-4 w-4" /> },
		{ id: 'content', label: 'Contenido', icon: <Bot className="h-4 w-4" /> },
		{ id: 'effects', label: 'Efectos', icon: <Star className="h-4 w-4" /> },
	];

	// Manejadores de eventos
	const handleEdit = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onEdit && prompt) {
			onEdit(prompt);
		}
	}, [onEdit, prompt]);

	const handleDelete = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDelete && prompt?.id) {
			onDelete(prompt.id);
		}
	}, [onDelete, prompt?.id]);

	const handleCopy = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onCopy && prompt.content) {
			onCopy(prompt.content);
		}
	}, [onCopy, prompt.content]);

	// Generar configuración avanzada basada en la rareza
	const enhancedCardOptions = useMemo(() => {
		// Valores por defecto
		const defaults = DEFAULT_PROMPT_OPTIONS;

		// Ajustar intensidad de efectos según rareza
		const intensity = rarityConfig.glowIntensity || 0.5;

		// Habilitar efectos especiales para prompts épicos y legendarios
		const isSpecial = rarityConfig.rarity === 'legendary' || rarityConfig.rarity === 'epic';

		// Crear opciones combinadas
		return {
			...defaults,
			enableHolographicEffect: isSpecial,
			enableScanlinesEffect: isSpecial,

			// Configurar glows basados en rareza
			glowOptions: {
				...(defaults.glowOptions || {}),
				intensity: intensity,
				color: rarityConfig.glowColor,
				size: 20 + (rarityConfig.stars * 2),
				visibleOnIdle: rarityConfig.rarity === 'legendary',
				animationType: isSpecial ? 'pulse' : 'static',
			},

			// Configurar bordes animados
			borderOptions: {
				...(defaults.borderOptions || {}),
				width: rarityConfig.stars * 0.5,
				color: rarityConfig.borderColor,
				pattern: isSpecial ? 'gradient' : 'solid',
				animationType: rarityConfig.borderAnimation || 'none',
				glowIntensity: intensity,
			},

			// Configurar texturas específicas
			textureConfig: {
				type: rarityConfig.textureType || 'noise',
				intensity: rarityConfig.textureOpacity || 0.15,
				scale: 1 + (rarityConfig.stars * 0.1),
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
					intensity: rarityConfig.rarity === 'legendary' ? 0.4 : 0.2,
				},
				noiseTexture: {
					enabled: true,
					visibleOnHover: !isSpecial,
					intensity: rarityConfig.textureOpacity || 0.15,
				},
				glitchEffect: {
					enabled: rarityConfig.rarity === 'legendary',
					visibleOnHover: true,
					intensity: 0.3,
					frequency: 0.1,
				},
			},
		};
	}, [rarityConfig]);

	// Formatear tags para mostrar
	const formattedTags = useMemo(() => {
		if (!prompt.tags) return [];
		if (typeof prompt.tags === 'string') {
			try {
				const parsed = JSON.parse(prompt.tags);
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				return [];
			}
		}
		return prompt.tags;
	}, [prompt.tags]);

	// Procesar los metadatos para la sección de metadatos
	const metadataItems = useMemo(() => {
		const items = [];

		if (prompt.category) {
			items.push({
				label: 'Categoría',
				value: prompt.category,
				icon: <FileText className="h-3.5 w-3.5 opacity-70" />
			});
		}

		if (prompt._count?.uses) {
			items.push({
				label: 'Usos',
				value: prompt._count.uses.toString(),
				icon: <Bot className="h-3.5 w-3.5 opacity-70" />
			});
		}

		return items;
	}, [prompt.category, prompt._count?.uses]);

	// Función para colorear el tipo de prompt
	const getTypeColor = () => {
		const type = promptTypeInfo.type;
		switch (type) {
			case 'image': return 'bg-pink-500/20 text-pink-200';
			case 'code': return 'bg-blue-500/20 text-blue-200';
			case 'text': return 'bg-green-500/20 text-green-200';
			case 'chat': return 'bg-yellow-500/20 text-yellow-200';
			default: return 'bg-purple-500/20 text-purple-200';
		}
	};

	return (
		<div className={cn(
			'prompt-card-container relative w-full h-full group',
			rarityClass,
			onClick && 'cursor-pointer',
			className
		)}>
			<EntityCardWrapper
				title={prompt.title || prompt.name || 'Prompt sin nombre'}
				description={prompt.content || ''}
				entityId={prompt.id as string}
				entityType="prompt"
				className={cn('prompt-card-wrapper relative w-full h-full', rarityClass)}
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
				<div className="prompt-card-content flex flex-col h-full w-full relative p-3">
					{/* Cabecera con título y tipo */}
					<CardHeader
						title={prompt.title || prompt.name || 'Prompt sin nombre'}
						entityType="prompt"
						className="mb-2 relative z-10"
						rightContent={
							<div className={cn(
								'flex items-center justify-center p-1 rounded-full border',
								'bg-black/30 backdrop-blur-sm',
								promptTypeInfo.className
							)}
								style={{ borderColor: rarityConfig.borderColor }}>
								<div style={{ color: rarityConfig.color }}>{promptTypeInfo.icon}</div>
							</div>
						}
					/>

					{/* Indicador de rareza */}
					<RarityStars count={rarityConfig.stars} />

					{/* Contenido del prompt */}
					<div className={cn(
						'flex-1 mb-3 p-3 rounded prompt-content',
						'border bg-black/30 backdrop-blur-sm'
					)}
						style={{ borderColor: rarityConfig.borderColor }}>
						<div className="flex items-center justify-between mb-1">
							<div className="flex items-center gap-1">
								<Bot className="h-3.5 w-3.5 text-card-foreground/70" />
								<span className="text-xs text-card-foreground/70">Prompt</span>
							</div>

							{onCopy && prompt.content && (
								<Button
									size="icon"
									variant="ghost"
									className="h-6 w-6 rounded-full hover:bg-white/10"
									onClick={handleCopy}
								>
									<Copy className="h-3 w-3 text-card-foreground/70" />
								</Button>
							)}
						</div>

						<CardDescriptionSection
							description={prompt.content || 'Sin contenido'}
							maxLines={5}
							className="text-sm text-card-foreground/90 whitespace-pre-line"
						/>
					</div>

					{/* Imagen destacada (si existe) */}
					{prompt.featuredImage && (
						<div
							className="mb-3 rounded overflow-hidden border"
							style={{ borderColor: rarityConfig.borderColor }}
						>
							<CardImageSection
								imageUrl={prompt.featuredImage}
								alt={prompt.title || prompt.name || 'Prompt'}
								aspectRatio="wide"
								overlayContent={
									<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
								}
							/>
						</div>
					)}

					{/* Metadatos y etiquetas */}
					{metadataItems.length > 0 && (
						<CardMetadataSection
							items={metadataItems}
							className="mb-2 p-2 bg-black/20 rounded border border-stone-800/30"
						/>
					)}

					{/* Etiquetas del prompt */}
					{formattedTags.length > 0 && (
						<div className="prompt-tags mb-2 flex flex-wrap gap-1">
							{formattedTags.slice(0, 3).map((tag: string, index: number) => (
								<span
									key={`tag-${index}`}
									className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary-foreground"
								>
									{tag}
								</span>
							))}
							{formattedTags.length > 3 && (
								<span className="text-[9px] opacity-70">+{formattedTags.length - 3}</span>
							)}
						</div>
					)}

					{/* Footer con rareza y acciones */}
					<CardFooter
						className="mt-auto"
						leftContent={
							<div className={cn(
								"prompt-rarity px-3 py-1 rounded-full text-[10px] font-medium",
								getTypeColor()
							)}>
								{promptTypeInfo.label}
							</div>
						}
						rightContent={
							<div className={cn(
								"prompt-rarity px-3 py-1 rounded-full text-[10px] font-medium",
								rarityConfig.rarity === 'legendary' ? "bg-fuchsia-500/20 text-fuchsia-200" :
									rarityConfig.rarity === 'epic' ? "bg-purple-500/20 text-purple-200" :
										rarityConfig.rarity === 'rare' ? "bg-blue-500/20 text-blue-200" :
											rarityConfig.rarity === 'uncommon' ? "bg-indigo-500/20 text-indigo-200" :
												"bg-gray-500/20 text-gray-200"
							)}>
								{rarityConfig.label}
							</div>
						}
					/>

					{/* Botones de acción */}
					{!isPreview && (onEdit || onDelete) && (
						<div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
							{onEdit && (
								<Button
									size="icon"
									variant="ghost"
									className="h-7 w-7 rounded-full bg-background/80 hover:bg-background"
									onClick={handleEdit}
								>
									<PencilIcon className="h-3.5 w-3.5" />
								</Button>
							)}
							{onDelete && (
								<Button
									size="icon"
									variant="ghost"
									className="h-7 w-7 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
									onClick={handleDelete}
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							)}
						</div>
					)}
				</div>
			</EntityCardWrapper>
		</div>
	);
}

// Componente público para usar en la aplicación
export function PromptCard(props: PromptCardProps) {
	return <PromptCardLayout {...props} />;
}