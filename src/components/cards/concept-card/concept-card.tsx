'use client';

import { cn } from '@/lib/utils';
import type { Concept } from '@/types/entities/concepts';
import { LightbulbIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useMemo } from 'react';
import { CardHeader } from '../card-header';
import { ConceptCardContent } from './concept-card-content';
import { ConceptCardFooter } from './concept-card-footer';
import { ConceptCardImages } from './concept-card-images';

interface ConceptCardProps {
	concept: Concept & {
		_count?: {
			images: number;
			prompts: number;
		};
		imageCount?: number;
		promptCount?: number;
	};
	onClick?: () => void;
	className?: string;
	style?: React.CSSProperties;
}

/**
 * Card para mostrar un concepto, con un diseño inspirado en cartas de Magic.
 */
export function ConceptCard({ concept, onClick, className, style }: ConceptCardProps) {
	// Calcular valores derivados
	const imagesCount = concept._count?.images || concept.imageCount || 0;
	const promptsCount = concept._count?.prompts || concept.promptCount || 0;

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
			const darkenFactor = 0.7;
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
		if (typeof concept.tags === 'string' && concept.tags) {
			try {
				return JSON.parse(concept.tags);
			} catch (e) {
				return [];
			}
		}
		return concept.tags || [];
	}, [concept.tags]);

	// Definir estilos de la tarjeta
	const cardStyle = useMemo(
		() => ({
			// Borde basado en el color primario
			borderColor: primaryColor,
			// Fondo con gradiente sutil basado en el color primario
			background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
			...style,
		}),
		[primaryColor, style]
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
					<LightbulbIcon className="w-4 h-4" />
				}
				primaryColor={primaryColor}
			/>

			{/* Sección de imágenes */}
			<ConceptCardImages
				conceptId={concept.id}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
			/>

			{/* Contenido principal */}
			<ConceptCardContent
				description={concept.description}
				content={concept.content}
				category={concept.category}
				tags={concept.tags}
				primaryColor={primaryColor}
				conceptId={concept.id}
			/>

			{/* Pie de la tarjeta */}
			<ConceptCardFooter
				createdAt={concept.createdAt}
				updatedAt={concept.updatedAt}
				imagesCount={imagesCount}
				prompts={promptsCount}
				isFavorite={concept.isFavorite}
				category={concept.category}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
			/>
		</motion.div>
	);
}