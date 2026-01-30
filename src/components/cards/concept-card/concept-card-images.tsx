import { ImageIcon, Sparkles } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Suspense, useMemo } from 'react';
import { useRecentConceptImages } from '@/lib/api/concepts';
import { cn } from '@/lib/utils';

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
	const { data, isLoading, error } = useRecentConceptImages(conceptId, 6);

	// Filtrar solo imágenes con thumbnailUrl válida
	const images = useMemo(() => {
		if (!data) return [];
		return data.filter((img) => img.thumbnailUrl);
	}, [data]);

	// Generar un ID de renderizado único
	const renderKey = useMemo(() => nanoid(), []);

	return (
		<div
			className={cn(
				'relative h-[160px] overflow-hidden',
				tcgMode ? 'border-b-0' : 'border-muted-foreground/30/30 border-b'
			)}
		>
			{/* Marco decorativo para TCG */}
			{tcgMode && (
				<>
					{/* Borde superior con gradiente */}
					<div
						className="absolute inset-x-0 top-0 z-10 h-[4px]"
						style={{ background: `linear-gradient(to right, transparent, ${primaryColor}, transparent)` }}
					/>

					{/* Bordes laterales con el color primario */}
					<div className="absolute top-0 bottom-0 left-0 z-10 w-[2px]" style={{ background: primaryColor }} />
					<div className="absolute top-0 right-0 bottom-0 z-10 w-[2px]" style={{ background: primaryColor }} />
				</>
			)}

			{/* Contenedor de imágenes con grid */}
			<div
				className={cn(
					'grid h-full w-full gap-0.5',
					images.length >= 4 ? 'grid-cols-3 grid-rows-2' : 'grid-cols-2 grid-rows-2'
				)}
				style={{
					backgroundImage: tcgMode
						? `linear-gradient(to bottom, color-mix(in oklab, ${secondaryColor}, transparent 50%), ${secondaryColor})`
						: `linear-gradient(to bottom, color-mix(in oklab, ${primaryColor}, transparent 81%), color-mix(in oklab, ${secondaryColor}, transparent 69%))`,
					borderBottom: tcgMode ? `2px solid ${primaryColor}` : `1px solid color-mix(in oklab, ${primaryColor}, transparent 69%)`,
				}}
			>
				<Suspense fallback={<ImageLoading backgroundColor={secondaryColor} tcgMode={tcgMode} />}>
					{isLoading ? (
						// Mostrar placeholders mientras carga
						[...new Array(6)].map((_, i) => (
							<ImageLoading
								backgroundColor={secondaryColor}
								key={`loading-${renderKey}-star-${i + 1}`}
								tcgMode={tcgMode}
							/>
						))
					) : error ? (
						// Mostrar mensaje de error
						<div className="col-span-full row-span-full flex items-center justify-center text-destructive text-sm">
							<ImageIcon className="mr-2 h-4 w-4" /> Error: {error.message}
						</div>
					) : images.length === 0 ? (
						// Mostrar mensaje si no hay imágenes
						<div
							className={cn(
								'col-span-full row-span-full flex flex-col items-center justify-center p-4 text-center',
								tcgMode ? 'bg-muted/30' : ''
							)}
						>
							{tcgMode ? (
								<div className="text-center">
									<div className="mb-1 flex items-center justify-center">
										<Sparkles className="mr-1 h-5 w-5 text-white/40" />
										<ImageIcon className="h-6 w-6 text-white/60" />
										<Sparkles className="ml-1 h-5 w-5 text-white/40" />
									</div>
									<p className="font-semibold text-sm text-white/80">Imaginación Conceptual</p>
									<p className="text-white/50 text-sm italic">Sin visualizaciones</p>
								</div>
							) : (
								<>
									<ImageIcon className="mb-2 h-8 w-8 opacity-30" />
									<p className="text-sm opacity-70">No hay imágenes</p>
								</>
							)}
						</div>
					) : (
						// Mostrar las imágenes disponibles
						<>
							{images.map((image, index) => (
								<div
									className={cn('relative h-full w-full overflow-hidden', tcgMode ? 'border border-border/40' : '')}
									key={image.id}
								>
									<img
										alt={`Imagen ${index + 1}`}
										className={cn(
											'h-full w-full object-cover',
											tcgMode ? 'transition-transform duration-500 hover:scale-110' : ''
										)}
										loading="lazy"
										src={image.thumbnailUrl}
									/>
									{tcgMode && (
										<div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
									)}
								</div>
							))}
							{/* Rellena con placeholders si hay menos de 6 imágenes */}
							{images.length < 6 &&
								[...new Array(6 - images.length)].map((_, i) => (
									<div
										className={cn(
											'flex h-full w-full items-center justify-center',
											tcgMode ? 'border border-border/20 bg-muted/40' : 'bg-muted/20'
										)}
										key={`placeholder-${renderKey}-position-${i + 1}`}
									>
										<ImageIcon className="h-5 w-5 opacity-20" />
									</div>
								))}
						</>
					)}
				</Suspense>
			</div>

			{/* Sello de agua TCG */}
			{tcgMode && (
				<div className="absolute right-2 bottom-2 font-mono text-white text-sm tracking-tight opacity-20">
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
				'relative flex h-full w-full animate-pulse items-center justify-center overflow-hidden',
				tcgMode ? 'border border-border/20' : ''
			)}
			style={{ backgroundColor: tcgMode ? `color-mix(in oklab, ${backgroundColor}, transparent 63%)` : `color-mix(in oklab, ${backgroundColor}, transparent 81%)` }}
		>
			<ImageIcon className="h-5 w-5 opacity-20" />
		</div>
	);
}
