"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useAnimate } from "motion/react";
import { FileItem } from "@/types/file-item";
import { ThumbnailSize } from "@/types/ui";
import { cn, formatBytes } from "@/lib/utils";
import { thumbnailService } from "@/services/thumbnail.service";
import { useToast } from "@/components/ui/use-toast";
import { FileContextMenu } from "./context-menu";
import { useImageViewer } from "@/store/image-viewer";
import { ImageCard } from "@/components/features/file-viewer/components/file-viewer-card";
import { useFileSelection } from "@/store/file-selection";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	FileIcon,
	ImageIcon,
	StarIcon,
	TagIcon,
	CalendarIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FileCardProps {
	item: FileItem;
	thumbnailSize?: ThumbnailSize;
	onClick?: (item: FileItem) => void;
	onDoubleClick?: (item: FileItem) => void;
	style?: React.CSSProperties;
	index?: number;
	totalColumns?: number;
}

export function FileCard({
	item,
	thumbnailSize = "medium",
	onClick,
	onDoubleClick,
	style,
	index = 0,
	totalColumns = 3,
}: FileCardProps) {
	const [thumbnail, setThumbnail] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { toast } = useToast();
	const { openViewer } = useImageViewer();
	const { toggleSelectedItem, selectedItems } = useFileSelection();
	const [isHovered, setIsHovered] = useState(false);

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
		<div className="relative w-full h-full overflow-hidden">
			<AnimatePresence mode="wait">
				{isLoading ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.4 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.5 }}
						className="absolute inset-0 bg-gradient-to-b from-primary/50 to-secondary/50"
					/>
				) : error ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="absolute inset-0 bg-red-50/50 flex items-center justify-center"
					>
						<div className="text-red-500 text-xs text-center">
							Error al cargar
						</div>
					</motion.div>
				) : (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.4 }}
						className="relative w-full h-full"
					>
						{/* Fondo blur */}
						<motion.div
							initial={{ opacity: 1 }}
							className="absolute inset-0 overflow-hidden"
							animate={{
								filter:
									isSelected || isHovered
										? "blur(20px) brightness(0.3)"
										: "blur(30px) brightness(0.7)",
							}}
							transition={{ duration: 0.5 }}
							style={{
								backgroundImage: `url(${thumbnail})`,
								backgroundSize: "cover",
								backgroundPosition: "center",
								transform: "scale(1.1) rotate(45deg)",
								filter: "blur(20px) brightness(0.3)"
							}}
						/>

						{/* Imagen principal */}
						<motion.div
							className="absolute inset-0 flex justify-center items-center"
							animate={{
								y: isSelected || isHovered ? "-10%" : "0%",
								scale: isSelected || isHovered ? 0.9 : 1,
							}}
							transition={{ type: "spring", stiffness: 200, damping: 20 }}
						>
							<ImageCard
								src={thumbnail || ""}
								alt={item.name}
								width={item.metadata?.dimensions?.width || 300}
								height={item.metadata?.dimensions?.height || 300}
								className="max-w-[90%] max-h-[80%] object-contain z-10 rounded-none shadow-lg"
								priority={false}
							/>
						</motion.div>

						{/* Información */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{
								opacity: isSelected || isHovered ? 1 : 0,
								y: isSelected || isHovered ? 0 : 20,
							}}
							transition={{ type: "spring", stiffness: 200, damping: 20 }}
							className="absolute inset-x-0 bottom-0 z-20"
						>
							<div className="p-1">
								<p className="text-[9px] text-white/90 font-medium truncate flex items-center gap-1">
									<FileIcon size={10} />
									<span>{item.name}</span>
								</p>
								<div className="grid grid-cols-2 gap-x-2 px-1">
									<div className="space-y-0.5">
										<div className="flex items-center gap-1 text-[8px] text-white/70">
											<ImageIcon size={9} />
											<span>{item.metadata?.extension?.toUpperCase()}</span>
											<span>•</span>
											<span>{formatBytes(item.metadata?.size || 0)}</span>
										</div>
										<div className="flex items-center gap-1 text-[9px] text-white/60">
											<CalendarIcon size={9} />
											<span>
												{format(new Date(item.createdAt), "dd MMM yyyy", {
													locale: es,
												})}
											</span>
										</div>
									</div>
									<div className="text-right space-y-0.5">
										{item.isFavorite && (
											<div className="flex items-center justify-end gap-1 text-[9px] text-white/70">
												<StarIcon size={9} className="text-yellow-400" />
												<span>Favorito</span>
											</div>
										)}
										{item.tags && item.tags[0] && (
											<Badge
												variant="secondary"
												className="h-4 text-[8px] bg-white/10 hover:bg-white/20"
											>
												<TagIcon size={8} className="mr-1" />
												{item.tags[0].name}
											</Badge>
										)}
									</div>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);

	return (
		<FileContextMenu file={item} onAction={handleContextMenuAction}>
			<motion.div
				whileHover={{ scale: 0.95 }}
				whileTap={{ scale: 0.93 }}
				transition={{ type: "spring", stiffness: 400, damping: 25 }}
				onHoverStart={() => setIsHovered(true)}
				onHoverEnd={() => setIsHovered(false)}
				className={cn(
					"relative overflow-hidden",
					isSelected
						? "ring-1 ring-primary ring-inset shadow-lg"
						: "hover:ring-1 hover:ring-white/30 hover:ring-inset",
					"aspect-square"
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
