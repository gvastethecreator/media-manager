import { BookOpen, ScrollText } from 'lucide-react';
import { motion } from 'motion/react';
import React, { memo, useCallback, useMemo } from 'react';
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

	// Extraer datos relevantes
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
	} = note || {}; // Añadir fallback para evitar errores si note es undefined

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
		if (!color) return '#db2777';

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
					'w-[300px] md:w-[320px] h-[470px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center',
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
					'w-[300px] md:w-[320px] h-[470px] rounded-lg overflow-hidden bg-red-100 dark:bg-red-900 flex items-center justify-center',
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
			className={cn(
				// Base
				'relative bg-card',
				'w-[300px] h-[420px] rounded-[4.75%] overflow-hidden',
				tcgMode ? 'border-[3px] shadow-xl' : 'border-2 shadow-md',
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
			onClick={onClick ? (e: React.MouseEvent<HTMLDivElement>) => onClick(note) : undefined}
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
				title={note.title || 'Sin título'}
				subtitle={note.category || 'General'}
				icon={
					note.emoji ? (
						<span className="text-lg">{note.emoji}</span>
					) : tcgMode ? (
						<BookOpen className="w-4 h-4" />
					) : (
						<ScrollText className="w-4 h-4" />
					)
				}
				primaryColor={primaryColor}
			/>

			{/* Sección de imágenes */}
			<NoteCardImages noteId={note.id} primaryColor={primaryColor} secondaryColor={secondaryColor} tcgMode={tcgMode} />

			{/* Contenido principal */}
			<NoteCardContent
				content={note.content}
				category={note.category}
				tags={tags}
				status={note.status}
				priority={note.priority}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
				noteId={note.id}
				tcgMode={tcgMode}
			/>

			{/* Pie de la tarjeta */}
			<NoteCardFooter
				createdAt={note.createdAt}
				updatedAt={note.updatedAt}
				imagesCount={imagesCount}
				videosCount={videosCount}
				relationsCount={relationsCount}
				isFavorite={note.isFavorite}
				status={note.status}
				priority={note.priority}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
				tcgMode={tcgMode}
			/>
		</motion.div>
	);
}

// Versión memorizada para optimizar rendimiento en listas
export const MemoizedNoteCard = memo(NoteCard);
