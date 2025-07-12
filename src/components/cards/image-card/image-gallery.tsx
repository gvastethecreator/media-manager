import { Grid2X2Icon, Grid3X3Icon, ListIcon, RefreshCw, SortAsc, SortDesc } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ImageWithStats } from '@/types/entities/image/base';
import type { TagWithStats } from '@/types/entities/tag/base';
import type { ImageCardData } from '@/lib/api/services/images';
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
 * - Soporta múltiples layouts: grid, grid-dense, list
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
	const [layout, setLayout] = useState(defaultLayout);
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
		if (!searchTerm) return images;

		return images.filter((image) => {
			if (typeof image === 'string') return true; // No podemos filtrar IDs sin datos

			return (
				image.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				image.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				image.tags?.some((tag: TagWithStats) => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
			);
		});
	}, [images, searchTerm]);

	// Ordenar imágenes
	const sortedImages = useMemo(() => {
		if (typeof filteredImages[0] === 'string') return filteredImages; // No podemos ordenar IDs sin datos

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
			if (!selectable) return;

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
		if (!onLoadMore || isLoadingMore) return;

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

	// Determinar clases para el grid según el layout
	const getLayoutClasses = () => {
		switch (layout) {
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
			<div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
				<div className="text-center">
					<h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">{emptyMessage}</h3>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
				<div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
					{title && <h2 className="text-2xl font-bold dark:text-white">{title}</h2>}

					{showControls && (
						<div className="flex flex-wrap gap-2 items-center">
							{/* Búsqueda */}
							<div className="w-full sm:w-auto">
								<Input
									placeholder="Buscar imágenes..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="h-9"
								/>
							</div>

							{/* Ordenamiento */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm" className="h-9">
										<SortAsc className={cn('h-4 w-4 mr-2', sortDirection === 'desc' && 'hidden')} />
										<SortDesc className={cn('h-4 w-4 mr-2', sortDirection === 'asc' && 'hidden')} />
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

							{/* Selector de layout */}
							<div className="flex items-center rounded-md border border-input">
								<Button
									variant="ghost"
									size="sm"
									className={cn('h-9 px-2 rounded-none rounded-l-md', layout === 'grid' && 'bg-primary/10')}
									onClick={() => setLayout('grid')}
								>
									<Grid3X3Icon className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className={cn(
										'h-9 px-2 rounded-none border-l border-r border-input',
										layout === 'grid-dense' && 'bg-primary/10'
									)}
									onClick={() => setLayout('grid-dense')}
								>
									<Grid2X2Icon className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className={cn('h-9 px-2 rounded-none rounded-r-md', layout === 'list' && 'bg-primary/10')}
									onClick={() => setLayout('list')}
								>
									<ListIcon className="h-4 w-4" />
								</Button>
							</div>

							{/* Selección */}
							{selectable && selectedImages.length > 0 && (
								<Button variant="default" size="sm" className="h-9" onClick={clearSelection}>
									Limpiar ({selectedImages.length})
								</Button>
							)}
						</div>
					)}
				</div>
			)}

			{/* Contenedor principal de imágenes */}
			<motion.div
				className={getLayoutClasses()}
				layout
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3 }}
			>
				{sortedImages.map((image, index) => {
					const imageId = typeof image === 'string' ? image : image.id;
					const isSelected = selectedImages.includes(imageId);

					return (
						<motion.div
							key={imageId}
							layout
							initial={{ opacity: 0, y: 20 }}
							animate={{
								opacity: 1,
								y: 0,
								transition: { delay: index * 0.05, duration: 0.3 },
							}}
							exit={{ opacity: 0, scale: 0.9 }}
							className={layout === 'list' ? 'w-full' : undefined}
						>
							{typeof image === 'string' ? (
								// Renderizar tarjeta con solo el ID, cargará datos internamente
								<ImageCardImproved
									imageId={image}
									variant={variant}
									aspectRatio={layout === 'list' ? 'auto' : aspectRatio}
									onClick={onImageClick ? handleImageClick : undefined}
									isSelected={isSelected}
									className={layout === 'list' ? 'flex flex-row items-center h-20' : undefined}
									priority={index < 8} // Cargar con prioridad las primeras 8 imágenes
								/>
							) : (
								// Renderizar tarjeta con los datos completos
								<ImageCardImproved
									imageId={image.id}
									variant={variant}
									aspectRatio={layout === 'list' ? 'auto' : aspectRatio}
									onClick={onImageClick ? handleImageClick : undefined}
									isSelected={isSelected}
									className={layout === 'list' ? 'flex flex-row items-center h-20' : undefined}
									priority={index < 8}
								/>
							)}
						</motion.div>
					);
				})}
			</motion.div>

			{/* Botón "Cargar más" */}
			{showLoadMore && hasMoreImages && (
				<div className="mt-8 flex justify-center">
					<Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore} className="px-4 py-2">
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
