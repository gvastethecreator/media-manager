import { ImageIcon } from 'lucide-react';
import { Suspense, useState } from 'react';
import { cn } from '@/lib/utils';

interface PromptCardImagesProps {
	/** Todas las im?genes a mostrar */
	images?: string[];
	/** Imagen principal a mostrar */
	mainImage?: string | null;
	/** Color primario para estilos */
	primaryColor: string;
	/** Color secundario para estilos */
	secondaryColor?: string;
	/** Si se muestra en modo TCG con efectos visuales */
	tcgMode?: boolean;
}

/**
 * Componente para mostrar las im?genes de un prompt en una tarjeta.
 * Soporta efectos visuales en modo TCG para im?genes.
 */
export function PromptCardImages({
	mainImage,
	images = [],
	primaryColor,
	secondaryColor = 'var(--dt-primary-700)',
	tcgMode = true,
}: PromptCardImagesProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [activeImage, setActiveImage] = useState<string | null>(mainImage || images[0] || null);

	// Altura ajustable seg?n el modo TCG
	const containerHeight = tcgMode ? 'h-[160px]' : 'h-[140px]';

	// Preparar array de im?genes, asegurando que activeImage sea la primera
	const processedImages = [...images];
	if (mainImage && !processedImages.includes(mainImage)) {
		processedImages.unshift(mainImage);
	}

	// Limitar a m?ximo 6 im?genes
	const displayImages = processedImages.slice(0, 6);

	return (
		<div
			className={cn('relative overflow-hidden border-b', containerHeight)}
			style={{ borderColor: `color-mix(in oklab, ${primaryColor}, transparent 60%)` }}
		>
			{/* Contenedor de im?genes */}
			<div
				className="relative h-full w-full"
				style={{
					backgroundImage: `linear-gradient(to bottom, color-mix(in oklab, ${primaryColor}, transparent 75%), color-mix(in oklab, ${secondaryColor}, transparent 50%))`,
				}}
			>
				<Suspense fallback={<ImageLoading backgroundColor={secondaryColor} />}>
					{(() => {
						if (isLoading) {
							return <ImageLoading backgroundColor={secondaryColor} />;
						}

						if (displayImages.length === 0) {
							// Mostrar mensaje si no hay im?genes
							return (
								<div className="flex h-full flex-col items-center justify-center p-4 text-center">
									<ImageIcon className="mb-2 h-8 w-8 opacity-30" />
									<p className="text-sm opacity-70">Sin im?genes</p>

									{tcgMode && (
										<div
											className="pointer-events-none absolute inset-0 opacity-20"
											style={{
												background: `repeating-linear-gradient(45deg, transparent, transparent 10px, color-mix(in oklab, ${primaryColor}, transparent 80%) 10px, color-mix(in oklab, ${primaryColor}, transparent 80%) 20px)`,
											}}
										/>
									)}
								</div>
							);
						}

						// Mostrar imagen activa
						return (
							<div className="relative h-full w-full overflow-hidden">
								{/* Imagen Principal */}
								{activeImage && (
									<div className="relative h-full w-full overflow-hidden">
										<img
										alt="Featured image"
											className={cn(
												'h-full w-full object-cover',
												tcgMode && 'transition-transform duration-dt-slow ease-dt-out hover:scale-110'
											)}
											loading="lazy"
											onError={() => setIsLoading(false)}
											onLoad={() => setIsLoading(false)}
											src={activeImage}
										/>

										{/* Efectos hologr?ficos en modo TCG */}
										{tcgMode && (
											<>
												<div
													className="ui-overlay-hover-soft"
													style={{
														background: `linear-gradient(45deg, transparent 0%, color-mix(in oklab, ${primaryColor}, transparent 20%) 45%, white 50%, color-mix(in oklab, ${primaryColor}, transparent 20%) 55%, transparent 100%)`,
														backgroundSize: '200% 200%',
														animation: 'shine 5s ease-in-out infinite',
													}}
												/>
												<div className="absolute bottom-0 left-0 h-1/4 w-full bg-linear-to-t from-black/40 to-transparent" />
											</>
										)}
									</div>
								)}

								{/* Miniaturas inferiores */}
								{displayImages.length > 1 && (
									<div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 transform items-center justify-center gap-1">
										{displayImages.map((img, idx) => (
											<button
											aria-label={`View image ${idx + 1}`}
												className={cn(
													'h-2 w-2 rounded-full transition-all',
													activeImage === img
														? 'scale-125 bg-background shadow-lg'
														: 'bg-background/50 hover:bg-background/80',
													tcgMode && 'outline-1 outline-offset-1'
												)}
												key={`thumb-${img.substring(0, 8)}-${idx + 1}`}
												onClick={() => setActiveImage(img)}
												style={{ outlineColor: activeImage === img ? primaryColor : 'transparent' }}
												type="button"
											/>
										))}
									</div>
								)}
							</div>
						);
					})()}
				</Suspense>
			</div>
		</div>
	);
}

// Componente para mostrar mientras se cargan las im?genes
function ImageLoading({ backgroundColor = 'var(--dt-primary-700)' }: { backgroundColor?: string }) {
	return (
		<div
			className="relative flex h-full w-full animate-pulse items-center justify-center overflow-hidden"
			style={{ backgroundColor: `color-mix(in oklab, ${backgroundColor}, transparent 70%)` }}
		>
			<ImageIcon className="h-5 w-5 opacity-20" />
		</div>
	);
}
