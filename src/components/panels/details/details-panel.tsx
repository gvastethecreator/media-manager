"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FileItem } from "@/types/file-item";
import { ThumbnailQuality } from "@/types/thumbnails";
import { useImageViewer } from "@/store/image-viewer.store";
import { ImageCard } from "@/components/features/file-viewer/components/file-viewer-card";
import {
	ImageOff,
	Info,
	Maximize2,
	Folder,
	Download,
	Copy,
	Heart,
	Flag,
	Trash2,
	FileText,
	Calendar,
	Image as ImageIcon,
	Clock,
	Play,
	X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatsPanel } from "../stats/stats-panel";
import { useToast } from "@/components/ui/use-toast";
import { updateImageStats, getImageUrl } from "@/app/actions/image.actions";
import { useFileManager } from "@/store/file-manager.store";
import { ImageItem } from "@/components/features/file-viewer/components/advanced-file-viewer";

interface DetailsPanelProps {
	selectedItems: FileItem[];
	onClose?: () => void;
}

const getMetadata = (metadata: string | null) => {
	if (!metadata) return null;
	try {
		return JSON.parse(metadata);
	} catch {
		return null;
	}
};

export function DetailsPanel({ selectedItems, onClose }: DetailsPanelProps) {
	const [imageError, setImageError] = React.useState(false);
	const [isMarked, setIsMarked] = React.useState(false);
	const [isLoading, setIsLoading] = React.useState(false);
	const [imageUrl, setImageUrl] = React.useState<string | null>(null);
	const { openViewer } = useImageViewer();
	const { toast } = useToast();
	const fileManager = useFileManager();

	const handleOpenViewer = React.useCallback(
		async (item: FileItem) => {
			const metadata = getMetadata(item.metadata);
			if (item.type === "image" || metadata?.mimeType?.startsWith("image/")) {
				try {
					// Usar las imágenes del directorio actual
					const currentItems = fileManager.currentItems || [];
					const allImages = currentItems.filter((i: FileItem) => {
						const meta = getMetadata(i.metadata);
						return i.type === "image" || meta?.mimeType?.startsWith("image/");
					});

					if (allImages.length === 0) {
						throw new Error("No hay imágenes disponibles");
					}

					// Procesar imágenes en lotes para evitar sobrecarga
					const batchSize = 5;
					const validImages: ImageItem[] = [];

					for (let i = 0; i < allImages.length; i += batchSize) {
						const batch = allImages.slice(i, i + batchSize);
						const batchResults = await Promise.all(
							batch.map(async (img: FileItem) => {
								try {
									// Obtener URL original
									const originalUrl = await getImageUrl(img.id);

									// Intentar obtener thumbnail del caché primero
									let thumbnailUrl: string | null = null;
									try {
										const thumbnailResponse = await fetch(
											`/api/thumbnails/${img.id}?quality=medium`
										);
										if (thumbnailResponse.ok) {
											const data = await thumbnailResponse.json();
											thumbnailUrl = `data:${
												data.mimeType || "image/webp"
											};base64,${data.thumbnail}`;
										}
									} catch (error) {
										console.warn(
											`No se pudo cargar el thumbnail para ${img.name}:`,
											error
										);
									}

									return {
										id: img.id,
										name: img.name,
										type: "image",
										url: originalUrl,
										src: originalUrl,
										thumbnail: thumbnailUrl || originalUrl,
										alt: img.name,
										mimeType:
											getMetadata(img.metadata)?.mimeType || "image/jpeg",
										width: getMetadata(img.metadata)?.dimensions?.width,
										height: getMetadata(img.metadata)?.dimensions?.height,
										metadata: img.metadata,
									} as ImageItem;
								} catch (error) {
									console.error(`Error cargando imagen ${img.name}:`, error);
									return null;
								}
							})
						);

						// Filtrar y agregar imágenes válidas
						validImages.push(
							...batchResults.filter((img): img is ImageItem => img !== null)
						);

						// Pequeña pausa entre lotes para evitar sobrecarga
						if (i + batchSize < allImages.length) {
							await new Promise((resolve) => setTimeout(resolve, 100));
						}
					}

					if (validImages.length === 0) {
						throw new Error("No se pudieron cargar las imágenes");
					}

					// Encontrar el índice de la imagen actual
					const currentIndex = validImages.findIndex(
						(img: ImageItem) => img.id === item.id
					);

					if (currentIndex === -1) {
						throw new Error("No se encontró la imagen seleccionada");
					}

					console.log(
						`🖼️ Abriendo visor con ${validImages.length} imágenes desde índice ${currentIndex}`
					);
					openViewer(validImages as unknown as FileItem[], currentIndex);
					await updateImageStats(item.id, "view");
				} catch (error) {
					console.error("Error al abrir el visor:", error);
					toast({
						title: "Error",
						description:
							error instanceof Error
								? error.message
								: "No se pudo abrir la imagen",
						variant: "destructive",
					});
				}
			}
		},
		[fileManager.currentItems, openViewer, toast]
	);

	// Cargar URL firmada cuando cambia el item seleccionado
	React.useEffect(() => {
		async function loadImageUrl() {
			if (selectedItems.length !== 1) return;

			try {
				setIsLoading(true);
				setImageError(false);
				const url = await getImageUrl(selectedItems[0].id);
				setImageUrl(url);
			} catch (error) {
				console.error("Error cargando imagen:", error);
				setImageError(true);
			} finally {
				setIsLoading(false);
			}
		}

		loadImageUrl();
	}, [selectedItems]);

	const renderImage = React.useCallback(
		(item: FileItem) => {
			if (isLoading) {
				return (
					<div className="flex flex-col items-center justify-center w-full h-full bg-muted/30">
						<div className="animate-pulse w-full h-full bg-muted/50" />
					</div>
				);
			}

			if (imageError) {
				return (
					<div className="flex flex-col items-center justify-center w-full h-full bg-muted/30 text-muted-foreground">
						<ImageOff className="h-8 w-8 mb-2" />
						<span className="text-xs">Error al cargar la imagen</span>
					</div>
				);
			}

			if (!imageUrl) return null;

			const metadata = getMetadata(item.metadata);
			return (
				<div className="relative w-full h-full">
					<ImageCard
						src={imageUrl}
						alt={item.name}
						width={metadata?.dimensions?.width || 300}
						height={metadata?.dimensions?.height || 300}
						className="w-full h-full object-contain transition-transform rounded-none hover:scale-95 hover:rounded-sm cursor-pointer"
						priority={true}
						onClick={() => handleOpenViewer(item)}
						onError={() => {
							setImageError(true);
							setIsLoading(false);
						}}
					/>
				</div>
			);
		},
		[imageError, isLoading, handleOpenViewer, imageUrl]
	);

	React.useEffect(() => {
		if (selectedItems.length === 1) {
			setIsLoading(true);
			setImageError(false);
		}
	}, [selectedItems]);

	if (!selectedItems.length) {
		return (
			<div className="flex-1 flex items-center justify-center p-4">
				<StatsPanel />
			</div>
		);
	}

	if (selectedItems.length > 1) {
		return (
			<div className="flex-1 flex items-center justify-center p-4">
				<Card className="w-full border-none rounded-none">
					<CardContent className="pt-6">
						<div className="flex flex-col items-center gap-2">
							<div className="flex items-center justify-center w-12 h-12 rounded-none bg-primary/10">
								<ImageIcon className="h-6 w-6 text-primary" />
							</div>
							<p className="text-sm font-medium">
								{selectedItems.length} archivos seleccionados
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const selectedItem = selectedItems[0];

	return (
		<ScrollArea className="h-full">
			<div className="flex flex-col gap-4 p-4">
				{onClose && (
					<div className="absolute top-4 right-4 z-50">
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
							className="hover:bg-accent"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				)}

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-sm font-medium">
							<ImageIcon className="h-4 w-4" />
							Vista previa
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
							{selectedItems.length === 1 && renderImage(selectedItems[0])}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-sm font-medium">
							<Play className="h-4 w-4" />
							Acciones
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleOpenViewer(selectedItem)}
							>
								<Maximize2 className="mr-2 h-4 w-4" />
								Ver
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={async () => {
									try {
										await updateImageStats(selectedItem.id, "download");
										toast({
											title: "Descarga iniciada",
											description: selectedItem.name,
										});
									} catch (error) {
										console.error("Error al descargar:", error);
										toast({
											title: "Error al descargar",
											description: "No se pudo iniciar la descarga",
											variant: "destructive",
										});
									}
								}}
							>
								<Download className="mr-2 h-4 w-4" />
								Descargar
							</Button>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm">
										<Copy className="mr-2 h-4 w-4" />
										Copiar
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem
										onClick={() => {
											navigator.clipboard.writeText(selectedItem.path);
											toast({
												title: "Ruta copiada",
												description:
													"La ruta del archivo ha sido copiada al portapapeles",
											});
										}}
									>
										<Folder className="mr-2 h-4 w-4" />
										Ruta
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => {
											navigator.clipboard.writeText(selectedItem.name);
											toast({
												title: "Nombre copiado",
												description:
													"El nombre del archivo ha sido copiado al portapapeles",
											});
										}}
									>
										<FileText className="mr-2 h-4 w-4" />
										Nombre
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

							<Button
								variant={selectedItem.isFavorite ? "default" : "outline"}
								size="sm"
								onClick={() => {
									// TODO: Implementar toggle favorito
									toast({
										title: selectedItem.isFavorite
											? "Eliminado de favoritos"
											: "Agregado a favoritos",
										description: selectedItem.name,
									});
								}}
							>
								<Heart className="mr-2 h-4 w-4" />
								{selectedItem.isFavorite ? "Quitar favorito" : "Favorito"}
							</Button>

							<Button
								variant={isMarked ? "default" : "outline"}
								size="sm"
								onClick={() => setIsMarked(!isMarked)}
							>
								<Flag className="mr-2 h-4 w-4" />
								{isMarked ? "Desmarcar" : "Marcar"}
							</Button>

							<Button
								variant="destructive"
								size="sm"
								onClick={() => {
									// TODO: Implementar eliminación
									toast({
										title: "Archivo eliminado",
										description: selectedItem.name,
									});
								}}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Eliminar
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-sm font-medium">
							<Info className="h-4 w-4" />
							Información
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Nombre</span>
								<span className="text-sm font-medium">{selectedItem.name}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Creado</span>
								<span className="text-sm font-medium">
									{new Date(selectedItem.createdAt).toLocaleString()}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">
									Modificado
								</span>
								<span className="text-sm font-medium">
									{new Date(selectedItem.updatedAt).toLocaleString()}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</ScrollArea>
	);
}
