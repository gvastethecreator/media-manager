'use client';

import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { getRecentWorldItemImages } from './world-item-server-actions';

interface WorldItemCardImagesProps {
	worldItemId: string;
	primaryColor: string;
	secondaryColor: string;
}

/**
 * Componente para mostrar las imágenes recientes de un objeto en una tarjeta.
 * Similar a la sección de ilustración de una carta Magic.
 */
export function WorldItemCardImages({ worldItemId, primaryColor, secondaryColor }: WorldItemCardImagesProps) {
	const [images, setImages] = useState<{ id: string; thumbnailUrl: string }[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadImages = async () => {
			try {
				setIsLoading(true);
				const data = await getRecentWorldItemImages(worldItemId);
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
	}, [worldItemId]);

	return (
		<div className="relative h-[160px] overflow-hidden border-b border-gray-400/30">
			{/* Contenedor de imágenes con grid */}
			<div
				className={cn(
					'w-full h-full grid gap-0.5',
					images.length >= 4 ? 'grid-cols-3 grid-rows-2' : 'grid-cols-2 grid-rows-2'
				)}
				style={{
					backgroundImage: `linear-gradient(to bottom, ${primaryColor}25, ${secondaryColor}50)`,
					borderBottom: `1px solid ${primaryColor}50`,
				}}
			>
				<Suspense fallback={<ImageLoading backgroundColor={secondaryColor} />}>
					{isLoading ? (
						// Mostrar placeholders mientras carga
						<>
							{[...Array(6)].map((_, i) => (
								<ImageLoading key={i} backgroundColor={secondaryColor} />
							))}
						</>
					) : error ? (
						// Mostrar mensaje de error
						<div className="col-span-full row-span-full flex items-center justify-center text-destructive text-sm">
							<ImageIcon className="mr-2 h-4 w-4" /> Error: {error}
						</div>
					) : images.length === 0 ? (
						// Mostrar mensaje si no hay imágenes
						<div className="col-span-full row-span-full flex flex-col items-center justify-center text-center p-4">
							<ImageIcon className="h-8 w-8 opacity-30 mb-2" />
							<p className="text-sm opacity-70">No hay imágenes</p>
						</div>
					) : (
						// Mostrar las imágenes disponibles
						<>
							{images.map((image, index) => (
								<div key={image.id} className="relative overflow-hidden w-full h-full">
									<img
										src={image.thumbnailUrl}
										alt={`Imagen ${index + 1}`}
										className="w-full h-full object-cover"
										loading="lazy"
									/>
								</div>
							))}
							{/* Rellena con placeholders si hay menos de 6 imágenes */}
							{images.length < 6 &&
								[...Array(6 - images.length)].map((_, i) => (
									<div
										key={`placeholder-${i}`}
										className="bg-black/20 w-full h-full flex items-center justify-center"
									>
										<ImageIcon className="w-5 h-5 opacity-20" />
									</div>
								))}
						</>
					)}
				</Suspense>
			</div>
		</div>
	);
}

// Componente para mostrar mientras se cargan las imágenes
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