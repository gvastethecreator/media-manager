'use client';

import { cn } from '@/lib/utils';
import { Suspense, useEffect, useState } from 'react';
import { getRecentFolderImages } from './folder-server-actions';

interface FolderCardImagesProps {
	folderId: string;
	primaryColor: string;
	secondaryColor: string;
}

interface ThumbnailImage {
	id: string;
	thumbnailUrl: string;
}

/**
 * Componente para mostrar las últimas 6 imágenes de una carpeta en la tarjeta.
 * Similar a la ilustración de una carta Magic, pero con un grid de miniaturas.
 */
export function FolderCardImages({ folderId, primaryColor, secondaryColor }: FolderCardImagesProps) {
	const [images, setImages] = useState<ThumbnailImage[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Cargar las imágenes recientes de la carpeta
	useEffect(() => {
		async function loadRecentImages() {
			try {
				setIsLoading(true);
				// Llamada a la acción del servidor para obtener las imágenes
				const recentImages = await getRecentFolderImages(folderId, 6);
				setImages(recentImages);
			} catch (err) {
				console.error('Error cargando miniaturas:', err);
				setError('Error al cargar las imágenes');
			} finally {
				setIsLoading(false);
			}
		}

		loadRecentImages();
	}, [folderId]);

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
								No hay imágenes en esta carpeta
							</div>
						)}
					</div>
				) : (
					<Suspense fallback={<div className="animate-pulse text-xl">⏳</div>}>
						{/* Grid de miniaturas */}
						<div className="grid grid-cols-3 grid-rows-2 gap-0.5 w-full h-full">
							{images.map((image, index) => (
								<div
									key={image.id}
									className={cn(
										"relative overflow-hidden bg-black/30",
										// Diferentes estilos para cada posición para crear un efecto interesante
										index === 0 && "col-span-2 row-span-2",
										index === 1 && "row-span-1",
										index === 2 && "row-span-1",
									)}
								>
									<img
										src={image.thumbnailUrl}
										alt=""
										className="w-full h-full object-cover"
										loading="lazy"
										style={{
											opacity: 0.85 + (0.15 / (index + 1)),
											filter: index > 0 ? 'brightness(0.9)' : 'brightness(1)'
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