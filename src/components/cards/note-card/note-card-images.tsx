import { ImageIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import React, { memo, Suspense, useMemo } from 'react';
import { useRecentNoteImages } from '@/lib/api/notes';
import { cn } from '@/lib/utils';

interface NoteCardImagesProps {
	noteId: string;
	primaryColor: string;
	secondaryColor: string;
	tcgMode?: boolean;
}

/**
 * Componente para mostrar las im?genes recientes de una nota en una tarjeta.
 * Similar a la secci?n de ilustraci?n de una carta TCG.
 */
export const NoteCardImages = memo(function NoteCardImagesComponent({
	noteId,
	primaryColor,
	secondaryColor,
	tcgMode = true,
}: NoteCardImagesProps) {
	// Generar un ID de renderizado ?nico
	const renderKey = React.useMemo(() => nanoid(), []);

	// Usar el hook para obtener im?genes recientes
	const { data: images = [], isLoading, error } = useRecentNoteImages(noteId, 6);

	// Obtener estilo de borde para modo TCG
	const getBorderStyles = useMemo(() => {
		if (tcgMode) {
			return {
				borderBottom: `2px solid color-mix(in oklab, ${primaryColor}, transparent 60%)`,
				borderImage: `linear-gradient(to right, transparent, color-mix(in oklab, ${primaryColor}, transparent 40%), transparent) 1`,
			};
		}
		return {
			borderBottom: `1px solid color-mix(in oklab, ${primaryColor}, transparent 70%)`,
		};
	}, [tcgMode, primaryColor]);

	const backgroundStyle = useMemo(
		() => ({
			backgroundImage: `linear-gradient(to bottom, color-mix(in oklab, ${primaryColor}, transparent 75%), color-mix(in oklab, ${secondaryColor}, transparent 50%))`,
		}),
		[primaryColor, secondaryColor]
	);

	return (
		<div
			className={cn('relative h-[150px] overflow-hidden border-muted-foreground/30/30 border-b', tcgMode && 'pb-1')}
			style={getBorderStyles}
		>
			{/* Contenedor de im?genes con grid */}
			<div
				className={cn(
					'grid h-full w-full gap-0.5',
					images.length >= 4 ? 'grid-cols-3 grid-rows-2' : 'grid-cols-2 grid-rows-2',
					tcgMode && 'overflow-hidden rounded-md'
				)}
				style={backgroundStyle}
			>
				<Suspense fallback={<ImageLoading backgroundColor={secondaryColor} />}>
					{(() => {
						if (isLoading) {
							return [...new Array(6)].map((_, i) => (
								<ImageLoading backgroundColor={secondaryColor} key={`loading-${renderKey}-position-${i + 1}`} />
							));
						}
						if (error) {
							return (
								<div className="col-span-full row-span-full flex items-center justify-center text-destructive text-sm">
									<ImageIcon className="mr-2 h-4 w-4" /> Error: {error.message}
								</div>
							);
						}
						if (images.length === 0) {
							return (
								<div className="col-span-full row-span-full flex flex-col items-center justify-center p-4 text-center">
									<ImageIcon className="mb-2 h-8 w-8 opacity-30" />
									<p className="text-sm opacity-70">No hay im?genes</p>
								</div>
							);
						}
						return (
							<>
								{images.map((image, index) => (
									<div
										className={cn(
											'relative h-full w-full overflow-hidden',
											tcgMode &&
												'transition-all duration-300 hover:z-10 hover:scale-105 hover:transform hover:brightness-110'
										)}
										key={image.id}
									>
										<img
										alt={`Attachment ${index + 1}`}
											className="h-full w-full object-cover"
											loading="lazy"
											src={image.thumbnailUrl}
										/>
										{/* Degradado inferior para TCG mode */}
										{tcgMode && (
											<div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
										)}
									</div>
								))}
								{/* Rellena con placeholders si hay menos de 6 im?genes */}
								{images.length < 6 &&
									[...new Array(6 - images.length)].map((_, i) => (
										<div
											className={cn(
												'flex h-full w-full items-center justify-center bg-muted/20',
												tcgMode && 'border border-border/40'
											)}
											key={`placeholder-${renderKey}-position-${i + 1}`}
										>
											<ImageIcon className="h-5 w-5 opacity-20" />
										</div>
									))}
							</>
						);
					})()}
				</Suspense>
			</div>

			{/* Decoraci?n TCG por debajo de las im?genes */}
			{tcgMode && (
				<div className="absolute inset-x-0 -bottom-1 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
			)}
		</div>
	);
});

// Componente para mostrar mientras se cargan las im?genes
function ImageLoading({ backgroundColor }: { backgroundColor: string }) {
	return (
		<div
			className="relative flex h-full w-full animate-pulse items-center justify-center overflow-hidden"
			style={{ backgroundColor: `color-mix(in oklab, ${backgroundColor}, transparent 70%)` }}
		>
			<ImageIcon className="h-5 w-5 opacity-20" />
		</div>
	);
}
