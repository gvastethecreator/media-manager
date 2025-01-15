"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "motion/react";
import type { FileItem } from "@/types/file-item";
import { cn } from "@/lib/utils";
import { useFileManager } from "@/store/file-manager.store";
import { useImageResources } from "@/store/image-resources.store";
import { useImageViewer } from "@/store/image-viewer.store";
import { getImageUrl } from "@/app/actions/image.actions";
import { useToast } from "@/components/ui/use-toast";
import { getThumbnail } from "@/app/actions/thumbnails.actions";
import { ThumbnailQuality } from "@/config/thumbnail.config";
import { FileContextMenu } from "./context-menu";
import {
	Heart,
	Image as ImageIcon,
	File,
	Calendar,
	HardDrive,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ViewMode } from "./types";
import { ImageRenderer } from "./image-renderer";

type FileCardProps = {
	item: FileItem;
	onClick?: (item: FileItem) => void;
	onDoubleClick?: (item: FileItem) => void;
	style?: React.CSSProperties;
	index?: number;
	totalColumns?: number;
	shouldLoad?: boolean;
	isSelected?: boolean;
	viewMode: ViewMode;
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

const EntityBadge = ({
	type,
	name,
	emoji = "🏷️",
	className,
}: {
	type: string;
	name: string;
	emoji?: string;
	className?: string;
}) => (
	<Badge
		variant="secondary"
		className={cn(
			"text-[10px] h-4 px-1 flex items-center gap-1 whitespace-nowrap",
			className
		)}
	>
		<span className="text-[10px]">{emoji}</span>
		<span className="truncate">{name}</span>
	</Badge>
);

const EntityGroup = ({
	items,
	type,
	emoji,
	max = 2,
}: {
	items: any[];
	type: string;
	emoji: string;
	max?: number;
}) => {
	if (!items?.length) return null;

	return (
		<div className="flex gap-1 flex-wrap">
			{items.slice(0, max).map((item) => (
				<EntityBadge
					key={item.id}
					type={type}
					name={item.name}
					emoji={item.emoji || emoji}
				/>
			))}
			{items.length > max && (
				<Badge variant="secondary" className="text-[10px] h-4 px-1">
					+{items.length - max}
				</Badge>
			)}
		</div>
	);
};

export function FileCard({
	item,
	onClick,
	onDoubleClick,
	style,
	shouldLoad = false,
	isSelected = false,
	viewMode,
}: FileCardProps) {
	const [thumbnail, setThumbnail] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isHovered, setIsHovered] = useState(false);
	const hasLoaded = useRef(false);
	const loadingRef = useRef<NodeJS.Timeout | null>(null);
	const fileManager = useFileManager();
	const imageResources = useImageResources();
	const { openViewer } = useImageViewer();
	const { toast } = useToast();

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			fileManager.toggleItemSelection(item, false);
			if (onClick) onClick(item);
		},
		[item, onClick, fileManager]
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

				toast({
					title: "Abriendo imagen",
					description: `Cargando ${item.name}...`,
				});

				// Obtener las imágenes del directorio actual
				const currentItems = fileManager.currentItems || [];
				const allImages = currentItems.filter((i: FileItem) => {
					const meta = getMetadata(i.metadata);
					return i.type === "image" || meta?.mimeType?.startsWith("image/");
				});

				if (allImages.length === 0) {
					throw new Error("No hay imágenes disponibles");
				}

				const currentIndex = allImages.findIndex((img) => img.id === item.id);
				if (currentIndex === -1) {
					throw new Error("No se encontró la imagen seleccionada");
				}

				openViewer(allImages, currentIndex);

				// Precargar recursos en segundo plano
				setTimeout(() => {
					imageResources.preloadResources(
						allImages
							.slice(currentIndex + 1, currentIndex + 4)
							.map((img) => img.id)
					);
				}, 1000);
			} catch (error) {
				console.error("Error al abrir imagen:", error);
				toast({
					title: "Error",
					description:
						error instanceof Error ?
							error.message
						:	"No se pudo abrir la imagen",
					variant: "destructive",
				});
			}
		},
		[item, onDoubleClick, openViewer, toast, fileManager, imageResources]
	);

	const handleHoverStart = useCallback(() => {
		if (!shouldLoad) return;
		setIsHovered(true);
	}, [shouldLoad]);

	const handleHoverEnd = useCallback(() => {
		if (!shouldLoad) return;
		setIsHovered(false);
	}, [shouldLoad]);

	// Cargar thumbnail con delay para evitar llamadas innecesarias
	useEffect(() => {
		if (shouldLoad && !hasLoaded.current) {
			if (loadingRef.current) {
				clearTimeout(loadingRef.current);
			}

			loadingRef.current = setTimeout(() => {
				setIsLoading(true);
				getThumbnail(item.id, ThumbnailQuality.MEDIUM)
					.then((data) => {
						if (!data) return;
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
			}, 100); // Pequeño delay para evitar llamadas innecesarias
		}

		return () => {
			if (loadingRef.current) {
				clearTimeout(loadingRef.current);
			}
		};
	}, [item.id, shouldLoad]);

	const handleContextMenuAction = useCallback(
		async (action: string, file: FileItem) => {
			switch (action) {
				case "preview":
					handleDoubleClick(new MouseEvent("doubleclick") as any);
					break;
				case "mark-toggle":
					// Implementar marcado
					break;
				case "open":
					// Implementar apertura de ubicación
					break;
				case "download":
					// Implementar descarga
					break;
				case "copy":
					// Implementar copiado
					break;
				case "delete":
					// Implementar eliminación
					break;
				default:
					break;
			}
		},
		[handleDoubleClick]
	);

	const renderGridView = () => (
		<div className="relative w-full h-full overflow-hidden group">
			<div className="aspect-square w-full">
				{thumbnail && (
					<ImageRenderer
						src={thumbnail}
						alt={item.name}
						width={getMetadata(item.metadata)?.dimensions?.width || 300}
						height={getMetadata(item.metadata)?.dimensions?.height || 300}
						className={cn(
							"h-full w-full rounded-sm transition-transform duration-200",
							isSelected && "ring-2 ring-primary ring-offset-2",
							"group-hover:scale-105"
						)}
						onError={() => setError("Error al cargar")}
						quality={75}
					/>
				)}
			</div>
			<div className="absolute top-2 right-2">
				{item.isFavorite && (
					<Heart className="h-4 w-4 text-red-500 fill-current drop-shadow-lg" />
				)}
			</div>
			<motion.div
				initial={{ opacity: 0, y: "100%" }}
				animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : "100%" }}
				className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 flex flex-col gap-2"
			>
				<div className="flex items-start gap-2">
					<p className="text-sm text-white font-medium truncate flex-1">
						{item.name}
					</p>
				</div>
				<div className="flex flex-col gap-1.5">
					<div className="flex items-center gap-2 text-xs text-white/70">
						<HardDrive className="h-3 w-3" />
						<span>{formatBytes(item.size)}</span>
						<span>•</span>
						<Calendar className="h-3 w-3" />
						<span>{new Date(item.createdAt).toLocaleDateString()}</span>
					</div>
					<EntityGroup items={item.tags} type="tag" emoji="🏷️" max={2} />
					<EntityGroup
						items={item.collections}
						type="collection"
						emoji="📁"
						max={2}
					/>
					<EntityGroup items={item.albums} type="album" emoji="📸" max={2} />
					<EntityGroup
						items={item.characters}
						type="character"
						emoji="👤"
						max={2}
					/>
					<EntityGroup items={item.places} type="place" emoji="📍" max={2} />
					<EntityGroup items={item.objects} type="object" emoji="🎯" max={2} />
				</div>
			</motion.div>
		</div>
	);

	const renderMasonryView = () => (
		<div className="relative w-full overflow-hidden group">
			<div className="aspect-[3/4] w-full">
				{thumbnail && (
					<ImageRenderer
						src={thumbnail}
						alt={item.name}
						width={getMetadata(item.metadata)?.dimensions?.width || 300}
						height={getMetadata(item.metadata)?.dimensions?.height || 300}
						className={cn(
							"h-full w-full rounded-sm transition-all duration-200",
							isSelected && "ring-2 ring-primary ring-offset-2",
							"group-hover:scale-102"
						)}
						onError={() => setError("Error al cargar")}
						quality={75}
					/>
				)}
			</div>
			<div className="absolute top-2 right-2">
				{item.isFavorite && (
					<Heart className="h-4 w-4 text-red-500 fill-current drop-shadow-lg" />
				)}
			</div>
			<motion.div
				initial={{ opacity: 0, y: "100%" }}
				animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : "100%" }}
				className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 flex flex-col gap-2"
			>
				<div className="flex items-start gap-2">
					<p className="text-sm text-white font-medium truncate flex-1">
						{item.name}
					</p>
				</div>
				<div className="flex flex-col gap-1.5">
					<div className="flex items-center gap-2 text-xs text-white/70">
						<HardDrive className="h-3 w-3" />
						<span>{formatBytes(item.size)}</span>
						<span>•</span>
						<Calendar className="h-3 w-3" />
						<span>{new Date(item.createdAt).toLocaleDateString()}</span>
					</div>
					<EntityGroup items={item.tags} type="tag" emoji="🏷️" max={3} />
					<EntityGroup
						items={item.collections}
						type="collection"
						emoji="📁"
						max={2}
					/>
					<EntityGroup items={item.albums} type="album" emoji="📸" max={2} />
					<EntityGroup
						items={item.characters}
						type="character"
						emoji="👤"
						max={2}
					/>
					<EntityGroup items={item.places} type="place" emoji="📍" max={2} />
					<EntityGroup items={item.objects} type="object" emoji="🎯" max={2} />
				</div>
			</motion.div>
		</div>
	);

	const renderCardsView = () => (
		<div className="relative w-full bg-card rounded-lg border shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200">
			<div className="flex flex-col h-full">
				<div className="relative aspect-[4/3] overflow-hidden">
					{thumbnail ?
						<ImageRenderer
							src={thumbnail}
							alt={item.name}
							width={getMetadata(item.metadata)?.dimensions?.width || 300}
							height={getMetadata(item.metadata)?.dimensions?.height || 300}
							className={cn(
								"h-full w-full transition-transform duration-200",
								isSelected && "ring-2 ring-primary ring-offset-2",
								"group-hover:scale-105"
							)}
							onError={() => setError("Error al cargar")}
							quality={75}
						/>
					:	<div className="flex items-center justify-center h-full bg-muted">
							<ImageIcon className="h-8 w-8 text-muted-foreground/50" />
						</div>
					}
					<div className="absolute top-2 right-2">
						{item.isFavorite && (
							<Heart className="h-4 w-4 text-red-500 fill-current drop-shadow-lg" />
						)}
					</div>
				</div>

				<div className="flex flex-col p-4 gap-3">
					<div className="flex items-start justify-between gap-2">
						<h3 className="text-sm font-medium leading-tight truncate">
							{item.name}
						</h3>
					</div>

					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<HardDrive className="h-3 w-3" />
						<span>{formatBytes(item.size)}</span>
						<span>•</span>
						<Calendar className="h-3 w-3" />
						<span>{new Date(item.createdAt).toLocaleDateString()}</span>
					</div>

					<div className="flex flex-col gap-2">
						<EntityGroup items={item.tags} type="tag" emoji="🏷️" max={4} />
						<EntityGroup
							items={item.collections}
							type="collection"
							emoji="📁"
							max={3}
						/>
						<EntityGroup items={item.albums} type="album" emoji="📸" max={3} />
						<EntityGroup
							items={item.characters}
							type="character"
							emoji="👤"
							max={3}
						/>
						<EntityGroup items={item.places} type="place" emoji="📍" max={3} />
						<EntityGroup
							items={item.objects}
							type="object"
							emoji="🎯"
							max={3}
						/>
					</div>
				</div>
			</div>
		</div>
	);

	const renderListView = () => (
		<div className="flex items-center gap-4 w-full p-2 hover:bg-accent/50 rounded-sm group">
			<div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-sm">
				{thumbnail ?
					<ImageRenderer
						src={thumbnail}
						alt={item.name}
						width={48}
						height={48}
						className={cn(
							"h-full w-full transition-transform duration-200",
							isSelected && "ring-2 ring-primary ring-offset-2",
							"group-hover:scale-105"
						)}
						onError={() => setError("Error al cargar")}
						quality={75}
					/>
				:	<div className="flex items-center justify-center h-full bg-muted">
						<File className="h-4 w-4 text-muted-foreground/50" />
					</div>
				}
				<div className="absolute top-0.5 right-0.5">
					{item.isFavorite && (
						<Heart className="h-3 w-3 text-red-500 fill-current drop-shadow-lg" />
					)}
				</div>
			</div>

			<div className="flex flex-col min-w-0 flex-1 gap-1">
				<div className="flex items-center gap-2">
					<p className="text-sm font-medium truncate">{item.name}</p>
				</div>
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<HardDrive className="h-3 w-3" />
					<span>{formatBytes(item.size)}</span>
					<span>•</span>
					<Calendar className="h-3 w-3" />
					<span>{new Date(item.createdAt).toLocaleDateString()}</span>
				</div>
			</div>

			<div className="flex items-center gap-2 ml-auto">
				<EntityGroup items={item.tags} type="tag" emoji="🏷️" max={2} />
				<EntityGroup
					items={item.collections}
					type="collection"
					emoji="📁"
					max={1}
				/>
				<EntityGroup items={item.albums} type="album" emoji="📸" max={1} />
				<EntityGroup
					items={item.characters}
					type="character"
					emoji="👤"
					max={1}
				/>
				<EntityGroup items={item.places} type="place" emoji="📍" max={1} />
				<EntityGroup items={item.objects} type="object" emoji="🎯" max={1} />
			</div>
		</div>
	);

	return (
		<FileContextMenu file={item} onAction={handleContextMenuAction}>
			<motion.div
				initial="initial"
				animate="animate"
				exit="exit"
				whileHover="hover"
				whileTap="tap"
				variants={variants}
				className={cn(
					"relative overflow-hidden w-full transition-all duration-200 cursor-pointer",
					viewMode === "grid" && "h-full rounded-sm hover:z-10",
					viewMode === "masonry" && "rounded-sm hover:z-10",
					viewMode === "cards" && "h-auto hover:z-10",
					viewMode === "list" && "h-auto"
				)}
				onClick={handleClick}
				onDoubleClick={handleDoubleClick}
				onHoverStart={handleHoverStart}
				onHoverEnd={handleHoverEnd}
				style={{
					...style,
					willChange: "transform",
					contain: "layout style paint",
				}}
				layout
			>
				{viewMode === "grid" && renderGridView()}
				{viewMode === "masonry" && renderMasonryView()}
				{viewMode === "cards" && renderCardsView()}
				{viewMode === "list" && renderListView()}
			</motion.div>
		</FileContextMenu>
	);
}

// Utility function to format bytes
function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
