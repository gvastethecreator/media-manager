"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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

const springConfig = {
	type: "spring",
	stiffness: 200,
	damping: 20,
	mass: 0.2,
	restSpeed: 0.1,
	restDelta: 0.001,
};

const transitionConfig = {
	type: "tween",
	duration: 0.3,
	ease: [0.4, 0, 0.2, 1],
};

const fadeInOutVariants = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: { opacity: 0 },
};

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
	index = 0,
	totalColumns = 3,
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
	const shouldReduceMotion = useReducedMotion();
	const hasLoaded = useRef(false);

	// Motion values optimizados solo para hover/selected
	const scale = useSpring(1, springConfig);
	const y = useSpring(0, springConfig);

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

	const handleHoverStart = useCallback(() => {
		if (!shouldLoad) return;
		setIsHovered(true);
		y.set(-10);
		scale.set(0.95);
	}, [shouldLoad, y, scale]);

	const handleHoverEnd = useCallback(() => {
		if (!shouldLoad) return;
		setIsHovered(false);
		y.set(0);
		scale.set(1);
	}, [shouldLoad, y, scale]);

	return (
		<motion.div
			layout
			layoutId={`file-${item.id}`}
			whileHover="hover"
			whileTap="tap"
			variants={variants}
			className={cn(
				"relative overflow-hidden w-full h-full",
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
				willChange: "transform",
				contain: "size layout",
			}}
		>
			<FileContextMenu file={item} onAction={handleContextMenuAction}>
				<motion.div className="relative w-full h-full overflow-hidden">
					<AnimatePresence mode="wait" initial={false}>
						{isLoading ? (
							<motion.div
								variants={fadeInOutVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								transition={transitionConfig}
								className="absolute inset-0 bg-black/50"
							/>
						) : error ? (
							<motion.div
								variants={fadeInOutVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								transition={transitionConfig}
								className="absolute inset-0 bg-red-50/50 flex items-center justify-center"
							>
								<div className="text-red-500 text-xs text-center">
									Error al cargar
								</div>
							</motion.div>
						) : thumbnail ? (
							<motion.div
								initial={false}
								animate="visible"
								exit="exit"
								transition={transitionConfig}
								className="relative w-full h-full"
							>
								{/* Fondo blur */}
								<motion.div
									className="absolute inset-0 overflow-hidden brightness-10"
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
									transition={{
										duration: 0.4,
										ease: [0.4, 0, 0.2, 1],
									}}
								/>

								{/* Imagen principal */}
								<motion.div
									className="absolute inset-0 flex justify-center items-center"
									animate={{
										scale: isSelected || isHovered ? 0.9 : 1,
										y: isSelected || isHovered ? -10 : 0,
									}}
									transition={springConfig}
								>
									<ImageCard
										src={thumbnail || ""}
										alt={item.name}
										width={item.metadata?.dimensions?.width || 300}
										height={item.metadata?.dimensions?.height || 300}
										className="max-w-[90%] max-h-[75%] z-10 shadow-lg rounded-sm"
										priority={false}
									/>
								</motion.div>

								{/* Información */}
								<motion.div
									animate={{
										opacity: isSelected || isHovered ? 1 : 0,
										y: isSelected || isHovered ? 0 : 10,
									}}
									transition={springConfig}
									className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-2"
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
								</motion.div>
							</motion.div>
						) : null}
					</AnimatePresence>
				</motion.div>
			</FileContextMenu>
		</motion.div>
	);
}
