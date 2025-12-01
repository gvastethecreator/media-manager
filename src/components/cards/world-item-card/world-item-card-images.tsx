import { ImageIcon } from 'lucide-react';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

import { WorldItemService } from '@/services/world-item/world-item.service';
import { clientLogger } from '@/lib/logger/client-logger';

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
	const [images, setImages] = useState<{ id: string; fullUrl: string }[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const worldItemService = useMemo(() => new WorldItemService(), []);

	useEffect(() => {
		const loadImages = async () => {
			try {
				setIsLoading(true);
				const data = await worldItemService.getRecentWorldItemImages(worldItemId, 6);
				// Filtrar solo imágenes con fullUrl válida
				const validImages = data.filter((img) => img.fullUrl);
				setImages(validImages);
			} catch (err) {
				clientLogger.error('Error cargando imágenes:', err);
				setError(err instanceof Error ? err.message : 'Error desconocido');
			} finally {
				setIsLoading(false);
			}
		};

		loadImages();
	}, [worldItemId, worldItemService]);

	return (
		<div className="relative h-[160px] overflow-hidden border-gray-400/30 border-b">
			{/* Contenedor de imágenes con grid */}
			<div
				className={cn(
					'grid h-full w-full gap-0.5',
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
						Array.from({ length: 6 }).map((_, _i) => (
							<ImageLoading
								backgroundColor={secondaryColor}
								key={`loading-placeholder-${worldItemId}-${Math.random().toString(36).substring(2, 9)}`}
							/>
						))
					) : error ? (
						// Mostrar mensaje de error
						<div className="col-span-full row-span-full flex items-center justify-center text-destructive text-sm">
							<ImageIcon className="mr-2 h-4 w-4" /> Error: {error}
						</div>
					) : images.length === 0 ? (
						// Mostrar mensaje si no hay imágenes
						<div className="col-span-full row-span-full flex flex-col items-center justify-center p-4 text-center">
							<ImageIcon className="mb-2 h-8 w-8 opacity-30" />
							<p className="text-sm opacity-70">No hay imágenes</p>
						</div>
					) : (
						// Mostrar las imágenes disponibles
						<>
							{images.map((image, index) => (
								<div className="relative h-full w-full overflow-hidden" key={image.id}>
									<img
										alt={`Imagen ${index + 1}`}
										className="h-full w-full object-cover"
										loading="lazy"
										src={image.fullUrl}
									/>
								</div>
							))}
							{/* Rellena con placeholders si hay menos de 6 imágenes */}
							{images.length < 6 &&
								Array.from({ length: 6 - images.length }).map((_, _i) => (
									<div
										className="flex h-full w-full items-center justify-center bg-black/20"
										key={`empty-placeholder-${worldItemId}-${Math.random().toString(36).substring(2, 9)}`}
									>
										<ImageIcon className="h-5 w-5 opacity-20" />
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
			className="relative flex h-full w-full animate-pulse items-center justify-center overflow-hidden"
			style={{ backgroundColor: `${backgroundColor}30` }}
		>
			<ImageIcon className="h-5 w-5 opacity-20" />
		</div>
	);
}
