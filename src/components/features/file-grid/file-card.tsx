"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FileItem } from "@/types/file-item";
import { ThumbnailSize } from "@/types/ui";
import { cn } from "@/lib/utils";
import { thumbnailService } from "@/services/thumbnail.service";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon } from "lucide-react";
import { FileContextMenu } from "./context-menu";
import { useImageViewer } from "@/store/image-viewer";
import { ImageCard } from "@/components/features/file-viewer/components/file-viewer-card";
import { useFileSelection } from "@/store/file-selection";

interface FileCardProps {
	item: FileItem;
	thumbnailSize?: ThumbnailSize;
	onClick?: (item: FileItem) => void;
	onDoubleClick?: (item: FileItem) => void;
	style?: React.CSSProperties;
}

export function FileCard({
	item,
	thumbnailSize = "medium",
	onClick,
	onDoubleClick,
	style,
}: FileCardProps) {
	const [thumbnail, setThumbnail] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { toast } = useToast();
	const { openViewer } = useImageViewer();
	const { toggleSelectedItem, selectedItems } = useFileSelection();

	// Determinar si este item está seleccionado
	const isSelected = selectedItems.some((i) => i.id === item.id);

	const loadThumbnail = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);

			// Calidad basada en el tamaño de la miniatura
			const quality =
				thumbnailSize === "small"
					? "compressed"
					: thumbnailSize === "large"
					? "high"
					: "mid";

			const thumbnailData = await thumbnailService.getThumbnail(
				item.id,
				quality
			);
			setThumbnail(thumbnailData);
			setIsLoading(false);
		} catch (error) {
			console.error("Error cargando miniatura:", error);
			setError(
				error instanceof Error ? error.message : "Error cargando miniatura"
			);
			setIsLoading(false);

			if (
				error instanceof Error &&
				error.message.includes("después de reintentos")
			) {
				toast({
					title: "Error",
					description: "No se pudo cargar la miniatura",
					variant: "destructive",
				});
			}
		}
	}, [item.id, thumbnailSize, toast]);

	useEffect(() => {
		let isMounted = true;

		const init = async () => {
			if (!isMounted) return;
			await loadThumbnail();
		};

		init();

		return () => {
			isMounted = false;
		};
	}, [loadThumbnail]);

	const handleClick = (e: React.MouseEvent) => {
		// Prevenir la selección del DOM cuando se usa shift
		if (e.shiftKey) {
			e.preventDefault();
		}

		// Toggle selección con shift o ctrl/cmd
		toggleSelectedItem(item, e.shiftKey || e.ctrlKey || e.metaKey);

		// Llamar al onClick proporcionado si existe
		if (onClick) onClick(item);
	};

	const handleDoubleClick = (e: React.MouseEvent) => {
		// Prevenir la selección del DOM
		e.preventDefault();

		// Si es una imagen, abrimos el visor
		if (item.metadata?.mimeType?.startsWith("image/")) {
			openViewer([item], 0);
		}
		// Llamamos al onDoubleClick proporcionado si existe
		if (onDoubleClick) onDoubleClick(item);
	};

	// Prevenir la selección del DOM al arrastrar
	const handleMouseDown = (e: React.MouseEvent) => {
		if (e.shiftKey || e.ctrlKey || e.metaKey) {
			e.preventDefault();
		}
	};

	const handleContextMenuAction = useCallback(
		async (action: string, file: FileItem) => {
			try {
				switch (action) {
					case "favorite-toggle":
						// TODO: Implementar toggle de favorito
						break;
					case "collection-new":
						// TODO: Implementar creación de colección nueva utilizando el servicio de colecciones y teniendo de referencia @collections-section
						break;
					case "tag-new":
						// TODO: Implementar creación de etiqueta nueva utilizando el servicio de etiquetas y teniendo de referencia @tags-section
						break;
					case "preview":
						if (file.metadata?.mimeType?.startsWith("image/")) {
							openViewer([file], 0);
						} else {
							onDoubleClick?.(file);
						}
						break;
					case "open":
						// Abrir ubicación del archivo
						break;
					case "download":
						// Descargar archivo
						break;
					case "copy":
						// Copiar la imagen  al portapapeles
						break;
					case "delete":
						// TODO: Implementar eliminación
						break;
					default:
						console.warn("Acción no implementada:", action);
				}
			} catch (error) {
				console.error("Error ejecutando acción:", error);
				toast({
					title: "Error",
					description: "No se pudo completar la acción",
					variant: "destructive",
				});
			}
		},
		[onDoubleClick, toast, openViewer]
	);

	const cardContent = (
		<div className="relative w-full h-full border-none">
			{isLoading ? (
				<Skeleton className="w-full h-full" />
			) : error ? (
				<div className="w-full h-full flex flex-col items-center justify-center bg-muted gap-2">
					<ImageIcon className="h-8 w-8 text-muted-foreground/50" />
					<span className="text-xs text-muted-foreground text-center">
						{error}
					</span>
				</div>
			) : (
				<div className="relative w-full h-full">
							<ImageCard
								src={thumbnail || ""}
								alt={item.name}
								width={item.metadata?.dimensions?.width || 300}
								height={item.metadata?.dimensions?.height || 300}
								className={cn(
									"w-full h-full object-cover ",
									!isSelected && "group-hover:scale-1 border-2 border-primary"
								)}
								priority={false}
							/>
							<div
								className={cn(
									"absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-200",
									"group-hover:opacity-100"
								)}
							>
								<div className="absolute bottom-0 left-0 right-0 p-2">
									<p className="text-xs text-white truncate">{item.name}</p>
								</div>
							</div>

				</div>
			)}
		</div>
	);

	return (
		<FileContextMenu file={item} onAction={handleContextMenuAction}>
			<motion.div
				layout
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.9 }}
				className={cn(
					"relative rounded-xs overflow-hidden border transition-colors select-none p-4",
					isSelected
						? "border-primary ring-2 ring-primary ring-offset-2"
						: "border-border",
					"aspect-square",
					"group hover:border-primary/50"
				)}
				onClick={handleClick}
				onDoubleClick={handleDoubleClick}
				onMouseDown={handleMouseDown}
				style={style}
			>
				{cardContent}
			</motion.div>
		</FileContextMenu>
	);
}
