import { BookOpen, ScrollText } from 'lucide-react';
import React, { memo, useCallback, useMemo } from 'react';
import { motion } from '@/components/ui/motion-shim';
import { useNote, useNoteCounts, useRecentNoteImages } from '@/lib/api/notes';
import { cn } from '@/lib/utils';
import type { NoteComplete } from '@/types/entities/note';
import { CardHeader } from '../card-header';
import { NoteCardContent } from './note-card-content';
import { NoteCardFooter } from './note-card-footer';
import { NoteCardImages } from './note-card-images';

export interface NoteCardProps {
	noteId: string;
	onClick?: (noteData: NoteComplete) => void;
	className?: string;
	style?: React.CSSProperties;
	tcgMode?: boolean;
}

/**
 * Card para mostrar una nota, con un diseño inspirado en cartas de TCG.
 */
export function NoteCard({ noteId, onClick, className, style, tcgMode = true }: NoteCardProps) {
	const { data: note, isLoading, error } = useNote(noteId);
	const { data: recentImagesData } = useRecentNoteImages(noteId);
	const { data: noteCounts } = useNoteCounts(noteId);

	// Extraer datos relevantes primero
	const {
		id,
		title,
		emoji = '📝',
		color,
		category,
		content,
		status,
		priority,
		isFavorite = false,
		createdAt,
		updatedAt,
		tags,
	} = note || {};

	// Calcular valores derivados
	const imagesCount = noteCounts?.images || 0;
	const videosCount = noteCounts?.videos || 0;
	const charactersCount = noteCounts?.characters || 0;
	const relationsCount =
		(noteCounts?.places || 0) +
		(noteCounts?.worldItems || 0) +
		(noteCounts?.concepts || 0) +
		(noteCounts?.prompts || 0) +
		(noteCounts?.groups || 0) +
		(noteCounts?.properties || 0) +
		(noteCounts?.wildcards || 0) +
		charactersCount;

	// Colores para el gradiente
	const primaryColor = useMemo(() => color || '#ec4899', [color]);
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto
		if (!color) {
			return '#db2777';
		}

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
			return '#db2777';
		}
	}, [color]);

	// Manejar eventos de teclado para accesibilidad
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (onClick && (e.key === 'Enter' || e.key === ' ') && note) {
				e.preventDefault();
				onClick(note);
			}
		},
		[onClick, note]
	);

	// Definir estilos de la tarjeta
	const cardStyle = useMemo(
		() => ({
			// Borde basado en el color primario
			borderColor: tcgMode ? `${primaryColor}70` : primaryColor,
			// Fondo con gradiente sutil basado en el color primario
			background: tcgMode
				? `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}10)`
				: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
			...style,
		}),
		[primaryColor, secondaryColor, style, tcgMode]
	);

	// Si no hay datos de la nota o está cargando, mostrar un esqueleto o un mensaje de error
	if (isLoading) {
		return (
			<div
				className={cn(
					'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-gray-100 md:w-[320px] dark:bg-gray-900',
					className
				)}
			>
				<p className="text-gray-500">Cargando nota...</p>
			</div>
		);
	}

	if (error || !note) {
		return (
			<div
				className={cn(
					'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-red-100 md:w-[320px] dark:bg-red-900',
					className
				)}
			>
				<p className="text-red-800">Error: {error?.message || 'Nota no encontrada'}</p>
			</div>
		);
	}

	// Render del componente
	return (
		<motion.div
			aria-label={`Nota: ${note.title}`}
			className={cn(
				// Base
				'relative bg-card',
				'h-[420px] w-[300px] overflow-hidden rounded-[4.75%]',
				tcgMode ? 'border-[3px] shadow-xl' : 'border-2 shadow-md',
				// Interacción
				'transition-all duration-300 ease-out',
				'hover:scale-[1.02] hover:shadow-lg',
				'active:scale-[0.98]',
				// Cursor
				onClick ? 'cursor-pointer' : '',
				// Clase personalizada
				className
			)}
			data-note-id={note.id}
			onClick={onClick ? (_e: React.MouseEvent<HTMLDivElement>) => onClick(note) : undefined}
			onKeyDown={handleKeyDown}
			role={onClick ? 'button' : 'article'}
			style={cardStyle}
			tabIndex={onClick ? 0 : -1}
			whileHover={{ y: -5 }}
			whileTap={{ scale: 0.98 }}
		>
			{/* Resplandor de borde en hover */}
			<div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100">
				<div
					className="-z-10 absolute inset-0 rounded-[4.75%] blur-sm"
					style={{ boxShadow: `0 0 15px 2px ${primaryColor}` }}
				/>
			</div>

			{/* Contenido estructurado de la tarjeta */}

			{/* Encabezado de la tarjeta */}
			<CardHeader
				icon={
					note.emoji ? (
						<span className="text-lg">{note.emoji}</span>
					) : tcgMode ? (
						<BookOpen className="h-4 w-4" />
					) : (
						<ScrollText className="h-4 w-4" />
					)
				}
				primaryColor={primaryColor}
				subtitle={note.category || 'General'}
				title={note.title || 'Sin título'}
			/>

			{/* Sección de imágenes */}
			<NoteCardImages noteId={note.id} primaryColor={primaryColor} secondaryColor={secondaryColor} tcgMode={tcgMode} />

			{/* Contenido principal */}
			<NoteCardContent
				category={note.category}
				content={note.content}
				noteId={note.id}
				primaryColor={primaryColor}
				priority={note.priority}
				secondaryColor={secondaryColor}
				status={note.status}
				tags={tags}
				tcgMode={tcgMode}
			/>

			{/* Pie de la tarjeta */}
			<NoteCardFooter
				createdAt={note.createdAt}
				imagesCount={imagesCount}
				isFavorite={note.isFavorite}
				primaryColor={primaryColor}
				priority={note.priority}
				relationsCount={relationsCount}
				secondaryColor={secondaryColor}
				status={note.status}
				tcgMode={tcgMode}
				updatedAt={note.updatedAt}
				videosCount={videosCount}
			/>
		</motion.div>
	);
}

// Versión memorizada para optimizar rendimiento en listas
export const MemoizedNoteCard = memo(NoteCard);
