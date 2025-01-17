"use client";

import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { motion } from "motion/react";
import type { FileItem } from "@/types/file-item";
import { cn } from "@/lib/utils";
import { useFileManager } from "@/store/file-manager.store";
import { useImageResources } from "@/store/image-resources.store";
import { useImageViewer } from "@/store/image-viewer.store";
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

const FileCard = memo(function FileCard({
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

	const metadata = useMemo(() => getMetadata(item.metadata), [item.metadata]);
	const aspectRatio = useMemo(
		() =>
			metadata?.dimensions?.width && metadata?.dimensions?.height ?
				metadata.dimensions.width / metadata.dimensions.height
			:	1,
		[metadata]
	);

	// Optimizar carga de thumbnails
	useEffect(() => {
		if (!shouldLoad || hasLoaded.current || !item.id) return;

		const controller = new AbortController();
		const signal = controller.signal;

		const loadThumbnail = async () => {
			try {
				setIsLoading(true);
				const data = await getThumbnail(item.id, ThumbnailQuality.MEDIUM);
				if (!data || signal.aborted) return;

				setThumbnail(
					`data:${data.mimeType || "image/webp"};base64,${data.thumbnail}`
				);
				hasLoaded.current = true;
			} catch (err: unknown) {
				if (!signal.aborted) {
					console.error("Error loading thumbnail:", err);
					setError(err instanceof Error ? err.message : "Error desconocido");
				}
			} finally {
				if (!signal.aborted) {
					setIsLoading(false);
				}
			}
		};

		if (loadingRef.current) {
			clearTimeout(loadingRef.current);
		}

		loadingRef.current = setTimeout(() => {
			loadThumbnail();
		}, 100);

		return () => {
			controller.abort();
			if (loadingRef.current) {
				clearTimeout(loadingRef.current);
			}
		};
	}, [item.id, shouldLoad]);

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			fileManager.toggleItemSelection(item, false);
			onClick?.(item);
		},
		[item, onClick, fileManager]
	);

	const handleDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			if (item.type === "image") {
				openViewer([item]);
			}
			onDoubleClick?.(item);
		},
		[item, onDoubleClick, openViewer]
	);

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

	// Memoizar componentes de renderizado
	const gridView = useMemo(
		() => (
			<div className="relative w-full h-full overflow-hidden group">
				<div
					className="w-full h-full bg-muted/50 rounded-sm"
					style={{
						aspectRatio,
					}}
				>
					{thumbnail ?
						<div className="relative w-full h-full">
							<div
								className="absolute inset-0 bg-cover bg-center blur-md opacity-25"
								style={{
									backgroundImage: `url(${thumbnail})`,
								}}
							/>
							<ImageRenderer
								src={thumbnail}
								alt={item.name}
								width={metadata?.dimensions?.width || 300}
								height={metadata?.dimensions?.height || 300}
								className={cn(
									"h-full w-full object-contain rounded-sm transition-transform duration-200",
									isSelected && "ring-2 ring-primary ring-offset-2",
									"group-hover:scale-105"
								)}
								onError={() => setError("Error al cargar")}
								quality={75}
							/>
						</div>
					:	<div className="flex items-center justify-center h-full">
							<ImageIcon className="h-8 w-8 text-muted-foreground/50" />
						</div>
					}
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
						<EntityGroup
							items={item.objects}
							type="object"
							emoji="🎯"
							max={2}
						/>
					</div>
				</motion.div>
			</div>
		),
		[thumbnail, metadata, isSelected, item.name, aspectRatio]
	);

	const masonryView = useMemo(
		() => (
			<div className="relative w-full overflow-hidden group">
				<div
					className="w-full bg-muted/50 rounded-sm"
					style={{
						aspectRatio: aspectRatio,
					}}
				>
					{thumbnail ?
						<div className="relative w-full h-full">
							<div
								className="absolute inset-0 bg-cover bg-center blur-md opacity-25"
								style={{
									backgroundImage: `url(${thumbnail})`,
								}}
							/>
							<ImageRenderer
								src={thumbnail}
								alt={item.name}
								width={metadata?.dimensions?.width || 300}
								height={metadata?.dimensions?.height || 300}
								className={cn(
									"h-full w-full object-contain rounded-sm transition-transform duration-200",
									isSelected && "ring-2 ring-primary ring-offset-2",
									"group-hover:scale-105"
								)}
								onError={() => setError("Error al cargar")}
								quality={75}
							/>
						</div>
					:	<div className="flex items-center justify-center h-full">
							<ImageIcon className="h-8 w-8 text-muted-foreground/50" />
						</div>
					}
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
						<EntityGroup
							items={item.objects}
							type="object"
							emoji="🎯"
							max={2}
						/>
					</div>
				</motion.div>
			</div>
		),
		[thumbnail, metadata, isSelected, item.name, aspectRatio]
	);

	const cardsView = useMemo(
		() => (
			<div className="relative w-full bg-card rounded-lg border shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200">
				<div className="flex flex-col h-full">
					<div className="relative aspect-[4/3] overflow-hidden">
						{thumbnail ?
							<div className="relative w-full h-full">
								<div
									className="absolute inset-0 bg-cover bg-center blur-md opacity-25"
									style={{
										backgroundImage: `url(${thumbnail})`,
									}}
								/>
								<ImageRenderer
									src={thumbnail}
									alt={item.name}
									width={metadata?.dimensions?.width || 300}
									height={metadata?.dimensions?.height || 300}
									className={cn(
										"h-full w-full object-contain transition-transform duration-200",
										isSelected && "ring-2 ring-primary ring-offset-2",
										"group-hover:scale-105"
									)}
									onError={() => setError("Error al cargar")}
									quality={75}
								/>
							</div>
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
							<EntityGroup
								items={item.albums}
								type="album"
								emoji="📸"
								max={3}
							/>
							<EntityGroup
								items={item.characters}
								type="character"
								emoji="👤"
								max={3}
							/>
							<EntityGroup
								items={item.places}
								type="place"
								emoji="📍"
								max={3}
							/>
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
		),
		[thumbnail, metadata, isSelected, item.name]
	);

	const listView = useMemo(
		() => (
			<div className="flex items-center gap-4 w-full p-2 hover:bg-accent/50 rounded-sm group">
				<div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-sm">
					{thumbnail ?
						<ImageRenderer
							src={thumbnail}
							alt={item.name}
							width={48}
							height={48}
							className={cn(
								"h-full w-full object-cover transition-transform duration-200",
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
					<EntityGroup items={item.objects} type="object" emoji="��" max={1} />
				</div>
			</div>
		),
		[thumbnail, metadata, isSelected, item.name]
	);

	const currentView = useMemo(() => {
		switch (viewMode) {
			case "grid":
				return gridView;
			case "masonry":
				return masonryView;
			case "cards":
				return cardsView;
			case "list":
				return listView;
			default:
				return null;
		}
	}, [viewMode, gridView, masonryView, cardsView, listView]);

	return (
		<motion.div
			initial="initial"
			animate="animate"
			exit="exit"
			variants={variants}
			whileHover="hover"
			whileTap="tap"
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			className={cn(
				"relative",
				viewMode === "grid" && "h-full",
				viewMode === "masonry" && "w-full",
				viewMode === "cards" && "w-full",
				viewMode === "list" && "w-full"
			)}
			style={style}
		>
			<FileContextMenu file={item} onAction={handleContextMenuAction}>
				{currentView}
			</FileContextMenu>
		</motion.div>
	);
});

export { FileCard };

// Utility function to format bytes
function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
