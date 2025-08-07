import { AlertCircle, Filter, ImageIcon, RefreshCw, SlidersHorizontal, Trash2, UploadCloud } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MemoizedImageCard } from '@/components/cards/image-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import type { BaseContentProps } from '@/components/views/base/types';
import {
	deleteUploadedImageFromApi,
	getUploadedImagesFromApi,
	uploadImagesToApi,
} from '@/lib/api/client/uploaded-images.client';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { toastService } from '@/services/toast';
import { UploadedFileType } from '@/types/entities/uploaded-image/types';
import type { EntityWithStats } from '@/types/migration';

const viewLogger = clientLogger.withContext('UploadedImagesView');

// Definición local del tipo de filtros para imágenes subidas
// ⚠️ Si se amplían los filtros, actualizar aquí y en el panel de filtros
export type UploadedImageFilters = {
	search?: string;
	type?: UploadedFileType;
};

export function UploadedImagesView() {
	const [isLoading, setIsLoading] = useState(true);
	const [items, setItems] = useState<EntityWithStats[]>([]);
	const [filters, setFilters] = useState<UploadedImageFilters>({});
	const [isUploading, setIsUploading] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [error, _setError] = useState<string | null>(null);

	// Función para cargar las imágenes subidas
	const loadImages = useCallback(async () => {
		try {
			setIsLoading(true);
			// Usando el cliente API
			const response = await getUploadedImagesFromApi({
				...filters,
				page: currentPage,
				pageSize: 20,
			});

			setItems(
				response.items.map((item) => ({
					id: item.id,
					name: item.name,
					entityType: 'uploaded-image' as const,
					description: null,
					createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
					updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
					stats: {
						totalItems: 1,
						totalAssociations: 0,
						lastUpdated: new Date(),
					},
				})) || []
			);
			setTotalItems(response.total || 0);
			setTotalPages(Math.ceil((response.total || 0) / (response.pageSize || 20)));
			setIsLoading(false);
		} catch (error) {
			viewLogger.error('Error al cargar imágenes:', error);
			toastService.error('No se pudieron cargar las imágenes subidas.');
			setIsLoading(false);
		}
	}, [filters, currentPage]);

	// Efecto para cargar imágenes al montar el componente o cuando cambien los filtros
	useEffect(() => {
		loadImages();
	}, [loadImages]);

	// Función para manejar la subida de archivos
	const handleFileUpload = useCallback(
		async (files: FileList) => {
			try {
				setIsUploading(true);

				// Crear FormData para la carga
				const formData = new FormData();
				for (const file of Array.from(files)) {
					formData.append('files', file);
				}

				// Añadir tipo y categoría si se han seleccionado en los filtros
				if (filters.type) {
					formData.append('type', filters.type);
				}

				// Llamar al cliente API
				const result = await uploadImagesToApi(formData);
				toastService.success(
					`Se ${result.items?.length === 1 ? 'ha subido' : 'han subido'} ${result.items?.length} ${result.items?.length === 1 ? 'imagen' : 'imágenes'} correctamente.`
				);
				loadImages(); // Recargamos la lista de imágenes
				setIsUploading(false);
			} catch (error) {
				viewLogger.error('Error al subir imágenes:', error);
				toastService.error('No se pudieron subir las imágenes.');
				setIsUploading(false);
			}
		},
		[loadImages, filters.type]
	);

	// Función para eliminar una imagen
	const handleDeleteImage = useCallback(
		async (id: string) => {
			try {
				await deleteUploadedImageFromApi(id);
				toastService.success('La imagen se ha eliminado correctamente.');
				setSelectedImage(null);
				loadImages();
			} catch (error) {
				viewLogger.error('Error al eliminar imagen:', error);
				toastService.error('No se pudo eliminar la imagen.');
			}
		},
		[loadImages]
	);

	// Manejador para el evento de arrastrar y soltar
	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
				handleFileUpload(e.dataTransfer.files);
			}
		},
		[handleFileUpload]
	);

	// Manejador para la entrada de archivos
	const handleFileInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files && e.target.files.length > 0) {
				handleFileUpload(e.target.files);
			}
		},
		[handleFileUpload]
	);

	// Manejador para seleccionar una imagen
	const handleSelectItem = useCallback(
		(item: EntityWithStats) => {
			setSelectedImage(selectedImage === item.id ? null : item.id);
		},
		[selectedImage]
	);

	// Manejar cambio de página
	const handlePageChange = useCallback(
		(newPage: number) => {
			if (newPage > 0 && newPage <= totalPages) {
				setCurrentPage(newPage);
			}
		},
		[totalPages]
	);

	// Usar eventos optimistas del cliente
	const [optimisticItems, addOptimisticEvent] = clientEvents.useEvents<EntityWithStats[]>(items);

	// Efecto para manejar el optimistic UI
	useEffect(() => {
		if (selectedImage) {
			const handleKeyDown = (e: KeyboardEvent) => {
				if (e.key === 'Delete') {
					const selectedItem = items.find((item) => item.id === selectedImage);
					if (selectedItem) {
						// Optimistic update
						addOptimisticEvent({
							type: 'delete',
							data: optimisticItems.filter((item) => item.id !== selectedImage),
						});

						// Actual delete
						handleDeleteImage(selectedImage);
					}
				}
			};

			window.addEventListener('keydown', handleKeyDown);
			return () => window.removeEventListener('keydown', handleKeyDown);
		}
	}, [selectedImage, items, handleDeleteImage, addOptimisticEvent, optimisticItems]);

	// Convertir UploadedImageResult a EntityWithStats para compatibilidad con BaseContentView
	const adaptedItems = useMemo<EntityWithStats[]>(() => {
		return optimisticItems.map((item) => ({
			id: item.id,
			name: item.name,
			entityType: 'uploaded-image' as const,
			description: item.description,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
			stats: item.stats,
		}));
	}, [optimisticItems]);

	// Función para adaptar el manejador de selección
	const adaptedToggleItemSelection = useCallback(
		(item: EntityWithStats, _isMultiSelect = false) => {
			// Usar directamente el item adaptado
			handleSelectItem(item);
		},
		[handleSelectItem]
	);

	// Props compartidos con el componente base
	const _contentProps: BaseContentProps = {
		items: adaptedItems,
		isLoading,
		toggleItemSelection: adaptedToggleItemSelection,
		emptyState: {
			icon: ImageIcon,
			title: 'No hay imágenes subidas',
			description:
				'No se encontraron imágenes subidas. Sube imágenes haciendo clic en el botón de arriba o arrastra y suelta archivos aquí.',
		},
	};

	return (
		<div className="flex h-full w-full flex-col" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
			{/* Barra de herramientas */}
			<div className="flex items-center justify-between border-b p-2">
				<div className="flex items-center gap-2">
					<h2 className="font-medium text-sm">Imágenes Subidas</h2>
					{isLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
					{!isLoading && (
						<span className="text-muted-foreground text-xs">
							{totalItems} {totalItems === 1 ? 'imagen' : 'imágenes'}
						</span>
					)}
				</div>

				<div className="flex items-center gap-2">
					<Button className="h-8 gap-1" onClick={() => setShowFilters(!showFilters)} size="sm" variant="outline">
						<Filter className="h-3.5 w-3.5" />
						<span className="text-xs">Filtros</span>
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className="h-8 w-8" size="icon" variant="outline">
								<SlidersHorizontal className="h-3.5 w-3.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-40">
							<DropdownMenuItem className="cursor-pointer text-xs" onClick={loadImages}>
								<RefreshCw className="mr-2 h-3.5 w-3.5" /> Actualizar
							</DropdownMenuItem>

							{selectedImage && (
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<DropdownMenuItem
											className="cursor-pointer text-destructive text-xs"
											onSelect={(e) => e.preventDefault()}
										>
											<Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
										</DropdownMenuItem>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
											<AlertDialogDescription>
												Esta acción eliminará permanentemente la imagen seleccionada.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancelar</AlertDialogCancel>
											<AlertDialogAction
												className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
												onClick={() => handleDeleteImage(selectedImage)}
											>
												Eliminar
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							)}
						</DropdownMenuContent>
					</DropdownMenu>

					<div className="relative">
						<Input
							accept="image/*"
							className="hidden"
							id="file-upload"
							multiple
							onChange={handleFileInput}
							type="file"
						/>
						<Button
							className={cn('h-8 gap-1.5', isUploading && 'cursor-not-allowed opacity-70')}
							disabled={isUploading}
							onClick={() => document.getElementById('file-upload')?.click()}
							size="sm"
							variant="primary"
						>
							{isUploading ? (
								<RefreshCw className="h-3.5 w-3.5 animate-spin" />
							) : (
								<UploadCloud className="h-3.5 w-3.5" />
							)}
							<span className="text-xs">Subir Imágenes</span>
						</Button>
					</div>
				</div>
			</div>

			{/* Panel de filtros desplegable */}
			{showFilters && (
				<motion.div
					animate={{ height: 'auto', opacity: 1 }}
					className="overflow-hidden border-b"
					exit={{ height: 0, opacity: 0 }}
					initial={{ height: 0, opacity: 0 }}
				>
					<Card className="rounded-none border-0 shadow-none">
						<CardContent className="grid grid-cols-1 gap-3 p-3 md:grid-cols-3">
							<div className="space-y-1">
								<label className="font-medium text-xs" htmlFor="search">
									Buscar
								</label>
								<Input
									className="h-8 text-xs"
									id="search"
									onChange={(e) => setFilters({ ...filters, search: e.target.value })}
									placeholder="Buscar por nombre..."
									value={filters.search || ''}
								/>
							</div>
							<div className="space-y-1">
								<label className="font-medium text-xs" htmlFor="type">
									Tipo
								</label>
								<select
									className="h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
									id="type"
									onChange={(e) =>
										setFilters({
											...filters,
											type: e.target.value as UploadedFileType,
										})
									}
									value={filters.type || ''}
								>
									<option value="">Todos los tipos</option>
									<option value="icon">Iconos</option>
									<option value="avatar">Avatares</option>
									<option value="background">Fondos</option>
									<option value="thumbnail">Miniaturas</option>
									<option value="banner">Banners</option>
									<option value="logo">Logos</option>
									<option value="pattern">Patrones</option>
									<option value="texture">Texturas</option>
									<option value="ui">UI</option>
								</select>
							</div>
							<div className="flex items-end">
								<Button
									className="h-8 text-xs"
									onClick={() => {
										setFilters({});
									}}
									size="sm"
									variant="outline"
								>
									Limpiar filtros
								</Button>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			)}

			{/* Contenido principal con soporte para arrastrar y soltar */}
			<div className="relative flex-1">
				{isLoading ? (
					<div className="flex h-64 items-center justify-center">
						<RefreshCw className="h-10 w-10 animate-spin text-primary" />
					</div>
				) : error ? (
					<Alert className="m-4" variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : adaptedItems.length === 0 ? (
					<div className="flex h-64 flex-col items-center justify-center p-4">
						<ImageIcon className="mb-4 h-16 w-16 text-muted-foreground" />
						<h3 className="mb-2 font-medium text-lg">No hay imágenes subidas</h3>
						<p className="max-w-md text-center text-muted-foreground text-sm">
							No se encontraron imágenes subidas. Sube imágenes haciendo clic en el botón de arriba o arrastra y suelta
							archivos aquí.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{adaptedItems.map((image) => (
							<MemoizedImageCard
								aspectRatio="square"
								className={cn(selectedImage === image.id && 'ring-2 ring-primary')}
								imageId={image.id}
								key={image.id}
								onClick={() => handleSelectItem(image)}
								showTags={true}
							/>
						))}
					</div>
				)}

				{/* Overlay para arrastrar y soltar archivos */}
				{isUploading && (
					<div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
						<Card className="w-64 border shadow-md">
							<CardContent className="flex flex-col items-center justify-center gap-3 p-4">
								<RefreshCw className="h-8 w-8 animate-spin text-primary" />
								<p className="font-medium text-sm">Subiendo imágenes...</p>
							</CardContent>
						</Card>
					</div>
				)}
			</div>

			{/* Paginación */}
			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-1 border-t p-2">
					<Button
						className="h-7 w-7 p-0"
						disabled={currentPage === 1 || isLoading}
						onClick={() => handlePageChange(currentPage - 1)}
						size="sm"
						variant="outline"
					>
						&lt;
					</Button>

					<span className="mx-2 text-xs">
						Página {currentPage} de {totalPages}
					</span>

					<Button
						className="h-7 w-7 p-0"
						disabled={currentPage === totalPages || isLoading}
						onClick={() => handlePageChange(currentPage + 1)}
						size="sm"
						variant="outline"
					>
						&gt;
					</Button>
				</div>
			)}
		</div>
	);
}
