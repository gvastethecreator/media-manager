'use client';

import { cn } from '@/lib/utils';
import type { Prompt } from '@/types/entities/prompts';
import { MessageSquareQuote } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useCallback, useMemo } from 'react';
import { CardHeader } from '../card-header';
import { PromptCardContent } from './prompt-card-content';
import { PromptCardFooter } from './prompt-card-footer';
import { PromptCardImages } from './prompt-card-images';

export interface PromptCardProps {
	prompt: Prompt & {
		_count?: {
			images: number;
			concepts: number;
		};
		imageCount?: number;
		conceptCount?: number;
	};
	onClick?: () => void;
	className?: string;
	style?: React.CSSProperties;
}

/**
 * Card para mostrar un prompt, con un diseño inspirado en cartas de Magic.
 */
export function PromptCard({ prompt, onClick, className, style }: PromptCardProps) {
	// Calcular valores derivados
	const imagesCount = prompt._count?.images || prompt.imageCount || 0;
	const conceptsCount = prompt._count?.concepts || prompt.conceptCount || 0;

	// Colores para el gradiente
	const primaryColor = useMemo(() => prompt.color || '#0ea5e9', [prompt.color]);
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto
		if (!prompt.color) return '#0369a1';

		// Oscurecer el color primario para el secundario
		try {
			// Convertir hex a RGB
			const r = Number.parseInt(prompt.color.slice(1, 3), 16);
			const g = Number.parseInt(prompt.color.slice(3, 5), 16);
			const b = Number.parseInt(prompt.color.slice(5, 7), 16);

			// Oscurecer los componentes
			const darkenFactor = 0.7;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);

			// Convertir de vuelta a hex
			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (e) {
			// Si hay algún error, volver al valor por defecto
			return '#0369a1';
		}
	}, [prompt.color]);

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
		if (typeof prompt.tags === 'string' && prompt.tags) {
			try {
				return JSON.parse(prompt.tags);
			} catch (e) {
				return [];
			}
		}
		return prompt.tags || [];
	}, [prompt.tags]);

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
			aria-label={`Prompt: ${prompt.name}`}
			data-prompt-id={prompt.id}
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
				title={prompt.name}
				subtitle={prompt.category || 'General'}
				icon={prompt.emoji ?
					<span className="text-lg">{prompt.emoji}</span> :
					<MessageSquareQuote className="w-4 h-4" />
				}
				primaryColor={primaryColor}
			/>

			{/* Sección de imágenes */}
			<PromptCardImages
				promptId={prompt.id}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
			/>

			{/* Contenido principal */}
			<PromptCardContent
				description={prompt.description}
				content={prompt.content}
				parameters={prompt.parameters}
				category={prompt.category}
				tags={prompt.tags}
				primaryColor={primaryColor}
				promptId={prompt.id}
			/>

			{/* Pie de la tarjeta */}
			<PromptCardFooter
				createdAt={prompt.createdAt}
				updatedAt={prompt.updatedAt}
				imagesCount={imagesCount}
				conceptsCount={conceptsCount}
				isFavorite={prompt.isFavorite}
				category={prompt.category}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
			/>
		</motion.div>
	);
}

// Versión memorizada para optimizar rendimiento en listas
export const MemoizedPromptCard = memo(PromptCard);