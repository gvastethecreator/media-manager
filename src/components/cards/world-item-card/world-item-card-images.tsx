import { ImageIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Suspense, useMemo } from 'react';
import { useRecentWorldItemImages } from '@/lib/api/world-items';
import { cn } from '@/lib/utils';

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
	const { data, isLoading, error } = useRecentWorldItemImages(worldItemId, 6);

	// Filtrar solo imágenes con thumbnailUrl válida
	const images = useMemo(() => {
		if (!data) return [];
		return data.filter((img) => img.thumbnailUrl);
	}, [data]);

	// ID único para keys estables
	const renderKey = useMemo(() => nanoid(), []);

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
						Array.from({ length: 6 }).map((_, i) => (
							<ImageLoading backgroundColor={secondaryColor} key={`loading-${renderKey}-${i}`} />
						))
					) : error ? (
						// Mostrar mensaje de error
						<div className="col-span-full row-span-full flex items-center justify-center text-destructive text-sm">
							<ImageIcon className="mr-2 h-4 w-4" /> Error: {error.message}
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
										src={image.thumbnailUrl}
									/>
								</div>
							))}
							{/* Rellena con placeholders si hay menos de 6 imágenes */}
							{images.length < 6 &&
								Array.from({ length: 6 - images.length }).map((_, i) => (
									<div
										className="flex h-full w-full items-center justify-center bg-black/20"
										key={`empty-${renderKey}-${i}`}
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
