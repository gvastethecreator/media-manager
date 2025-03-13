'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Prompt } from '@prisma/client';
import {
	Bot,
	Code,
	Copy,
	FileText,
	Image as ImageIcon,
	MessageSquare,
	PencilIcon,
	Sparkles,
	Trash2,
	Wand2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import type * as React from 'react';
import { EntityCardWrapper } from '../base/entity-card-wrapper';
import { VisualizationConfig } from '../config/visualization-config';
import type { PromptFormData } from '../forms/entity-types';
import type { CardOptions, RarityConfig, TextureConfig } from '../types/base-card-types';

type CardData =
	| (Prompt & {
			_count?: { uses: number };
			category?: string;
			tags?: string[];
	  })
	| PromptFormData;

interface PromptCardProps {
	data: CardData;
	isPreview?: boolean;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
	onCopy?: (text: string) => void;
	className?: string;
	showVisualizationConfig?: boolean;
	options?: Partial<CardOptions>;
	rarity?: RarityConfig | null;
	texture?: TextureConfig | null;
}

/**
 * Componente PromptCard - Diseñado con inspiración en tarjetas de comandos de IA
 *
 * Características:
 * - Diseño futurista con elementos de interfaz de IA
 * - Visualización del texto del prompt con opción de copia
 * - Indicadores de categoría y número de usos
 * - Efectos visuales que sugieren tecnología avanzada
 */
export function PromptCard({
	data,
	isPreview = false,
	onEdit,
	onDelete,
	onClick,
	onCopy,
	className,
	showVisualizationConfig = false,
	options,
	rarity: initialRarity,
	texture: initialTexture,
}: PromptCardProps) {
	const [isHovered, setIsHovered] = useState(false);
	const [configOpen, setConfigOpen] = useState(false);
	const [cardOptions, setCardOptions] = useState<Partial<CardOptions>>(
		options || {
			enable3DEffect: true,
			enableHolographicEffect: true,
			enableScanlines: true,
			enableLightHalo: true,
			enableGrainEffect: false,
			scanlinesDensity: 20,
			scanlinesOpacity: 0.1,
			hoverLiftHeight: 10,
		}
	);

	// Determinar el número de usos
	const usesCount = '_count' in data && data._count ? data._count.uses : 0;

	// Determinar el nivel de rareza basado en el número de usos
	const rarityLevel = Math.min(5, Math.max(1, Math.ceil(usesCount / 10)));

	const rarityNames = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
	const rarityConfig = initialRarity || {
		name: rarityNames[rarityLevel - 1],
		color: '#6366f1', // Indigo
		borderWidth: 1 + rarityLevel * 0.5,
		borderStyle: 'solid',
		borderGlow: true,
		borderGlowIntensity: 0.3 + rarityLevel * 0.1,
		borderGlowColor: '99, 102, 241', // Indigo RGB
		borderGlowRadius: 4 + rarityLevel,
		borderGlowSpread: 2 + rarityLevel,
	};

	// Determinar el tipo de prompt basado en el contenido o categoría
	const determinePromptType = () => {
		const content = 'content' in data && data.content ? data.content.toLowerCase() : '';
		const title = 'title' in data && data.title ? data.title.toLowerCase() : '';
		const category = 'category' in data && data.category ? data.category.toLowerCase() : '';

		const textToAnalyze = `${title} ${content} ${category}`;

		if (
			textToAnalyze.includes('imagen') ||
			textToAnalyze.includes('dibujo') ||
			textToAnalyze.includes('visual') ||
			textToAnalyze.includes('arte') ||
			textToAnalyze.includes('photo') ||
			textToAnalyze.includes('imagen')
		) {
			return 'image';
		}

		if (
			textToAnalyze.includes('código') ||
			textToAnalyze.includes('programación') ||
			textToAnalyze.includes('function') ||
			textToAnalyze.includes('class') ||
			textToAnalyze.includes('script') ||
			textToAnalyze.includes('desarrolla')
		) {
			return 'code';
		}

		if (
			textToAnalyze.includes('texto') ||
			textToAnalyze.includes('escribe') ||
			textToAnalyze.includes('redacta') ||
			textToAnalyze.includes('artículo') ||
			textToAnalyze.includes('ensayo') ||
			textToAnalyze.includes('historia')
		) {
			return 'text';
		}

		if (
			textToAnalyze.includes('chat') ||
			textToAnalyze.includes('conversación') ||
			textToAnalyze.includes('diálogo') ||
			textToAnalyze.includes('pregunta') ||
			textToAnalyze.includes('responde')
		) {
			return 'chat';
		}

		return 'general';
	};

	const promptType = determinePromptType();

	// Configuración visual basada en el tipo de prompt
	const promptStyles = {
		image: {
			bgGradient: 'from-fuchsia-900 via-purple-800 to-indigo-900',
			accentColor: 'text-fuchsia-300',
			borderColor: 'border-fuchsia-500',
			icon: <ImageIcon className="h-5 w-5" />,
			label: 'Imagen',
		},
		code: {
			bgGradient: 'from-cyan-900 via-blue-800 to-indigo-900',
			accentColor: 'text-cyan-300',
			borderColor: 'border-cyan-500',
			icon: <Code className="h-5 w-5" />,
			label: 'Código',
		},
		text: {
			bgGradient: 'from-emerald-900 via-teal-800 to-cyan-900',
			accentColor: 'text-emerald-300',
			borderColor: 'border-emerald-500',
			icon: <FileText className="h-5 w-5" />,
			label: 'Texto',
		},
		chat: {
			bgGradient: 'from-amber-900 via-orange-800 to-red-900',
			accentColor: 'text-amber-300',
			borderColor: 'border-amber-500',
			icon: <MessageSquare className="h-5 w-5" />,
			label: 'Chat',
		},
		general: {
			bgGradient: 'from-indigo-900 via-violet-800 to-purple-900',
			accentColor: 'text-indigo-300',
			borderColor: 'border-indigo-500',
			icon: <Wand2 className="h-5 w-5" />,
			label: 'General',
		},
	};

	const style = promptStyles[promptType as keyof typeof promptStyles] || promptStyles.general;

	return (
		<>
			{configOpen && (
				<VisualizationConfig
					options={cardOptions}
					onOptionsChange={(newOptions) => {
						setCardOptions({
							...cardOptions,
							...newOptions,
						});
					}}
					onClose={() => setConfigOpen(false)}
				/>
			)}

			<EntityCardWrapper
				className={cn(`bg-gradient-to-br ${style.bgGradient}`, className)}
				options={cardOptions}
				entityType="prompt"
				rarity={rarityConfig}
				texture={initialTexture}
				onClick={onClick ? (e) => onClick(e) : undefined}
				onHoverStart={() => setIsHovered(true)}
				onHoverEnd={() => setIsHovered(false)}
				showVisualizationConfig={showVisualizationConfig}
				onVisualizationConfigClick={() => setConfigOpen(true)}
			>
				{/* Elementos decorativos de fondo */}
				<div className="absolute inset-0 overflow-hidden">
					{/* Círculos decorativos */}
					<div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border border-white/10 opacity-20" />
					<div className="absolute -bottom-20 -left-10 w-60 h-60 rounded-full border border-white/10 opacity-10" />

					{/* Líneas de circuito */}
					<svg
						className="absolute inset-0 w-full h-full opacity-10"
						xmlns="http://www.w3.org/2000/svg"
						aria-label="Decorative circuit lines"
						role="presentation"
					>
						<title>Circuit Pattern</title>
						<path
							d="M10,30 L50,30 L50,10 L90,10"
							stroke="currentColor"
							strokeWidth="1"
							fill="none"
							className={style.accentColor}
						/>
						<path
							d="M10,50 L30,50 L30,70 L70,70 L70,50 L90,50"
							stroke="currentColor"
							strokeWidth="1"
							fill="none"
							className={style.accentColor}
						/>
						<path d="M50,90 L50,70" stroke="currentColor" strokeWidth="1" fill="none" className={style.accentColor} />
					</svg>
				</div>

				{/* Contenido principal */}
				<div className="flex flex-col h-full p-4 relative z-10">
					{/* Cabecera con título y tipo */}
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-lg font-bold text-white line-clamp-1">{'title' in data && data.title}</h3>

						<div
							className={cn(
								'flex items-center justify-center rounded-full p-1',
								'border',
								style.borderColor,
								'bg-black/30 backdrop-blur-sm'
							)}
						>
							<div className={style.accentColor}>{style.icon}</div>
						</div>
					</div>

					{/* Contenido del prompt */}
					<div className={cn('flex-1 mb-3 p-3 rounded', 'border', style.borderColor, 'bg-black/30 backdrop-blur-sm')}>
						<div className="flex items-center justify-between mb-1">
							<div className="flex items-center gap-1">
								<Bot className="h-3.5 w-3.5 text-white/70" />
								<span className="text-xs text-white/70">Prompt</span>
							</div>

							{onCopy && 'content' in data && data.content && (
								<Button
									size="icon"
									variant="ghost"
									className="h-6 w-6 rounded-full hover:bg-white/10"
									onClick={(e) => {
										e.stopPropagation();
										onCopy(data.content);
									}}
								>
									<Copy className="h-3 w-3 text-white/70" />
								</Button>
							)}
						</div>

						<p className="text-sm text-white/90 line-clamp-4 whitespace-pre-line">
							{'content' in data && data.content}
						</p>
					</div>

					{/* Información adicional */}
					<div className="mt-auto">
						{/* Etiquetas y categoría */}
						<div className="flex flex-wrap gap-1 mb-2">
							{'category' in data && data.category && (
								<span
									className={cn(
										'px-2 py-0.5 text-xs rounded-full',
										'border',
										style.borderColor,
										'bg-black/30',
										style.accentColor
									)}
								>
									{data.category}
								</span>
							)}

							{'tags' in data &&
								data.tags &&
								data.tags.map((tag) => (
									<span key={`tag-${tag}`} className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/80">
										{tag}
									</span>
								))}
						</div>

						{/* Estadísticas */}
						<div className="flex items-center justify-between text-xs text-white/70">
							<div className="flex items-center gap-1">
								<Sparkles className="h-3.5 w-3.5" />
								<span>{rarityNames[rarityLevel - 1]}</span>
							</div>

							<div className="flex items-center gap-1">
								<span>
									{usesCount} {usesCount === 1 ? 'uso' : 'usos'}
								</span>
							</div>
						</div>
					</div>

					{/* Efecto de brillo en hover */}
					{isHovered && (
						<motion.div
							className="absolute inset-0 pointer-events-none"
							initial={{ opacity: 0 }}
							animate={{ opacity: 0.1 }}
							transition={{ duration: 0.3 }}
						>
							<div className={cn('absolute inset-0 bg-gradient-to-br opacity-30', style.bgGradient)} />
						</motion.div>
					)}

					{/* Botones de edición/eliminación */}
					{!isPreview && isHovered && 'id' in data && data.id && (
						<div className="absolute top-2 right-2 flex gap-1">
							{onEdit && (
								<Button
									size="icon"
									variant="ghost"
									className="h-7 w-7 rounded-full bg-background/80 hover:bg-background"
									onClick={(e) => {
										e.stopPropagation();
										onEdit(data.id as string);
									}}
								>
									<PencilIcon className="h-3.5 w-3.5" />
								</Button>
							)}
							{onDelete && (
								<Button
									size="icon"
									variant="ghost"
									className="h-7 w-7 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
									onClick={(e) => {
										e.stopPropagation();
										onDelete(data.id as string);
									}}
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							)}
						</div>
					)}
				</div>
			</EntityCardWrapper>
		</>
	);
}
