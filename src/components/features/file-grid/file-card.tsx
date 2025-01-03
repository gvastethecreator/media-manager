"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
	motion,
	AnimatePresence,
	useReducedMotion,
	LazyMotion,
	domAnimation,
	m,
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
	shouldLoad?: boolean;
}

const springConfig = {
	type: "spring",
	stiffness: 300,
	damping: 30,
	mass: 0.5,
	restSpeed: 2,
	restDelta: 0.01,
};

const transitionConfig = {
	type: "tween",
	duration: 0.2,
	ease: "easeOut",
};

const fadeInOutVariants = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: { opacity: 0 },
};

const cardVariants = {
	initial: { scale: 0.95, opacity: 0 },
	animate: {
		scale: 1,
		opacity: 1,
		transition: springConfig,
	},
	exit: {
		scale: 0.95,
		opacity: 0,
		transition: { duration: 0.2 },
	},
	hover: {
		scale: 0.95,
		transition: springConfig,
	},
	tap: {
		scale: 0.93,
		transition: springConfig,
	},
};

export function FileCard({
	item,
	thumbnailSize = "medium",
	onClick,
	onDoubleClick,
	style,
	index = 0,
	totalColumns = 3,
	shouldLoad = false,
}: FileCardProps) {
	const [thumbnail, setThumbnail] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { toast } = useToast();
	const { openViewer } = useImageViewer();
	const { toggleSelectedItem, selectedItems } = useFileSelection();
	const [isHovered, setIsHovered] = useState(false);
	const shouldReduceMotion = useReducedMotion();
	const hasLoaded = useRef(false);

	// Motion values con valores iniciales correctos
	const scale = useSpring(1, springConfig);
	const opacity = useSpring(0, springConfig);
	const y = useSpring(20, springConfig);

	// Determinar si este item está seleccionado
	const isSelected = selectedItems.some((i) => i.id === item.id);

	const loadThumbnail = useCallback(async () => {
		if (hasLoaded.current || !shouldLoad) return;

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
		let isMounted = true;

		const init = async () => {
			if (!isMounted) return;
			await loadThumbnail();
		};

		if (shouldLoad) {
			init();
		}

		return () => {
			isMounted = false;
		};
	}, [loadThumbnail, shouldLoad]);

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

	// Cleanup y reset de animaciones mejorado
	useEffect(() => {
		if (!shouldLoad) {
			setIsHovered(false);
			scale.set(1, false);
			opacity.set(0, false);
			y.set(20, false);
		}
		return () => {
			scale.stop();
			opacity.stop();
			y.stop();
		};
	}, [shouldLoad, scale, opacity, y]);

	const handleHoverStart = useCallback(() => {
		if (!shouldLoad) return;
		setIsHovered(true);
		y.set(-20);
		scale.set(0.9);
		opacity.set(1);
	}, [shouldLoad, y, scale, opacity]);

	const handleHoverEnd = useCallback(() => {
		if (!shouldLoad) return;
		setIsHovered(false);
		y.set(20);
		scale.set(1);
		opacity.set(0);
	}, [shouldLoad, y, scale, opacity]);

	return (
		<motion.div
			layout
			initial={false}
			animate={{
				scale: isHovered ? 0.95 : 1,
			}}
			whileHover={{ scale: shouldReduceMotion ? 1 : 0.95 }}
			whileTap={{ scale: shouldReduceMotion ? 1 : 0.93 }}
			transition={springConfig}
			onHoverStart={handleHoverStart}
			onHoverEnd={handleHoverEnd}
			className={cn(
				"relative overflow-hidden w-full h-full",
				isSelected
					? "ring-1 ring-primary ring-inset shadow-lg"
					: "hover:ring-1 hover:ring-white/30 hover:ring-inset",
				"aspect-square"
			)}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			onMouseDown={handleMouseDown}
			style={{
				...style,
				height: "100%",
				width: "100%",
				willChange: "transform",
				contain: "size layout",
			}}
		>
			<FileContextMenu file={item} onAction={handleContextMenuAction}>
				<div className="relative w-full h-full overflow-hidden">
					<AnimatePresence mode="wait" initial={false}>
						{isLoading ? (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 0.4 }}
								exit={{ opacity: 0 }}
								transition={transitionConfig}
								className="absolute inset-0 bg-gradient-to-b from-black/50 to-secondary/50"
							/>
						) : error ? (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={transitionConfig}
								className="absolute inset-0 bg-red-50/50 flex items-center justify-center"
							>
								<div className="text-red-500 text-xs text-center">
									Error al cargar
								</div>
							</motion.div>
						) : thumbnail ? (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={transitionConfig}
								className="relative w-full h-full"
							>
								{/* Fondo blur */}
								<motion.div
									className="absolute inset-0 overflow-hidden"
									style={{
										backgroundImage: `url(${thumbnail})`,
										backgroundSize: "cover",
										backgroundPosition: "center",
										transform: "scale(1.1) rotate(45deg)",
										filter:
											isSelected || isHovered
												? "blur(20px) brightness(0.3)"
												: "blur(30px) brightness(0.7)",
									}}
									transition={springConfig}
								/>

								{/* Imagen principal */}
								<motion.div
									className="absolute inset-0 flex justify-center items-center"
									style={{
										y,
										scale: isSelected || isHovered ? 0.9 : scale,
									}}
									transition={springConfig}
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
									style={{
										opacity,
										y: isSelected || isHovered ? 0 : 20,
									}}
									transition={springConfig}
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
						) : null}
					</AnimatePresence>
				</div>
			</FileContextMenu>
		</motion.div>
	);
}
