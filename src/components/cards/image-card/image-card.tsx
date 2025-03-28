'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ImageIcon, Info, TagIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getImageCardData, type ImageCardData } from './image-server-actions';

interface ImageCardProps {
	imageId: string;
	onClick?: (imageData: ImageCardData) => void;
	className?: string;
	showTags?: boolean;
	showDetails?: boolean;
	aspectRatio?: 'square' | 'auto' | 'video' | string;
	variant?: 'default' | 'minimal' | 'polaroid';
}

/**
 * Card para mostrar una imagen con sus metadatos principales
 */
export function ImageCard({
	imageId,
	onClick,
	className,
	showTags = true,
	showDetails = true,
	aspectRatio = 'auto',
	variant = 'default',
}: ImageCardProps) {
	const [imageData, setImageData] = useState<ImageCardData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isHovered, setIsHovered] = useState(false);

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
			default:
				return 'border border-gray-200 dark:border-gray-800';
		}
	};

	const handleClick = () => {
		if (onClick && imageData) {
			onClick(imageData);
		}
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

	const cardContent = (
		<div
			className={cn(
				'relative overflow-hidden rounded-lg bg-white dark:bg-gray-950 transition-all duration-300',
				getAspectRatioClass(),
				getVariantClasses(),
				isHovered ? 'shadow-lg scale-[1.02]' : 'hover:shadow-lg hover:scale-[1.02]',
				onClick && 'cursor-pointer',
				className
			)}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={handleClick}
		>
			{/* Imagen principal */}
			<div className="relative w-full h-full">
				{imageData.thumbnailUrl ? (
					<img
						src={imageData.thumbnailUrl}
						alt={imageData.name || 'Imagen'}
						className="w-full h-full object-cover"
						loading="lazy"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
						<ImageIcon className="h-10 w-10 text-gray-400" />
					</div>
				)}

				{/* Overlay con información (visible al hacer hover) */}
				{showDetails && (
					<div className={cn(
						'absolute inset-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity',
						isHovered ? 'opacity-100' : 'opacity-0'
					)}>
						<div className="absolute bottom-0 left-0 right-0 p-3">
							{/* Nombre y dimensiones */}
							<h3 className="text-white font-medium line-clamp-1 text-sm mb-1">
								{imageData.name || 'Sin título'}
							</h3>
							<div className="flex items-center gap-2 text-xs text-gray-200">
								<Info className="h-3 w-3" />
								<span>{getHumanReadableDimensions()}</span>
							</div>
						</div>
					</div>
				)}

				{/* Tags (visible siempre) */}
				{showTags && imageData.tags && imageData.tags.length > 0 && (
					<div className="absolute top-2 right-2 flex gap-1 flex-wrap justify-end max-w-[65%]">
						{imageData.tags.slice(0, 3).map(tag => (
							<Badge
								key={tag.id}
								variant="secondary"
								className="text-xs py-0"
								style={{ backgroundColor: `${tag.color}30`, borderColor: tag.color }}
							>
								<TagIcon className="h-3 w-3 mr-1" />
								{tag.name}
							</Badge>
						))}
						{imageData.tags.length > 3 && (
							<Badge variant="outline" className="text-xs py-0">
								+{imageData.tags.length - 3}
							</Badge>
						)}
					</div>
				)}
			</div>
		</div>
	);

	// Si hay onClick, no envolvemos en Link
	if (onClick) {
		return cardContent;
	}

	// Si no hay onClick, lo envolvemos en un Link para navegar a la página de la imagen
	return (
		<Link href={`/dashboard/images/${imageData.id}`} className="block">
			{cardContent}
		</Link>
	);
}