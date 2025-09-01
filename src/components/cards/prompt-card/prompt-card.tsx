import React, { memo, useCallback, useMemo, useState } from 'react';
import { motion } from '@/components/ui/motion-shim';
import { usePrompt, useRecentPromptImages } from '@/lib/api/prompts';
import { cn } from '@/lib/utils';
import type { PromptWithStats } from '@/types/entities/prompt';
import { CardContainer } from '../card-container';
import { PromptCardContent } from './prompt-card-content';
import { PromptCardFooter } from './prompt-card-footer';
import { PromptCardImages } from './prompt-card-images';

export interface PromptCardProps {
	/** ID del prompt */
	promptId: string;
	/** Si está en modo TCG con efectos visuales especiales */
	tcgMode?: boolean;
	/** Si está en modo compacto con menos información */
	compact?: boolean;
	/** Deshabilitar interacciones con la tarjeta */
	disabled?: boolean;
	/** Función a ejecutar al hacer clic */
	onClick?: (promptData: PromptWithStats) => void;
	/** Si la tarjeta está seleccionada */
	isSelected?: boolean;
	/** Clases CSS adicionales */
	className?: string;
	/** Estilos CSS adicionales */
	style?: React.CSSProperties;
}

// Helper function para calcular el total de relaciones
function calculateTotalRelations(stats: any, count: any): number {
	return (
		(stats?.totalImages ?? 0) +
		(stats?.totalVideos ?? 0) +
		(stats?.totalNotes ?? 0) +
		(stats?.totalCharacters ?? 0) +
		(stats?.totalPlaces ?? 0) +
		(stats?.totalProperties ?? 0) +
		(stats?.totalWildcards ?? 0) +
		(stats?.totalGroups ?? 0) +
		(stats?.totalAlbums ?? 0) +
		(stats?.totalCollections ?? 0) +
		(stats?.tagsCount ?? 0) +
		(count?.worldItems ?? 0)
	);
}

// Helper function para generar colores
function generateSecondaryColor(baseColor: string): string {
	if (!baseColor) {
		return '#0369a1';
	}

	try {
		const r = Number.parseInt(baseColor.slice(1, 3), 16);
		const g = Number.parseInt(baseColor.slice(3, 5), 16);
		const b = Number.parseInt(baseColor.slice(5, 7), 16);

		const darkenFactor = 0.7;
		const darkerR = Math.floor(r * darkenFactor);
		const darkerG = Math.floor(g * darkenFactor);
		const darkerB = Math.floor(b * darkenFactor);

		return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
	} catch (_e) {
		return '#0369a1';
	}
}

// Helper function para calcular estilo de tarjeta
// Helper function para calcular el estilo de la tarjeta
function calculateCardStyle(
	tcgMode: boolean,
	primaryColor: string,
	totalRelations: number,
	style?: React.CSSProperties
): React.CSSProperties {
	return {
		...style,
		background: tcgMode ? `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}25)` : 'rgba(255, 255, 255, 0.02)',
		boxShadow: tcgMode ? `0 8px 32px rgba(0, 0, 0, 0.1), 0 4px 16px ${primaryColor}30` : '0 4px 8px rgba(0, 0, 0, 0.1)',
		borderColor: tcgMode ? `${primaryColor}40` : 'transparent',
		borderWidth: totalRelations > 10 ? '2px' : '1px',
	};
}

// Helper function para calcular props de la tarjeta principal
function calculateCardProps(promptData: any, tcgMode: boolean, totalRelations: number, style?: React.CSSProperties) {
	const primaryColor = promptData.baseColor || '#0ea5e9';
	const secondaryColor = generateSecondaryColor(promptData.baseColor);
	const cardStyle = calculateCardStyle(tcgMode, primaryColor, totalRelations, style);

	return {
		primaryColor,
		secondaryColor,
		cardStyle,
	};
}

// Componente para estados de carga
function PromptCardLoadingState({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-gray-100 md:w-[320px] dark:bg-gray-900',
				className
			)}
		>
			<p className="text-gray-500">Cargando prompt...</p>
		</div>
	);
}

// Componente para estados de error
function PromptCardErrorState({ error, className }: { error: any; className?: string }) {
	return (
		<div
			className={cn(
				'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-red-100 md:w-[320px] dark:bg-red-900',
				className
			)}
		>
			<p className="text-red-800">Error: {error?.message || 'Prompt no encontrado'}</p>
		</div>
	);
}

// Hook personalizado para manejar la lógica del prompt
function usePromptCardData(promptId: string) {
	const { data: prompt, isLoading, error } = usePrompt(promptId);
	const { data: recentImagesData } = useRecentPromptImages(promptId);

	const promptData = useMemo(() => {
		if (!prompt) {
			return null;
		}

		return {
			name: prompt.name ?? '',
			emoji: prompt.emoji ?? '🎯',
			baseColor: prompt.color ?? '#0ea5e9',
			description: prompt.description ?? '',
			content: prompt.content ?? '',
			category: prompt.category ?? 'general',
			parameters: prompt.parameters ?? {},
			stats: prompt.stats,
			count: prompt._count,
			createdAt: prompt.createdAt,
			updatedAt: prompt.updatedAt,
		};
	}, [prompt]);

	return {
		prompt,
		promptData,
		recentImagesData,
		isLoading,
		error,
	};
}

// Hook para manejar interacciones
function usePromptCardInteractions(prompt: any, onClickHandler?: (promptData: any) => void, disabled?: boolean) {
	const [isHovered, setIsHovered] = useState(false);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (onClickHandler && (e.key === 'Enter' || e.key === ' ') && prompt) {
				e.preventDefault();
				onClickHandler(prompt);
			}
		},
		[onClickHandler, prompt]
	);

	const handleClick = useCallback(() => {
		if (!disabled && onClickHandler && prompt) {
			onClickHandler(prompt);
		}
	}, [disabled, onClickHandler, prompt]);

	const handleMouseEnter = useCallback(() => setIsHovered(true), []);
	const handleMouseLeave = useCallback(() => setIsHovered(false), []);

	return {
		isHovered,
		handleKeyDown,
		handleClick,
		handleMouseEnter,
		handleMouseLeave,
	};
}

// Hook para calcular conteos y relaciones
function usePromptCardCounts(promptData: any) {
	return useMemo(() => {
		if (!promptData) {
			return {
				imagesCount: 0,
				videosCount: 0,
				tagsCount: 0,
				relationCounts: {},
				totalRelations: 0,
			};
		}

		const imagesCount = promptData.stats?.totalImages ?? 0;
		const videosCount = promptData.stats?.totalVideos ?? 0;
		const tagsCount = promptData.stats?.tagsCount ?? 0;
		const relationCounts = {
			characters: promptData.stats?.totalCharacters ?? 0,
			concepts: promptData.stats?.totalConcepts ?? 0,
			notes: promptData.stats?.totalNotes ?? 0,
			places: promptData.stats?.totalPlaces ?? 0,
			worldItems: promptData.count?.worldItems ?? 0,
			collections: promptData.stats?.totalCollections ?? 0,
			albums: promptData.stats?.totalAlbums ?? 0,
		};
		const totalRelations = calculateTotalRelations(promptData.stats, promptData.count);

		return {
			imagesCount,
			videosCount,
			tagsCount,
			relationCounts,
			totalRelations,
		};
	}, [promptData]);
}

/**
 * Tarjeta para mostrar un prompt, con un diseño inspirado en cartas de TCG.
 * Incluye efectos visuales, soporte para relaciones y parámetros.
 */
function PromptCardComponent({
	promptId,
	tcgMode = true,
	compact = false,
	disabled = false,
	onClick,
	isSelected = false,
	className,
	style,
}: PromptCardProps) {
	const { prompt, promptData, recentImagesData, isLoading, error } = usePromptCardData(promptId);
	const { isHovered, handleKeyDown, handleClick, handleMouseEnter, handleMouseLeave } = usePromptCardInteractions(
		prompt,
		onClick,
		disabled
	);
	const { imagesCount, videosCount, tagsCount, relationCounts, totalRelations } = usePromptCardCounts(promptData);

	// Estados tempranos
	if (isLoading) {
		return <PromptCardLoadingState className={className} />;
	}

	if (error || !prompt || !promptData) {
		return <PromptCardErrorState className={className} error={error} />;
	}

	// Calcular propiedades usando helper
	const { primaryColor, secondaryColor, cardStyle } = calculateCardProps(promptData, tcgMode, totalRelations, style);

	return (
		<motion.div
			aria-label={`Prompt: ${promptData.name}`}
			className={cn(
				'w-[300px] md:w-[320px]',
				tcgMode ? 'h-[470px]' : 'h-auto',
				compact && 'h-auto',
				disabled && 'pointer-events-none opacity-70',
				className
			)}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			role={onClick ? 'button' : 'article'}
			style={cardStyle}
			tabIndex={disabled || !onClick ? -1 : 0}
			whileHover={disabled ? {} : { y: -8, transition: { duration: 0.3 } }}
			whileTap={!disabled && onClick ? { scale: 0.98 } : {}}
		>
			<CardContainer
				className={cn(
					'transition-all duration-300',
					isHovered && 'scale-[1.02]',
					isSelected && 'ring-4 ring-primary/60'
				)}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
			>
				<div className="relative z-1 flex h-full flex-col">
					{!compact && recentImagesData && (
						<PromptCardImages
							images={recentImagesData.map((img) => img.thumbnailUrl)}
							primaryColor={primaryColor}
							tcgMode={tcgMode}
						/>
					)}
					<PromptCardContent
						category={promptData.category}
						compact={compact}
						content={promptData.content}
						description={promptData.description}
						emoji={promptData.emoji}
						name={promptData.name}
						parameters={promptData.parameters}
						primaryColor={primaryColor}
						relationCounts={relationCounts}
						tcgMode={tcgMode}
					/>
					<PromptCardFooter
						createdAt={promptData.createdAt}
						imagesCount={imagesCount}
						primaryColor={primaryColor}
						secondaryColor={secondaryColor}
						tagsCount={tagsCount}
						tcgMode={tcgMode}
						updatedAt={promptData.updatedAt}
						videosCount={videosCount}
					/>
				</div>
			</CardContainer>
		</motion.div>
	);
}

export const PromptCard = memo(PromptCardComponent);
