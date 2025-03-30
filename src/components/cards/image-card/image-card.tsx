'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CalendarIcon, CameraIcon, FolderIcon, HashIcon, Image as ImageIcon, Info, Star, TagIcon } from 'lucide-react';
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
	variant?: 'default' | 'minimal' | 'polaroid' | 'tcg';
	tcgMode?: boolean;
	showRelations?: boolean;
}

/**
 * Card para mostrar una imagen con sus metadatos principales.
 * Incluye opción de estilo TCG (Trading Card Game) para una visualización
 * más atractiva e inmersiva.
 */
export function ImageCard({
	imageId,
	onClick,
	className,
	showTags = true,
	showDetails = true,
	aspectRatio = 'auto',
	variant = 'default',
	tcgMode = false,
	showRelations = false,
}: ImageCardProps) {
	const [imageData, setImageData] = useState<ImageCardData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isHovered, setIsHovered] = useState(false);

	// Si variant es tcg, forzar tcgMode a true
	if (variant === 'tcg') {
		tcgMode = true;
	}

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

	// Funciones para el aspecto ratio
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
					const [width, height] = aspectRatio.split('/');
					return `aspect-[${width}/${height}]`;
				}
				return '';
		}
	};

	// Función para calcular dimensiones legibles
	const getHumanReadableDimensions = () => {
		if (!imageData?.width || !imageData?.height) return '';
		return `${imageData.width} × ${imageData.height}`;
	};

	// Obtener variante de diseño
	const getVariantClasses = () => {
		switch (variant) {
			case 'minimal':
				return 'border-0 shadow-none';
			case 'polaroid':
				return 'border-8 border-white bg-white shadow-md p-1 rotate-1';
			case 'tcg':
				return 'border border-gray-800/20 shadow-lg bg-gradient-to-b from-gray-900 to-black';
			default:
				return tcgMode
					? 'border border-gray-800/20 shadow-lg bg-gradient-to-b from-gray-900 to-black'
					: 'border border-gray-200 dark:border-gray-800';
		}
	};

	const handleClick = () => {
		if (onClick && imageData) {
			onClick(imageData);
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
					<p className="text-sm text-gray-500">
						{error || 'No se pudo cargar la imagen'}
					</p>
				</div>
			</div>
		);
	}

	// Obtener formato de imagen de los metadatos
	const getImageFormat = () => {
		return imageData.metadata?.format || 'unknown';
	};

	// Obtener información de cámara si está disponible
	const getCameraInfo = () => {
		if (imageData.metadata?.camera?.make || imageData.metadata?.camera?.model) {
			return `${imageData.metadata.camera.make || ''} ${imageData.metadata.camera.model || ''}`.trim();
		}
		return null;
	};

	const primaryColor = getPrimaryColor();

	// Calcular contador total de relaciones
	const getTotalRelationsCount = () => {
		if (!imageData._count) return 0;
		return (
			(imageData._count.tags || 0) +
			(imageData._count.albums || 0) +
			(imageData._count.collections || 0) +
			(imageData._count.characters || 0) +
			(imageData._count.places || 0) +
			(imageData._count.worldItems || 0) +
			(imageData._count.notes || 0)
		);
	};

	const cardContent = (
		<div
			className={cn(
				'group relative overflow-hidden rounded-lg transition-all duration-300',
				getAspectRatioClass(),
				getVariantClasses(),
				isHovered ? 'shadow-lg scale-[1.02]' : 'hover:shadow-lg hover:scale-[1.02]',
				onClick && 'cursor-pointer',
				className
			)}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={handleClick}
			onKeyDown={(e) => e.key === 'Enter' && handleClick()}
			tabIndex={onClick ? 0 : -1}
			role={onClick ? 'button' : undefined}
		>
			{/* Elementos decorativos TCG */}
			{tcgMode && (
				<>
					{/* Esquinas decorativas en estilo TCG */}
					<div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 rounded-tl-md z-20 pointer-events-none"
						style={{ borderColor: `${primaryColor}70` }} />
					<div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 rounded-tr-md z-20 pointer-events-none"
						style={{ borderColor: `${primaryColor}70` }} />
					<div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 rounded-bl-md z-20 pointer-events-none"
						style={{ borderColor: `${primaryColor}70` }} />
					<div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 rounded-br-md z-20 pointer-events-none"
						style={{ borderColor: `${primaryColor}70` }} />

					{/* Borde brillante al hacer hover */}
					<div
						className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-10"
						style={{
							boxShadow: `inset 0 0 0 1px ${primaryColor}50, 0 0 15px ${primaryColor}30`
						}}
					/>

					{/* Barra superior TCG */}
					<div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r z-20"
						style={{
							background: `linear-gradient(to right, ${primaryColor}90, ${primaryColor}30)`,
						}}>
						<div className="flex items-center justify-between px-2 h-full">
							<span className="text-xs font-medium text-white truncate max-w-[70%]">{imageData.name || 'Sin título'}</span>
							<div className="flex items-center gap-1">
								{imageData.metadata?.format && (
									<span className="px-1.5 py-0.5 text-[10px] bg-black/30 rounded uppercase text-white/90">
										{imageData.metadata.format}
									</span>
								)}
							</div>
						</div>
					</div>
				</>
			)}

			{/* Imagen principal */}
			<div className="relative w-full h-full">
				{imageData.thumbnailUrl ? (
					<img
						src={imageData.thumbnailUrl}
						alt={imageData.name || 'Imagen'}
						className={cn(
							"w-full h-full object-cover",
							tcgMode && "pt-8" // Espacio para la barra superior en modo TCG
						)}
						loading="lazy"
					/>
				) : (
					<div className={cn(
						"w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900",
						tcgMode && "pt-8" // Espacio para la barra superior en modo TCG
					)}>
						<ImageIcon className="h-10 w-10 text-gray-400" />
					</div>
				)}

				{/* Overlay con información (visible al hacer hover o siempre en modo TCG) */}
				{showDetails && (
					<div className={cn(
						'absolute inset-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity',
						tcgMode ? 'opacity-70 group-hover:opacity-90' : (isHovered ? 'opacity-100' : 'opacity-0')
					)}>
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
										{imageData.metadata?.format && (
											<Badge variant="outline" className="bg-black/40 text-[10px] border-none py-0 px-1.5 h-4">
												{imageData.metadata.format.toUpperCase()}
											</Badge>
										)}
										{imageData.metadata?.size && (
											<Badge variant="outline" className="bg-black/40 text-[10px] border-none py-0 px-1.5 h-4">
												{Math.round(imageData.metadata.size / 1024)} KB
											</Badge>
										)}
										{imageData.hash && (
											<Badge variant="outline" className="bg-black/40 text-[10px] border-none py-0 px-1.5 h-4 truncate max-w-[60px]">
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
									{imageData._count?.tags && imageData._count.tags > 0 && (
										<Badge variant="secondary" className="bg-black/40 border-none gap-1">
											<TagIcon className="h-3 w-3" />
											{imageData._count.tags}
										</Badge>
									)}
									{imageData._count?.albums && imageData._count.albums > 0 && (
										<Badge variant="secondary" className="bg-black/40 border-none gap-1">
											<FolderIcon className="h-3 w-3" />
											{imageData._count.albums}
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
										{imageData.tags.slice(0, 3).map((tag) => (
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
										{imageData.tags.length > 3 && (
											<Badge
												variant="outline"
												className="py-0 h-4 text-[10px] bg-gray-800/60 border-gray-700/60"
											>
												+{imageData.tags.length - 3}
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
						{imageData.tags.slice(0, 5).map((tag) => (
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
						{imageData.tags.length > 5 && (
							<Badge
								variant="outline"
								className="py-0 h-5 text-[10px] bg-gray-800/60 border-gray-700/60"
							>
								+{imageData.tags.length - 5}
							</Badge>
						)}
					</div>
				</div>
			)}
		</div>
	);

	// Si hay un onClick, devolver directamente el contenido
	if (onClick) {
		return cardContent;
	}

	// Si no hay onClick, envolver en un Link (si route es proporcionado)
	return (
		<Link href={`/images/${imageId}`} passHref>
			{cardContent}
		</Link>
	);
}