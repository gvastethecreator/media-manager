"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
	motion,
	AnimatePresence,
	useReducedMotion,
	useSpring,
	useMotionValue,
} from "motion/react";
import { FileItem } from "@/types/file-item";
import { ThumbnailSize } from "@/types/ui";
import { cn, formatBytes } from "@/lib/utils";
import { thumbnailService } from "@/services/thumbnail.service";
import { useToast } from "@/components/ui/use-toast";
import { FileContextMenu } from "./context-menu";
import { useImageViewer } from "@/store/image-viewer";
import { ImageCard } from "@/components/features/file-viewer/components/file-viewer-card";
import { useFileManager } from "@/store/file-manager";
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
	shouldLoad?: boolean;
	hasBeenRendered?: boolean;
}

// Configuración de animaciones simplificada
const springConfig = {
	type: "spring",
	stiffness: 300,
	damping: 30,
	mass: 0.5,
};

// Solo mantenemos las variantes esenciales y las optimizamos
const variants = {
	hover: {
		scale: 0.95,
		transition: springConfig,
	},
	tap: {
		scale: 0.93,
		transition: {
			...springConfig,
			stiffness: 400,
			damping: 10,
		},
	},
};

export function FileCard({
	item,
	thumbnailSize = "medium",
	onClick,
	onDoubleClick,
	style,
	shouldLoad = false,
	hasBeenRendered = false,
}: FileCardProps) {
	const [thumbnail, setThumbnail] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { toast } = useToast();
	const { openViewer } = useImageViewer();
	const { toggleItemSelection, selectedItems } = useFileManager();
	const [isHovered, setIsHovered] = useState(false);
	const hasLoaded = useRef(false);

	// Determinar si este item está seleccionado
	const isSelected = selectedItems.some((i) => i.id === item.id);

	const loadThumbnail = useCallback(async () => {
		if (hasLoaded.current || !shouldLoad) return;

		try {
			setIsLoading(true);
			setError(null);

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
			hasLoaded.current = true;
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
	}, [item.id, thumbnailSize, toast, shouldLoad]);

	useEffect(() => {
		if (shouldLoad) {
			loadThumbnail();
		}
	}, [loadThumbnail, shouldLoad]);

	const handleClick = (e: React.MouseEvent) => {
		// Prevenir la selección del DOM cuando se usa shift
		if (e.shiftKey) {
			e.preventDefault();
		}

		// Toggle selección con shift o ctrl/cmd
		toggleItemSelection(item, e.shiftKey || e.ctrlKey || e.metaKey);

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
		async (action: string, file: FileItem, data?: any) => {
			try {
				switch (action) {
					case "favorite-toggle":
						try {
							// Actualizar el estado local inmediatamente (optimista)
							const newFavoriteState = !file.isFavorite;
							const updatedFile = { ...file, isFavorite: newFavoriteState };
							toggleItemSelection(updatedFile, false);

							// Mostrar feedback inmediato
							toast({
								title: newFavoriteState
									? "Agregado a favoritos"
									: "Eliminado de favoritos",
								description: `${file.name} ha sido ${
									newFavoriteState ? "agregado a" : "eliminado de"
								} favoritos`,
							});

							// Realizar la actualización en el servidor en segundo plano
							const response = await fetch(`/api/images/${file.id}/favorite`, {
								method: "POST",
								headers: {
									"Content-Type": "application/json",
								},
								body: JSON.stringify({ isFavorite: newFavoriteState }),
							});

							if (!response.ok) {
								// Si falla, revertir el cambio local
								toggleItemSelection(
									{ ...file, isFavorite: !newFavoriteState },
									false
								);
								throw new Error("Error al actualizar favorito");
							}
						} catch (error) {
							console.error("Error toggling favorite:", error);
							toast({
								title: "Error",
								description: "No se pudo actualizar el estado de favorito",
								variant: "destructive",
							});
						}
						break;

					case "collection-add":
						try {
							if (!data?.collectionId)
								throw new Error("ID de colección no proporcionado");

							// Mostrar feedback inmediato
							toast({
								title: "Agregando a colección",
								description: "Procesando...",
							});

							const response = await fetch(
								`/api/collections/${data.collectionId}/files`,
								{
									method: "POST",
									headers: {
										"Content-Type": "application/json",
									},
									body: JSON.stringify({ fileId: file.id }),
								}
							);

							const responseData = await response.json().catch(() => null);

							if (!response.ok) {
								throw new Error(
									responseData?.error || "Error al agregar a la colección"
								);
							}

							if (!responseData?.success || !responseData?.collection) {
								throw new Error("Respuesta inválida del servidor");
							}

							// Actualizar el estado local si es necesario
							const updatedFile = {
								...file,
								collections: [
									...(file.collections || []),
									{
										id: responseData.collection.id,
										name: responseData.collection.name,
										emoji: responseData.collection.emoji,
										color: responseData.collection.color || "#000000",
									},
								],
							};
							toggleItemSelection(updatedFile, false);

							toast({
								title: "Agregado a la colección",
								description: `${file.name} ha sido agregado a ${responseData.collection.name}`,
							});
						} catch (error) {
							console.error("Error adding to collection:", error);
							toast({
								title: "Error",
								description:
									error instanceof Error
										? error.message
										: "No se pudo agregar a la colección",
								variant: "destructive",
							});
						}
						break;

					case "tag-add":
						try {
							if (!data?.tagId)
								throw new Error("ID de etiqueta no proporcionado");

							// Mostrar feedback inmediato
							toast({
								title: "Agregando etiqueta",
								description: "Procesando...",
							});

							const response = await fetch(`/api/tags/${data.tagId}/files`, {
								method: "POST",
								headers: {
									"Content-Type": "application/json",
								},
								body: JSON.stringify({ fileId: file.id }),
							});

							const responseData = await response.json().catch(() => null);

							if (!response.ok) {
								throw new Error(
									responseData?.error || "Error al agregar la etiqueta"
								);
							}

							if (!responseData?.success || !responseData?.tag) {
								throw new Error("Respuesta inválida del servidor");
							}

							// Actualizar el estado local si es necesario
							const updatedFile = {
								...file,
								tags: [
									...(file.tags || []),
									{
										id: responseData.tag.id,
										name: responseData.tag.name,
										color: responseData.tag.color || "#000000",
									},
								],
							};
							toggleItemSelection(updatedFile, false);

							toast({
								title: "Etiqueta agregada",
								description: `${file.name} ha sido etiquetado con ${responseData.tag.name}`,
							});
						} catch (error) {
							console.error("Error adding tag:", error);
							toast({
								title: "Error",
								description:
									error instanceof Error
										? error.message
										: "No se pudo agregar la etiqueta",
								variant: "destructive",
							});
						}
						break;

					case "preview":
						if (file.metadata?.mimeType?.startsWith("image/")) {
							openViewer([file], 0);
						} else {
							onDoubleClick?.(file);
						}
						break;

					case "open":
						try {
							const response = await fetch(`/api/files/${file.id}/location`, {
								method: "POST",
							});

							if (!response.ok) throw new Error("Error al abrir ubicación");

							toast({
								title: "Ubicación abierta",
								description: "Se ha abierto la ubicación del archivo",
							});
						} catch (error) {
							console.error("Error opening location:", error);
							toast({
								title: "Error",
								description: "No se pudo abrir la ubicación",
								variant: "destructive",
							});
						}
						break;

					case "download":
						try {
							const response = await fetch(`/api/files/${file.id}/download`);
							if (!response.ok) throw new Error("Error al descargar archivo");

							const blob = await response.blob();
							const url = window.URL.createObjectURL(blob);
							const a = document.createElement("a");
							a.href = url;
							a.download = file.name;
							document.body.appendChild(a);
							a.click();
							window.URL.revokeObjectURL(url);
							document.body.removeChild(a);

							toast({
								title: "Descarga iniciada",
								description: `Se ha iniciado la descarga de ${file.name}`,
							});
						} catch (error) {
							console.error("Error downloading file:", error);
							toast({
								title: "Error",
								description: "No se pudo descargar el archivo",
								variant: "destructive",
							});
						}
						break;

					case "copy":
						try {
							// Intentar obtener la imagen original primero
							let response = await fetch(`/api/files/${file.id}/raw`);

							// Si falla, intentar con el thumbnail
							if (!response.ok) {
								const thumbnailUrl = `/api/thumbnails/${file.id}?quality=high`;
								response = await fetch(thumbnailUrl);
							}

							if (!response.ok) {
								throw new Error("No se pudo obtener la imagen");
							}

							const blob = await response.blob();

							// Función para intentar copiar usando el portapapeles
							const tryClipboardCopy = async () => {
								if (navigator.clipboard && navigator.clipboard.write) {
									try {
										// Asegurarnos de que el documento tiene el foco
										window.focus();
										await navigator.clipboard.write([
											new ClipboardItem({
												[blob.type]: blob,
											}),
										]);
										return true;
									} catch (clipboardError) {
										console.warn(
											"Error copying image to clipboard:",
											clipboardError
										);
										return false;
									}
								}
								return false;
							};

							// Intentar copiar usando el portapapeles
							const clipboardSuccess = await tryClipboardCopy();
							if (clipboardSuccess) {
								toast({
									title: "Copiado",
									description: "Imagen copiada al portapapeles",
								});
								return;
							}

							// Si no se pudo usar el portapapeles, intentar con el método fallback
							try {
								const url = window.URL.createObjectURL(blob);
								const img = document.createElement("img");
								img.src = url;

								// Crear un contenedor temporal
								const container = document.createElement("div");
								container.style.position = "fixed";
								container.style.pointerEvents = "none";
								container.style.opacity = "0";
								container.appendChild(img);
								document.body.appendChild(container);

								// Esperar a que la imagen se cargue
								await new Promise((resolve) => {
									img.onload = resolve;
								});

								// Seleccionar y copiar
								const range = document.createRange();
								range.selectNode(img);
								window.getSelection()?.removeAllRanges();
								window.getSelection()?.addRange(range);

								// Forzar el foco en el documento
								window.focus();
								const success = document.execCommand("copy");

								// Limpiar
								window.getSelection()?.removeAllRanges();
								document.body.removeChild(container);
								window.URL.revokeObjectURL(url);

								if (success) {
									toast({
										title: "Copiado",
										description: "Imagen copiada al portapapeles",
									});
									return;
								}
							} catch (fallbackError) {
								console.warn(
									"Error using fallback copy method:",
									fallbackError
								);
							}

							// Si todo lo anterior falló, copiar el path como último recurso
							await navigator.clipboard.writeText(file.path);
							toast({
								title: "Copiado",
								description:
									"Ruta del archivo copiada al portapapeles (no se pudo copiar la imagen)",
								variant: "destructive",
							});
						} catch (error) {
							console.error("Error copying to clipboard:", error);
							toast({
								title: "Error",
								description: "No se pudo copiar al portapapeles",
								variant: "destructive",
							});
						}
						break;

					case "delete":
						try {
							const response = await fetch(`/api/files/${file.id}`, {
								method: "DELETE",
							});

							if (!response.ok) throw new Error("Error al eliminar archivo");

							toast({
								title: "Archivo eliminado",
								description: `${file.name} ha sido eliminado`,
							});
						} catch (error) {
							console.error("Error deleting file:", error);
							toast({
								title: "Error",
								description: "No se pudo eliminar el archivo",
								variant: "destructive",
							});
						}
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
		[onDoubleClick, toast, openViewer, toggleItemSelection]
	);

	const handleHoverStart = useCallback(() => {
		if (!shouldLoad) return;
		setIsHovered(true);
	}, [shouldLoad]);

	const handleHoverEnd = useCallback(() => {
		if (!shouldLoad) return;
		setIsHovered(false);
	}, [shouldLoad]);

	return (
		<motion.div
			whileHover="hover"
			whileTap="tap"
			variants={variants}
			className={cn(
				"relative overflow-hidden w-full h-full transition-[shadow,ring] duration-200",
				isSelected || isHovered
					? "ring-1 ring-primary ring-inset shadow-lg"
					: "hover:ring-1 hover:ring-white/30 hover:ring-inset"
			)}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			onMouseDown={handleMouseDown}
			onHoverStart={handleHoverStart}
			onHoverEnd={handleHoverEnd}
			style={{
				...style,
				height: "100%",
				width: "100%",
			}}
		>
			<FileContextMenu file={item} onAction={handleContextMenuAction}>
				<div className="relative w-full h-full overflow-hidden">
					{isLoading ? (
						<div className="absolute inset-0 bg-black/50 flex items-center justify-center" />
					) : error ? (
						<div className="absolute inset-0 bg-red-50/50 flex items-center justify-center">
							<div className="text-red-500 text-xs text-center">
								Error al cargar
							</div>
						</div>
					) : thumbnail ? (
						<div className="relative w-full h-full">
							{/* Fondo blur */}
							<div
								className={cn(
									"absolute inset-0 overflow-hidden brightness-10 transition-[filter] duration-200",
									isSelected || isHovered
										? "blur-[20px] brightness-[0.3]"
										: "blur-[30px] brightness-[0.7]"
								)}
								style={{
									backgroundImage: `url(${thumbnail})`,
									backgroundSize: "cover",
									backgroundPosition: "center",
									transform: "scale(1.1) rotate(45deg)",
								}}
							/>

							{/* Imagen principal */}
							<div
								className={cn(
									"absolute inset-0 flex justify-center items-center transition-transform duration-200",
									isSelected || isHovered ? "scale-90 -translate-y-[10px]" : ""
								)}
							>
								<ImageCard
									src={thumbnail || ""}
									alt={item.name}
									width={item.metadata?.dimensions?.width || 300}
									height={item.metadata?.dimensions?.height || 300}
									className="max-w-[90%] max-h-[75%] z-10 shadow-lg rounded-sm"
									priority={false}
								/>
							</div>

							{/* Información */}
							<div
								className={cn(
									"absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-2 transition-[opacity,transform] duration-200",
									isSelected || isHovered
										? "opacity-100 translate-y-0"
										: "opacity-0 translate-y-2"
								)}
							>
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
						</div>
					) : null}
				</div>
			</FileContextMenu>
		</motion.div>
	);
}
