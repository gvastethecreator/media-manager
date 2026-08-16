import React, { memo, useCallback, useMemo, useState } from 'react';
import { motion } from '@/components/ui/motion-shim';
import { useRecentPromptImages } from '@/lib/api/prompts';
import { cn } from '@/lib/utils';
import type { PromptWithStats } from '@/types/entities/prompt';
import { CardContainer } from '../card-container';
import { PromptCardContent } from './prompt-card-content';
import { PromptCardFooter } from './prompt-card-footer';
import { PromptCardImages } from './prompt-card-images';

export interface PromptCardProps {
	/** Clases CSS adicionales */
	className?: string;
	/** Si está en modo compacto con menos información */
	compact?: boolean;
	/** Deshabilitar interacciones con la tarjeta */
	disabled?: boolean;
	/** Si la tarjeta está seleccionada */
	isSelected?: boolean;
	/** Función a ejecutar al hacer clic */
	onClick?: () => void;
	/** Prompt a mostrar */
	prompt: PromptWithStats;
	/** Estilos CSS adicionales */
	style?: React.CSSProperties;
	/** Si está en modo TCG con efectos visuales especiales */
	tcgMode?: boolean;
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
		return 'var(--dt-primary-600)';
	}

	return `color-mix(in oklab, ${baseColor}, black 20%)`;
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
		background: tcgMode
			? `linear-gradient(135deg, color-mix(in oklab, ${primaryColor}, transparent 85%), color-mix(in oklab, ${primaryColor}, transparent 75%))`
			: 'rgba(var(--effect-highlight-rgb), 0.02)',
		boxShadow: tcgMode
			? `0 8px 32px rgba(var(--effect-shadow-rgb), 0.1), 0 4px 16px color-mix(in oklab, ${primaryColor}, transparent 70%)`
			: '0 4px 8px rgba(var(--effect-shadow-rgb), 0.1)',
		borderColor: tcgMode ? `color-mix(in oklab, ${primaryColor}, transparent 60%)` : 'transparent',
		borderWidth: totalRelations > 10 ? '2px' : '1px',
	};
}

// Helper function para calcular props de la tarjeta principal
function calculateCardProps(promptData: any, tcgMode: boolean, totalRelations: number, style?: React.CSSProperties) {
	const primaryColor = promptData.baseColor || 'var(--entity-prompt)';
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
				'flex h-117.5 w-75 items-center justify-center overflow-hidden rounded-lg bg-muted md:w-80',
				className
			)}
		>
			<p className="text-muted-foreground">Loading prompt...</p>
		</div>
	);
}

// Componente para estados de error
function PromptCardErrorState({ error, className }: { error: any; className?: string }) {
	return (
		<div
			className={cn(
				'flex h-117.5 w-75 items-center justify-center overflow-hidden rounded-lg bg-destructive/10 md:w-80',
				className
			)}
		>
			<p className="text-destructive">Error: {error?.message || 'Prompt no encontrado'}</p>
		</div>
	);
}

// Hook para manejar interacciones
function usePromptCardInteractions(prompt: any, onClickHandler?: () => void, disabled?: boolean) {
	const [isHovered, setIsHovered] = useState(false);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (onClickHandler && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				onClickHandler();
			}
		},
		[onClickHandler]
	);

	const handleClick = useCallback(() => {
		if (!disabled && onClickHandler) {
			onClickHandler();
		}
	}, [disabled, onClickHandler]);

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
	prompt,
	tcgMode = true,
	compact = false,
	disabled = false,
	onClick,
	isSelected = false,
	className,
	style,
}: PromptCardProps) {
	// Cargar imágenes recientes para el prompt
	const { data: recentImagesData } = useRecentPromptImages(prompt.id);
	const { isHovered, handleKeyDown, handleClick, handleMouseEnter, handleMouseLeave } = usePromptCardInteractions(
		prompt,
		onClick,
		disabled
	);
	const { imagesCount, videosCount, tagsCount, relationCounts, totalRelations } = usePromptCardCounts(prompt);

	// Validación simple de prompt requerido
	if (!prompt) {
		return <PromptCardErrorState className={className} error="Prompt no encontrado" />;
	}

	// Calcular propiedades usando helper
	const { primaryColor, secondaryColor, cardStyle } = calculateCardProps(prompt, tcgMode, totalRelations, style);

	return (
		<motion.div
			aria-label={`Prompt: ${prompt.name}`}
			className={cn(
				'w-75 md:w-80',
				tcgMode ? 'h-117.5' : 'h-auto',
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
						category={prompt.category || undefined}
						compact={compact}
						content={prompt.content || undefined}
						description={prompt.description}
						emoji={prompt.emoji}
						name={prompt.name}
						parameters={prompt.parameters || undefined}
						primaryColor={primaryColor}
						relationCounts={relationCounts}
						tcgMode={tcgMode}
					/>
					<PromptCardFooter
						createdAt={prompt.createdAt}
						imagesCount={imagesCount}
						primaryColor={primaryColor}
						secondaryColor={secondaryColor}
						tagsCount={tagsCount}
						tcgMode={tcgMode}
						updatedAt={prompt.updatedAt}
						videosCount={videosCount}
					/>
				</div>
			</CardContainer>
		</motion.div>
	);
}

export const PromptCard = memo(PromptCardComponent);
