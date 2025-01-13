"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FileItem } from "@/types/file-item";
import { statsService } from "@/services/stats.service";
import type { CacheInvalidationEvent } from "@/services/events.service";
import { thumbnailService } from "@/services/thumbnail.service";
import { ThumbnailQuality } from "@/types/thumbnails";
import { useImageViewer } from "@/store/image-viewer";
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

interface DetailsPanelProps {
	selectedItems: FileItem[];
	onClose?: () => void;
}

export function DetailsPanel({ selectedItems, onClose }: DetailsPanelProps) {
	const [imageError, setImageError] = React.useState(false);
	const [isMarked, setIsMarked] = React.useState(false);
	const [isLoading, setIsLoading] = React.useState(false);
	const { openViewer } = useImageViewer();
	const { toast } = useToast();

	const handleOpenViewer = React.useCallback(
		(item: FileItem) => {
			if (
				item.type === "image" ||
				item.metadata?.mimeType?.startsWith("image/")
			) {
				openViewer([item], 0);
			}
		},
		[openViewer]
	);

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

			return (
				<div className="relative w-full h-full">
					<ImageCard
						src={`/api/images/${item.id}/original`}
						alt={item.name}
						width={item.metadata?.dimensions?.width || 300}
						height={item.metadata?.dimensions?.height || 300}
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
		[imageError, isLoading, handleOpenViewer]
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
								onClick={() => {
									// TODO: Implementar descarga
									toast({
										title: "Descarga iniciada",
										description: selectedItem.name,
									});
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
