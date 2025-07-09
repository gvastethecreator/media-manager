import { ImageIcon, Sparkles } from 'lucide-react';
import { nanoid } from 'nanoid';
import React, { Suspense, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

import { ConceptService } from '@/services/concept/concept.service';
import type { ImageWithStats } from '@/types/entities/image';

const { getRecentConceptImages } = ConceptService;

interface ConceptCardImagesProps {
	conceptId: string;
	primaryColor: string;
	secondaryColor: string;
	tcgMode?: boolean;
}

/**
 * Componente para mostrar las imágenes recientes de un concepto en una tarjeta.
 * Diseñado para parecer la ilustración de una carta TCG con efectos visuales.
 */
export function ConceptCardImages({ conceptId, primaryColor, secondaryColor, tcgMode = true }: ConceptCardImagesProps) {
	const [images, setImages] = useState<{ id: string; thumbnailUrl: string }[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Generar un ID de renderizado único
	const renderKey = React.useMemo(() => nanoid(), []);

		useEffect(() => {
		const loadImages = async () => {
			try {
				setIsLoading(true);
				const data = await getRecentConceptImages(conceptId);
				// Filtrar solo imágenes con thumbnailUrl válida
				const validImages = data.filter((img) => img.thumbnailUrl);
				setImages(validImages);
			} catch (err) {
				console.error('Error cargando imágenes:', err);
				setError(err instanceof Error ? err.message : 'Error desconocido');
			} finally {
				setIsLoading(false);
			}
		};

		loadImages();
	}, [conceptId]);

	return (
		<div className={cn('relative h-[160px] overflow-hidden', tcgMode ? 'border-b-0' : 'border-b border-gray-400/30')}>
			{/* Marco decorativo para TCG */}
			{tcgMode && (
				<>
					{/* Borde superior con gradiente */}
					<div
						className="absolute top-0 inset-x-0 h-[4px] z-10"
						style={{ background: `linear-gradient(to right, transparent, ${primaryColor}, transparent)` }}
					/>

					{/* Bordes laterales con el color primario */}
					<div className="absolute top-0 bottom-0 left-0 w-[2px] z-10" style={{ background: primaryColor }} />
					<div className="absolute top-0 bottom-0 right-0 w-[2px] z-10" style={{ background: primaryColor }} />
				</>
			)}

			{/* Contenedor de imágenes con grid */}
			<div
				className={cn(
					'w-full h-full grid gap-0.5',
					images.length >= 4 ? 'grid-cols-3 grid-rows-2' : 'grid-cols-2 grid-rows-2'
				)}
				style={{
					backgroundImage: tcgMode
						? `linear-gradient(to bottom, ${secondaryColor}80, ${secondaryColor})`
						: `linear-gradient(to bottom, ${primaryColor}25, ${secondaryColor}50)`,
					borderBottom: tcgMode ? `2px solid ${primaryColor}` : `1px solid ${primaryColor}50`,
				}}
			>
				<Suspense fallback={<ImageLoading backgroundColor={secondaryColor} tcgMode={tcgMode} />}>
					{isLoading ? (
						// Mostrar placeholders mientras carga
						[...Array(6)].map((_, i) => (
							<ImageLoading
								key={`loading-${renderKey}-star-${i + 1}`}
								backgroundColor={secondaryColor}
								tcgMode={tcgMode}
							/>
						))
					) : error ? (
						// Mostrar mensaje de error
						<div className="col-span-full row-span-full flex items-center justify-center text-destructive text-sm">
							<ImageIcon className="mr-2 h-4 w-4" /> Error: {error}
						</div>
					) : images.length === 0 ? (
						// Mostrar mensaje si no hay imágenes
						<div
							className={cn(
								'col-span-full row-span-full flex flex-col items-center justify-center text-center p-4',
								tcgMode ? 'bg-black/30' : ''
							)}
						>
							{tcgMode ? (
								<div className="text-center">
									<div className="flex items-center justify-center mb-1">
										<Sparkles className="h-5 w-5 text-white/40 mr-1" />
										<ImageIcon className="h-6 w-6 text-white/60" />
										<Sparkles className="h-5 w-5 text-white/40 ml-1" />
									</div>
									<p className="text-sm text-white/80 font-semibold">Imaginación Conceptual</p>
									<p className="text-xs text-white/50 italic">Sin visualizaciones</p>
								</div>
							) : (
								<>
									<ImageIcon className="h-8 w-8 opacity-30 mb-2" />
									<p className="text-sm opacity-70">No hay imágenes</p>
								</>
							)}
						</div>
					) : (
						// Mostrar las imágenes disponibles
						<>
							{images.map((image, index) => (
								<div
									key={image.id}
									className={cn('relative overflow-hidden w-full h-full', tcgMode ? 'border border-white/10' : '')}
								>
									<img
										src={image.thumbnailUrl}
										alt={`Imagen ${index + 1}`}
										className={cn(
											'w-full h-full object-cover',
											tcgMode ? 'hover:scale-110 transition-transform duration-500' : ''
										)}
										loading="lazy"
									/>
									{tcgMode && (
										<div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
									)}
								</div>
							))}
							{/* Rellena con placeholders si hay menos de 6 imágenes */}
							{images.length < 6 &&
								[...Array(6 - images.length)].map((_, i) => (
									<div
										key={`placeholder-${renderKey}-position-${i + 1}`}
										className={cn(
											'w-full h-full flex items-center justify-center',
											tcgMode ? 'bg-black/40 border border-white/5' : 'bg-black/20'
										)}
									>
										<ImageIcon className="w-5 h-5 opacity-20" />
									</div>
								))}
						</>
					)}
				</Suspense>
			</div>

			{/* Sello de agua TCG */}
			{tcgMode && (
				<div className="absolute bottom-2 right-2 opacity-20 text-white text-xs font-mono tracking-tight">
					◊ C-{conceptId.substring(0, 4)} ◊
				</div>
			)}
		</div>
	);
}

// Componente para mostrar mientras se cargan las imágenes
function ImageLoading({ backgroundColor, tcgMode = false }: { backgroundColor: string; tcgMode?: boolean }) {
	return (
		<div
			className={cn(
				'animate-pulse relative overflow-hidden w-full h-full flex items-center justify-center',
				tcgMode ? 'border border-white/5' : ''
			)}
			style={{ backgroundColor: tcgMode ? `${backgroundColor}60` : `${backgroundColor}30` }}
		>
			<ImageIcon className="w-5 h-5 opacity-20" />
		</div>
	);
}
