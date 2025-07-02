import { cn } from '@/lib/utils';
import { TagRarity } from '@/store/entities/tag/types';
import { ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTagThumbnails } from './tag-server-actions';

interface TagCardImagesProps {
	tagId: string;
	primaryColor: string;
	secondaryColor: string;
	rarity?: TagRarity;
	featuredImage?: { id: string; thumbnailUrl: string; url?: string } | null;
	tcgMode?: boolean;
	compact?: boolean;
}

interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
}

/**
 * Componente para mostrar las imágenes recientes asociadas a una etiqueta
 * Similar a la ilustración de una carta TCG pero con una disposición especial para etiquetas
 */
export function TagCardImages({
	tagId,
	primaryColor,
	secondaryColor,
	rarity = TagRarity.COMMON,
	featuredImage = null,
	tcgMode = true,
	compact = false,
}: TagCardImagesProps) {
	// Estado para almacenar las imágenes
	const [images, setImages] = useState<ThumbnailImage[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Conseguir un factor de brillo basado en la rareza para efectos visuales
	const rarityBrightnessMap = {
		[TagRarity.COMMON]: 1,
		[TagRarity.UNCOMMON]: 1.2,
		[TagRarity.RARE]: 1.5,
		[TagRarity.VERY_RARE]: 1.8,
		[TagRarity.LEGENDARY]: 2.2,
	} as const;

	const rarityBrightness: number = rarityBrightnessMap[rarity as keyof typeof rarityBrightnessMap] || 1;

	// Cargar imágenes al montar el componente
	useEffect(() => {
		async function loadImages() {
			try {
				setLoading(true);
				// Si hay una imagen destacada, usarla primero
				const fetchedImages = await getTagThumbnails(tagId);

				// Si hay una imagen destacada, asegurarse de que aparezca primero
				if (featuredImage && fetchedImages.length > 0) {
					const filteredImages = fetchedImages.filter((img) => img.id !== featuredImage.id);
					setImages([featuredImage as ThumbnailImage, ...filteredImages]);
				} else {
					setImages(fetchedImages);
				}

				setError(null);
			} catch (err) {
				console.error('Error loading tag images:', err);
				setError('No se pudieron cargar las imágenes');
			} finally {
				setLoading(false);
			}
		}

		loadImages();
	}, [tagId, featuredImage]);

	// Elemento placeholder para cuando no hay imágenes
	const renderPlaceholder = () => (
		<div className="flex flex-col items-center justify-center h-full">
			<ImageIcon className="text-muted-foreground mb-2" style={{ color: `${primaryColor}70` }} />
			<p className="text-xs text-muted-foreground text-center" style={{ color: `${primaryColor}90` }}>
				{error || 'No hay imágenes con esta etiqueta'}
			</p>
		</div>
	);

	// Renderizar loading
	if (loading) {
		return (
			<div
				className={cn('flex-shrink-0 flex items-center justify-center bg-black/5', compact ? 'h-[120px]' : 'h-[140px]')}
				style={{
					borderBottom: `1px solid ${primaryColor}20`,
					background: tcgMode ? `linear-gradient(90deg, ${primaryColor}10, ${secondaryColor}10)` : `${primaryColor}05`,
				}}
			>
				<div
					className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
					style={{ borderColor: `${primaryColor}80 transparent ${primaryColor}30 ${primaryColor}30` }}
				/>
			</div>
		);
	}

	// Si no hay imágenes o hay error, mostrar placeholder
	if (error || images.length === 0) {
		return (
			<div
				className={cn('flex-shrink-0 bg-black/5', compact ? 'h-[120px]' : 'h-[140px]')}
				style={{
					borderBottom: `1px solid ${primaryColor}20`,
					background: tcgMode ? `linear-gradient(90deg, ${primaryColor}10, ${secondaryColor}10)` : `${primaryColor}05`,
				}}
			>
				{renderPlaceholder()}
			</div>
		);
	}

	// Renderizar mosaico de imágenes - diseño especial para etiquetas
	return (
		<div
			className={cn('flex-shrink-0 overflow-hidden relative', compact ? 'h-[120px]' : 'h-[140px]')}
			style={{
				borderBottom: `1px solid ${primaryColor}20`,
			}}
		>
			{/* Fondo estilizado */}
			<div
				className="absolute inset-0 -z-10"
				style={{
					background: tcgMode ? `linear-gradient(90deg, ${primaryColor}10, ${secondaryColor}10)` : `${primaryColor}05`,
				}}
			/>

			{/* Esquinas TCG decorativas para imágenes */}
			{tcgMode && (
				<div className="absolute inset-0 pointer-events-none z-10">
					<div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20" />
					<div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/20" />
					<div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/20" />
					<div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/20" />
				</div>
			)}

			{/* Grid de imágenes con efecto de mosaico etiquetado */}
			<div className="grid grid-cols-3 grid-rows-2 gap-px h-full">
				{images.slice(0, 6).map((image, index) => (
					<div key={image.id} className="relative overflow-hidden bg-black/20">
						{/* Imagen */}
						<img
							src={image.thumbnailUrl}
							alt={image.name || 'Imagen etiquetada'}
							className="w-full h-full object-cover"
							loading="lazy"
							style={{
								opacity: tcgMode ? 0.9 : 1,
								// Efectos específicos de etiqueta: borde sutil y tratamiento de imágen
								filter: tcgMode ? `contrast(1.05) ${index % 2 === 0 ? 'saturate(1.1)' : 'saturate(0.9)'}` : 'none',
							}}
						/>

						{/* Corner tag emblem en cada imagen */}
						{tcgMode && (
							<div
								className="absolute top-0 left-0 w-[20px] h-[20px] opacity-70"
								style={{
									background: primaryColor,
									clipPath: 'polygon(0 0, 100% 0, 0 100%)',
								}}
							/>
						)}

						{/* Overlay sutil con efecto de brillo basado en rareza */}
						<div
							className="absolute inset-0 pointer-events-none"
							style={{
								boxShadow: `inset 0 0 0 1px ${primaryColor}30`,
								background: tcgMode ? `linear-gradient(135deg, ${primaryColor}20, transparent)` : 'none',
								filter: tcgMode && rarity !== TagRarity.COMMON ? `brightness(${rarityBrightness})` : 'none',
							}}
						/>

						{/* Destacar la primera imagen si es la destacada */}
						{index === 0 && featuredImage && featuredImage.id === image.id && tcgMode && (
							<div
								className="absolute bottom-0 right-0 w-[15px] h-[15px]"
								style={{
									background: primaryColor,
									clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
								}}
							/>
						)}
					</div>
				))}
			</div>

			{/* Indicador de total */}
			{tcgMode && images.length > 6 && (
				<div
					className="absolute bottom-1 right-1 text-xs px-1.5 py-0.5 rounded-sm backdrop-blur-sm z-10"
					style={{
						background: `${primaryColor}80`,
						color: 'white',
						boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
					}}
				>
					+{images.length - 6}
				</div>
			)}
		</div>
	);
}
