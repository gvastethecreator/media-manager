'use client';

import {
	deleteUploadedImage,
	getUploadedImages,
	uploadImages,
} from '@/app/actions/uploaded-images/uploaded-images.actions';
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
import type { BaseContentProps } from '@/components/views/base';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { toastService } from '@/services/toast.service';
import { UploadedImageResult } from '@/transformers/uploaded-image/transformer';
import type { UploadedImageType } from '@/types/entities/uploaded-image/types';
import type { FileItem } from '@/types/file-item';
import { FileProcessingStatus, FileType } from '@/types/file-item';
import type { EntityId, JSONString } from '@/utils/types/utility-types';
import { AlertCircle, Filter, ImageIcon, RefreshCw, SlidersHorizontal, Trash2, UploadCloud } from 'lucide-react';
import { motion } from 'motion/react';
import type * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const viewLogger = clientLogger.withContext('UploadedImagesView');

// Definición local del tipo de filtros para imágenes subidas
// ⚠️ Si se amplían los filtros, actualizar aquí y en el panel de filtros
export type UploadedImageFilters = {
	search?: string;
	type?: UploadedImageType;
};

export function UploadedImagesView() {
	const [isLoading, setIsLoading] = useState(true);
	const [items, setItems] = useState<UploadedImageResult[]>([]);
	const [filters, setFilters] = useState<UploadedImageFilters>({});
	const [isUploading, setIsUploading] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [error, setError] = useState<string | null>(null);

	// Función para cargar las imágenes subidas
	const loadImages = useCallback(async () => {
		try {
			setIsLoading(true);
			// Usando la server action
			const response = await getUploadedImages({
				...filters,
				page: currentPage,
				pageSize: 20,
			});

			if (response.success) {
				setItems(response.items || []);
				setTotalItems(response.total || 0);
				setTotalPages(Math.ceil((response.total || 0) / (response.pageSize || 20)));
			} else {
				toastService.error(response.error || 'No se pudieron cargar las imágenes subidas.');
			}
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

				// Llamar a la server action
				const result = await uploadImages(formData);

				if (result.success) {
					toastService.success(
						`Se ${result.items?.length === 1 ? 'ha subido' : 'han subido'} ${result.items?.length} ${result.items?.length === 1 ? 'imagen' : 'imágenes'} correctamente.`
					);
					loadImages(); // Recargamos la lista de imágenes
				} else {
					toastService.error(result.error || 'No se pudieron subir las imágenes.');
				}
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
				const result = await deleteUploadedImage(id);

				if (result.success) {
					toastService.success('La imagen se ha eliminado correctamente.');
					setSelectedImage(null);
					loadImages();
				} else {
					toastService.error(result.error || 'No se pudo eliminar la imagen.');
				}
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
		(item: UploadedImageResult) => {
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
	const [optimisticItems, addOptimisticEvent] = clientEvents.useEvents<UploadedImageResult[]>(items);

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

	// Convertir UploadedImageResult a FileItem para compatibilidad con BaseContentView
	const adaptedItems = useMemo<FileItem[]>(() => {
		return optimisticItems.map((item) => {
			// Extraer mimeType desde metadata si es posible
			let mimeType = 'image/jpeg';
			try {
				if (item.metadata) {
					const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
					if (meta && typeof meta === 'object' && meta.format) {
						// Ejemplo: meta.format = 'png' => 'image/png'
						mimeType = `image/${meta.format.toLowerCase()}`;
					}
				}
			} catch {}
			// Asegurar que metadata es string JSON
			const metadataString = typeof item.metadata === 'string' ? item.metadata : JSON.stringify(item.metadata || {});
			return {
				id: item.id as EntityId, // Forzamos el tipo, ya que es string compatible
				name: item.name,
				path: item.path,
				type: FileType.IMAGE,
				size: item.size,
				mimeType,
				metadata: metadataString as JSONString<any>,
				processingStatus: FileProcessingStatus.COMPLETED, // Enum correcto
				createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
				updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
			};
		});
	}, [optimisticItems]);

	// Función para adaptar el manejador de selección
	const adaptedToggleItemSelection = useCallback(
		(item: FileItem, _isMultiSelect = false) => {
			// Encontrar el item original por ID
			const originalItem = items.find((i) => i.id === item.id);
			if (originalItem) {
				handleSelectItem(originalItem);
			}
		},
		[items, handleSelectItem]
	);

	// Props compartidos con el componente base
	const contentProps: BaseContentProps = {
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
		<div className="w-full h-full flex flex-col" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
			{/* Barra de herramientas */}
			<div className="flex items-center justify-between p-2 border-b">
				<div className="flex items-center gap-2">
					<h2 className="text-sm font-medium">Imágenes Subidas</h2>
					{isLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
					{!isLoading && (
						<span className="text-xs text-muted-foreground">
							{totalItems} {totalItems === 1 ? 'imagen' : 'imágenes'}
						</span>
					)}
				</div>

				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setShowFilters(!showFilters)}>
						<Filter className="h-3.5 w-3.5" />
						<span className="text-xs">Filtros</span>
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="icon" className="h-8 w-8">
								<SlidersHorizontal className="h-3.5 w-3.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-40">
							<DropdownMenuItem className="text-xs cursor-pointer" onClick={loadImages}>
								<RefreshCw className="h-3.5 w-3.5 mr-2" /> Actualizar
							</DropdownMenuItem>

							{selectedImage && (
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<DropdownMenuItem
											className="text-xs cursor-pointer text-destructive"
											onSelect={(e) => e.preventDefault()}
										>
											<Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
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
												onClick={() => handleDeleteImage(selectedImage)}
												className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
							id="file-upload"
							type="file"
							multiple
							accept="image/*"
							className="hidden"
							onChange={handleFileInput}
						/>
						<Button
							variant="default"
							size="sm"
							className={cn('h-8 gap-1.5', isUploading && 'opacity-70 cursor-not-allowed')}
							onClick={() => document.getElementById('file-upload')?.click()}
							disabled={isUploading}
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
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: 'auto', opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					className="border-b overflow-hidden"
				>
					<Card className="border-0 rounded-none shadow-none">
						<CardContent className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
							<div className="space-y-1">
								<label htmlFor="search" className="text-xs font-medium">
									Buscar
								</label>
								<Input
									id="search"
									placeholder="Buscar por nombre..."
									className="h-8 text-xs"
									value={filters.search || ''}
									onChange={(e) => setFilters({ ...filters, search: e.target.value })}
								/>
							</div>
							<div className="space-y-1">
								<label htmlFor="type" className="text-xs font-medium">
									Tipo
								</label>
								<select
									id="type"
									className="h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
									value={filters.type || ''}
									onChange={(e) =>
										setFilters({
											...filters,
											type: e.target.value as UploadedImageType,
										})
									}
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
									size="sm"
									variant="outline"
									className="h-8 text-xs"
									onClick={() => {
										setFilters({});
									}}
								>
									Limpiar filtros
								</Button>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			)}

			{/* Contenido principal con soporte para arrastrar y soltar */}
			<div className="flex-1 relative">
				{isLoading ? (
					<div className="flex justify-center items-center h-64">
						<RefreshCw className="h-10 w-10 animate-spin text-primary" />
					</div>
				) : error ? (
					<Alert variant="destructive" className="m-4">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : optimisticItems.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-64 p-4">
						<ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
						<h3 className="text-lg font-medium mb-2">No hay imágenes subidas</h3>
						<p className="text-sm text-muted-foreground text-center max-w-md">
							No se encontraron imágenes subidas. Sube imágenes haciendo clic en el botón de arriba o arrastra y suelta
							archivos aquí.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
						{optimisticItems.map((image) => (
							<MemoizedImageCard
								key={image.id}
								imageId={image.id}
								aspectRatio="square"
								showTags={true}
								onClick={() => handleSelectItem(image)}
								className={cn(selectedImage === image.id && 'ring-2 ring-primary')}
							/>
						))}
					</div>
				)}

				{/* Overlay para arrastrar y soltar archivos */}
				{isUploading && (
					<div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
						<Card className="w-64 border shadow-md">
							<CardContent className="p-4 flex flex-col items-center justify-center gap-3">
								<RefreshCw className="h-8 w-8 animate-spin text-primary" />
								<p className="text-sm font-medium">Subiendo imágenes...</p>
							</CardContent>
						</Card>
					</div>
				)}
			</div>

			{/* Paginación */}
			{totalPages > 1 && (
				<div className="flex items-center justify-center p-2 border-t gap-1">
					<Button
						variant="outline"
						size="sm"
						className="h-7 w-7 p-0"
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={currentPage === 1 || isLoading}
					>
						&lt;
					</Button>

					<span className="text-xs mx-2">
						Página {currentPage} de {totalPages}
					</span>

					<Button
						variant="outline"
						size="sm"
						className="h-7 w-7 p-0"
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={currentPage === totalPages || isLoading}
					>
						&gt;
					</Button>
				</div>
			)}
		</div>
	);
}
