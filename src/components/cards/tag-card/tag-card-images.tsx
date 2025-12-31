import { ImageIcon } from 'lucide-react';
import { useTagThumbnails } from '@/lib/api/tags';
import { cn } from '@/lib/utils';
import { TagRarity } from '@/store/entities/tag/types';

// Componente para placeholder cuando no hay imágenes
function ImagePlaceholder({ primaryColor, error }: { primaryColor: string; error?: Error | null }) {
	return (
		<div className="flex h-full flex-col items-center justify-center">
			<ImageIcon className="mb-2 text-muted-foreground" style={{ color: `${primaryColor}70` }} />
			<p className="text-center text-muted-foreground text-xs" style={{ color: `${primaryColor}90` }}>
				{error?.message || 'No hay imágenes con esta etiqueta'}
			</p>
		</div>
	);
}

// Componente para estado de carga
function LoadingState({
	compact,
	primaryColor,
	secondaryColor,
	tcgMode,
}: {
	compact: boolean;
	primaryColor: string;
	secondaryColor: string;
	tcgMode: boolean;
}) {
	return (
		<div
			className={cn('flex flex-shrink-0 items-center justify-center bg-black/5', compact ? 'h-[120px]' : 'h-[140px]')}
			style={{
				borderBottom: `1px solid ${primaryColor}20`,
				background: tcgMode ? `linear-gradient(90deg, ${primaryColor}10, ${secondaryColor}10)` : `${primaryColor}05`,
			}}
		>
			<div
				className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
				style={{ borderColor: `${primaryColor}80 transparent ${primaryColor}30 ${primaryColor}30` }}
			/>
		</div>
	);
}

// Componente para esquinas decorativas TCG
function TCGCorners() {
	return (
		<div className="pointer-events-none absolute inset-0 z-10">
			<div className="absolute top-0 left-0 h-4 w-4 border-white/20 border-t border-l" />
			<div className="absolute top-0 right-0 h-4 w-4 border-white/20 border-t border-r" />
			<div className="absolute bottom-0 left-0 h-4 w-4 border-white/20 border-b border-l" />
			<div className="absolute right-0 bottom-0 h-4 w-4 border-white/20 border-r border-b" />
		</div>
	);
}

interface TagCardImagesProps {
	tagId: string;
	primaryColor: string;
	secondaryColor: string;
	rarity?: TagRarity;
	featuredImage?: { id: string; thumbnailUrl: string; url?: string; name?: string | null; isVideo?: boolean } | null;
	tcgMode?: boolean;
	compact?: boolean;
	images?: Array<{ id: string; name?: string | null; thumbnailUrl: string; url?: string; isVideo?: boolean }>;
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
	const { data: fetchedImages, isLoading: loading, error } = useTagThumbnails(tagId);

	// Helper function para generar efectos de filtro
	const getFilterEffects = (index: number): string => {
		if (!tcgMode) {
			return 'none';
		}

		const contrast = 'contrast(1.05)';
		const saturation = index % 2 === 0 ? 'saturate(1.1)' : 'saturate(0.9)';
		return `${contrast} ${saturation}`;
	};

	// Calcular imágenes prioritizando imagen destacada
	const computeImages = () => {
		if (!fetchedImages) {
			return [];
		}

		if (featuredImage && fetchedImages.length > 0) {
			return [featuredImage, ...fetchedImages.filter((img) => img.id !== featuredImage.id)];
		}

		return fetchedImages;
	};

	// Obtener configuración de brillo por rareza
	const getRarityBrightness = () => {
		const rarityBrightnessMap = {
			[TagRarity.COMMON]: 1,
			[TagRarity.UNCOMMON]: 1.2,
			[TagRarity.RARE]: 1.5,
			[TagRarity.VERY_RARE]: 1.8,
			[TagRarity.LEGENDARY]: 2.2,
		} as const;

		return rarityBrightnessMap[rarity as keyof typeof rarityBrightnessMap] || 1;
	};

	// Estado para almacenar las imágenes
	const images = computeImages();
	const rarityBrightness = getRarityBrightness();

	// Renderizar loading
	if (loading) {
		return (
			<LoadingState compact={compact} primaryColor={primaryColor} secondaryColor={secondaryColor} tcgMode={tcgMode} />
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
				<ImagePlaceholder error={error} primaryColor={primaryColor} />
			</div>
		);
	}

	// Renderizar mosaico de imágenes - diseño especial para etiquetas
	return (
		<div
			className={cn('relative flex-shrink-0 overflow-hidden', compact ? 'h-[120px]' : 'h-[140px]')}
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
			{tcgMode && <TCGCorners />}

			{/* Grid de imágenes con efecto de mosaico etiquetado */}
			<div className="grid h-full grid-cols-3 grid-rows-2 gap-px">
				{images.slice(0, 6).map((image, index) => (
					<div className="relative overflow-hidden bg-black/20" key={image.id}>
						{/* Imagen */}
						<img
							alt={image.name || 'Imagen etiquetada'}
							className="h-full w-full object-cover"
							loading="lazy"
							src={image.thumbnailUrl}
							style={{
								opacity: tcgMode ? 0.9 : 1,
								// Efectos específicos de etiqueta: borde sutil y tratamiento de imágen
								filter: getFilterEffects(index),
							}}
						/>

						{/* Corner tag emblem en cada imagen */}
						{tcgMode && (
							<div
								className="absolute top-0 left-0 h-[20px] w-[20px] opacity-70"
								style={{
									background: primaryColor,
									clipPath: 'polygon(0 0, 100% 0, 0 100%)',
								}}
							/>
						)}

						{/* Overlay sutil con efecto de brillo basado en rareza */}
						<div
							className="pointer-events-none absolute inset-0"
							style={{
								boxShadow: `inset 0 0 0 1px ${primaryColor}30`,
								background: tcgMode ? `linear-gradient(135deg, ${primaryColor}20, transparent)` : 'none',
								filter: tcgMode && rarity !== TagRarity.COMMON ? `brightness(${rarityBrightness})` : 'none',
							}}
						/>

						{/* Destacar la primera imagen si es la destacada */}
						{index === 0 && featuredImage && featuredImage.id === image.id && tcgMode && (
							<div
								className="absolute right-0 bottom-0 h-[15px] w-[15px]"
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
					className="absolute right-1 bottom-1 z-10 rounded-sm px-1.5 py-0.5 text-xs backdrop-blur-sm"
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
