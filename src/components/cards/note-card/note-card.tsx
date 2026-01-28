import { BookOpen, ScrollText } from 'lucide-react';
import React, { memo, useCallback, useMemo } from 'react';
import { motion } from '@/components/ui/animejs-shim';
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
export const NoteCard = memo(function NoteCard({ noteId, onClick, className, style, tcgMode = true }: NoteCardProps) {
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
	const primaryColor = useMemo(() => color || 'var(--entity-note)', [color]);
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto basado en OKLCH (rojo/rosa de notas)
		if (!color) {
			return 'oklch(0.55 0.24 29)';
		}

		// Usar color-mix para oscurecer el color de forma nativa en CSS si es posible,
		// o simplemente retornar el mismo color (el CSS se encargará de las variaciones)
		return `color-mix(in oklab, ${primaryColor}, black 20%)`;
	}, [color, primaryColor]);

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
			borderColor: tcgMode ? `color-mix(in oklab, ${primaryColor}, transparent 30%)` : primaryColor,
			// Fondo con gradiente sutil basado en el color primario
			background: tcgMode
				? `linear-gradient(135deg, color-mix(in oklab, ${primaryColor}, transparent 80%), color-mix(in oklab, ${secondaryColor}, transparent 90%))`
				: `linear-gradient(135deg, color-mix(in oklab, ${primaryColor}, transparent 85%), color-mix(in oklab, ${primaryColor}, transparent 95%))`,
			...style,
		}),
		[primaryColor, secondaryColor, style, tcgMode]
	);

	// Si no hay datos de la nota o está cargando, mostrar un esqueleto o un mensaje de error
	if (isLoading) {
		return (
			<div
				className={cn(
					'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-muted md:w-[320px] dark:bg-background',
					className
				)}
			>
				<p className="text-muted-foreground">Cargando nota...</p>
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
				<p className="text-destructive">Error: {error?.message || 'Nota no encontrada'}</p>
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
			onClick={onClick ? () => onClick(note) : undefined}
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
					className="absolute inset-0 -z-10 rounded-[4.75%] blur-sm"
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
});

// Versión memorizada ya incluida en la definición principal
export const MemoizedNoteCard = NoteCard;
