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

	// Datos base con defaults seguros
	const name = prompt?.name ?? '';
	const emoji = prompt?.emoji ?? '🎯';
	const baseColor = prompt?.color ?? '#0ea5e9';
	const description = prompt?.description ?? '';
	const content = prompt?.content ?? '';
	const category = prompt?.category ?? 'general';
	const parameters = prompt?.parameters ?? {};

	// Calcular valores derivados (seguros si prompt es undefined)
	const imagesCount = prompt?.stats?.totalImages ?? 0;
	const videosCount = prompt?.stats?.totalVideos ?? 0;
	const collectionsCount = prompt?.stats?.totalCollections ?? 0;
	const albumsCount = prompt?.stats?.totalAlbums ?? 0;
	const tagsCount = prompt?.stats?.tagsCount ?? 0;
	const conceptsCount = prompt?.stats?.totalConcepts ?? 0;
	const notesCount = prompt?.stats?.totalNotes ?? 0;
	const charactersCount = prompt?.stats?.totalCharacters ?? 0;
	const propertiesCount = prompt?.stats?.totalProperties ?? 0;
	const wildcardsCount = prompt?.stats?.totalWildcards ?? 0;
	const groupsCount = prompt?.stats?.totalGroups ?? 0;
	const placesCount = prompt?.stats?.totalPlaces ?? 0;
	const worldItemsCount = prompt?._count?.worldItems ?? 0;

	// Colores para el gradiente
	const primaryColor = baseColor || '#0ea5e9';
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto
		if (!baseColor) return '#0369a1';

		// Oscurecer el color primario para el secundario
		try {
			// Convertir hex a RGB
			const r = Number.parseInt(baseColor.slice(1, 3), 16);
			const g = Number.parseInt(baseColor.slice(3, 5), 16);
			const b = Number.parseInt(baseColor.slice(5, 7), 16);

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
	}, [baseColor]);

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

	// 'parameters' ya es un objeto en PromptWithStats, no necesita parseo manual
	const parsedParameters = parameters;

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

	// Render de estados tempranos manteniendo hooks al tope
	if (isLoading) {
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

	if (error || !prompt) {
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

	// A partir de aquí, prompt está definido
	const createdAt = prompt.createdAt;
	const updatedAt = prompt.updatedAt;

	return (
		<motion.div
			aria-label={`Prompt: ${name}`}
			className={cn(
				'w-[300px] md:w-[320px]',
				tcgMode ? 'h-[470px]' : 'h-auto',
				compact && 'h-auto',
				disabled && 'pointer-events-none opacity-70',
				className
			)}
			onClick={disabled ? undefined : () => onClick?.(prompt)}
			onKeyDown={handleKeyDown}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
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
						category={category || 'general'}
						compact={compact}
						content={content || ''}
						description={description || ''}
						emoji={emoji}
						name={name}
						parameters={parsedParameters}
						primaryColor={primaryColor}
						relationCounts={relationCounts}
						tcgMode={tcgMode}
					/>
					<PromptCardFooter
						createdAt={createdAt}
						imagesCount={imagesCount}
						primaryColor={primaryColor}
						secondaryColor={secondaryColor}
						tagsCount={tagsCount}
						tcgMode={tcgMode}
						updatedAt={updatedAt}
						videosCount={videosCount}
					/>
				</div>
			</CardContainer>
		</motion.div>
	);
}

export const PromptCard = memo(PromptCardComponent);
