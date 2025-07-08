import { motion } from 'framer-motion';
import { BrainCircuitIcon, LightbulbIcon } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { CardHeader } from '@/components/cards/card-header';
import { useConcept, useConceptCounts } from '@/lib/api/concepts';
import { cn } from '@/lib/utils';
import type { ConceptCardProps } from './concept-card.types';
import { ConceptCardContent } from './concept-card-content';
import { ConceptCardFooter } from './concept-card-footer';
import { ConceptCardImages } from './concept-card-images';

export function ConceptCard({ _conceptId, onClick, className, style, tcgMode = true }: ConceptCardProps) {
	const { data: concept, isLoading, error } = useConcept(_conceptId);
	const { data: conceptCounts } = useConceptCounts(_conceptId);

	// Extraer propiedades básicas del objeto
	const {
		id,
		name,
		emoji = '💡',
		color,
		category,
		description,
		content,
		createdAt,
		updatedAt,
		isFavorite = false,
		tags: conceptTags,
	} = concept || {}; // Añadir fallback para evitar errores si concept es undefined

	// Calcular valores derivados
	const imagesCount = conceptCounts?.images || 0;
	const videosCount = concept?.videos?.length || 0;
	const promptsCount = concept?.prompts?.length || 0;
	const notesCount = concept?.notes?.length || 0;
	const charactersCount = concept?.characters?.length || 0;
	const placesCount = concept?.places?.length || 0;
	const worldItemsCount = concept?.worldItems?.length || 0;
	const propertiesCount = concept?.properties?.length || 0;
	const wildcardsCount = concept?.wildcards?.length || 0;
	const groupsCount = concept?.groups?.length || 0;
	const albumsCount = concept?.albums?.length || 0;
	const collectionsCount = concept?.collections?.length || 0;
	const tagsCount = conceptCounts?.tags || 0;

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
	const primaryColor = useMemo(() => color || '#3b82f6', [color]);
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto
		if (!color) return '#1e40af';

		// Oscurecer el color primario para el secundario
		try {
			// Convertir hex a RGB
			const r = Number.parseInt(color.slice(1, 3), 16);
			const g = Number.parseInt(color.slice(3, 5), 16);
			const b = Number.parseInt(color.slice(5, 7), 16);

			// Oscurecer los componentes
			const darkenFactor = 0.6;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);

			// Convertir de vuelta a hex
			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (_e) {
			// Si hay algún error, volver al valor por defecto
			return '#1e40af';
		}
	}, [color]);

	// Manejar eventos de teclado para accesibilidad
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (onClick && (e.key === 'Enter' || e.key === ' ') && concept) {
				onClick(concept);
			}
		},
		[onClick][(onClick, concept)]
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
	}, []);

	// Definir estilos de la tarjeta TCG
	const cardStyle = useMemo(() => {
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
	}, [primaryColor, style, tcgMode, totalRelations]);

	// Si no hay datos del concepto o está cargando, mostrar un esqueleto o un mensaje de error
	if (isLoading) {
		return (
			<div
				className={cn(
					'w-[300px] md:w-[320px] h-[470px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center',
					className
				)}
			>
				<p className="text-gray-500">Cargando concepto...</p>
			</div>
		);
	}

	if (error || !concept) {
		return (
			<div
				className={cn(
					'w-[300px] md:w-[320px] h-[470px] rounded-lg overflow-hidden bg-red-100 dark:bg-red-900 flex items-center justify-center',
					className
				)}
			>
				<p className="text-red-800">Error: {error?.message || 'Concepto no encontrado'}</p>
			</div>
		);
	}

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
			aria-label={`Concepto: ${name}`}
			data-concept-id={id}
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
					<div
						className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 opacity-50 pointer-events-none rounded-tl"
						style={{ borderColor: primaryColor }}
					/>
					<div
						className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 opacity-50 pointer-events-none rounded-tr"
						style={{ borderColor: primaryColor }}
					/>
					<div
						className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 opacity-50 pointer-events-none rounded-bl"
						style={{ borderColor: primaryColor }}
					/>
					<div
						className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 opacity-50 pointer-events-none rounded-br"
						style={{ borderColor: primaryColor }}
					/>
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
				title={name}
				subtitle={category || 'General'}
				icon={
					emoji ? (
						<span className="text-lg">{emoji}</span>
					) : tcgMode ? (
						<BrainCircuitIcon className="w-4 h-4" />
					) : (
						<LightbulbIcon className="w-4 h-4" />
					)
				}
				primaryColor={primaryColor}
			/>

			{/* Sección de imágenes */}
			{/* Temporal: Comentado por problemas de imports */}
			{/* <ConceptCardImages conceptId={id} primaryColor={primaryColor} secondaryColor={secondaryColor} tcgMode={tcgMode} /> */}

			{/* Contenido principal */}
			<ConceptCardContent
				description={description}
				content={content}
				category={category}
				tags={tags}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
				conceptId={id}
				tcgMode={tcgMode}
			/>

			{/* Pie de la tarjeta */}
			<ConceptCardFooter
				createdAt={createdAt}
				updatedAt={updatedAt}
				imagesCount={imagesCount}
				videosCount={videosCount}
				promptsCount={promptsCount}
				notesCount={notesCount}
				totalRelations={totalRelations}
				isFavorite={isFavorite}
				category={category}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
				tcgMode={tcgMode}
			/>
		</motion.div>
	);
}
