"use client";

import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { motion } from "motion/react";
import type { FileItem } from "@/types/file-item";
import { cn } from "@/lib/utils";
import { useFileManager } from "@/store/file-manager.store";
import { useImageResources } from "@/store/image-resources.store";
import { useImageViewer } from "@/store/image-viewer.store";
import { getThumbnail } from "@/app/actions/thumbnails.actions";
import { ThumbnailQuality } from "@/config/thumbnail.config";
import { FileContextMenu } from "./context-menu";
import { GRID_CONFIG } from "./file-grid";
import {
	Heart,
	Image as ImageIcon,
	File,
	Calendar,
	HardDrive,
	Star,
	Share2,
	Maximize2,
	BookImage,
	Camera,
	User2,
	MapPin,
	Box,
	Wand2,
	Palette,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImageRenderer } from "./image-renderer";
import { ViewMode } from "@/types/settings";

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
	itemSize?: number;
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
	itemSize = 200,
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
			<div className="relative w-full h-full group">
				<div className="w-full h-full bg-muted/30 rounded-sm">
					{" "}
					{thumbnail ?
						<div className="relative w-full h-full p-2">
							<div
								className="absolute inset-0 bg-cover bg-center blur-lg opacity-80 brightness-20"
								style={{
									backgroundImage: `url(${thumbnail})`,
								}}
							/>
							<ImageRenderer
								src={thumbnail}
								alt={item.name}
								objectFit="contain"
								className={cn(
									"h-full w-full rounded-sm transition-transform duration-200",
									isSelected && "shadow-sm",
									"group-hover:scale-105"
								)}
								onError={() => setError("Error al cargar")}
							/>
						</div>
					:	<div className="flex items-center justify-center h-full">
							<ImageIcon className="h-8 w-8 text-muted-foreground/50 animate-ping " />
						</div>
					}
				</div>
				<div className="absolute top-2 right-2">
					{item.isFavorite && (
						<Star className="h-4 w-4 text-yellow-500 fill-current drop-shadow-lg shadow-black" />
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

	// Memoizar componentes de renderizado
	const masonryView = useMemo(
		() => (
			<div
				className="relative w-full h-full overflow-hidden group"
				style={{
					height: "100%",
				}}
			>
				{thumbnail ?
					<div className="relative w-full h-full">
						<ImageRenderer
							src={thumbnail}
							alt={item.name}
							width={metadata?.dimensions?.width}
							height={metadata?.dimensions?.height}
							className={cn(
								"w-full h-full object-cover rounded-sm transition-all duration-200",
								isSelected && "ring-2 ring-primary ring-offset-2",
								"group-hover:scale-[1.02]"
							)}
							onError={() => setError("Error al cargar")}
							quality={75}
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
					</div>
				:	<div className="flex items-center justify-center h-full bg-muted/50 rounded-sm">
						<ImageIcon className="h-8 w-8 text-muted-foreground/50" />
					</div>
				}
				<div className="absolute top-2 right-2 flex gap-1">
					{item.isFavorite && (
						<Badge variant="secondary" className="bg-red-500/20 text-red-500">
							<Heart className="h-3 w-3 fill-current" />
						</Badge>
					)}
					{item.isPublic && (
						<Badge
							variant="secondary"
							className="bg-green-500/20 text-green-500"
						>
							<Share2 className="h-3 w-3" />
						</Badge>
					)}
					{metadata?.generation && (
						<Badge
							variant="secondary"
							className={cn(
								"text-[10px] h-5 px-1",
								metadata.generation.type === "stable-diffusion" &&
									"bg-blue-500/20 text-blue-500",
								metadata.generation.type === "comfyui" &&
									"bg-green-500/20 text-green-500",
								metadata.generation.type === "midjourney" &&
									"bg-purple-500/20 text-purple-500"
							)}
						>
							<Wand2 className="h-3 w-3" />
						</Badge>
					)}
				</div>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
					className="absolute inset-x-0 bottom-0 p-2 flex flex-col gap-1.5"
				>
					<div className="flex items-start justify-between gap-2">
						<p className="text-xs text-white font-medium truncate flex-1 drop-shadow">
							{item.name}
						</p>
						{metadata?.dimensions && (
							<span className="text-[10px] text-white/90 font-medium drop-shadow">
								{metadata.dimensions.width} × {metadata.dimensions.height}
							</span>
						)}
					</div>
					<div className="flex flex-wrap gap-1">
						{item.tags?.slice(0, 3).map((tag) => (
							<Badge
								key={tag.id}
								variant="secondary"
								className="text-[10px] h-4 px-1 bg-white/10 text-white/90"
							>
								{tag.name}
							</Badge>
						))}
						{item.tags?.length > 3 && (
							<Badge
								variant="secondary"
								className="text-[10px] h-4 px-1 bg-white/10 text-white/90"
							>
								+{item.tags.length - 3}
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-1 text-[10px] text-white/70">
						<div className="flex items-center gap-1">
							<HardDrive className="h-2.5 w-2.5" />
							<span>{formatBytes(item.size)}</span>
						</div>
						{metadata?.colorSpace && (
							<>
								<span>•</span>
								<div className="flex items-center gap-1">
									<Palette className="h-2.5 w-2.5" />
									<span>{metadata.colorSpace}</span>
								</div>
							</>
						)}
					</div>
				</motion.div>
			</div>
		),
		[thumbnail, metadata, isSelected, item, isHovered]
	);

	// Vista de tarjetas mejorada
	const cardsView = useMemo(
		() => (
			<div className="relative w-full h-full bg-card rounded-lg border shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200">
				<div className="flex flex-col h-full">
					<div
						className="relative overflow-hidden"
						style={{
							height:
								metadata?.dimensions ?
									Math.min(
										itemSize /
											(metadata.dimensions.width / metadata.dimensions.height),
										itemSize * 0.6
									)
								:	itemSize * 0.5,
						}}
					>
						{thumbnail ?
							<div className="relative w-full h-full">
								<div
									className="absolute inset-0 bg-cover bg-center blur-sm opacity-30 brightness-50"
									style={{
										backgroundImage: `url(${thumbnail})`,
									}}
								/>
								<ImageRenderer
									src={thumbnail}
									alt={item.name}
									width={metadata?.dimensions?.width}
									height={metadata?.dimensions?.height}
									className={cn(
										"h-full w-full object-contain transition-all duration-200",
										isSelected && "ring-2 ring-primary ring-offset-2",
										"group-hover:scale-[1.02]"
									)}
									onError={() => setError("Error al cargar")}
									quality={75}
								/>
							</div>
						:	<div className="flex items-center justify-center h-full bg-muted">
								<ImageIcon className="h-8 w-8 text-muted-foreground/50" />
							</div>
						}
						<div className="absolute top-2 right-2 flex gap-1">
							{item.isFavorite && (
								<Badge
									variant="secondary"
									className="bg-red-500/20 text-red-500"
								>
									<Heart className="h-3 w-3 fill-current" />
								</Badge>
							)}
							{item.isPublic && (
								<Badge
									variant="secondary"
									className="bg-green-500/20 text-green-500"
								>
									<Share2 className="h-3 w-3" />
								</Badge>
							)}
						</div>
					</div>

					<div className="flex flex-col flex-1 p-3 gap-2">
						<div className="flex items-start justify-between gap-2">
							<h3 className="text-sm font-medium leading-tight truncate">
								{item.name}
							</h3>
							{metadata?.generation && (
								<Badge
									variant="outline"
									className={cn(
										"text-[10px] h-5 px-1.5 shrink-0",
										metadata.generation.type === "stable-diffusion" &&
											"bg-blue-500/10 text-blue-500",
										metadata.generation.type === "comfyui" &&
											"bg-green-500/10 text-green-500",
										metadata.generation.type === "midjourney" &&
											"bg-purple-500/10 text-purple-500"
									)}
								>
									<Wand2 className="h-3 w-3 mr-1" />
									<span className="truncate">
										{metadata.generation.type === "stable-diffusion" ?
											"SD"
										: metadata.generation.type === "comfyui" ?
											"ComfyUI"
										: metadata.generation.type === "midjourney" ?
											"MJ"
										:	metadata.generation.type}
									</span>
								</Badge>
							)}
						</div>

						<div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-muted-foreground">
							<div className="flex items-center gap-1">
								<HardDrive className="h-3 w-3" />
								<span>{formatBytes(item.size)}</span>
							</div>
							{metadata?.dimensions && (
								<div className="flex items-center gap-1">
									<Maximize2 className="h-3 w-3" />
									<span>
										{metadata.dimensions.width} × {metadata.dimensions.height}
									</span>
								</div>
							)}
							<div className="flex items-center gap-1">
								<Calendar className="h-3 w-3" />
								<span>{new Date(item.createdAt).toLocaleDateString()}</span>
							</div>
							{metadata?.colorSpace && (
								<div className="flex items-center gap-1">
									<Palette className="h-3 w-3" />
									<span>{metadata.colorSpace}</span>
								</div>
							)}
						</div>

						<div className="flex flex-col gap-1.5 mt-auto">
							{item.tags?.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{item.tags.slice(0, 3).map((tag) => (
										<Badge
											key={tag.id}
											variant="secondary"
											className="text-[10px] h-4 px-1"
										>
											{tag.name}
										</Badge>
									))}
									{item.tags.length > 3 && (
										<Badge variant="secondary" className="text-[10px] h-4 px-1">
											+{item.tags.length - 3}
										</Badge>
									)}
								</div>
							)}

							<div className="flex flex-wrap gap-1">
								{item.collections?.length > 0 && (
									<Badge
										variant="outline"
										className="text-[10px] h-4 px-1 flex items-center gap-1"
									>
										<BookImage className="h-2.5 w-2.5" />
										<span>{item.collections.length}</span>
									</Badge>
								)}
								{item.albums?.length > 0 && (
									<Badge
										variant="outline"
										className="text-[10px] h-4 px-1 flex items-center gap-1"
									>
										<Camera className="h-2.5 w-2.5" />
										<span>{item.albums.length}</span>
									</Badge>
								)}
								{item.characters?.length > 0 && (
									<Badge
										variant="outline"
										className="text-[10px] h-4 px-1 flex items-center gap-1"
									>
										<User2 className="h-2.5 w-2.5" />
										<span>{item.characters.length}</span>
									</Badge>
								)}
								{item.places?.length > 0 && (
									<Badge
										variant="outline"
										className="text-[10px] h-4 px-1 flex items-center gap-1"
									>
										<MapPin className="h-2.5 w-2.5" />
										<span>{item.places.length}</span>
									</Badge>
								)}
								{item.objects?.length > 0 && (
									<Badge
										variant="outline"
										className="text-[10px] h-4 px-1 flex items-center gap-1"
									>
										<Box className="h-2.5 w-2.5" />
										<span>{item.objects.length}</span>
									</Badge>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		),
		[thumbnail, metadata, isSelected, item, aspectRatio, isHovered, itemSize]
	);

	// Vista de lista mejorada
	const listView = useMemo(
		() => (
			<div className="flex items-center gap-4 w-full hover:bg-accent/50 rounded-sm group px-2">
				<div className="relative h-[72px] aspect-square flex-shrink-0 overflow-hidden rounded-sm">
					{thumbnail ?
						<div className="relative w-full h-full">
							<div
								className="absolute inset-0 bg-cover bg-center blur-sm opacity-30 brightness-50"
								style={{
									backgroundImage: `url(${thumbnail})`,
								}}
							/>
							<ImageRenderer
								src={thumbnail}
								alt={item.name}
								width={72}
								height={72}
								className={cn(
									"h-full w-full object-cover transition-all duration-200",
									isSelected && "ring-2 ring-primary ring-offset-2",
									"group-hover:scale-[1.02]"
								)}
								onError={() => setError("Error al cargar")}
								quality={75}
							/>
						</div>
					:	<div className="flex items-center justify-center h-full bg-muted">
							<File className="h-4 w-4 text-muted-foreground/50" />
						</div>
					}
					<div className="absolute top-0.5 right-0.5 flex gap-0.5">
						{item.isFavorite && (
							<Badge
								variant="secondary"
								className="bg-red-500/20 text-red-500 h-3 w-3 p-0.5"
							>
								<Heart className="h-2 w-2 fill-current" />
							</Badge>
						)}
						{item.isPublic && (
							<Badge
								variant="secondary"
								className="bg-green-500/20 text-green-500 h-3 w-3 p-0.5"
							>
								<Share2 className="h-2 w-2" />
							</Badge>
						)}
					</div>
				</div>

				<div className="flex flex-col min-w-0 flex-1 py-2 gap-1">
					<div className="flex items-center gap-2">
						<p className="text-sm font-medium truncate">{item.name}</p>
						{metadata?.generation && (
							<Badge
								variant="outline"
								className={cn(
									"text-[10px] h-4 px-1 flex items-center gap-1 shrink-0",
									metadata.generation.type === "stable-diffusion" &&
										"bg-blue-500/10 text-blue-500",
									metadata.generation.type === "comfyui" &&
										"bg-green-500/10 text-green-500",
									metadata.generation.type === "midjourney" &&
										"bg-purple-500/10 text-purple-500"
								)}
							>
								<Wand2 className="h-2.5 w-2.5" />
								<span className="truncate">
									{metadata.generation.type === "stable-diffusion" ?
										"SD"
									: metadata.generation.type === "comfyui" ?
										"ComfyUI"
									: metadata.generation.type === "midjourney" ?
										"MJ"
									:	metadata.generation.type}
								</span>
							</Badge>
						)}
					</div>

					<div className="grid grid-cols-4 gap-x-4 text-xs text-muted-foreground">
						<div className="flex items-center gap-1">
							<HardDrive className="h-3 w-3" />
							<span>{formatBytes(item.size)}</span>
						</div>
						{metadata?.dimensions && (
							<div className="flex items-center gap-1">
								<Maximize2 className="h-3 w-3" />
								<span>
									{metadata.dimensions.width} × {metadata.dimensions.height}
								</span>
							</div>
						)}
						<div className="flex items-center gap-1">
							<Calendar className="h-3 w-3" />
							<span>{new Date(item.createdAt).toLocaleDateString()}</span>
						</div>
						{metadata?.colorSpace && (
							<div className="flex items-center gap-1">
								<Palette className="h-3 w-3" />
								<span>{metadata.colorSpace}</span>
							</div>
						)}
					</div>

					<div className="flex items-center gap-2">
						<div className="flex flex-wrap gap-1 max-w-[50%]">
							{item.tags?.slice(0, 2).map((tag) => (
								<Badge
									key={tag.id}
									variant="secondary"
									className="text-[10px] h-4 px-1"
								>
									{tag.name}
								</Badge>
							))}
							{item.tags?.length > 2 && (
								<Badge variant="secondary" className="text-[10px] h-4 px-1">
									+{item.tags.length - 2}
								</Badge>
							)}
						</div>

						<div className="flex items-center gap-1 ml-auto">
							{item.collections?.length > 0 && (
								<Badge
									variant="outline"
									className="text-[10px] h-4 px-1 flex items-center gap-1"
								>
									<BookImage className="h-2.5 w-2.5" />
									<span>{item.collections.length}</span>
								</Badge>
							)}
							{item.albums?.length > 0 && (
								<Badge
									variant="outline"
									className="text-[10px] h-4 px-1 flex items-center gap-1"
								>
									<Camera className="h-2.5 w-2.5" />
									<span>{item.albums.length}</span>
								</Badge>
							)}
							{item.characters?.length > 0 && (
								<Badge
									variant="outline"
									className="text-[10px] h-4 px-1 flex items-center gap-1"
								>
									<User2 className="h-2.5 w-2.5" />
									<span>{item.characters.length}</span>
								</Badge>
							)}
							{item.places?.length > 0 && (
								<Badge
									variant="outline"
									className="text-[10px] h-4 px-1 flex items-center gap-1"
								>
									<MapPin className="h-2.5 w-2.5" />
									<span>{item.places.length}</span>
								</Badge>
							)}
							{item.objects?.length > 0 && (
								<Badge
									variant="outline"
									className="text-[10px] h-4 px-1 flex items-center gap-1"
								>
									<Box className="h-2.5 w-2.5" />
									<span>{item.objects.length}</span>
								</Badge>
							)}
						</div>
					</div>
				</div>
			</div>
		),
		[thumbnail, metadata, isSelected, item, isHovered]
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
