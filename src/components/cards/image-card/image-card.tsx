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
	onContextMenu?: (e: React.MouseEvent) => void;
	className?: string;
	showTags?: boolean;
	showDetails?: boolean;
	aspectRatio?: 'square' | 'auto' | 'video' | string;
	variant?: 'default' | 'minimal' | 'polaroid' | 'tcg';
	tcgMode?: boolean;
	showRelations?: boolean;
	// Props adicionales para accesibilidad y funcionalidad
	'data-item-id'?: string;
	role?: string;
	tabIndex?: number;
	'aria-label'?: string;
	'aria-selected'?: boolean;
	'aria-describedby'?: string;
	onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * Card para mostrar una imagen con sus metadatos principales.
 * Incluye opción de estilo TCG (Trading Card Game) para una visualización
 * más atractiva e inmersiva.
 */
export const ImageCard = memo(
	function ImageCard({
		imageId,
		onClick,
		onDoubleClick,
		onContextMenu,
		className,
		showTags = true,
		showDetails = true,
		aspectRatio = 'auto',
		variant = 'default',
		tcgMode = false,
		showRelations = false,
		'data-item-id': dataItemId,
		role,
		tabIndex,
		'aria-label': ariaLabel,
		'aria-selected': ariaSelected,
		'aria-describedby': ariaDescribedBy,
		onKeyDown,
		...restProps
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
						'relative flex items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900',
						getAspectRatioClass(),
						getVariantClasses(),
						className
					)}
				>
					<div className="p-4 text-center">
						<ImageIcon className="mx-auto mb-2 h-10 w-10 text-gray-400" />
						<p className="text-gray-500 text-sm">{error?.message || 'No se pudo cargar la imagen'}</p>
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
			if (!(imageData?.width && imageData?.height)) return '';
			return `${imageData.width} × ${imageData.height}`;
		};

		const cardContent = (
			<button
				aria-describedby={ariaDescribedBy}
				aria-label={ariaLabel}
				aria-selected={ariaSelected}
				className={cn(
					'group relative h-full w-full overflow-hidden rounded-lg border-0 bg-transparent p-0 transition-all duration-300',
					getAspectRatioClass(),
					getVariantClasses(),
					isHovered ? 'scale-[1.02] shadow-lg' : 'hover:scale-[1.02] hover:shadow-lg',
					(onClick || onDoubleClick) && 'cursor-pointer',
					className
				)}
				data-item-id={dataItemId}
				disabled={!(onClick || onDoubleClick)}
				onClick={handleClick}
				onContextMenu={onContextMenu}
				onDoubleClick={handleDoubleClick}
				onKeyDown={onKeyDown}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				role={role}
				tabIndex={tabIndex}
				type="button"
			>
				{/* Elementos decorativos TCG */}
				{tcgMode && (
					<>
						{/* Esquinas decorativas en estilo TCG */}
						<div
							className="pointer-events-none absolute top-0 left-0 z-20 h-5 w-5 rounded-tl-md border-t-2 border-l-2"
							style={{ borderColor: `${primaryColor}70` }}
						/>
						<div
							className="pointer-events-none absolute top-0 right-0 z-20 h-5 w-5 rounded-tr-md border-t-2 border-r-2"
							style={{ borderColor: `${primaryColor}70` }}
						/>
						<div
							className="pointer-events-none absolute bottom-0 left-0 z-20 h-5 w-5 rounded-bl-md border-b-2 border-l-2"
							style={{ borderColor: `${primaryColor}70` }}
						/>
						<div
							className="pointer-events-none absolute right-0 bottom-0 z-20 h-5 w-5 rounded-br-md border-r-2 border-b-2"
							style={{ borderColor: `${primaryColor}70` }}
						/>

						{/* Borde brillante al hacer hover */}
						<div
							className="pointer-events-none absolute inset-0 z-10 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
							style={{
								boxShadow: `inset 0 0 0 1px ${primaryColor}50, 0 0 15px ${primaryColor}30`,
							}}
						/>

						{/* Barra superior TCG */}
						<div
							className="absolute top-0 right-0 left-0 z-20 h-8 bg-gradient-to-r"
							style={{
								background: `linear-gradient(to right, ${primaryColor}90, ${primaryColor}30)`,
							}}
						>
							<div className="flex h-full items-center justify-between px-2">
								<span className="max-w-[70%] truncate font-medium text-white text-xs">
									{imageData.name || 'Sin título'}
								</span>
								<div className="flex items-center gap-1">
									{(() => {
										try {
											const metadata = imageData.metadata ? JSON.parse(imageData.metadata) : null;
											return metadata?.format ? (
												<span className="rounded bg-black/30 px-1.5 py-0.5 text-[10px] text-white/90 uppercase">
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
				<div className="relative h-full w-full">
					{/* Mostrar skeleton mientras carga el thumbnail */}
					{shouldShowThumbnailLoading && (
						<div className={cn('absolute inset-0 z-10', tcgMode && 'pt-8')}>
							<Skeleton className="h-full w-full" />
						</div>
					)}

					{displayThumbnailUrl ? (
						<img
							alt={imageData.name || 'Imagen'}
							className={cn(
								'h-full w-full object-cover',
								tcgMode && 'pt-8', // Espacio para la barra superior en modo TCG
								shouldShowThumbnailLoading && 'opacity-0' // Ocultar mientras carga
							)}
							loading="lazy"
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
							onLoad={() => {
								// Ocultar skeleton cuando la imagen se carga
								setThumbnailLoading(false);
							}}
							src={displayThumbnailUrl}
						/>
					) : (
						<div
							className={cn(
								'flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-900',
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
							<div className="absolute right-0 bottom-0 left-0 p-3">
								{/* Nombre y dimensiones */}
								{!tcgMode && (
									<h3 className="mb-1 line-clamp-1 font-medium text-sm text-white">
										{imageData.name || 'Sin título'}
										{imageData.isFavorite && (
											<Star className="-mt-1 ml-1 inline h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
										)}
									</h3>
								)}

								{/* Información técnica */}
								<div className="flex flex-col gap-1 text-gray-200 text-xs">
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
											<span className="max-w-[180px] truncate">{getCameraInfo()}</span>
										</div>
									)}

									{/* Formato de la imagen y tamaño */}
									{tcgMode && (
										<div className="mt-1 flex flex-wrap gap-1.5">
											{(() => {
												try {
													const metadata = imageData.metadata ? JSON.parse(imageData.metadata) : null;
													return metadata?.format ? (
														<Badge className="h-4 border-none bg-black/40 px-1.5 py-0 text-[10px]" variant="outline">
															{metadata.format.toUpperCase()}
														</Badge>
													) : null;
												} catch {
													return null;
												}
											})()}
											{imageData.size && (
												<Badge className="h-4 border-none bg-black/40 px-1.5 py-0 text-[10px]" variant="outline">
													{Math.round(imageData.size / 1024)} KB
												</Badge>
											)}
											{imageData.hash && (
												<Badge
													className="h-4 max-w-[60px] truncate border-none bg-black/40 px-1.5 py-0 text-[10px]"
													variant="outline"
												>
													<HashIcon className="mr-1 h-2 w-2" />
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
											<Badge className="gap-1 border-none bg-black/40" variant="secondary">
												<TagIcon className="h-3 w-3" />
												{imageData.stats.tagCount}
											</Badge>
										)}
										{imageData.stats?.albumCount && imageData.stats.albumCount > 0 && (
											<Badge className="gap-1 border-none bg-black/40" variant="secondary">
												<FolderIcon className="h-3 w-3" />
												{imageData.stats.albumCount}
											</Badge>
										)}
										{getTotalRelationsCount() > 0 && (
											<Badge className="border-none bg-black/40 px-1.5" variant="secondary">
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
						<div className="pointer-events-none absolute inset-0">
							{/* Efecto viñeta */}
							<div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 opacity-60" />

							{/* Brillo superior */}
							<div className="absolute inset-0 h-[20%] bg-gradient-to-b from-white/10 to-transparent opacity-60" />

							{/* Información TCG en parte inferior (siempre visible) */}
							<div className="absolute right-0 bottom-0 left-0 h-16 bg-gradient-to-t from-black to-transparent pt-2">
								{/* Etiquetas en modo TCG (visible siempre) */}
								{showTags && imageData.tags && imageData.tags.length > 0 && (
									<div className="px-3">
										<div className="mb-1 flex flex-wrap gap-1">
											{imageData.tags?.slice(0, 3).map((tag: TagWithStats) => (
												<Badge
													className="h-4 py-0 text-[10px]"
													key={tag.id}
													style={{
														backgroundColor: `${tag.color}20`,
														borderColor: `${tag.color}40`,
														color: `${tag.color}`,
													}}
													variant="outline"
												>
													{tag.name}
												</Badge>
											))}
											{imageData.tags && imageData.tags.length > 3 && (
												<Badge className="h-4 border-gray-700/60 bg-gray-800/60 py-0 text-[10px]" variant="outline">
													+{imageData.tags ? imageData.tags.length - 3 : 0}
												</Badge>
											)}
										</div>
									</div>
								)}
							</div>

							{/* Indicador de favorito */}
							{imageData.isFavorite && (
								<div className="absolute top-9 right-2 rotate-12 transform">
									<Star className="h-5 w-5 fill-yellow-300 text-yellow-300 drop-shadow-md" />
								</div>
							)}
						</div>
					)}
				</div>

				{/* Etiquetas estándar (visible al hacer hover) */}
				{showTags && imageData.tags && imageData.tags.length > 0 && !tcgMode && (
					<div
						className={cn(
							'absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10',
							isHovered ? 'opacity-100' : 'opacity-0',
							'transition-opacity duration-300'
						)}
					>
						<div className="flex flex-wrap gap-1">
							{imageData.tags?.slice(0, 5).map((tag: TagWithStats) => (
								<Badge
									className="h-5 py-0 text-[10px]"
									key={tag.id}
									style={{
										backgroundColor: `${tag.color}30`,
										borderColor: `${tag.color}40`,
										color: `${tag.color}`,
									}}
									variant="outline"
								>
									{tag.name}
								</Badge>
							))}
							{imageData.tags && imageData.tags.length > 5 && (
								<Badge className="h-5 border-gray-700/60 bg-gray-800/60 py-0 text-[10px]" variant="outline">
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
	},
	(prevProps, nextProps) => {
		// Comparación personalizada para optimizar renders
		// Si el imageId es el mismo, y las props básicas no han cambiado, evitar re-render
		if (prevProps.imageId !== nextProps.imageId) return false;
		if (prevProps.className !== nextProps.className) return false;
		if (prevProps.showTags !== nextProps.showTags) return false;
		if (prevProps.showDetails !== nextProps.showDetails) return false;
		if (prevProps.aspectRatio !== nextProps.aspectRatio) return false;
		if (prevProps.variant !== nextProps.variant) return false;
		if (prevProps.tcgMode !== nextProps.tcgMode) return false;
		if (prevProps.showRelations !== nextProps.showRelations) return false;
		if (prevProps['data-item-id'] !== nextProps['data-item-id']) return false;
		if (prevProps['aria-selected'] !== nextProps['aria-selected']) return false;

		// Ignorar cambios en funciones callback si el imageId es el mismo
		// Esto evita re-renders innecesarios cuando solo cambian las funciones
		return true;
	}
);
