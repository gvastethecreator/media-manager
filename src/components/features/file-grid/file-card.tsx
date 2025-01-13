"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "motion/react";
import type { FileItem, ImageItem } from "@/types/file-item";
import { cn } from "@/lib/utils";
import { ImageCard } from "@/components/features/file-viewer/components/file-viewer-card";
import { useFileManager } from "@/store/file-manager.store";
import { useImageViewer } from "@/store/image-viewer.store";
import { getImageUrl } from "@/app/actions/image.actions";
import { useToast } from "@/components/ui/use-toast";

type FileCardProps = {
	item: FileItem;
	onClick?: (item: FileItem) => void;
	onDoubleClick?: (item: FileItem) => void;
	style?: React.CSSProperties;
	index?: number;
	totalColumns?: number;
	shouldLoad?: boolean;
	hasBeenRendered?: boolean;
	isSelected?: boolean;
};

// Configuración de animaciones mejorada
const springConfig = {
	type: "spring",
	stiffness: 300,
	damping: 30,
	mass: 0.5,
};

// Variantes de animación actualizadas
const variants = {
	initial: { scale: 0.95, opacity: 0 },
	animate: { scale: 1, opacity: 1 },
	hover: {
		scale: 1.02,
		transition: springConfig,
	},
	tap: {
		scale: 0.98,
		transition: springConfig,
	},
	exit: { scale: 0.95, opacity: 0 },
};

const getMetadata = (metadata: string | null) => {
	if (!metadata) return null;
	try {
		return JSON.parse(metadata);
	} catch {
		return null;
	}
};

export function FileCard({
	item,
	onClick,
	onDoubleClick,
	style,
	shouldLoad = false,
	hasBeenRendered = false,
	isSelected = false,
}: FileCardProps) {
	const [thumbnail, setThumbnail] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isHovered, setIsHovered] = useState(false);
	const hasLoaded = useRef(false);
	const { toggleItemSelection } = useFileManager();
	const { openViewer } = useImageViewer();
	const { toast } = useToast();

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			toggleItemSelection(item, false);
			if (onClick) onClick(item);
		},
		[item, onClick, toggleItemSelection]
	);

	const handleDoubleClick = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			try {
				if (onDoubleClick) {
					onDoubleClick(item);
					return;
				}

				const url = await getImageUrl(item.id);
				if (!url) {
					throw new Error("No se pudo obtener la URL de la imagen");
				}

				const metadata = getMetadata(item.metadata);
				const imageToView: ImageItem = {
					...item,
					url,
					src: url,
					alt: item.name,
					mimeType: metadata?.mimeType || "image/jpeg",
				};

				toast({
					title: "Abriendo imagen",
					description: `Cargando ${imageToView.name}...`,
				});

				openViewer([imageToView], 0);
			} catch (error) {
				console.error("Error al abrir imagen:", error);
				toast({
					title: "Error",
					description: "No se pudo abrir la imagen",
					variant: "destructive",
				});
				setError("Error al abrir la imagen");
			}
		},
		[item, onDoubleClick, openViewer, toast]
	);

	const handleHoverStart = useCallback(() => {
		if (!shouldLoad) return;
		setIsHovered(true);
	}, [shouldLoad]);

	const handleHoverEnd = useCallback(() => {
		if (!shouldLoad) return;
		setIsHovered(false);
	}, [shouldLoad]);

	useEffect(() => {
		if (shouldLoad && !hasLoaded.current) {
			setIsLoading(true);
			fetch(`/api/thumbnails/${item.id}?quality=medium`)
				.then((res) => res.json())
				.then((data) => {
					setThumbnail(
						`data:${data.mimeType || "image/webp"};base64,${data.thumbnail}`
					);
					hasLoaded.current = true;
				})
				.catch((err) => {
					console.error("Error cargando thumbnail:", err);
					setError(err.message);
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
	}, [item.id, shouldLoad]);

	return (
		<motion.div
			initial="initial"
			animate="animate"
			exit="exit"
			whileHover="hover"
			whileTap="tap"
			variants={variants}
			className={cn(
				"relative overflow-hidden w-full h-full transition-all duration-200 rounded-sm cursor-pointer",
				isHovered
					? "ring-1 ring-white/30 ring-inset shadow-lg"
					: "hover:ring-1 hover:ring-white/30 hover:ring-inset",
				isSelected && "ring-2 ring-primary"
			)}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			onHoverStart={handleHoverStart}
			onHoverEnd={handleHoverEnd}
			style={{
				...style,
				height: "100%",
				width: "100%",
			}}
			layout
		>
			<div className="relative w-full h-full overflow-hidden">
				{isLoading ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="absolute inset-0 bg-black/50 flex items-center justify-center"
					/>
				) : error ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
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
						exit={{ opacity: 0 }}
						className="relative w-full h-full"
						layout
					>
						<div className="absolute inset-0 flex justify-center items-center">
							{thumbnail && (
								<ImageCard
									src={thumbnail}
									alt={item.name}
									width={getMetadata(item.metadata)?.dimensions?.width || 300}
									height={getMetadata(item.metadata)?.dimensions?.height || 300}
									className={cn(
										"h-full w-full rounded-sm border-1 bg-black/50 border-white/10",
										isSelected && "ring-2 ring-primary ring-offset-2"
									)}
									priority={false}
								/>
							)}
						</div>
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
							className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-2"
						>
							<p className="text-[10px] text-white/90 font-medium truncate">
								{item.name}
							</p>
						</motion.div>
					</motion.div>
				)}
			</div>
		</motion.div>
	);
}
