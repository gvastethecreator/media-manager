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
	viewMode?: "grid" | "list";
	thumbnailSize?: ThumbnailSize;
	onClick?: (item: FileItem) => void;
	onDoubleClick?: (item: FileItem) => void;
	style?: React.CSSProperties;
}

export function FileCard({
	item,
	viewMode = "grid",
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
					case "preview":
						if (file.metadata?.mimeType?.startsWith("image/")) {
							openViewer([file], 0);
						} else {
							onDoubleClick?.(file);
						}
						break;
					case "open":
						// Abrir ubicación del archivo
						window.electron?.openPath(file.path);
						break;
					case "download":
						// Descargar archivo
						window.electron?.downloadFile(file.path);
						break;
					case "share":
						// Copiar enlace al portapapeles
						await navigator.clipboard.writeText(file.path);
						toast({
							title: "Enlace copiado",
							description:
								"La ruta del archivo ha sido copiada al portapapeles",
						});
						break;
					case "copy":
						// Copiar archivo al portapapeles
						window.electron?.copyFile(file.path);
						break;
					case "collection-new":
						// TODO: Implementar creación de colección
						break;
					case "favorite-toggle":
						// TODO: Implementar toggle de favorito
						break;
					case "tag-new":
						// TODO: Implementar creación de etiqueta
						break;
					case "rename":
						// TODO: Implementar renombrado
						break;
					case "delete":
						// TODO: Implementar eliminación
						break;
					case "info":
						// TODO: Implementar vista de propiedades
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
		<div className="relative w-full h-full">
			{isLoading ? (
				<Skeleton className="w-full h-full" />
			) : error ? (
				<div className="w-full h-full flex flex-col items-center justify-center bg-muted gap-2 p-4">
					<ImageIcon className="h-8 w-8 text-muted-foreground/50" />
					<span className="text-xs text-muted-foreground text-center">
						{error}
					</span>
				</div>
			) : (
				<div className="relative w-full h-full">
					{thumbnail ? (
						<>
							<ImageCard
								src={thumbnail}
								alt={item.name}
								width={item.metadata?.dimensions?.width || 300}
								height={item.metadata?.dimensions?.height || 300}
								className={cn(
									"w-full h-full",
									!isSelected && "group-hover:scale-105"
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
						</>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-muted">
							<ImageIcon className="h-8 w-8 text-muted-foreground/50" />
						</div>
					)}
					{viewMode === "list" && (
						<div className="absolute inset-0 flex items-center px-4">
							<span className="text-sm truncate">{item.name}</span>
						</div>
					)}
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
					"relative rounded-lg overflow-hidden border transition-colors select-none",
					isSelected
						? "border-primary ring-2 ring-primary ring-offset-2"
						: "border-border",
					viewMode === "grid" ? "aspect-square" : "h-12",
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
