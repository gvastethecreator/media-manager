'use client';

import { cn } from '@/lib/utils';
import type { ConceptComplete, ConceptWithStats } from '@/types/entities/concept';
import { BrainCircuitIcon, LightbulbIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useMemo } from 'react';
import { CardHeader } from '../card-header';
import { ConceptCardContent } from './concept-card-content';
import { ConceptCardFooter } from './concept-card-footer';
import { ConceptCardImages } from './concept-card-images';

interface ConceptCardProps {
	concept: ConceptComplete | (ConceptWithStats & {
		_count?: {
			images: number;
			videos: number;
			albums: number;
			collections: number;
			tags: number;
			characters: number;
			places: number;
			worldItems: number;
			prompts: number;
			notes: number;
			wildcards: number;
			properties: number;
			groups: number;
		};
		imageCount?: number;
		promptCount?: number;
		videoCount?: number;
		albumCount?: number;
		collectionCount?: number;
		tagCount?: number;
		characterCount?: number;
		placeCount?: number;
		worldItemCount?: number;
		noteCount?: number;
		wildcardCount?: number;
		propertyCount?: number;
		groupCount?: number;
		tags?: string[] | string;
	});
	onClick?: () => void;
	className?: string;
	style?: React.CSSProperties;
	tcgMode?: boolean;
}

/**
 * Card para mostrar un concepto, con un diseño inspirado en cartas de TCG.
 */
export function ConceptCard({
	concept,
	onClick,
	className,
	style,
	tcgMode = true
}: ConceptCardProps) {
	// Verificar si concept tiene _count o campos individuales
	const hasCount = '_count' in concept;

	// Calcular valores derivados (usando _count o valores directos)
	const imagesCount = hasCount && concept._count?.images !== undefined
		? concept._count.images
		: ('imageCount' in concept ? concept.imageCount : 0) || 0;

	const videosCount = hasCount && concept._count?.videos !== undefined
		? concept._count.videos
		: ('videoCount' in concept ? concept.videoCount : 0) || 0;

	const promptsCount = hasCount && concept._count?.prompts !== undefined
		? concept._count.prompts
		: ('promptCount' in concept ? concept.promptCount : 0) || 0;

	const notesCount = hasCount && concept._count?.notes !== undefined
		? concept._count.notes
		: ('noteCount' in concept ? concept.noteCount : 0) || 0;

	const charactersCount = hasCount && concept._count?.characters !== undefined
		? concept._count.characters
		: ('characterCount' in concept ? concept.characterCount : 0) || 0;

	const placesCount = hasCount && concept._count?.places !== undefined
		? concept._count.places
		: ('placeCount' in concept ? concept.placeCount : 0) || 0;

	const worldItemsCount = hasCount && concept._count?.worldItems !== undefined
		? concept._count.worldItems
		: ('worldItemCount' in concept ? concept.worldItemCount : 0) || 0;

	const propertiesCount = hasCount && concept._count?.properties !== undefined
		? concept._count.properties
		: ('propertyCount' in concept ? concept.propertyCount : 0) || 0;

	const wildcardsCount = hasCount && concept._count?.wildcards !== undefined
		? concept._count.wildcards
		: ('wildcardCount' in concept ? concept.wildcardCount : 0) || 0;

	const groupsCount = hasCount && concept._count?.groups !== undefined
		? concept._count.groups
		: ('groupCount' in concept ? concept.groupCount : 0) || 0;

	const albumsCount = hasCount && concept._count?.albums !== undefined
		? concept._count.albums
		: ('albumCount' in concept ? concept.albumCount : 0) || 0;

	const collectionsCount = hasCount && concept._count?.collections !== undefined
		? concept._count.collections
		: ('collectionCount' in concept ? concept.collectionCount : 0) || 0;

	const tagsCount = hasCount && concept._count?.tags !== undefined
		? concept._count.tags
		: ('tagCount' in concept ? concept.tagCount : 0) || 0;

	// Total de relaciones para efectos visuales
	const totalRelations = imagesCount + videosCount + promptsCount + notesCount +
		charactersCount + placesCount + worldItemsCount + propertiesCount +
		wildcardsCount + groupsCount + albumsCount + collectionsCount + tagsCount;

	// Colores para el gradiente
	const primaryColor = useMemo(() => concept.color || '#3b82f6', [concept.color]);
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto
		if (!concept.color) return '#1e40af';

		// Oscurecer el color primario para el secundario
		try {
			// Convertir hex a RGB
			const r = Number.parseInt(concept.color.slice(1, 3), 16);
			const g = Number.parseInt(concept.color.slice(3, 5), 16);
			const b = Number.parseInt(concept.color.slice(5, 7), 16);

			// Oscurecer los componentes
			const darkenFactor = 0.6;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);

			// Convertir de vuelta a hex
			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (e) {
			// Si hay algún error, volver al valor por defecto
			return '#1e40af';
		}
	}, [concept.color]);

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
		if ('tags' in concept) {
			const conceptTags = concept.tags;
			// Si tags es un string, intentar parsearlo
			if (typeof conceptTags === 'string' && conceptTags) {
				try {
					return JSON.parse(conceptTags);
				} catch (e) {
					return [];
				}
			}
			return conceptTags || [];
		}
		// Si no tiene tags, devolver array vacío
		return [];
	}, [concept]);

	// Definir estilos de la tarjeta TCG
	const cardStyle = useMemo(
		() => {
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
		},
		[primaryColor, style, tcgMode, totalRelations]
	);

	// Render del componente
	return (
		<motion.div
			className={cn(
				// Base
				'relative bg-card',
				'w-[300px] h-[420px] rounded-[4.75%] overflow-hidden',
				'border-2 shadow-md',
				// Interacción
				'transition-all duration-300 ease-out',
				'hover:shadow-lg hover:scale-[1.02]',
				'active:scale-[0.98]',
				// Cursor
				onClick ? 'cursor-pointer' : '',
				// Clase personalizada
				className
			)}
			whileHover={{ y: -5 }}
			whileTap={{ scale: 0.98 }}
			onClick={onClick}
			onKeyDown={handleKeyDown}
			tabIndex={onClick ? 0 : -1}
			role={onClick ? 'button' : 'article'}
			aria-label={`Concepto: ${concept.name}`}
			data-concept-id={concept.id}
			style={cardStyle}
		>
			{/* Efectos decorativos de carta TCG */}
			{tcgMode && (
				<>
					{/* Textura de fondo */}
					<div
						className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay"
						style={{
							backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23${primaryColor.slice(1)}' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`,
						}}
					/>

					{/* Brillo superior */}
					<div
						className="absolute top-0 left-0 right-0 h-[30%] opacity-20 pointer-events-none"
						style={{
							background: `linear-gradient(to bottom, ${primaryColor}70, transparent)`,
						}}
					/>

					{/* Decoración lateral */}
					<div
						className="absolute top-0 bottom-0 right-0 w-[15px] opacity-30 pointer-events-none"
						style={{
							background: `linear-gradient(to left, ${secondaryColor}, transparent)`,
						}}
					/>

					{/* Esquinas decorativas */}
					<div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 opacity-50 pointer-events-none rounded-tl"
						style={{ borderColor: primaryColor }} />
					<div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 opacity-50 pointer-events-none rounded-tr"
						style={{ borderColor: primaryColor }} />
					<div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 opacity-50 pointer-events-none rounded-bl"
						style={{ borderColor: primaryColor }} />
					<div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 opacity-50 pointer-events-none rounded-br"
						style={{ borderColor: primaryColor }} />
				</>
			)}

			{/* Resplandor de borde en hover */}
			<div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
				<div
					className="absolute inset-0 rounded-[4.75%] blur-sm -z-10"
					style={{ boxShadow: `0 0 15px 2px ${primaryColor}` }}
				/>
			</div>

			{/* Contenido estructurado de la tarjeta */}

			{/* Encabezado de la tarjeta */}
			<CardHeader
				title={concept.name}
				subtitle={concept.category || 'General'}
				icon={concept.emoji ?
					<span className="text-lg">{concept.emoji}</span> :
					tcgMode ?
						<BrainCircuitIcon className="w-4 h-4" /> :
						<LightbulbIcon className="w-4 h-4" />
				}
				primaryColor={primaryColor}
			/>

			{/* Sección de imágenes */}
			<ConceptCardImages
				conceptId={concept.id}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
				tcgMode={tcgMode}
			/>

			{/* Contenido principal */}
			<ConceptCardContent
				description={concept.description}
				content={concept.content}
				category={concept.category}
				tags={tags}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
				conceptId={concept.id}
				tcgMode={tcgMode}
			/>

			{/* Pie de la tarjeta */}
			<ConceptCardFooter
				createdAt={concept.createdAt}
				updatedAt={concept.updatedAt}
				imagesCount={imagesCount}
				videosCount={videosCount}
				promptsCount={promptsCount}
				notesCount={notesCount}
				totalRelations={totalRelations}
				isFavorite={concept.isFavorite}
				category={concept.category}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
				tcgMode={tcgMode}
			/>
		</motion.div>
	);
}