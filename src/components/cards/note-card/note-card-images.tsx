import { ImageIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import React, { memo, Suspense, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useRecentNoteImages } from '@/lib/api/notes';

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
export const NoteCardImages = memo(function NoteCardImages({ noteId, primaryColor, secondaryColor, tcgMode = true }: NoteCardImagesProps) {
	// Generar un ID de renderizado ?nico
	const renderKey = React.useMemo(() => nanoid(), []);

	// Usar el hook para obtener im?genes recientes
	const { data: images = [], isLoading, error } = useRecentNoteImages(noteId, 6);

	// Obtener estilo de borde para modo TCG
	const getBorderStyles = useMemo(() => {
		if (tcgMode) {
			return {
				borderBottom: `2px solid ${primaryColor}40`,
				borderImage: `linear-gradient(to right, transparent, ${primaryColor}60, transparent) 1`,
			};
		}
		return {
			borderBottom: `1px solid ${primaryColor}30`,
		};
	}, [tcgMode, primaryColor]);

	const backgroundStyle = useMemo(() => ({
		backgroundImage: `linear-gradient(to bottom, ${primaryColor}25, ${secondaryColor}50)`,
	}), [primaryColor, secondaryColor]);

	return (
		<div
			className={cn('relative h-[150px] overflow-hidden border-b border-gray-400/30', tcgMode && 'pb-1')}
			style={getBorderStyles()}
		>
			{/* Contenedor de im?genes con grid */}
			<div
				className={cn(
					'w-full h-full grid gap-0.5',
					images.length >= 4 ? 'grid-cols-3 grid-rows-2' : 'grid-cols-2 grid-rows-2',
					tcgMode && 'rounded-md overflow-hidden'
				)}
				style={backgroundStyle}
			>
				<Suspense fallback={<ImageLoading backgroundColor={secondaryColor} />}>
					{isLoading ? (
						// Mostrar placeholders mientras carga
						[...Array(6)].map((_, i) => (
							<ImageLoading key={`loading-${renderKey}-position-${i + 1}`} backgroundColor={secondaryColor} />
						))
					) : error ? (
						// Mostrar mensaje de error
						<div className="col-span-full row-span-full flex items-center justify-center text-destructive text-sm">
							<ImageIcon className="mr-2 h-4 w-4" /> Error: {error.message}
						</div>
					) : images.length === 0 ? (
						// Mostrar mensaje si no hay im?genes
						<div className="col-span-full row-span-full flex flex-col items-center justify-center text-center p-4">
							<ImageIcon className="h-8 w-8 opacity-30 mb-2" />
							<p className="text-sm opacity-70">No hay im?genes</p>
						</div>
					) : (
						// Mostrar las im?genes disponibles
						<>
							{images.map((image, index) => (
								<div
									key={image.id}
									className={cn(
										'relative overflow-hidden w-full h-full',
										tcgMode &&
											'transition-all duration-300 hover:brightness-110 hover:z-10 hover:transform hover:scale-105'
									)}
								>
									<img
										src={image.thumbnailUrl}
										alt={`Imagen ${index + 1}`}
										className="w-full h-full object-cover"
										loading="lazy"
									/>
									{/* Degradado inferior para TCG mode */}
									{tcgMode && (
										<div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
									)}
								</div>
							))}
							{/* Rellena con placeholders si hay menos de 6 im?genes */}
							{images.length < 6 &&
								[...Array(6 - images.length)].map((_, i) => (
									<div
										key={`placeholder-${renderKey}-position-${i + 1}`}
										className={cn(
											'bg-black/20 w-full h-full flex items-center justify-center',
											tcgMode && 'border border-white/10'
										)}
									>
										<ImageIcon className="w-5 h-5 opacity-20" />
									</div>
								))}
						</>
					)}
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
			className="animate-pulse relative overflow-hidden w-full h-full flex items-center justify-center"
			style={{ backgroundColor: `${backgroundColor}30` }}
		>
			<ImageIcon className="w-5 h-5 opacity-20" />
		</div>
	);
}
