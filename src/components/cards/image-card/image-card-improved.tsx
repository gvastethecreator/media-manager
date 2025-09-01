import {
	CalendarIcon,
	CameraIcon,
	CheckCircle2,
	FolderIcon,
	ImageIcon,
	InfoIcon,
	StarIcon,
	ZoomInIcon,
} from 'lucide-react';
import { motion } from '@/components/ui/motion-shim';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getImageCardData, type ImageCardData } from '@/lib/api/services/images';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/format.utils';
import type { TagWithStats } from '@/types/entities/tag';

interface ImageCardProps {
	imageId: string;
	onClick?: (imageData: ImageCardData) => void;
	className?: string;
	showTags?: boolean;
	showDetails?: boolean;
	aspectRatio?: 'square' | 'auto' | 'video' | string;
	variant?: 'default' | 'minimal' | 'polaroid' | 'tcg' | 'gallery' | 'elevated';
	isSelected?: boolean;
	isHoverable?: boolean;
	showRelations?: boolean;
	priority?: boolean;
}

/**
 * Componente Card mejorado para mostrar una imagen con sus metadatos principales.
 * Incluye múltiples variantes de diseño y características avanzadas como:
 * - Optimización de imágenes con img nativo
 * - Animaciones con motion
 * - Diseño responsivo
 * - Modo oscuro integrado
 * - Variantes visuales (default, minimal, polaroid, tcg, gallery)
 * - Estado de selección visual
 */
export const ImageCardImproved = memo(function ImageCardImproved({
	imageId,
	onClick,
	className,
	showTags = true,
	showDetails = true,
	aspectRatio = 'auto',
	variant = 'default',
	isSelected = false,
	isHoverable = true,
	showRelations = false,
}: ImageCardProps) {
	const [imageData, setImageData] = useState<ImageCardData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isHovered, setIsHovered] = useState(false);

	// OPTIMIZACIÓN: Memoizar props estables para evitar re-renders
	const memoizedProps = useMemo(
		() => ({
			isTcgMode: variant === 'tcg',
			showTags,
			showDetails,
			showRelations,
			isSelected,
			isHoverable,
		}),
		[variant, showTags, showDetails, showRelations, isSelected, isHoverable]
	);

	// OPTIMIZACIÓN: Memoizar clases de aspect ratio
	const aspectRatioClass = useMemo(() => {
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
				return 'aspect-[3/2]'; // Relación predeterminada para fotos
		}
	}, [aspectRatio]);

	// OPTIMIZACIÓN: Memoizar clases específicas para cada variante
	const variantClasses = useMemo(() => {
		switch (variant) {
			case 'minimal':
				return 'border-0 shadow-none bg-transparent';
			case 'polaroid':
				return 'border-8 border-white dark:border-gray-800 bg-white dark:bg-gray-800 shadow-md p-1 rotate-1';
			case 'tcg':
				return 'border border-gray-800/20 shadow-lg bg-gradient-to-b from-gray-900 to-black text-white';
			case 'gallery':
				return 'border-0 shadow-none overflow-hidden';
			default:
				return 'border border-gray-200 dark:border-gray-800 bg-card';
		}
	}, [variant]);

	// OPTIMIZACIÓN: Memoizar datos derivados de imageData
	const derivedData = useMemo(() => {
		if (!imageData) {
			return null;
		}

		const primaryColor =
			imageData.tags && imageData.tags.length > 0 ? imageData.tags[0]?.color || '#3b82f6' : '#3b82f6';

		const dimensions = imageData.width && imageData.height ? `${imageData.width} × ${imageData.height}` : '';

		const cameraInfo =
			imageData.metadata?.camera?.make || imageData.metadata?.camera?.model
				? `${imageData.metadata.camera?.make || ''} ${imageData.metadata.camera?.model || ''}`.trim()
				: null;

		const totalRelations =
			memoizedProps.showRelations && imageData.stats
				? (imageData.stats.tagCount || 0) +
					(imageData.stats.albumCount || 0) +
					(imageData.stats.collectionCount || 0) +
					(imageData.stats.characterCount || 0) +
					(imageData.stats.placeCount || 0) +
					(imageData.stats.worldItemCount || 0) +
					(imageData.stats.noteCount || 0)
				: 0;

		return {
			primaryColor,
			dimensions,
			cameraInfo,
			totalRelations,
			imageFormat: imageData.format || 'unknown',
		};
	}, [imageData, memoizedProps.showRelations]);

	// OPTIMIZACIÓN: Carga de datos con useEffect estable
	useEffect(() => {
		const loadImageData = async () => {
			if (!imageId) {
				return;
			}

			try {
				setIsLoading(true);
				const data = await getImageCardData(imageId);
				setImageData(data);
			} catch (err) {
				console.error('Error cargando datos de imagen:', err);
				setError(err instanceof Error ? err.message : 'Error desconocido');
			} finally {
				setIsLoading(false);
			}
		};

		loadImageData();
	}, [imageId]);

	// OPTIMIZACIÓN: Handlers estables
	const handleClick = useCallback(() => {
		if (onClick && imageData) {
			onClick(imageData);
		}
	}, [onClick, imageData]);

	const handleHoverStart = useCallback(() => setIsHovered(true), []);
	const handleHoverEnd = useCallback(() => setIsHovered(false), []);

	// Renderizar estado de carga
	if (isLoading) {
		return (
			<div
				className={cn(
					'relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800',
					aspectRatioClass,
					variantClasses,
					className
				)}
			>
				<Skeleton className="h-full w-full" />
			</div>
		);
	}

	// Renderizar estado de error
	if (error || !imageData) {
		return (
			<div
				className={cn(
					'relative flex items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900',
					aspectRatioClass,
					variantClasses,
					className
				)}
			>
				<div className="p-4 text-center">
					<ImageIcon className="mx-auto mb-2 h-10 w-10 text-gray-400" />
					<p className="text-gray-500 text-sm dark:text-gray-400">
						{error?.toString() || 'No se pudo cargar la imagen'}
					</p>
				</div>
			</div>
		);
	}

	// Obtener datos derivados
	if (!derivedData) {
		return null;
	}
	const { primaryColor, dimensions, cameraInfo, totalRelations, imageFormat } = derivedData;

	// Contenido de la tarjeta
	const cardContent = (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				'group relative overflow-hidden rounded-lg transition-all',
				aspectRatioClass,
				variantClasses,
				isSelected && 'shadow-md ring-2 ring-primary',
				memoizedProps.isHoverable && 'duration-300 hover:scale-[1.02] hover:shadow-lg',
				onClick && 'cursor-pointer',
				className
			)}
			initial={{ opacity: 0, y: 10 }}
			onClick={handleClick}
			onHoverEnd={handleHoverEnd}
			onHoverStart={handleHoverStart}
			style={
				memoizedProps.isTcgMode
					? { boxShadow: `0 8px 15px -3px ${primaryColor}20, 0 4px 6px -4px ${primaryColor}30` }
					: {}
			}
			transition={{ duration: 0.3 }}
		>
			{/* Imagen principal */}
			<div className="relative h-0 w-full pb-[75%]">
				{imageData.thumbnail ? (
					<img
						alt={imageData.name || 'Imagen'}
						className="h-full w-full object-cover"
						loading="lazy"
						src={imageData.thumbnail}
					/>
				) : (
					<div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
						<ImageIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
					</div>
				)}

				{/* Overlay en hover */}
				<div
					className={cn(
						'absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300',
						isHovered || variant === 'gallery' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
					)}
				>
					{/* Información en overlay */}
					<div className="absolute right-0 bottom-0 left-0 p-3">
						<h3 className="line-clamp-1 font-medium text-sm text-white sm:text-base">
							{imageData.name || 'Sin título'}
						</h3>

						{memoizedProps.showDetails && (
							<div className="mt-1 flex flex-wrap gap-2">
								{dimensions && <p className="text-white/80 text-xs">{dimensions}</p>}
								{imageFormat && imageFormat !== 'unknown' && (
									<p className="text-white/80 text-xs uppercase">{imageFormat}</p>
								)}
							</div>
						)}
					</div>

					{/* Acciones en hover */}
					<div className="absolute top-2 right-2 flex gap-1">
						<motion.button
							aria-label="Ampliar imagen"
							className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-primary/90"
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.95 }}
						>
							<ZoomInIcon className="h-4 w-4" />
						</motion.button>
					</div>
				</div>

				{/* Indicador de selección */}
				{isSelected && (
					<div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-md">
						<CheckCircle2 className="h-4 w-4" />
					</div>
				)}

				{/* Indicador de favoritos */}
				{imageData.isFavorite && (
					<div className={cn('absolute top-2 left-2 flex items-center justify-center', isSelected && 'left-9')}>
						<StarIcon className="h-5 w-5 fill-yellow-400 text-yellow-400" />
					</div>
				)}
			</div>

			{/* Contenido bajo la imagen (excepto para variante gallery) */}
			{variant !== 'gallery' && memoizedProps.showDetails && (
				<div className="p-3">
					{/* Título e información principal */}
					<div className="mb-2 flex items-start justify-between">
						<h3 className={cn('line-clamp-1 font-medium', memoizedProps.isTcgMode ? 'text-white' : 'text-foreground')}>
							{imageData.name || 'Sin título'}
						</h3>

						{imageData.isFavorite && !memoizedProps.isTcgMode && (
							<StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
						)}
					</div>

					{/* Información técnica */}
					<div className="space-y-1">
						{cameraInfo && (
							<div className="flex items-center gap-1 text-muted-foreground text-xs">
								<CameraIcon className="h-3 w-3" />
								<span className="truncate">{cameraInfo}</span>
							</div>
						)}

						{imageData.folderId && (
							<div className="flex items-center gap-1 text-muted-foreground text-xs">
								<FolderIcon className="h-3 w-3" />
								<span className="truncate">{'Carpeta'}</span>
							</div>
						)}

						{imageData.createdAt && (
							<div className="flex items-center gap-1 text-muted-foreground text-xs">
								<CalendarIcon className="h-3 w-3" />
								<span>{formatDate(imageData.createdAt)}</span>
							</div>
						)}
					</div>

					{/* Etiquetas */}
					{memoizedProps.showTags && imageData.tags && imageData.tags.length > 0 && (
						<div className="mt-3 flex flex-wrap gap-1">
							{imageData.tags.slice(0, 3).map((tag: TagWithStats) => (
								<Badge
									className="h-5 max-w-[100px] truncate px-1.5 text-[10px]"
									key={tag.id}
									style={{
										borderColor: `${tag.color}50`,
										backgroundColor: memoizedProps.isTcgMode ? `${tag.color}20` : undefined,
									}}
									variant="outline"
								>
									{tag.name}
								</Badge>
							))}
							{imageData.tags.length > 3 && (
								<Badge className="h-5 px-1.5 text-[10px]" variant="outline">
									+{imageData.tags.length - 3}
								</Badge>
							)}
						</div>
					)}

					{/* Contador de relaciones */}
					{memoizedProps.showRelations && totalRelations > 0 && (
						<div className="mt-2 flex items-center text-muted-foreground text-xs">
							<InfoIcon className="mr-1 h-3 w-3" />
							<span>{totalRelations} relaciones</span>
						</div>
					)}
				</div>
			)}

			{/* Efectos visuales para modo TCG */}
			{memoizedProps.isTcgMode && (
				<>
					{/* Brillo en hover */}
					<div
						className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
						style={{
							background: `radial-gradient(circle at 50% 50%, ${primaryColor}20 0%, transparent 70%)`,
							zIndex: 1,
						}}
					/>

					{/* Esquinas decorativas */}
					<div
						className="pointer-events-none absolute top-0 left-0 h-5 w-5 rounded-br-sm border-t border-l opacity-60"
						style={{ borderColor: `${primaryColor}80` }}
					/>
					<div
						className="pointer-events-none absolute top-0 right-0 h-5 w-5 rounded-bl-sm border-t border-r opacity-60"
						style={{ borderColor: `${primaryColor}80` }}
					/>
					<div
						className="pointer-events-none absolute bottom-0 left-0 h-5 w-5 rounded-tr-sm border-b border-l opacity-60"
						style={{ borderColor: `${primaryColor}80` }}
					/>
					<div
						className="pointer-events-none absolute right-0 bottom-0 h-5 w-5 rounded-tl-sm border-r border-b opacity-60"
						style={{ borderColor: `${primaryColor}80` }}
					/>
				</>
			)}
		</motion.div>
	);

	// Si no hay onClick, envolver en un Link para navegación
	if (!onClick) {
		return (
			<Link className="block h-full" to={`/images/${imageData.id}`}>
				{cardContent}
			</Link>
		);
	}

	// Si no, devolver solo el contenido
	return cardContent;
});
