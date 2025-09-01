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
	// Helper para decidir si usar <img> o background-image
	const isDataUrl = (src?: string | null) => (src ? src.startsWith('data:') : false);
	const isLargeDataUrl = (src?: string | null) => (isDataUrl(src) ? (src?.length || 0) > 200_000 : false);

	// Si hay una imagen destacada, la mostramos como principal
	if (featuredImage) {
		return (
			<div
				className={cn('relative h-40 w-full overflow-hidden', tcgMode ? 'border-white/10 border-b' : '')}
				style={
					isLargeDataUrl(featuredImage)
						? { backgroundImage: `url(${featuredImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
						: undefined
				}
			>
				{/* Imagen principal */}
				{!isLargeDataUrl(featuredImage) && (
					<img
						alt="Imagen destacada"
						className="h-full w-full object-cover"
						onError={(e) => {
							// fallback: ocultar img si falla y usar fondo liso
							const el = e.currentTarget as HTMLImageElement;
							el.style.display = 'none';
						}}
						src={featuredImage}
					/>
				)}

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
						<div className="absolute top-0 left-0 h-6 w-6 border-white/30 border-t-2 border-l-2" />
						<div className="absolute top-0 right-0 h-6 w-6 border-white/30 border-t-2 border-r-2" />
						<div className="absolute bottom-0 left-0 h-6 w-6 border-white/30 border-b-2 border-l-2" />
						<div className="absolute right-0 bottom-0 h-6 w-6 border-white/30 border-r-2 border-b-2" />

						{/* Insignia de rareza */}
						<div
							className="absolute top-2 right-2 h-4 w-4 rounded-full"
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
					'relative grid h-40 w-full grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden',
					tcgMode ? 'border-white/10 border-b bg-black/20 p-0.5' : ''
				)}
			>
				{images.map((image, index) => (
					<div
						className="relative overflow-hidden"
						key={`recent-image-${generateImageKey(image, index)}`}
						style={
							isLargeDataUrl(image)
								? { backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
								: undefined
						}
					>
						{!isLargeDataUrl(image) && (
							<img
								alt={`Imagen reciente ${index + 1}`}
								className="h-full w-full object-cover"
								onError={(e) => {
									const el = e.currentTarget as HTMLImageElement;
									el.style.display = 'none';
								}}
								src={image}
							/>
						)}

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
					<div className="pointer-events-none absolute inset-0">
						{/* Bordes externos decorativos */}
						<div className="absolute top-0 left-0 h-4 w-4 border-white/30 border-t border-l" />
						<div className="absolute top-0 right-0 h-4 w-4 border-white/30 border-t border-r" />
						<div className="absolute bottom-0 left-0 h-4 w-4 border-white/30 border-b border-l" />
						<div className="absolute right-0 bottom-0 h-4 w-4 border-white/30 border-r border-b" />

						{/* Marcador de elementos */}
						<div
							className="absolute top-1 right-1 rounded-sm px-1 font-bold text-xs"
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
				'relative flex h-40 w-full items-center justify-center',
				tcgMode ? 'border-white/10 border-b bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-muted'
			)}
			style={
				tcgMode
					? {
							backgroundImage: `radial-gradient(circle at 70% 30%, ${primaryColor}30 0%, transparent 50%)`,
						}
					: {}
			}
		>
			<div className={cn('p-4 text-center font-medium text-lg', tcgMode ? 'text-white/70' : 'text-muted-foreground')}>
				Sin imágenes
			</div>

			{/* Decoraciones TCG para el placeholder */}
			{tcgMode && (
				<>
					<div className="absolute top-0 left-0 h-6 w-6 border-white/20 border-t-2 border-l-2" />
					<div className="absolute top-0 right-0 h-6 w-6 border-white/20 border-t-2 border-r-2" />
					<div className="absolute bottom-0 left-0 h-6 w-6 border-white/20 border-b-2 border-l-2" />
					<div className="absolute right-0 bottom-0 h-6 w-6 border-white/20 border-r-2 border-b-2" />

					<div
						className="absolute right-2 bottom-2 h-8 w-8 rounded-full opacity-30"
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
