'use client';

import { cn } from '@/lib/utils';
import type { Note } from '@/types/entities/notes';
import { ScrollText } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useCallback, useMemo } from 'react';
import { CardHeader } from '../card-header';
import { NoteCardContent } from './note-card-content';
import { NoteCardFooter } from './note-card-footer';
import { NoteCardImages } from './note-card-images';

export interface NoteCardProps {
	note: Note & {
		_count?: {
			images: number;
			characters: number;
			places: number;
			worldItems: number;
			concepts: number;
			prompts: number;
		};
	};
	onClick?: () => void;
	className?: string;
	style?: React.CSSProperties;
}

/**
 * Card para mostrar una nota, con un diseño inspirado en cartas de Magic.
 */
export function NoteCard({ note, onClick, className, style }: NoteCardProps) {
	// Calcular valores derivados
	const imagesCount = note._count?.images || 0;
	const charactersCount = note._count?.characters || 0;
	const relationsCount =
		(note._count?.places || 0) +
		(note._count?.worldItems || 0) +
		(note._count?.concepts || 0) +
		(note._count?.prompts || 0) +
		charactersCount;

	// Colores para el gradiente
	const primaryColor = useMemo(() => note.color || '#ec4899', [note.color]);
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto
		if (!note.color) return '#db2777';

		// Oscurecer el color primario para el secundario
		try {
			// Convertir hex a RGB
			const r = Number.parseInt(note.color.slice(1, 3), 16);
			const g = Number.parseInt(note.color.slice(3, 5), 16);
			const b = Number.parseInt(note.color.slice(5, 7), 16);

			// Oscurecer los componentes
			const darkenFactor = 0.7;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);

			// Convertir de vuelta a hex
			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (e) {
			// Si hay algún error, volver al valor por defecto
			return '#db2777';
		}
	}, [note.color]);

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
		if (typeof note.tags === 'string' && note.tags) {
			try {
				return JSON.parse(note.tags);
			} catch (e) {
				return [];
			}
		}
		return note.tags || [];
	}, [note.tags]);

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
			aria-label={`Nota: ${note.title}`}
			data-note-id={note.id}
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
				title={note.title}
				subtitle={note.category || 'General'}
				icon={note.emoji ?
					<span className="text-lg">{note.emoji}</span> :
					<ScrollText className="w-4 h-4" />
				}
				primaryColor={primaryColor}
			/>

			{/* Sección de imágenes */}
			<NoteCardImages
				noteId={note.id}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
			/>

			{/* Contenido principal */}
			<NoteCardContent
				content={note.content}
				category={note.category}
				tags={tags}
				status={note.status}
				priority={note.priority}
				primaryColor={primaryColor}
				noteId={note.id}
			/>

			{/* Pie de la tarjeta */}
			<NoteCardFooter
				createdAt={note.createdAt}
				updatedAt={note.updatedAt}
				imagesCount={imagesCount}
				relationsCount={relationsCount}
				isFavorite={note.isFavorite}
				status={note.status}
				priority={note.priority}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
			/>
		</motion.div>
	);
}

// Versión memorizada para optimizar rendimiento en listas
export const MemoizedNoteCard = memo(NoteCard);