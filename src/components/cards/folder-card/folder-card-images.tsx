'use client';

import { cn } from '@/lib/utils';

export interface FolderCardImagesProps {
	featuredImage?: string | null;
	recentImages?: string[] | null;
	primaryColor: string;
	secondaryColor?: string;
	tcgMode?: boolean;
}

/**
 * Componente para mostrar las imágenes destacadas y recientes de una carpeta.
 * En modo TCG, se muestra con bordes y efectos visuales similares a cartas coleccionables.
 */
export function FolderCardImages({
	featuredImage,
	recentImages = [],
	primaryColor,
	secondaryColor = primaryColor,
	tcgMode = false,
}: FolderCardImagesProps) {
	// Si hay una imagen destacada, la mostramos como principal
	if (featuredImage) {
		return (
			<div className={cn('relative w-full h-40 overflow-hidden', tcgMode ? 'border-b border-white/10' : '')}>
				{/* Imagen principal */}
                                <img
                                        src={featuredImage}
                                        alt="Imagen destacada"
                                        className="object-cover w-full h-full"
                                />

				{/* Overlay para TCG mode */}
				{tcgMode && (
					<div
						className="absolute inset-0 mix-blend-overlay"
						style={{
							background: `linear-gradient(135deg, ${primaryColor}40, transparent 80%)`,
							boxShadow: `inset 0 0 30px ${primaryColor}30`,
						}}
					/>
				)}

				{/* Marco decorativo para TCG mode */}
				{tcgMode && (
					<>
						{/* Esquinas decorativas */}
						<div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/30" />
						<div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/30" />
						<div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/30" />
						<div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/30" />

						{/* Insignia de rareza */}
						<div
							className="absolute top-2 right-2 w-4 h-4 rounded-full"
							style={{ background: `radial-gradient(circle, ${primaryColor}, ${secondaryColor})` }}
						/>
					</>
				)}
			</div>
		);
	}

	// Si no hay imagen destacada pero hay imágenes recientes, mostrar una cuadrícula de 4
	if (recentImages && recentImages.length > 0) {
		const images = recentImages.slice(0, 4);

		return (
			<div
				className={cn(
					'relative w-full h-40 grid grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden',
					tcgMode ? 'border-b border-white/10 p-0.5 bg-black/20' : ''
				)}
			>
				{images.map((image, index) => (
					<div key={`recent-image-${generateImageKey(image, index)}`} className="relative overflow-hidden">
                                                <img
                                                        src={image}
                                                        alt={`Imagen reciente ${index + 1}`}
                                                        className="object-cover w-full h-full"
                                                />

						{/* Overlay para TCG mode */}
						{tcgMode && (
							<div
								className="absolute inset-0 mix-blend-overlay"
								style={{
									background: `linear-gradient(135deg, ${index % 2 === 0 ? primaryColor : secondaryColor}30, transparent 80%)`,
									boxShadow: `inset 0 0 20px ${primaryColor}20`,
								}}
							/>
						)}
					</div>
				))}

				{/* Decoraciones para TCG mode */}
				{tcgMode && (
					<div className="absolute inset-0 pointer-events-none">
						{/* Bordes externos decorativos */}
						<div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/30" />
						<div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/30" />
						<div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/30" />
						<div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/30" />

						{/* Marcador de elementos */}
						<div
							className="absolute top-1 right-1 text-xs font-bold px-1 rounded-sm"
							style={{
								background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
								color: 'white',
								textShadow: '0 1px 2px rgba(0,0,0,0.5)',
							}}
						>
							x{images.length}
						</div>
					</div>
				)}
			</div>
		);
	}

	// Si no hay imágenes, mostrar un placeholder
	return (
		<div
			className={cn(
				'relative w-full h-40 flex items-center justify-center',
				tcgMode ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-b border-white/10' : 'bg-muted'
			)}
			style={
				tcgMode
					? {
							backgroundImage: `radial-gradient(circle at 70% 30%, ${primaryColor}30 0%, transparent 50%)`,
						}
					: {}
			}
		>
			<div className={cn('text-lg font-medium text-center p-4', tcgMode ? 'text-white/70' : 'text-muted-foreground')}>
				Sin imágenes
			</div>

			{/* Decoraciones TCG para el placeholder */}
			{tcgMode && (
				<>
					<div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/20" />
					<div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/20" />
					<div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/20" />
					<div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/20" />

					<div
						className="absolute bottom-2 right-2 w-8 h-8 rounded-full opacity-30"
						style={{
							background: `conic-gradient(${primaryColor}, ${secondaryColor}, ${primaryColor})`,
						}}
					/>
				</>
			)}
		</div>
	);
}

/**
 * Genera una clave única para cada imagen basada en la URL y posición
 */
function generateImageKey(imageUrl: string, index: number): string {
	const urlSegment = imageUrl.split('/').pop() || '';
	return `${urlSegment.substring(0, 8)}-${index}`;
}
