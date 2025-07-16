import { motion } from 'motion/react';
import React, { memo, useCallback, useMemo, useState } from 'react';
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
	const { data: prompt, isLoading, error } = usePrompt(promptId);
	const { data: recentImagesData } = useRecentPromptImages(promptId);
	const [isHovered, setIsHovered] = useState(false);

	// Si no hay datos del prompt o está cargando, mostrar un esqueleto o un mensaje de error
	if (isLoading) {
		return (
			<div
				className={cn(
					'w-[300px] md:w-[320px] h-[470px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center',
					className
				)}
			>
				<p className="text-gray-500">Cargando prompt...</p>
			</div>
		);
	}

	if (error || !prompt) {
		return (
			<div
				className={cn(
					'w-[300px] md:w-[320px] h-[470px] rounded-lg overflow-hidden bg-red-100 dark:bg-red-900 flex items-center justify-center',
					className
				)}
			>
				<p className="text-red-800">Error: {error?.message || 'Prompt no encontrado'}</p>
			</div>
		);
	}

	// Extraer datos relevantes
	const {
		id,
		name,
		emoji = '🎯',
		color = '#0ea5e9',
		description,
		content,
		type, // Usar 'type' en lugar de 'purpose'
		category = 'general',
		parameters,
		tags, // 'tags' ya es un array en PromptWithStats
		isFavorite = false,
		featuredImage,
		createdAt,
		updatedAt,
	} = prompt;

	// Calcular valores derivados
	const imagesCount = prompt.stats?.imageCount || 0;
	const videosCount = prompt.stats?.videoCount || 0;
	const collectionsCount = prompt.stats?.collectionCount || 0;
	const albumsCount = prompt.stats?.albumCount || 0;
	const tagsCount = prompt.stats?.tagCount || 0;
	const conceptsCount = prompt.stats?.conceptCount || 0;
	const notesCount = prompt.stats?.noteCount || 0;
	const charactersCount = prompt.stats?.characterCount || 0;
	const propertiesCount = prompt.stats?.propertyCount || 0;
	const wildcardsCount = prompt.stats?.wildcardCount || 0;
	const groupsCount = prompt.stats?.groupCount || 0;
	const placesCount = prompt.stats?.placeCount || 0;
	const worldItemsCount = prompt.stats?.worldItemCount || 0;

	// Colores para el gradiente
	const primaryColor = color || '#0ea5e9';
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto
		if (!color) return '#0369a1';

		// Oscurecer el color primario para el secundario
		try {
			// Convertir hex a RGB
			const r = Number.parseInt(color.slice(1, 3), 16);
			const g = Number.parseInt(color.slice(3, 5), 16);
			const b = Number.parseInt(color.slice(5, 7), 16);

			// Oscurecer los componentes
			const darkenFactor = 0.7;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);

			// Convertir de vuelta a hex
			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (_e) {
			// Si hay algún error, volver al valor por defecto
			return '#0369a1';
		}
	}, [color]);

	// Relaciones para mostrar en el contenido
	const relationCounts = {
		characters: charactersCount,
		concepts: conceptsCount,
		notes: notesCount,
		places: placesCount,
		worldItems: worldItemsCount,
		collections: collectionsCount,
		albums: albumsCount,
	};

	// Manejar eventos de teclado para accesibilidad
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (onClick && (e.key === 'Enter' || e.key === ' ') && prompt) {
				e.preventDefault();
				onClick(prompt);
			}
		},
		[onClick, prompt]
	);

	// 'tags' y 'parameters' ya son arrays/objetos en PromptWithStats, no necesitan parseo manual
	const parsedTags = tags || [];
	const parsedParameters = parameters || {};

	// Definir estilos de la tarjeta TCG
	const cardStyle = useMemo(() => {
		const totalRelations =
			imagesCount +
			videosCount +
			notesCount +
			charactersCount +
			placesCount +
			worldItemsCount +
			propertiesCount +
			wildcardsCount +
			groupsCount +
			albumsCount +
			collectionsCount +
			tagsCount;

		if (!tcgMode) {
			return {
				borderColor: primaryColor,
				background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
				...style,
			};
		}

		// Ajustar intensidad del estilo TCG basado en la cantidad de relaciones
		const relationIntensity = Math.min(0.5 + (totalRelations / 100) * 0.5, 0.9);

		// Estilo TCG por defecto
		return {
			// Base estilo TCG
			borderColor: primaryColor,
			// Fondo con gradiente y texturas para parecer una carta TCG
			background: `linear-gradient(135deg, ${primaryColor}${Math.round(relationIntensity * 50)}, ${primaryColor}10)`,
			boxShadow: `0 0 15px ${primaryColor}40, inset 0 0 20px ${primaryColor}20`,
			...style,
		};
	}, [
		primaryColor,
		style,
		tcgMode,
		imagesCount,
		videosCount,
		notesCount,
		charactersCount,
		placesCount,
		worldItemsCount,
		propertiesCount,
		wildcardsCount,
		groupsCount,
		albumsCount,
		collectionsCount,
		tagsCount,
	]);

	return (
		<motion.div
			className={cn(
				'w-[300px] md:w-[320px]',
				tcgMode ? 'h-[470px]' : 'h-auto',
				compact && 'h-auto',
				disabled && 'opacity-70 pointer-events-none',
				className
			)}
			style={cardStyle}
			whileHover={!disabled ? { y: -8, transition: { duration: 0.3 } } : {}}
			whileTap={!disabled && onClick ? { scale: 0.98 } : {}}
			onClick={disabled ? undefined : () => onClick?.(prompt)}
			onKeyDown={handleKeyDown}
			tabIndex={disabled || !onClick ? -1 : 0}
			role={onClick ? 'button' : 'article'}
			aria-label={`Prompt: ${name}`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<CardContainer
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
				className={cn(
					'transition-all duration-300',
					isHovered && 'scale-[1.02]',
					isSelected && 'ring-4 ring-primary/60'
				)}
			>
				<div className="flex flex-col h-full relative z-1">
					{!compact && recentImagesData && (
						<PromptCardImages
							images={recentImagesData.map((img) => img.thumbnailUrl)}
							primaryColor={primaryColor}
							tcgMode={tcgMode}
						/>
					)}
					<					<PromptCardContent
						name={name}
						emoji={emoji}
						description={description || ''}
						content={content || ''}
						category={category || 'general'}
						parameters={parsedParameters}
						relationCounts={relationCounts}
						tcgMode={tcgMode}
						compact={compact}
						primaryColor={primaryColor}
					/>
					<PromptCardFooter
						imagesCount={imagesCount}
						videosCount={videosCount}
						tagsCount={tagsCount}
						createdAt={createdAt}
						updatedAt={updatedAt}
						primaryColor={primaryColor}
						secondaryColor={secondaryColor}
						tcgMode={tcgMode}
					/>
				</div>
			</CardContainer>
		</motion.div>
	);
}

export const PromptCard = memo(PromptCardComponent);
