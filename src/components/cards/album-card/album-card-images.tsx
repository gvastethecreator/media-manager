'use client';

import { getRecentAlbumImages } from '@/app/actions/albums/album-images.actions';
import { cn } from '@/lib/utils';
import { Suspense, useEffect, useState } from 'react';

interface AlbumCardImagesProps {
	albumId: string;
	primaryColor: string;
	secondaryColor: string;
}

interface ThumbnailImage {
	id: string;
	thumbnailUrl: string;
}

/**
 * Componente para mostrar las últimas 6 imágenes de un álbum en la tarjeta.
 * Similar a la ilustración de una carta Magic, pero con un grid de miniaturas.
 */
export function AlbumCardImages({ albumId, primaryColor, secondaryColor }: AlbumCardImagesProps) {
	const [images, setImages] = useState<ThumbnailImage[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Cargar las imágenes recientes del álbum
	useEffect(() => {
		async function loadRecentImages() {
			try {
				setIsLoading(true);
				// Llamada a la acción del servidor para obtener las imágenes
				const recentImages = await getRecentAlbumImages(albumId, 6);
				setImages(recentImages);
			} catch (err) {
				console.error('Error cargando miniaturas:', err);
				setError('Error al cargar las imágenes');
			} finally {
				setIsLoading(false);
			}
		}

		loadRecentImages();
	}, [albumId]);

	return (
		<div
			className="relative h-36 bg-card border-b"
			style={{ borderColor: `${primaryColor}50` }}
		>
			{/* Marco de la ilustración */}
			<div className="absolute inset-0.5 rounded-sm overflow-hidden">
				{/* Mostrar un placeholder durante la carga o si hay error */}
				{isLoading || error || images.length === 0 ? (
					<div
						className="w-full h-full flex items-center justify-center"
						style={{ background: `radial-gradient(circle, ${primaryColor}30, ${secondaryColor}40)` }}
					>
						{isLoading ? (
							<div className="animate-pulse text-xl">⏳</div>
						) : error ? (
							<div className="text-red-500 text-sm text-center px-2">Error al cargar imágenes</div>
						) : (
							<div className="text-muted-foreground text-sm text-center px-2">
								No hay imágenes en este álbum
							</div>
						)}
					</div>
				) : (
					<Suspense fallback={<div className="animate-pulse text-xl">⏳</div>}>
						{/* Mosaico de imágenes - Diseño especial tipo collage para álbumes */}
						<div className="grid grid-cols-3 grid-rows-2 gap-0.5 w-full h-full">
							{images.map((image, index) => (
								<div
									key={image.id}
									className={cn(
										"relative overflow-hidden bg-black/30",
										// Para álbumes, dar un efecto de mosaico más artístico
										index === 0 && "col-span-2 row-span-1",
										index === 1 && "row-span-1",
										index === 2 && "col-span-1 row-span-2",
										index === 3 && "col-span-1 row-span-1",
										index === 4 && "col-span-1 row-span-1",
									)}
								>
									<img
										src={image.thumbnailUrl}
										alt=""
										className="w-full h-full object-cover"
										loading="lazy"
										style={{
											opacity: 0.9,
											// Añadir un filtro degradado para darle efecto artístico
											filter: index % 2 ? 'saturate(1.1) contrast(1.05)' : 'saturate(0.95) contrast(1.02)'
										}}
									/>

									{/* Efecto de brillo en hover */}
									<div
										className="absolute inset-0 opacity-0 hover:opacity-100 transition-all duration-300"
										style={{
											background: `linear-gradient(135deg, ${primaryColor}30 0%, transparent 50%, ${secondaryColor}30 100%)`
										}}
									/>
								</div>
							))}

							{/* Rellenar las celdas vacías si hay menos de 6 imágenes */}
							{Array.from({ length: Math.max(0, 6 - images.length) }).map((_, index) => (
								<div
									key={`placeholder-${index}`}
									className="bg-black/20"
									style={{
										background: `linear-gradient(45deg, ${primaryColor}10, ${secondaryColor}20)`
									}}
								/>
							))}
						</div>

						{/* Overlay para darle un efecto de unidad al mosaico */}
						<div
							className="absolute inset-0 pointer-events-none opacity-30"
							style={{
								background: `radial-gradient(circle at center, transparent 50%, ${primaryColor}30 100%)`
							}}
						/>
					</Suspense>
				)}
			</div>

			{/* Borde decorativo alrededor de la ilustración */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					boxShadow: `inset 0 0 0 1.5px ${primaryColor}90`
				}}
			/>
		</div>
	);
}