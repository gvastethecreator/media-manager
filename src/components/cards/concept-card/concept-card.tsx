import { BrainCircuitIcon, LightbulbIcon } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { CardHeader } from '@/components/cards/card-header';
import { motion } from '@/components/ui/motion-shim';
import { cn } from '@/lib/utils';
import type { ConceptCardProps } from './concept-card.types';
import { ConceptCardContent } from './concept-card-content';
import { ConceptCardFooter } from './concept-card-footer';

export const ConceptCard = memo(function ConceptCard({
	concept,
	onClick,
	className,
	style,
	tcgMode = true,
}: ConceptCardProps) {
	// Si no hay concept, no renderizar nada
	if (!concept) {
		return null;
	}

	// Calcular valores derivados usando los datos del objeto concept
	const imagesCount = concept?.stats?.imageCount || concept?._count?.images || 0;
	const videosCount = concept?.stats?.videoCount || concept?._count?.videos || 0;
	const promptsCount = concept?.stats?.promptCount || concept?._count?.prompts || 0;
	const notesCount = concept?.stats?.noteCount || concept?._count?.notes || 0;
	const charactersCount = concept?.stats?.characterCount || concept?._count?.characters || 0;
	const placesCount = concept?.stats?.placeCount || concept?._count?.places || 0;
	const worldItemsCount = concept?.stats?.worldItemCount || concept?._count?.worldItems || 0;
	const propertiesCount = concept?.stats?.propertyCount || concept?._count?.properties || 0;
	const wildcardsCount = concept?.stats?.wildcardCount || concept?._count?.wildcards || 0;
	const groupsCount = concept?.stats?.groupCount || concept?._count?.groups || 0;
	const albumsCount = concept?.stats?.albumCount || concept?._count?.albums || 0;
	const collectionsCount = concept?.stats?.collectionCount || concept?._count?.collections || 0;
	const tagsCount = concept?.stats?.tagCount || concept?._count?.tags || 0;

	// Total de relaciones para efectos visuales
	const totalRelations =
		imagesCount +
		videosCount +
		promptsCount +
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

	// Colores para el gradiente
	const primaryColor = useMemo(() => concept?.color || 'var(--entity-concept)', [concept?.color]);
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto (ámbar de conceptos)
		if (!concept?.color) {
			return 'oklch(0.65 0.18 65)';
		}

		return `color-mix(in oklab, ${primaryColor}, black 20%)`;
	}, [concept?.color, primaryColor]);

	// Manejar click del mouse
	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (onClick) {
				e.preventDefault();
				onClick();
			}
		},
		[onClick]
	);

	// Manejar eventos de teclado para accesibilidad
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (onClick && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				onClick();
			}
		},
		[onClick]
	);

	// Parsear tags si es un string
	const tags = useMemo(() => {
		// Comprobar si concept tiene la propiedad tags
		if (concept && 'tags' in concept) {
			const conceptTags = concept.tags;
			// Si tags es un string, intentar parsearlo
			if (typeof conceptTags === 'string' && conceptTags) {
				try {
					return JSON.parse(conceptTags);
				} catch (_e) {
					return [];
				}
			}
			return conceptTags || [];
		}
		// Si no tiene tags, devolver array vacío
		return [];
	}, [concept]);

	// Definir estilos de la tarjeta TCG
	const cardStyle = useMemo(() => {
		if (!tcgMode) {
			return {
				borderColor: primaryColor,
				background: `linear-gradient(135deg, color-mix(in oklab, ${primaryColor}, transparent 85%), color-mix(in oklab, ${primaryColor}, transparent 95%))`,
				...style,
			};
		}

		// Ajustar intensidad del estilo TCG basado en la cantidad de relaciones
		const relationIntensity = Math.min(0.5 + (totalRelations / 100) * 0.5, 0.9);
		const bgOpacity = Math.round(relationIntensity * 50);

		// Estilo TCG por defecto
		return {
			// Base estilo TCG
			borderColor: primaryColor,
			// Fondo con gradiente y texturas para parecer una carta TCG
			background: `linear-gradient(135deg, color-mix(in oklab, ${primaryColor}, transparent ${100 - bgOpacity}%), color-mix(in oklab, ${primaryColor}, transparent 90%))`,
			boxShadow: `0 0 15px color-mix(in oklab, ${primaryColor}, transparent 60%), inset 0 0 20px color-mix(in oklab, ${primaryColor}, transparent 80%)`,
			...style,
		};
	}, [primaryColor, style, tcgMode, totalRelations]);

	// Render del componente
	return (
		<motion.div
			aria-label={`Concepto: ${concept.name}`}
			className={cn(
				// Base
				'relative bg-card',
				'h-[420px] w-[300px] overflow-hidden rounded-[4.75%]',
				'border-2 shadow-md',
				// Interacción
				'transition-all duration-300 ease-out',
				'hover:scale-[1.02] hover:shadow-lg',
				'active:scale-[0.98]',
				// Cursor
				onClick ? 'cursor-pointer' : '',
				// Clase personalizada
				className
			)}
			data-concept-id={concept.id}
			onClick={onClick ? () => onClick() : undefined}
			onKeyDown={handleKeyDown}
			role={onClick ? 'button' : 'article'}
			style={cardStyle}
			tabIndex={onClick ? 0 : -1}
			whileHover={{ y: -5 }}
			whileTap={{ scale: 0.98 }}
		>
			{/* Efectos decorativos de carta TCG */}
			{tcgMode && (
				<>
					{/* Textura de fondo */}
					<div
						className="pointer-events-none absolute inset-0 opacity-5 mix-blend-overlay"
						style={
							{
								'--concept-fill-color': primaryColor,
								backgroundImage:
									"url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='currentColor' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E\")",
								color: 'var(--concept-fill-color)',
							} as React.CSSProperties
						}
					/>

					{/* Brillo superior */}
					<div
						className="pointer-events-none absolute top-0 right-0 left-0 h-[30%] opacity-20"
						style={{
							background: `linear-gradient(to bottom, color-mix(in oklab, ${primaryColor}, transparent 30%), transparent)`,
						}}
					/>

					{/* Decoración lateral */}
					<div
						className="pointer-events-none absolute top-0 right-0 bottom-0 w-[15px] opacity-30"
						style={{
							background: `linear-gradient(to left, ${secondaryColor}, transparent)`,
						}}
					/>

					{/* Esquinas decorativas */}
					<div
						className="pointer-events-none absolute top-2 left-2 h-6 w-6 rounded-tl border-t-2 border-l-2 opacity-50"
						style={{ borderColor: primaryColor }}
					/>
					<div
						className="pointer-events-none absolute top-2 right-2 h-6 w-6 rounded-tr border-t-2 border-r-2 opacity-50"
						style={{ borderColor: primaryColor }}
					/>
					<div
						className="pointer-events-none absolute bottom-2 left-2 h-6 w-6 rounded-bl border-b-2 border-l-2 opacity-50"
						style={{ borderColor: primaryColor }}
					/>
					<div
						className="pointer-events-none absolute right-2 bottom-2 h-6 w-6 rounded-br border-r-2 border-b-2 opacity-50"
						style={{ borderColor: primaryColor }}
					/>
				</>
			)}

			{/* Resplandor de borde en hover */}
			<div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100">
				<div
					className="absolute inset-0 -z-10 rounded-[4.75%] blur-sm"
					style={{ boxShadow: `0 0 15px 2px ${primaryColor}` }}
				/>
			</div>

			{/* Encabezado de la tarjeta */}
			<CardHeader
				icon={
					concept.emoji ? (
						<span className="text-lg">{concept.emoji}</span>
					) : tcgMode ? (
						<BrainCircuitIcon className="h-4 w-4" />
					) : (
						<LightbulbIcon className="h-4 w-4" />
					)
				}
				primaryColor={primaryColor}
				subtitle={concept.category || 'General'}
				title={concept.name}
			/>

			{/* Sección de imágenes */}
			{/* Temporal: Comentado por problemas de imports */}
			{/* <ConceptCardImages conceptId={id} primaryColor={primaryColor} secondaryColor={secondaryColor} tcgMode={tcgMode} /> */}

			{/* Contenido principal */}
			<ConceptCardContent
				category={concept.category}
				conceptId={concept.id}
				content={concept.content}
				description={concept.description}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
				tags={tags}
				tcgMode={tcgMode}
			/>

			{/* Pie de la tarjeta */}
			<ConceptCardFooter
				category={concept.category}
				createdAt={concept.createdAt}
				imagesCount={imagesCount}
				isFavorite={concept.isFavorite}
				notesCount={notesCount}
				primaryColor={primaryColor}
				promptsCount={promptsCount}
				secondaryColor={secondaryColor}
				tcgMode={tcgMode}
				totalRelations={totalRelations}
				updatedAt={concept.updatedAt}
				videosCount={videosCount}
			/>
		</motion.div>
	);
});
