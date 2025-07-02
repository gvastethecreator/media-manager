import { MessageSquareQuote, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { CardContainer } from '../card-container';
import { PromptCardContent } from './prompt-card-content';
import { PromptCardFooter } from './prompt-card-footer';
import { PromptCardImages } from './prompt-card-images';
import type { PromptCardData } from './prompt-server-actions';

export interface PromptCardProps {
	/** Datos del prompt */
	prompt: PromptCardData;
	/** Si está en modo TCG con efectos visuales especiales */
	tcgMode?: boolean;
	/** Si está en modo compacto con menos información */
	compact?: boolean;
	/** Deshabilitar interacciones con la tarjeta */
	disabled?: boolean;
	/** Función a ejecutar al hacer clic */
	onClick?: () => void;
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
	prompt,
	tcgMode = true,
	compact = false,
	disabled = false,
	onClick,
	isSelected = false,
	className,
	style,
}: PromptCardProps) {
	const [isHovered, setIsHovered] = useState(false);

	// Extraer datos relevantes
	const {
		id,
		name,
		emoji = '🎯',
		color = '#0ea5e9',
		description,
		content,
		purpose,
		category = 'general',
		parsedParameters,
		parsedTags,
		isFavorite = false,
		featuredImage,
		createdAt,
		updatedAt,
		_count,
		recentImages = [],
		model,
	} = prompt;

	// Calcular valores derivados
	const imagesCount = _count?.images || 0;
	const videosCount = _count?.videos || 0;
	const collectionsCount = _count?.collections || 0;
	const albumsCount = _count?.albums || 0;
	const tagsCount = _count?.tags || 0;
	const conceptsCount = _count?.concepts || 0;
	const notesCount = _count?.notes || 0;
	const charactersCount = _count?.characters || 0;
	const _propertiesCount = _count?.properties || 0;
	const _wildcardsCount = _count?.wildcards || 0;
	const _groupsCount = _count?.groups || 0;

	// Relaciones para mostrar en el contenido
	const relationCounts = {
		characters: charactersCount,
		concepts: conceptsCount,
		notes: notesCount,
		places: _count?.places || 0,
		worldItems: _count?.worldItems || 0,
		collections: collectionsCount,
		albums: albumsCount,
	};

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

	// Manejar eventos de teclado para accesibilidad
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				onClick();
			}
		},
		[onClick, disabled]
	);

	return (
		<motion.div
			className={cn(
				'w-[300px] md:w-[320px]',
				tcgMode ? 'h-[470px]' : 'h-[400px]',
				compact && 'h-[220px]',
				disabled && 'opacity-70 pointer-events-none',
				className
			)}
			whileHover={!disabled ? { y: -8, transition: { duration: 0.3 } } : {}}
			whileTap={!disabled && onClick ? { scale: 0.98 } : {}}
			onClick={disabled ? undefined : onClick}
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
				{/* Efectos holográficos especiales para el modo TCG */}
				{tcgMode && (
					<>
						{/* Efecto holográfico de resplandor */}
						<div
							className="absolute inset-0 opacity-0 hover:opacity-30 transition-opacity duration-300 pointer-events-none z-1"
							style={{
								backgroundImage: `
									linear-gradient(125deg,
									transparent 0%,
									${primaryColor}30 25%,
									${secondaryColor}30 50%,
									${primaryColor}30 75%,
									transparent 100%)
								`,
								backgroundSize: '200% 200%',
								animation: 'gradient-shift 3s ease infinite',
							}}
						/>

						{/* Líneas de textura */}
						<div className="absolute inset-0 opacity-0 hover:opacity-10 pointer-events-none z-1">
							<div
								className="w-full h-full"
								style={{
									backgroundImage: `
										repeating-linear-gradient(
											-45deg,
											transparent,
											transparent 2px,
											${primaryColor} 2px,
											${primaryColor} 3px
										)
									`,
								}}
							/>
						</div>

						{/* Sello de modelo */}
						{model && (
							<div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 opacity-10 pointer-events-none z-1">
								<div
									className="w-full h-full rounded-full border-2 border-dashed flex items-center justify-center text-center"
									style={{ borderColor: primaryColor }}
								>
									<div className="text-xs font-bold" style={{ color: primaryColor }}>
										{model.split('-')[0].toUpperCase()}
									</div>
								</div>
							</div>
						)}

						{/* Sello de favorito */}
						{isFavorite && (
							<div className="absolute top-0 right-0 w-24 h-24 overflow-hidden z-30 pointer-events-none">
								<div
									className="absolute top-0 right-0 w-24 h-24 rotate-45 translate-x-12 -translate-y-8 opacity-70"
									style={{
										background: `linear-gradient(45deg, transparent 30%, ${primaryColor} 40%, gold 50%, ${primaryColor} 60%, transparent 70%)`,
										backgroundSize: '600% 600%',
										animation: 'shine 3s linear infinite',
									}}
								/>
							</div>
						)}
					</>
				)}

				{/* Contenido principal */}
				<div className="flex flex-col h-full relative z-1">
					{/* Cabecera con nombre, emoji y categoría */}
					<div
						className="bg-primary/80 text-primary-foreground px-3 py-2 flex items-center gap-2"
						style={{
							background: `linear-gradient(90deg, ${primaryColor}95, ${primaryColor}70)`,
							borderBottom: `2px solid ${primaryColor}`,
						}}
					>
						<div
							className="w-8 h-8 flex-shrink-0 rounded-full bg-background/20 flex items-center justify-center"
							style={{
								boxShadow: `0 0 10px ${primaryColor}40 inset`,
							}}
						>
							<span className="text-xl">{emoji}</span>
						</div>
						<div className="flex-1 overflow-hidden">
							<h3 className="font-bold text-base truncate">{name}</h3>
							<div className="text-xs opacity-90 flex items-center gap-1">
								<span>{category}</span>
								{purpose && (
									<>
										<span className="opacity-50">•</span>
										<span className="truncate">{purpose.length > 15 ? `${purpose.substring(0, 15)}...` : purpose}</span>
									</>
								)}
							</div>
						</div>
						<div className="flex-shrink-0">
							<MessageSquareQuote className="w-4 h-4" />
						</div>
					</div>

					{/* En modo compacto solo mostrar header y footer */}
					{!compact && (
						<>
							{/* Sección de imágenes */}
							<PromptCardImages
								mainImage={featuredImage || recentImages?.[0]?.thumbnailUrl}
								images={recentImages.map((img) => img.thumbnailUrl)}
								primaryColor={primaryColor}
								secondaryColor={secondaryColor}
								tcgMode={tcgMode}
							/>

							{/* Contenido principal */}
							<PromptCardContent
								description={description}
								content={content}
								purpose={purpose}
								parameters={parsedParameters}
								category={category}
								tags={parsedTags}
								primaryColor={primaryColor}
								secondaryColor={secondaryColor}
								relationCounts={relationCounts}
								tcgMode={tcgMode}
								compact={compact}
							/>
						</>
					)}

					{/* Pie de la tarjeta */}
					<PromptCardFooter
						createdAt={createdAt}
						updatedAt={updatedAt}
						imagesCount={imagesCount}
						videosCount={videosCount}
						tagsCount={tagsCount}
						primaryColor={primaryColor}
						secondaryColor={secondaryColor}
						tcgMode={tcgMode}
					/>

					{/* Efecto brillo para cartas TCG */}
					{tcgMode && isHovered && (
						<div className="absolute top-0 right-0 p-2 z-10">
							<Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
						</div>
					)}
				</div>
			</CardContainer>
		</motion.div>
	);
}

export const PromptCard = memo(PromptCardComponent);
