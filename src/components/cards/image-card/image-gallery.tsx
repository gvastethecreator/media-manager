import { Grid2X2Icon, Grid3X3Icon, ListIcon, RefreshCw, SortAsc, SortDesc } from 'lucide-react';
import { motion } from '@/components/ui/motion-shim';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import type { ImageCardData } from '@/lib/api/services/images';
import { cn } from '@/lib/utils';
import type { ImageWithStats } from '@/types/entities/image/base';
import type { TagWithStats } from '@/types/entities/tag/base';
import { ImageCardImproved } from './image-card-improved';

interface ImageGalleryProps {
	images: string[] | ImageWithStats[];
	title?: string;
	className?: string;
	emptyMessage?: string;
	loading?: boolean;
	selectable?: boolean;
	variant?: 'default' | 'minimal' | 'polaroid' | 'tcg' | 'gallery';
	defaultLayout?: 'grid' | 'grid-dense' | 'list';
	onImageClick?: (image: ImageCardData) => void;
	onSelectionChange?: (selectedImages: string[]) => void;
	aspectRatio?: 'square' | 'auto' | 'video' | string;
	showControls?: boolean;
	showLoadMore?: boolean;
	onLoadMore?: () => Promise<void>;
	hasMoreImages?: boolean;
}

type SortOption = 'name' | 'date' | 'size' | 'dimensions';
type SortDirection = 'asc' | 'desc';

/**
 * Componente para mostrar una galería de imágenes con opciones de visualización y control
 * - Soporta múltiples s: grid, grid-dense, list
 * - Permite ordenamiento por diferentes criterios
 * - Filtrado de imágenes por texto
 * - Selección de imágenes con callback
 * - Diseño responsivo para diferentes tamaños de pantalla
 * - Soporte para "cargar más" con scroll infinito
 */
export function ImageGallery({
	images,
	title = 'Galería de imágenes',
	className,
	emptyMessage = 'No hay imágenes para mostrar',
	loading = false,
	selectable = false,
	variant = 'default',
	defaultLayout = 'grid',
	onImageClick,
	onSelectionChange,
	aspectRatio = '3/2',
	showControls = true,
	showLoadMore = false,
	onLoadMore,
	hasMoreImages = false,
}: ImageGalleryProps) {
	// Estados de la galería
	const [searchTerm, setSearchTerm] = useState('');
	const [sortBy, setSortBy] = useState<SortOption>('date');
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
	const [, setLayout] = useState(defaultLayout);
	const [selectedImages, setSelectedImages] = useState<string[]>([]);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [_imagesData, setImagesData] = useState<ImageWithStats[]>([]);

	// Convertir IDs de imágenes a array de ImageCardData si es necesario
	useEffect(() => {
		if (images.length === 0) {
			setImagesData([]);
			return;
		}

		// Si ya recibimos objetos ImageCardData
		if (typeof images[0] !== 'string') {
			setImagesData(images as ImageWithStats[]);
		}
		// Si solo tenemos IDs, los datos se cargarán en cada tarjeta
	}, [images]);

	// Filtrar imágenes según el término de búsqueda
	const filteredImages = useMemo(() => {
		if (!searchTerm) {
			return images;
		}

		return images.filter((image) => {
			if (typeof image === 'string') {
				return true; // No podemos filtrar IDs sin datos
			}

			return (
				image.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				image.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				image.tags?.some((tag: TagWithStats) => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
			);
		});
	}, [images, searchTerm]);

	// Ordenar imágenes
	const sortedImages = useMemo(() => {
		if (typeof filteredImages[0] === 'string') {
			return filteredImages; // No podemos ordenar IDs sin datos
		}

		const sorted = [...(filteredImages as ImageWithStats[])].sort((a, b) => {
			let comparison = 0;

			switch (sortBy) {
				case 'name':
					comparison = (a.name || '').localeCompare(b.name || '');
					break;
				case 'date':
					comparison = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
					break;
				case 'size':
					comparison = (a.size || 0) - (b.size || 0);
					break;
				case 'dimensions': {
					const aArea = (a.width || 0) * (a.height || 0);
					const bArea = (b.width || 0) * (b.height || 0);
					comparison = aArea - bArea;
					break;
				}
				default:
					comparison = 0;
			}

			return sortDirection === 'desc' ? -comparison : comparison;
		});

		return sorted;
	}, [filteredImages, sortBy, sortDirection]);

	// Manejar selección de imagen
	const handleImageSelect = useCallback(
		(image: ImageCardData) => {
			if (!selectable) {
				return;
			}

			setSelectedImages((prev) => {
				const imageId = image.id;
				const newSelection = prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId];

				// Notificar cambio en selección
				if (onSelectionChange) {
					onSelectionChange(newSelection);
				}

				return newSelection;
			});
		},
		[selectable, onSelectionChange]
	);

	// Manejar clic en imagen
	const handleImageClick = useCallback(
		(image: ImageCardData) => {
			if (selectable) {
				handleImageSelect(image);
			} else if (onImageClick) {
				onImageClick(image);
			}
		},
		[selectable, handleImageSelect, onImageClick]
	);

	// Cambiar dirección de ordenamiento
	const toggleSortDirection = useCallback(() => {
		setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
	}, []);

	// Cargar más imágenes
	const handleLoadMore = useCallback(async () => {
		if (!onLoadMore || isLoadingMore) {
			return;
		}

		setIsLoadingMore(true);
		await onLoadMore();
		setIsLoadingMore(false);
	}, [onLoadMore, isLoadingMore]);

	// Limpiar selección
	const clearSelection = useCallback(() => {
		setSelectedImages([]);
		if (onSelectionChange) {
			onSelectionChange([]);
		}
	}, [onSelectionChange]);

	// Determinar clases para el grid según el
	const getLayoutClasses = () => {
		switch () {
			case 'grid':
				return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4';
			case 'grid-dense':
				return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 auto-rows-auto';
			case 'list':
				return 'flex flex-col gap-3';
			default:
				return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4';
		}
	};

	// Renderizar contenido vacío
	if (!loading && sortedImages.length === 0) {
		return (
			<div className={cn('flex flex-col items-center justify-center px-4 py-12', className)}>
				<div className="text-center">
					<h3 className="mt-2 font-medium text-gray-900 text-lg dark:text-gray-100">{emptyMessage}</h3>
					<p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
						No se encontraron imágenes que coincidan con los criterios actuales.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className={cn('space-y-4', className)}>
			{/* Cabecera con título y controles */}
			{(title || showControls) && (
				<div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
					{title && <h2 className="font-bold text-2xl dark:text-white">{title}</h2>}

					{showControls && (
						<div className="flex flex-wrap items-center gap-2">
							{/* Búsqueda */}
							<div className="w-full sm:w-auto">
								<Input
									className="h-9"
									onChange={(e) => setSearchTerm(e.target.value)}
									placeholder="Buscar imágenes..."
									value={searchTerm}
								/>
							</div>

							{/* Ordenamiento */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button className="h-9" size="sm" variant="outline">
										<SortAsc className={cn('mr-2 h-4 w-4', sortDirection === 'desc' && 'hidden')} />
										<SortDesc className={cn('mr-2 h-4 w-4', sortDirection === 'asc' && 'hidden')} />
										<span>Ordenar</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={() => setSortBy('name')}>Por nombre</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setSortBy('date')}>Por fecha</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setSortBy('size')}>Por tamaño</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setSortBy('dimensions')}>Por área</DropdownMenuItem>
									<DropdownMenuItem onClick={toggleSortDirection}>
										{sortDirection === 'asc' ? 'Ascendente' : 'Descendente'}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

							{/* Selector de  */}
							<div className="flex items-center rounded-md border border-input">
								<Button
									className={cn('h-9 rounded-none rounded-l-md px-2',  === 'grid' && 'bg-primary/10')}
									onClick={() => setLayout('grid')}
									size="sm"
									variant="ghost"
								>
									<Grid3X3Icon className="h-4 w-4" />
								</Button>
								<Button
									className={cn(
										'h-9 rounded-none border-input border-r border-l px-2',
										 === 'grid-dense' && 'bg-primary/10'
									)}
									onClick={() => setLayout('grid-dense')}
									size="sm"
									variant="ghost"
								>
									<Grid2X2Icon className="h-4 w-4" />
								</Button>
								<Button
									className={cn('h-9 rounded-none rounded-r-md px-2',  === 'list' && 'bg-primary/10')}
									onClick={() => setLayout('list')}
									size="sm"
									variant="ghost"
								>
									<ListIcon className="h-4 w-4" />
								</Button>
							</div>

							{/* Selección */}
							{selectable && selectedImages.length > 0 && (
								<Button className="h-9" onClick={clearSelection} size="sm" variant="primary">
									Limpiar ({selectedImages.length})
								</Button>
							)}
						</div>
					)}
				</div>
			)}

			{/* Contenedor principal de imágenes */}
			<motion.div
				animate={{ opacity: 1 }}
				className={getLayoutClasses()}
				initial={{ opacity: 0 }}
				
				transition={{ duration: 0.3 }}
			>
				{sortedImages.map((image, index) => {
					const imageId = typeof image === 'string' ? image : image.id;
					const isSelected = selectedImages.includes(imageId);

					return (
						<motion.div
							animate={{
								opacity: 1,
								y: 0,
								transition: { delay: index * 0.05, duration: 0.3 },
							}}
							className={ === 'list' ? 'w-full' : undefined}
							exit={{ opacity: 0, scale: 0.9 }}
							initial={{ opacity: 0, y: 20 }}
							key={imageId}
							
						>
							{typeof image === 'string' ? (
								// Renderizar tarjeta con solo el ID, cargará datos internamente
								<ImageCardImproved
									aspectRatio={ === 'list' ? 'auto' : aspectRatio}
									className={ === 'list' ? 'flex h-20 flex-row items-center' : undefined}
									imageId={image}
									isSelected={isSelected}
									onClick={onImageClick ? handleImageClick : undefined}
									priority={index < 8}
									variant={variant} // Cargar con prioridad las primeras 8 imágenes
								/>
							) : (
								// Renderizar tarjeta con los datos completos
								<ImageCardImproved
									aspectRatio={ === 'list' ? 'auto' : aspectRatio}
									className={ === 'list' ? 'flex h-20 flex-row items-center' : undefined}
									imageId={image.id}
									isSelected={isSelected}
									onClick={onImageClick ? handleImageClick : undefined}
									priority={index < 8}
									variant={variant}
								/>
							)}
						</motion.div>
					);
				})}
			</motion.div>

			{/* Botón "Cargar más" */}
			{showLoadMore && hasMoreImages && (
				<div className="mt-8 flex justify-center">
					<Button className="px-4 py-2" disabled={isLoadingMore} onClick={handleLoadMore} variant="outline">
						{isLoadingMore ? (
							<>
								<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
								Cargando...
							</>
						) : (
							'Cargar más'
						)}
					</Button>
				</div>
			)}
		</div>
	);
}
