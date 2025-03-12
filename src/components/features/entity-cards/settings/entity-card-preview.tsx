'use client';

import { type RandomImage, getRandomImagesForEntity } from '@/app/actions/images/images-random.action';
import { BaseCard } from '@/components/features/entity-cards/base/base-card';
import type { RarityConfig, TextureConfig } from '@/components/features/entity-cards/base/base-card-types';
import type { CardOptions } from '@/components/features/entity-cards/settings/card-settings-types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toastService } from '@/lib/services/toast.service';
import { cn } from '@/lib/utils/utils';
import {
	BadgeCheck,
	Info as BadgeInfo,
	Bookmark,
	CalendarClock,
	Clock,
	FolderIcon,
	HardDrive,
	Image as ImageIcon,
	Palette,
	RefreshCcw,
	Settings,
	Settings2,
	Sparkles,
	Star,
	Tag as TagIcon,
} from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { adaptSettingsToBaseOptions } from '../base/card-adapter';

interface EntityCardPreviewProps {
	cardOptions: CardOptions;
	rarity?: RarityConfig | null;
	texture?: TextureConfig | null;
	showInfo?: boolean;
	className?: string;
	entityType?: string;
}

// Componente para grid de imágenes reales
function ImageGrid({
	layout = 'single',
	gap = 4,
	images = [],
	loading = false,
	style = 'standard',
}: {
	layout?: string;
	gap?: number;
	images?: RandomImage[];
	loading?: boolean;
	style?: string;
}) {
	// Asegurar que tenemos suficientes imágenes para el layout
	const neededImages = layout === 'single' ? 1 : layout === 'dual' ? 2 : layout === 'quad' ? 4 : 6;
	const paddedImages = [...images];

	// Si hay menos imágenes que las necesarias, rellenamos con placeholders
	while (paddedImages.length < neededImages) {
		paddedImages.push({ id: `placeholder-${paddedImages.length}`, path: '' });
	}

	// Renderizar un placeholder para cuando no hay imagen
	const renderImagePlaceholder = () => (
		<div className="bg-muted/50 rounded-md aspect-square flex items-center justify-center">
			<ImageIcon className="h-5 w-5 text-muted-foreground/50" />
		</div>
	);

	// Renderizar una imagen real o un skeleton si está cargando
	const renderImage = (image: RandomImage, index: number) => {
		if (loading) {
			return <Skeleton className="w-full h-full aspect-square rounded-md" />;
		}

		if (!image.path) {
			return renderImagePlaceholder();
		}

		// Aplicar estilos según el tipo de grid
		const imageClasses = cn(
			'w-full h-full object-cover rounded-md transition-all',
			style === 'masonry' && index % 2 === 0 && 'aspect-[3/4]',
			style === 'masonry' && index % 2 === 1 && 'aspect-[4/3]'
		);

		// Convertir la ruta de imagen para ser compatible con next/image
		// Asumiendo que las imágenes están en la carpeta public
		const imagePath = `/api/thumbnails/${encodeURIComponent(image.path)}`;

		return (
			<div className="relative overflow-hidden rounded-md aspect-square">
				<Image
					src={imagePath}
					alt={`Imagen ${index + 1}`}
					fill
					sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
					className={imageClasses}
					priority={index < 2}
				/>
			</div>
		);
	};

	// Estilos para diferentes tipos de grid
	const gridContainerClasses = cn(
		'grid gap-[var(--grid-gap)]',
		style === 'masonry' && 'grid-flow-dense',
		style === 'carousel' && 'overflow-hidden relative'
	);

	return (
		<div className={gridContainerClasses} style={{ '--grid-gap': `${gap}px` } as React.CSSProperties}>
			{/* Para el modo carrusel, mostrar una superposición de navegación */}
			{style === 'carousel' && (
				<div className="absolute inset-0 flex items-center justify-between z-10 pointer-events-none">
					<div className="h-full w-8 bg-gradient-to-r from-background/60 to-transparent" />
					<div className="h-full w-8 bg-gradient-to-l from-background/60 to-transparent" />
				</div>
			)}

			{/* Grid de una sola imagen */}
			{layout === 'single' && <div className="aspect-square">{renderImage(paddedImages[0], 0)}</div>}

			{/* Grid de dos imágenes */}
			{layout === 'dual' && (
				<div className={cn('grid grid-cols-2 gap-[var(--grid-gap)]', style === 'carousel' && 'animate-slider-dual')}>
					{paddedImages.slice(0, 2).map((image, index) => (
						<div key={image.id}>{renderImage(image, index)}</div>
					))}
				</div>
			)}

			{/* Grid de cuatro imágenes */}
			{layout === 'quad' && (
				<div
					className={cn(
						'grid grid-cols-2 grid-rows-2 gap-[var(--grid-gap)]',
						style === 'carousel' && 'animate-slider-quad'
					)}
				>
					{paddedImages.slice(0, 4).map((image, index) => (
						<div key={image.id}>{renderImage(image, index)}</div>
					))}
				</div>
			)}

			{/* Grid de seis imágenes */}
			{layout === 'six' && (
				<div
					className={cn(
						'grid grid-cols-3 grid-rows-2 gap-[var(--grid-gap)]',
						style === 'carousel' && 'animate-slider-six'
					)}
				>
					{paddedImages.slice(0, 6).map((image, index) => (
						<div key={image.id}>{renderImage(image, index)}</div>
					))}
				</div>
			)}
		</div>
	);
}

export function EntityCardPreview({
	cardOptions,
	rarity: rarityConfig,
	texture: textureConfig,
	showInfo: showVisualConfig = true,
	entityType = 'album',
}: EntityCardPreviewProps) {
	// Estado para almacenar las imágenes cargadas
	const [images, setImages] = React.useState<RandomImage[]>([]);
	const [loading, setLoading] = React.useState(true);

	// Cargar imágenes aleatorias cuando cambia el tipo de entidad o las opciones de grid
	React.useEffect(() => {
		async function loadImages() {
			setLoading(true);
			try {
				// Determinar cuántas imágenes necesitamos basado en el layout
				const layout = cardOptions.imageGridLayout || 'single';
				const count = layout === 'single' ? 1 : layout === 'dual' ? 2 : layout === 'quad' ? 4 : 6;

				const result = await getRandomImagesForEntity(entityType, count);
				if (result.success && result.data) {
					setImages(result.data);
				} else {
					console.error('Error al cargar imágenes:', result.message);
					toastService.error('No se pudieron cargar imágenes para la vista previa');
				}
			} catch (error) {
				console.error('Error al cargar imágenes:', error);
			} finally {
				setLoading(false);
			}
		}

		loadImages();
	}, [entityType, cardOptions.imageGridLayout]);

	// Función para recargar imágenes
	const handleRefreshImages = async () => {
		setLoading(true);
		try {
			const layout = cardOptions.imageGridLayout || 'single';
			const count = layout === 'single' ? 1 : layout === 'dual' ? 2 : layout === 'quad' ? 4 : 6;

			const result = await getRandomImagesForEntity(entityType, count);
			if (result.success && result.data) {
				setImages(result.data);
				toastService.success('Imágenes actualizadas');
			}
		} catch (error) {
			console.error('Error al recargar imágenes:', error);
			toastService.error('No se pudieron actualizar las imágenes');
		} finally {
			setLoading(false);
		}
	};

	// Generar un SVG dataURL para la textura si es un patrón
	const getTextureDataUrl = React.useCallback(() => {
		if (!textureConfig || !textureConfig.patternType || textureConfig.patternType === 'none') {
			return undefined;
		}

		// Esta es una implementación simple. En un entorno real,
		// deberíamos buscar el patrón SVG en una colección o guardar el SVG completo
		let svgContent = '';

		// Patrones básicos predefinidos
		switch (textureConfig.patternType) {
			case 'dots':
				svgContent = `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
					<circle cx="5" cy="5" r="1.5" fill="${textureConfig.color || 'currentColor'}" />
					<circle cx="15" cy="5" r="1.5" fill="${textureConfig.color || 'currentColor'}" />
					<circle cx="5" cy="15" r="1.5" fill="${textureConfig.color || 'currentColor'}" />
					<circle cx="15" cy="15" r="1.5" fill="${textureConfig.color || 'currentColor'}" />
				</svg>`;
				break;
			case 'lines':
				svgContent = `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
					<line x1="0" y1="10" x2="20" y2="10" stroke="${textureConfig.color || 'currentColor'}" stroke-width="1" />
				</svg>`;
				break;
			case 'grid':
				svgContent = `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
					<line x1="0" y1="10" x2="20" y2="10" stroke="${textureConfig.color || 'currentColor'}" stroke-width="0.5" />
					<line x1="10" y1="0" x2="10" y2="20" stroke="${textureConfig.color || 'currentColor'}" stroke-width="0.5" />
				</svg>`;
				break;
			case 'diagonal':
				svgContent = `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
					<line x1="0" y1="0" x2="20" y2="20" stroke="${textureConfig.color || 'currentColor'}" stroke-width="0.5" />
					<line x1="20" y1="0" x2="0" y2="20" stroke="${textureConfig.color || 'currentColor'}" stroke-width="0.5" />
				</svg>`;
				break;
			case 'waves':
				svgContent = `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
					<path d="M0,10 Q5,5 10,10 T20,10" stroke="${textureConfig.color || 'currentColor'}" fill="none" stroke-width="0.5" />
					<path d="M0,15 Q5,10 10,15 T20,15" stroke="${textureConfig.color || 'currentColor'}" fill="none" stroke-width="0.5" />
					<path d="M0,5 Q5,0 10,5 T20,5" stroke="${textureConfig.color || 'currentColor'}" fill="none" stroke-width="0.5" />
				</svg>`;
				break;
			case 'hexagons':
				svgContent = `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
					<polygon points="10,1 17,5 17,15 10,19 3,15 3,5" fill="none" stroke="${textureConfig.color || 'currentColor'}" stroke-width="0.5" />
				</svg>`;
				break;
			default:
				return undefined;
		}

		// Crear un data URL para el SVG
		return `url('data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}')`;
	}, [textureConfig]);

	// Construir el objeto de textura completo para la vista previa
	const previewTexture = React.useMemo(() => {
		if (!textureConfig) {
			return undefined;
		}

		const textureUrl = getTextureDataUrl();

		return {
			...textureConfig,
			imageUrl: textureConfig.imageUrl || undefined,
			pattern: textureUrl,
		};
	}, [textureConfig, getTextureDataUrl]);

	// Configuración del grid de imágenes
	const imageGridLayout = cardOptions.imageGridLayout || 'single';
	const imageGridGap = cardOptions.imageGridGap || 4;
	const imageGridStyle = cardOptions.imageGridStyle || 'standard';
	const showImageCount = cardOptions.showImageCount ?? true;

	return (
		<div className="relative w-full max-w-[300px] mx-auto">
			<BaseCard
				options={adaptSettingsToBaseOptions(cardOptions)}
				rarity={rarityConfig || undefined}
				texture={previewTexture}
				className="w-full aspect-[2/3] border border-border"
			>
				<div className="relative flex flex-col h-full">
					{/* Header con botón de recarga */}
					<div className="p-3 border-b border-border/30">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<span className="text-sm font-medium">Vista Previa</span>
								{rarityConfig && (
									<span
										className="text-xs flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
										style={{
											backgroundColor: `${rarityConfig.color}20`,
											color: rarityConfig.color,
										}}
									>
										<Star className="h-3 w-3" strokeWidth={2.5} />
										{rarityConfig.name}
									</span>
								)}
							</div>
							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									onClick={handleRefreshImages}
									disabled={loading}
								>
									<RefreshCcw className="h-3 w-3" />
								</Button>
								{textureConfig && (
									<span
										className="text-xs px-1.5 py-0.5 rounded-md"
										style={{
											backgroundColor: `${textureConfig.color}15`,
											color: textureConfig.color,
										}}
									>
										{textureConfig.name}
									</span>
								)}
							</div>
						</div>
					</div>

					{/* Main content con grid de imágenes */}
					<div className="flex-1 flex flex-col p-3 text-center gap-3">
						<ImageGrid
							layout={imageGridLayout as string}
							gap={imageGridGap}
							images={images}
							loading={loading}
							style={imageGridStyle as string}
						/>

						<div className="space-y-1">
							<p className="text-sm font-medium">Título de Entidad</p>
							<p className="text-xs text-muted-foreground line-clamp-2">
								{entityType === 'album'
									? 'Álbum con imágenes'
									: entityType === 'collection'
										? 'Colección de fotografías'
										: entityType === 'tag'
											? 'Etiqueta temática'
											: 'Entidad personalizada'}
							</p>
						</div>
					</div>

					{/* Footer con contador de imágenes */}
					<div className="p-3 border-t border-border/30 flex justify-between items-center">
						{showImageCount && (
							<span className="text-xs text-muted-foreground flex items-center gap-1">
								<ImageIcon className="h-3 w-3" />
								{imageGridLayout === 'single'
									? '1'
									: imageGridLayout === 'dual'
										? '2'
										: imageGridLayout === 'quad'
											? '4'
											: '6'}{' '}
								imágenes
							</span>
						)}
						<span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
							{entityType === 'album'
								? 'Álbum'
								: entityType === 'collection'
									? 'Colección'
									: entityType === 'tag'
										? 'Etiqueta'
										: entityType === 'character'
											? 'Persona'
											: entityType === 'place'
												? 'Lugar'
												: entityType === 'world-item'
													? 'Objeto'
													: entityType === 'concept'
														? 'Concepto'
														: entityType === 'prompt'
															? 'Prompt'
															: entityType === 'note'
																? 'Nota'
																: 'Entidad'}
						</span>
					</div>
				</div>
			</BaseCard>

			{/* Info panel (opcional) */}
			{showVisualConfig && (
				<div className="mt-3 p-2 text-xs text-muted-foreground bg-muted/30 rounded border border-border/30">
					<div className="flex items-start gap-1.5">
						<BadgeInfo className="h-3.5 w-3.5 mt-0.5 shrink-0" />
						<div>
							<p className="font-medium mb-1">Configuración activa:</p>
							<ul className="space-y-1">
								{cardOptions.enable3DEffect && <li>• Efecto 3D</li>}
								{cardOptions.enableHolographicEffect && <li>• Efecto holográfico</li>}
								{cardOptions.enableGlowEffect && <li>• Efecto de brillo</li>}
								{cardOptions.enableGrainEffect && <li>• Efecto de grano</li>}
								{cardOptions.imageGridLayout && (
									<li>
										• Grid:{' '}
										{cardOptions.imageGridLayout === 'single'
											? 'Una imagen'
											: cardOptions.imageGridLayout === 'dual'
												? 'Dos imágenes'
												: cardOptions.imageGridLayout === 'quad'
													? 'Cuatro imágenes'
													: 'Seis imágenes'}
									</li>
								)}
								{cardOptions.imageGridStyle !== 'standard' && (
									<li>• Estilo: {cardOptions.imageGridStyle === 'masonry' ? 'Mosaico' : 'Carrusel'}</li>
								)}
								{rarityConfig && <li>• Rareza: {rarityConfig.name}</li>}
								{textureConfig && <li>• Textura: {textureConfig.name}</li>}
								{!cardOptions.enable3DEffect &&
									!cardOptions.enableHolographicEffect &&
									!cardOptions.enableGlowEffect &&
									!cardOptions.enableGrainEffect &&
									!rarityConfig &&
									!textureConfig && <li>• Configuración básica</li>}
							</ul>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
