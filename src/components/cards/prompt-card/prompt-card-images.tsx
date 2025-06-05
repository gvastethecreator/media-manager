'use client';

import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';
import { Suspense, useState } from 'react';

interface PromptCardImagesProps {
	/** Imagen principal a mostrar */
	mainImage?: string | null;
	/** Todas las im?genes a mostrar */
	images?: string[];
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
	secondaryColor = '#0369a1',
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
			style={{ borderColor: `${primaryColor}40` }}
		>
			{/* Contenedor de im?genes */}
			<div
				className="w-full h-full relative"
				style={{
					backgroundImage: `linear-gradient(to bottom, ${primaryColor}25, ${secondaryColor}50)`,
				}}
			>
				<Suspense fallback={<ImageLoading backgroundColor={secondaryColor} />}>
					{isLoading ? (
						<ImageLoading backgroundColor={secondaryColor} />
					) : displayImages.length === 0 ? (
						// Mostrar mensaje si no hay im?genes
						<div className="h-full flex flex-col items-center justify-center text-center p-4">
							<ImageIcon className="h-8 w-8 opacity-30 mb-2" />
							<p className="text-sm opacity-70">Sin im?genes</p>

							{tcgMode && (
								<div
									className="absolute inset-0 opacity-20 pointer-events-none"
									style={{
										background: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${primaryColor}20 10px, ${primaryColor}20 20px)`,
									}}
								/>
							)}
						</div>
					) : (
						// Mostrar imagen activa
						<div className="relative w-full h-full overflow-hidden">
							{/* Imagen Principal */}
							{activeImage && (
								<div className="relative w-full h-full overflow-hidden">
									<img
										src={activeImage}
										alt="Imagen destacada"
										className={cn(
											'w-full h-full object-cover',
											tcgMode && 'transition-transform duration-700 hover:scale-110'
										)}
										loading="lazy"
										onLoad={() => setIsLoading(false)}
										onError={() => setIsLoading(false)}
									/>

									{/* Efectos hologr?ficos en modo TCG */}
									{tcgMode && (
										<>
											<div
												className="absolute inset-0 opacity-0 hover:opacity-20 transition-opacity duration-300 pointer-events-none"
												style={{
													background: `linear-gradient(45deg, transparent 0%, ${primaryColor}80 45%, white 50%, ${primaryColor}80 55%, transparent 100%)`,
													backgroundSize: '200% 200%',
													animation: 'shine 5s ease-in-out infinite',
												}}
											/>
											<div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-black/40 to-transparent" />
										</>
									)}
								</div>
							)}

							{/* Miniaturas inferiores */}
							{displayImages.length > 1 && (
								<div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-1 z-10">
									{displayImages.map((img, idx) => (
										<button
											type="button"
											key={`thumb-${img.substring(0, 8)}-${idx + 1}`}
											className={cn(
												'w-2 h-2 rounded-full transition-all',
												activeImage === img ? 'bg-white scale-125 shadow-lg' : 'bg-white/50 hover:bg-white/80',
												tcgMode && 'outline outline-1 outline-offset-1'
											)}
											style={{ outlineColor: activeImage === img ? primaryColor : 'transparent' }}
											onClick={() => setActiveImage(img)}
											aria-label={`Ver imagen ${idx + 1}`}
										/>
									))}
								</div>
							)}
						</div>
					)}
				</Suspense>
			</div>
		</div>
	);
}

// Componente para mostrar mientras se cargan las im?genes
function ImageLoading({ backgroundColor = '#0369a1' }: { backgroundColor?: string }) {
	return (
		<div
			className="animate-pulse relative overflow-hidden w-full h-full flex items-center justify-center"
			style={{ backgroundColor: `${backgroundColor}30` }}
		>
			<ImageIcon className="w-5 h-5 opacity-20" />
		</div>
	);
}
