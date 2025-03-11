"use client";

import {
	deleteUploadedImage,
	getUploadedImages,
	uploadImages,
} from "@/app/actions/uploaded-images/uploaded-images.actions";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { BaseContentView, ContentViewProvider } from "@/components/views/base";
import type { BaseContentProps } from "@/components/views/base";
import { clientEvents } from "@/lib/client/events.client";
import { logger } from "@/lib/logger/logger";
import { cn } from "@/lib/utils";
import type { UploadedImageType } from "@/types/entities/entities";
import type {
	UploadedImageFilters,
	UploadedImageResult,
} from "@/types/uploaded-images";
import {
	Filter,
	ImageIcon,
	Plus,
	RefreshCw,
	SlidersHorizontal,
	Trash2,
	UploadCloud,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type * as React from "react";

const viewLogger = logger.withContext("UploadedImagesView");

export function UploadedImagesView() {
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState(true);
	const [items, setItems] = useState<UploadedImageResult[]>([]);
	const [filters, setFilters] = useState<UploadedImageFilters>({});
	const [isUploading, setIsUploading] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);

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
				setTotalPages(
					Math.ceil((response.total || 0) / (response.pageSize || 20))
				);
			} else {
				toast({
					title: "Error",
					description:
						response.error || "No se pudieron cargar las imágenes subidas.",
					variant: "destructive",
				});
			}
			setIsLoading(false);
		} catch (error) {
			viewLogger.error("Error al cargar imágenes:", error);
			toast({
				title: "Error al cargar imágenes",
				description: "No se pudieron cargar las imágenes subidas.",
				variant: "destructive",
			});
			setIsLoading(false);
		}
	}, [toast, filters, currentPage]);

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
					formData.append("files", file);
				}

				// Añadir tipo y categoría si se han seleccionado en los filtros
				if (filters.type) {
					formData.append("type", filters.type);
				}

				// Llamar a la server action
				const result = await uploadImages(formData);

				if (result.success) {
					toast({
						title: "Imágenes subidas",
						description: `Se ${result.items?.length === 1 ? "ha subido" : "han subido"} ${result.items?.length} ${result.items?.length === 1 ? "imagen" : "imágenes"} correctamente.`,
					});
					loadImages(); // Recargamos la lista de imágenes
				} else {
					toast({
						title: "Error al subir imágenes",
						description: result.error || "No se pudieron subir las imágenes.",
						variant: "destructive",
					});
				}
				setIsUploading(false);
			} catch (error) {
				viewLogger.error("Error al subir imágenes:", error);
				toast({
					title: "Error al subir imágenes",
					description: "No se pudieron subir las imágenes.",
					variant: "destructive",
				});
				setIsUploading(false);
			}
		},
		[loadImages, toast, filters.type]
	);

	// Función para eliminar una imagen
	const handleDeleteImage = useCallback(
		async (id: string) => {
			try {
				const result = await deleteUploadedImage(id);

				if (result.success) {
					toast({
						title: "Imagen eliminada",
						description: "La imagen se ha eliminado correctamente.",
					});
					setSelectedImage(null);
					loadImages();
				} else {
					toast({
						title: "Error",
						description: result.error || "No se pudo eliminar la imagen.",
						variant: "destructive",
					});
				}
			} catch (error) {
				viewLogger.error("Error al eliminar imagen:", error);
				toast({
					title: "Error",
					description: "No se pudo eliminar la imagen.",
					variant: "destructive",
				});
			}
		},
		[loadImages, toast]
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
	const [optimisticItems, addOptimisticEvent] =
		clientEvents.useEvents<UploadedImageResult[]>(items);

	// Efecto para manejar el optimistic UI
	useEffect(() => {
		if (selectedImage) {
			const handleKeyDown = (e: KeyboardEvent) => {
				if (e.key === "Delete") {
					const selectedItem = items.find((item) => item.id === selectedImage);
					if (selectedItem) {
						// Optimistic update
						addOptimisticEvent({
							type: "delete",
							data: optimisticItems.filter((item) => item.id !== selectedImage),
						});

						// Actual delete
						handleDeleteImage(selectedImage);
					}
				}
			};

			window.addEventListener("keydown", handleKeyDown);
			return () => window.removeEventListener("keydown", handleKeyDown);
		}
	}, [
		selectedImage,
		items,
		handleDeleteImage,
		addOptimisticEvent,
		optimisticItems,
	]);

	// Props compartidos con el componente base
	const contentProps: BaseContentProps = {
		items: optimisticItems,
		isLoading,
		toggleItemSelection: handleSelectItem,
		emptyState: {
			icon: ImageIcon,
			title: "No hay imágenes subidas",
			description:
				"No se encontraron imágenes subidas. Sube imágenes haciendo clic en el botón de arriba o arrastra y suelta archivos aquí.",
		},
	};

	return (
		<div
			className="w-full h-full flex flex-col"
			onDragOver={(e) => e.preventDefault()}
			onDrop={handleDrop}
		>
			{/* Barra de herramientas */}
			<div className="flex items-center justify-between p-2 border-b">
				<div className="flex items-center gap-2">
					<h2 className="text-sm font-medium">Imágenes Subidas</h2>
					{isLoading && (
						<RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
					)}
					{!isLoading && (
						<span className="text-xs text-muted-foreground">
							{totalItems} {totalItems === 1 ? "imagen" : "imágenes"}
						</span>
					)}
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="h-8 gap-1"
						onClick={() => setShowFilters(!showFilters)}
					>
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
							<DropdownMenuItem
								className="text-xs cursor-pointer"
								onClick={loadImages}
							>
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
												Esta acción eliminará permanentemente la imagen
												seleccionada.
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
							className={cn(
								"h-8 gap-1.5",
								isUploading && "opacity-70 cursor-not-allowed"
							)}
							onClick={() => document.getElementById("file-upload")?.click()}
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
					animate={{ height: "auto", opacity: 1 }}
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
									value={filters.search || ""}
									onChange={(e) =>
										setFilters({ ...filters, search: e.target.value })
									}
								/>
							</div>
							<div className="space-y-1">
								<label htmlFor="type" className="text-xs font-medium">
									Tipo
								</label>
								<select
									id="type"
									className="h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
									value={filters.type || ""}
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
				<ContentViewProvider {...contentProps}>
					<BaseContentView />
				</ContentViewProvider>

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
