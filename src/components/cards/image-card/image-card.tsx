import { CalendarIcon, CameraIcon, FolderIcon, HashIcon, Image as ImageIcon, Info, Star, TagIcon } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useImage } from '@/lib/api/images';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/format.utils';
import { useImageResources } from '@/store/image-resources.store';
import type { ImageWithStats } from '@/types/entities/image';
import type { TagWithStats } from '@/types/entities/tag';

interface ImageCardProps {
	imageId: string;
	onClick?: (imageData?: ImageWithStats) => void;
	onDoubleClick?: () => void;
	className?: string;
	showTags?: boolean;
	showDetails?: boolean;
	aspectRatio?: 'square' | 'auto' | 'video' | string;
	variant?: 'default' | 'minimal' | 'polaroid' | 'tcg';
	tcgMode?: boolean;
	showRelations?: boolean;
}

/**
 * Card para mostrar una imagen con sus metadatos principales.
 * Incluye opción de estilo TCG (Trading Card Game) para una visualización
 * más atractiva e inmersiva.
 */
export const ImageCard = memo(function ImageCard({
	imageId,
	onClick,
	onDoubleClick,
	className,
	showTags = true,
	showDetails = true,
	aspectRatio = 'auto',
	variant = 'default',
	tcgMode = false,
	showRelations = false,
}: ImageCardProps) {
	const { data: imageData, isLoading, error } = useImage(imageId);
	const [isHovered, setIsHovered] = useState(false);
	const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
	const [thumbnailLoading, setThumbnailLoading] = useState(false);

	// Hook para manejar recursos de imagen (thumbnails)
	const { getThumbnail, isLoading: isResourceLoading } = useImageResources();

	// Si variant es tcg, forzar tcgMode a true
	if (variant === 'tcg') {
		tcgMode = true;
	}

	// Cargar thumbnail usando useImageResources
	useEffect(() => {
		const loadThumbnail = async () => {
			if (!imageId || thumbnailUrl) return;

			setThumbnailLoading(true);
			try {
				const url = await getThumbnail(imageId);
				if (url) {
					setThumbnailUrl(url);
				}
			} catch (error) {
				console.error('Error cargando thumbnail:', error);
			} finally {
				setThumbnailLoading(false);
			}
		};

		loadThumbnail();
	}, [imageId, getThumbnail, thumbnailUrl]);

	const handleClick = () => {
		if (onClick && imageData) {
			onClick(imageData);
		}
	};

	const handleDoubleClick = () => {
		if (onDoubleClick) {
			onDoubleClick();
		}
	};

	// Funciones de utilidad para clases CSS
	const getAspectRatioClass = () => {
		switch (aspectRatio) {
			case 'square':
				return 'aspect-square';
			case 'video':
				return 'aspect-video';
			case 'auto':
				return '';
			default:
				if (typeof aspectRatio === 'string' && aspectRatio.includes('/')) {
					return `aspect-[${aspectRatio}]`;
				}
				return 'aspect-[3/2]';
		}
	};

	const getVariantClasses = () => {
		switch (variant) {
			case 'minimal':
				return 'border-0 shadow-none bg-transparent';
			case 'polaroid':
				return 'border-8 border-white dark:border-gray-800 bg-white dark:bg-gray-800 shadow-md p-1 rotate-1';
			case 'tcg':
				return 'border border-gray-800/20 shadow-lg bg-gradient-to-b from-gray-900 to-black text-white';
			default:
				return 'border border-gray-200 dark:border-gray-800 bg-card';
		}
	};

	// Determinar color primario para efectos TCG
    const getPrimaryColor = () => {
        // Usar el color de la primera etiqueta si hay etiquetas
        if (imageData?.tags && imageData.tags.length > 0) {
            return imageData.tags[0].color || '#3b82f6';
        }
        // Color predeterminado
        return '#3b82f6';
    };

	// Renderizar cargando
	if (isLoading) {
		return (
			<div
				className={cn(
					'relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900',
					getAspectRatioClass(),
					getVariantClasses(),
					className
				)}
			>
				<Skeleton className="h-full w-full" />
			</div>
		);
	}

	// Renderizar error
	if (error || !imageData) {
		return (
			<div
				className={cn(
					'relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center',
					getAspectRatioClass(),
					getVariantClasses(),
					className
				)}
			>
				<div className="text-center p-4">
					<ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
					<p className="text-sm text-gray-500">{error?.message || 'No se pudo cargar la imagen'}</p>
				</div>
			</div>
		);
	}

	// Determinar la URL del thumbnail a usar
	const displayThumbnailUrl = thumbnailUrl || imageData.thumbnailUrl || `/api/images/${imageData.id}/thumbnail`;
	const shouldShowThumbnailLoading = thumbnailLoading || isResourceLoading(imageId);

	// Obtener formato de imagen de los metadatos
	const _getImageFormat = () => {
		try {
			const metadata = imageData.metadata ? JSON.parse(imageData.metadata) : null;
			return metadata?.format || 'unknown';
		} catch {
			return 'unknown';
		}
	};

	// Obtener información de cámara si está disponible
	const getCameraInfo = () => {
		try {
			const metadata = imageData.metadata ? JSON.parse(imageData.metadata) : null;
			if (metadata?.camera?.make || metadata?.camera?.model) {
				return `${metadata.camera.make || ''} ${metadata.camera.model || ''}`.trim();
			}
		} catch {
			// Ignore parsing errors
		}
		return null;
	};

	const primaryColor = getPrimaryColor();

	// Calcular contador total de relaciones
	const getTotalRelationsCount = () => {
		if (!imageData.stats) return 0;
		return (
			(imageData.stats.tagCount || 0) +
			(imageData.stats.albumCount || 0) +
			(imageData.stats.collectionCount || 0) +
			(imageData.stats.characterCount || 0) +
			(imageData.stats.placeCount || 0) +
			(imageData.stats.worldItemCount || 0) +
			(imageData.stats.noteCount || 0)
		);
	};

	const getHumanReadableDimensions = () => {
		if (!imageData?.width || !imageData?.height) return '';
		return `${imageData.width} × ${imageData.height}`;
	};

	const cardContent = (
		<button
			type="button"
			className={cn(
				'group relative overflow-hidden rounded-lg transition-all duration-300 w-full h-full border-0 bg-transparent p-0',
				getAspectRatioClass(),
				getVariantClasses(),
				isHovered ? 'shadow-lg scale-[1.02]' : 'hover:shadow-lg hover:scale-[1.02]',
				(onClick || onDoubleClick) && 'cursor-pointer'
			)}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			disabled={!onClick && !onDoubleClick}
		>
			{/* Elementos decorativos TCG */}
			{tcgMode && (
				<>
					{/* Esquinas decorativas en estilo TCG */}
					<div
						className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 rounded-tl-md z-20 pointer-events-none"
						style={{ borderColor: `${primaryColor}70` }}
					/>
					<div
						className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 rounded-tr-md z-20 pointer-events-none"
						style={{ borderColor: `${primaryColor}70` }}
					/>
					<div
						className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 rounded-bl-md z-20 pointer-events-none"
						style={{ borderColor: `${primaryColor}70` }}
					/>
					<div
						className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 rounded-br-md z-20 pointer-events-none"
						style={{ borderColor: `${primaryColor}70` }}
					/>

					{/* Borde brillante al hacer hover */}
					<div
						className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-10"
						style={{
							boxShadow: `inset 0 0 0 1px ${primaryColor}50, 0 0 15px ${primaryColor}30`,
						}}
					/>

					{/* Barra superior TCG */}
					<div
						className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r z-20"
						style={{
							background: `linear-gradient(to right, ${primaryColor}90, ${primaryColor}30)`,
						}}
					>
						<div className="flex items-center justify-between px-2 h-full">
							<span className="text-xs font-medium text-white truncate max-w-[70%]">
								{imageData.name || 'Sin título'}
							</span>
							<div className="flex items-center gap-1">
								{(() => {
									try {
										const metadata = imageData.metadata ? JSON.parse(imageData.metadata) : null;
										return metadata?.format ? (
											<span className="px-1.5 py-0.5 text-[10px] bg-black/30 rounded uppercase text-white/90">
												{metadata.format}
											</span>
										) : null;
									} catch {
										return null;
									}
								})()}
							</div>
						</div>
					</div>
				</>
			)}

			{/* Imagen principal */}
			<div className="relative w-full h-full">
				{/* Mostrar skeleton mientras carga el thumbnail */}
				{shouldShowThumbnailLoading && (
					<div className={cn('absolute inset-0 z-10', tcgMode && 'pt-8')}>
						<Skeleton className="w-full h-full" />
					</div>
				)}

				{displayThumbnailUrl ? (
					<img
						src={displayThumbnailUrl}
						alt={imageData.name || 'Imagen'}
						className={cn(
							'w-full h-full object-cover',
							tcgMode && 'pt-8', // Espacio para la barra superior en modo TCG
							shouldShowThumbnailLoading && 'opacity-0' // Ocultar mientras carga
						)}
						loading="lazy"
						onLoad={() => {
							// Ocultar skeleton cuando la imagen se carga
							setThumbnailLoading(false);
						}}
						onError={(e) => {
							// Fallback si el thumbnail falla
							console.warn(`Error cargando thumbnail para ${imageId}:`, e);
							const imgElement = e.currentTarget as HTMLImageElement;
							imgElement.style.display = 'none';
							const parent = imgElement.parentElement;
							if (parent) {
								parent.innerHTML = `
									<div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 ${tcgMode ? 'pt-8' : ''}">
										<svg class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
									</div>
								`;
							}
							setThumbnailLoading(false);
						}}
					/>
				) : (
					<div
						className={cn(
							'w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900',
							tcgMode && 'pt-8' // Espacio para la barra superior en modo TCG
						)}
					>
						<ImageIcon className="h-10 w-10 text-gray-400" />
					</div>
				)}

				{/* Overlay con información (visible al hacer hover o siempre en modo TCG) */}
				{showDetails && (
					<div
						className={cn(
							'absolute inset-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity',
							tcgMode ? 'opacity-70 group-hover:opacity-90' : isHovered ? 'opacity-100' : 'opacity-0'
						)}
					>
						<div className="absolute bottom-0 left-0 right-0 p-3">
							{/* Nombre y dimensiones */}
							{!tcgMode && (
								<h3 className="text-white font-medium line-clamp-1 text-sm mb-1">
									{imageData.name || 'Sin título'}
									{imageData.isFavorite && (
										<Star className="w-3.5 h-3.5 inline ml-1 -mt-1 text-yellow-300 fill-yellow-300" />
									)}
								</h3>
							)}

							{/* Información técnica */}
							<div className="flex flex-col gap-1 text-xs text-gray-200">
								{/* Dimensiones */}
								<div className="flex items-center gap-1.5">
									<Info className="h-3 w-3" />
									<span>{getHumanReadableDimensions()}</span>
								</div>

								{/* Fecha de creación */}
								{imageData.createdAt && (
									<div className="flex items-center gap-1.5">
										<CalendarIcon className="h-3 w-3" />
										<span>{formatDate(imageData.createdAt)}</span>
									</div>
								)}

								{/* Cámara (si está disponible) */}
								{getCameraInfo() && (
									<div className="flex items-center gap-1.5">
										<CameraIcon className="h-3 w-3" />
										<span className="truncate max-w-[180px]">{getCameraInfo()}</span>
									</div>
								)}

								{/* Formato de la imagen y tamaño */}
								{tcgMode && (
									<div className="mt-1 flex flex-wrap gap-1.5">
										{(() => {
											try {
												const metadata = imageData.metadata ? JSON.parse(imageData.metadata) : null;
												return metadata?.format ? (
													<Badge variant="outline" className="bg-black/40 text-[10px] border-none py-0 px-1.5 h-4">
														{metadata.format.toUpperCase()}
													</Badge>
												) : null;
											} catch {
												return null;
											}
										})()}
										{imageData.size && (
											<Badge variant="outline" className="bg-black/40 text-[10px] border-none py-0 px-1.5 h-4">
												{Math.round(imageData.size / 1024)} KB
											</Badge>
										)}
										{imageData.hash && (
											<Badge
												variant="outline"
												className="bg-black/40 text-[10px] border-none py-0 px-1.5 h-4 truncate max-w-[60px]"
											>
												<HashIcon className="h-2 w-2 mr-1" />
												{imageData.hash.substring(0, 6)}
											</Badge>
										)}
									</div>
								)}
							</div>

							{/* Relaciones */}
							{showRelations && (tcgMode || isHovered) && (
								<div className="mt-2 flex items-center gap-2">
									{imageData.stats?.tagCount && imageData.stats.tagCount > 0 && (
										<Badge variant="secondary" className="bg-black/40 border-none gap-1">
											<TagIcon className="h-3 w-3" />
											{imageData.stats.tagCount}
										</Badge>
									)}
									{imageData.stats?.albumCount && imageData.stats.albumCount > 0 && (
										<Badge variant="secondary" className="bg-black/40 border-none gap-1">
											<FolderIcon className="h-3 w-3" />
											{imageData.stats.albumCount}
										</Badge>
									)}
									{getTotalRelationsCount() > 0 && (
										<Badge variant="secondary" className="bg-black/40 border-none px-1.5">
											{getTotalRelationsCount()}
										</Badge>
									)}
								</div>
							)}
						</div>
					</div>
				)}

				{/* Estilo TCG para la imagen */}
				{tcgMode && (
					<div className="absolute inset-0 pointer-events-none">
						{/* Efecto viñeta */}
						<div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 opacity-60" />

						{/* Brillo superior */}
						<div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent h-[20%] opacity-60" />

						{/* Información TCG en parte inferior (siempre visible) */}
						<div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent pt-2">
							{/* Etiquetas en modo TCG (visible siempre) */}
							{showTags && imageData.tags && imageData.tags.length > 0 && (
								<div className="px-3">
									<div className="flex flex-wrap gap-1 mb-1">
										{imageData.tags?.slice(0, 3).map((tag: TagWithStats) => (
											<Badge
												key={tag.id}
												variant="outline"
												className="py-0 h-4 text-[10px]"
												style={{
													backgroundColor: `${tag.color}20`,
													borderColor: `${tag.color}40`,
													color: `${tag.color}`,
												}}
											>
												{tag.name}
											</Badge>
										))}
										{imageData.tags && imageData.tags.length > 3 && (
											<Badge variant="outline" className="py-0 h-4 text-[10px] bg-gray-800/60 border-gray-700/60">
												+{imageData.tags ? imageData.tags.length - 3 : 0}
											</Badge>
										)}
									</div>
								</div>
							)}
						</div>

						{/* Indicador de favorito */}
						{imageData.isFavorite && (
							<div className="absolute top-9 right-2 transform rotate-12">
								<Star className="h-5 w-5 text-yellow-300 fill-yellow-300 drop-shadow-md" />
							</div>
						)}
					</div>
				)}
			</div>

			{/* Etiquetas estándar (visible al hacer hover) */}
			{showTags && imageData.tags && imageData.tags.length > 0 && !tcgMode && (
				<div
					className={cn(
						'absolute left-0 right-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-black/70 to-transparent',
						isHovered ? 'opacity-100' : 'opacity-0',
						'transition-opacity duration-300'
					)}
				>
					<div className="flex flex-wrap gap-1">
						{imageData.tags?.slice(0, 5).map((tag: TagWithStats) => (
							<Badge
								key={tag.id}
								variant="outline"
								className="py-0 h-5 text-[10px]"
								style={{
									backgroundColor: `${tag.color}30`,
									borderColor: `${tag.color}40`,
									color: `${tag.color}`,
								}}
							>
								{tag.name}
							</Badge>
						))}
						{imageData.tags && imageData.tags.length > 5 && (
							<Badge variant="outline" className="py-0 h-5 text-[10px] bg-gray-800/60 border-gray-700/60">
								+{imageData.tags ? imageData.tags.length - 5 : 0}
							</Badge>
						)}
					</div>
				</div>
			)}
		</button>
	);

	// Si hay un onClick o onDoubleClick, devolver directamente el contenido
	if (onClick || onDoubleClick) {
		return cardContent;
	}

	// Si no hay onClick, envolver en un Link (si route es proporcionado)
	return (
		<div className={className}>
			<Link to={`/images/${imageId}`}>{cardContent}</Link>
		</div>
	);
});
