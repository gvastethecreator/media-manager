'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
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
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { type ImageCardData, getImageCardData } from './image-server-actions';

interface ImageCardProps {
	imageId: string;
	onClick?: (imageData: ImageCardData) => void;
	className?: string;
	showTags?: boolean;
	showDetails?: boolean;
	aspectRatio?: 'square' | 'auto' | 'video' | string;
	variant?: 'default' | 'minimal' | 'polaroid' | 'tcg' | 'gallery';
	isSelected?: boolean;
	isHoverable?: boolean;
	showRelations?: boolean;
	priority?: boolean;
}

/**
 * Componente Card mejorado para mostrar una imagen con sus metadatos principales.
 * Incluye múltiples variantes de diseño y características avanzadas como:
 * - Optimización de imágenes con next/image
 * - Animaciones con motion
 * - Diseño responsivo
 * - Modo oscuro integrado
 * - Variantes visuales (default, minimal, polaroid, tcg, gallery)
 * - Estado de selección visual
 */
export function ImageCardImproved({
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
	priority = false,
}: ImageCardProps) {
	const [imageData, setImageData] = useState<ImageCardData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isHovered, setIsHovered] = useState(false);

	// Determinar si estamos en modo TCG basado en la variante
	const isTcgMode = variant === 'tcg';

	useEffect(() => {
		const loadImageData = async () => {
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

		if (imageId) {
			loadImageData();
		}
	}, [imageId]);

	// Gestionar las clases de aspect ratio
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
				return 'aspect-[3/2]'; // Relación predeterminada para fotos
		}
	};

	// Formatear dimensiones para mostrar
	const getHumanReadableDimensions = () => {
		if (!imageData?.width || !imageData?.height) return '';
		return `${imageData.width} × ${imageData.height}`;
	};

	// Obtener clases específicas para cada variante
	const getVariantClasses = () => {
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
	};

	// Manejar clic en la tarjeta
	const handleClick = () => {
		if (onClick && imageData) {
			onClick(imageData);
		}
	};

	// Determinar color primario para efectos visuales
	const getPrimaryColor = () => {
		if (imageData?.tags && imageData.tags.length > 0) {
			return imageData.tags[0].color || '#3b82f6';
		}
		return '#3b82f6'; // Color predeterminado
	};

	// Renderizar estado de carga
	if (isLoading) {
		return (
			<div
				className={cn(
					'relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800',
					getAspectRatioClass(),
					getVariantClasses(),
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
					'relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center',
					getAspectRatioClass(),
					getVariantClasses(),
					className
				)}
			>
				<div className="text-center p-4">
					<ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
					<p className="text-sm text-gray-500 dark:text-gray-400">{error || 'No se pudo cargar la imagen'}</p>
				</div>
			</div>
		);
	}

	const primaryColor = getPrimaryColor();
	const imageFormat = imageData.metadata?.format || 'unknown';
	const cameraInfo =
		imageData.metadata?.camera?.make || imageData.metadata?.camera?.model
			? `${imageData.metadata.camera.make || ''} ${imageData.metadata.camera.model || ''}`.trim()
			: null;

	// Calcular total de relaciones
	const totalRelations =
		showRelations && imageData._count
			? (imageData._count.tags || 0) +
				(imageData._count.albums || 0) +
				(imageData._count.collections || 0) +
				(imageData._count.characters || 0) +
				(imageData._count.places || 0) +
				(imageData._count.worldItems || 0) +
				(imageData._count.notes || 0)
			: 0;

	// Contenido de la tarjeta
	const cardContent = (
		<motion.div
			className={cn(
				'group relative overflow-hidden rounded-lg transition-all',
				getAspectRatioClass(),
				getVariantClasses(),
				isSelected && 'ring-2 ring-primary shadow-md',
				isHoverable && 'hover:shadow-lg hover:scale-[1.02] duration-300',
				onClick && 'cursor-pointer',
				className
			)}
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
			onClick={handleClick}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			style={isTcgMode ? { boxShadow: `0 8px 15px -3px ${primaryColor}20, 0 4px 6px -4px ${primaryColor}30` } : {}}
		>
			{/* Imagen principal */}
			<div className="relative w-full h-0 pb-[75%]">
				{imageData.thumbnailUrl ? (
					<Image
						src={imageData.thumbnailUrl}
						alt={imageData.title || 'Imagen'}
						fill
						sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
						className="object-cover rounded-t-lg"
						priority={priority}
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
					<div className="absolute bottom-0 left-0 right-0 p-3">
						<h3 className="text-white font-medium line-clamp-1 text-sm sm:text-base">
							{imageData.title || 'Sin título'}
						</h3>

						{showDetails && (
							<div className="flex flex-wrap gap-2 mt-1">
								{getHumanReadableDimensions() && (
									<p className="text-xs text-white/80">{getHumanReadableDimensions()}</p>
								)}
								{imageFormat && imageFormat !== 'unknown' && (
									<p className="text-xs text-white/80 uppercase">{imageFormat}</p>
								)}
							</div>
						)}
					</div>

					{/* Acciones en hover */}
					<div className="absolute top-2 right-2 flex gap-1">
						<motion.button
							className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-primary/90"
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.95 }}
							aria-label="Ampliar imagen"
						>
							<ZoomInIcon className="w-4 h-4" />
						</motion.button>
					</div>
				</div>

				{/* Indicador de selección */}
				{isSelected && (
					<div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
						<CheckCircle2 className="w-4 h-4" />
					</div>
				)}

				{/* Indicador de favoritos */}
				{imageData.isFavorite && (
					<div className={cn('absolute top-2 left-2 flex items-center justify-center', isSelected && 'left-9')}>
						<StarIcon className="w-5 h-5 text-yellow-400 fill-yellow-400" />
					</div>
				)}
			</div>

			{/* Contenido bajo la imagen (excepto para variante gallery) */}
			{variant !== 'gallery' && showDetails && (
				<div className="p-3">
					{/* Título e información principal */}
					<div className="flex justify-between items-start mb-2">
						<h3 className={cn('font-medium line-clamp-1', isTcgMode ? 'text-white' : 'text-foreground')}>
							{imageData.title || 'Sin título'}
						</h3>

						{imageData.isFavorite && !isTcgMode && <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
					</div>

					{/* Información técnica */}
					<div className="space-y-1">
						{cameraInfo && (
							<div className="flex items-center text-xs text-muted-foreground gap-1">
								<CameraIcon className="w-3 h-3" />
								<span className="truncate">{cameraInfo}</span>
							</div>
						)}

						{imageData.folderId && (
							<div className="flex items-center text-xs text-muted-foreground gap-1">
								<FolderIcon className="w-3 h-3" />
								<span className="truncate">{imageData.folderName || 'Carpeta'}</span>
							</div>
						)}

						{imageData.createdAt && (
							<div className="flex items-center text-xs text-muted-foreground gap-1">
								<CalendarIcon className="w-3 h-3" />
								<span>{formatDate(imageData.createdAt)}</span>
							</div>
						)}
					</div>

					{/* Etiquetas */}
					{showTags && imageData.tags && imageData.tags.length > 0 && (
						<div className="mt-3 flex flex-wrap gap-1">
							{imageData.tags.slice(0, 3).map((tag) => (
								<Badge
									key={tag.id}
									variant="outline"
									className="text-[10px] h-5 px-1.5 truncate max-w-[100px]"
									style={{
										borderColor: `${tag.color}50`,
										backgroundColor: isTcgMode ? `${tag.color}20` : undefined,
									}}
								>
									{tag.name}
								</Badge>
							))}
							{imageData.tags.length > 3 && (
								<Badge variant="outline" className="text-[10px] h-5 px-1.5">
									+{imageData.tags.length - 3}
								</Badge>
							)}
						</div>
					)}

					{/* Contador de relaciones */}
					{showRelations && totalRelations > 0 && (
						<div className="mt-2 flex items-center text-xs text-muted-foreground">
							<InfoIcon className="w-3 h-3 mr-1" />
							<span>{totalRelations} relaciones</span>
						</div>
					)}
				</div>
			)}

			{/* Efectos visuales para modo TCG */}
			{isTcgMode && (
				<>
					{/* Brillo en hover */}
					<div
						className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"
						style={{
							background: `radial-gradient(circle at 50% 50%, ${primaryColor}20 0%, transparent 70%)`,
							zIndex: 1,
						}}
					/>

					{/* Esquinas decorativas */}
					<div
						className="absolute top-0 left-0 w-5 h-5 border-t border-l rounded-br-sm opacity-60 pointer-events-none"
						style={{ borderColor: `${primaryColor}80` }}
					/>
					<div
						className="absolute top-0 right-0 w-5 h-5 border-t border-r rounded-bl-sm opacity-60 pointer-events-none"
						style={{ borderColor: `${primaryColor}80` }}
					/>
					<div
						className="absolute bottom-0 left-0 w-5 h-5 border-b border-l rounded-tr-sm opacity-60 pointer-events-none"
						style={{ borderColor: `${primaryColor}80` }}
					/>
					<div
						className="absolute bottom-0 right-0 w-5 h-5 border-b border-r rounded-tl-sm opacity-60 pointer-events-none"
						style={{ borderColor: `${primaryColor}80` }}
					/>
				</>
			)}
		</motion.div>
	);

	// Si hay un enlace específico, envolver en un Link
	if (imageData.href && !onClick) {
		return (
			<Link href={imageData.href} className="block h-full">
				{cardContent}
			</Link>
		);
	}

	// Si no, devolver solo el contenido
	return cardContent;
}
