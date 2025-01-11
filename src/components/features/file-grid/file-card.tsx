/**
 * @component FileCard
 * @description Componente que representa una tarjeta individual de archivo con soporte para miniaturas, interacciones y menú contextual.
 *
 * Flujo de integración:
 * 1. Recibe un FileItem y callbacks desde FileGrid
 * 2. Se integra con ThumbnailService para cargar miniaturas
 * 3. Maneja estados de carga, error y visualización
 * 4. Integra FileContextMenu para acciones contextuales
 * 5. Soporta selección, marcado y favoritos
 *
 * Características:
 * - Lazy loading de miniaturas
 * - Animaciones con Framer Motion
 * - Integración con sistema de eventos
 * - Gestión de caché de thumbnails
 * - Soporte para diferentes calidades de miniatura
 * - Integración con nuevas entidades (Albums, Characters, Places, Objects)
 *
 * @param {FileCardProps} props - Propiedades del componente
 */

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
	BookmarkIcon,
	Camera,
	User2,
	MapPin,
	Box,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	statsEventEmitter,
	STATS_EVENTS,
	type StatsUpdateEvent,
} from "@/services/stats.service";
import { toastService } from "@/services/toast.service";
import { ThumbnailQuality } from "@/types/thumbnails";
import { statsService } from "@/services/stats.service";
import { addImageToCollection } from "@/services/collection.service";
import { addImageToTag } from "@/services/tag.service";
import { addImageToAlbum } from "@/services/album.service";
import { addImageToCharacter } from "@/services/character.service";
import { addImageToPlace } from "@/services/place.service";
import { addImageToObject } from "@/services/object.service";
import { ElectronAPI } from "@/types/electron";
import { useFavorites } from "@/store/favorites";
import { logger } from "@/lib/logger";

declare global {
	interface Window {
		electron?: ElectronAPI;
	}
}

const fileCardLogger = logger.withContext("FileCard");

// Configuración de la caché de thumbnails
const THUMBNAIL_CACHE_CONFIG = {
	maxSize: 200,
	quality: ThumbnailQuality.MEDIUM as const,
	retryDelay: 2000,
	retryAttempts: 2,
};

// Caché de thumbnails usando WeakMap para mejor gestión de memoria
const thumbnailCache = new WeakMap<FileItem, string>();

// Tipos de acciones del menú contextual
type ContextMenuAction =
	| "mark-toggle"
	| "favorite-toggle"
	| "collection-add"
	| "tag-add"
	| "album-add"
	| "character-add"
	| "place-add"
	| "object-add"
	| "preview"
	| "open"
	| "download"
	| "copy"
	| "delete";

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

// Configuración de animaciones optimizada
const springConfig = {
	type: "spring" as const,
	stiffness: 200,
	damping: 20,
	mass: 0.3,
};

// Variantes de animación actualizadas
const variants = {
	hover: {
		scale: 1,
		transition: springConfig,
	},
	selected: {
		scale: 0.96,
		transition: {
			...springConfig,
			stiffness: 400,
			damping: 10,
		},
	},
	marked: {
		scale: 0.96,
		transition: {
			...springConfig,
			stiffness: 400,
			damping: 10,
		},
	},
	tap: {
		scale: 0.96,
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
	const [thumbnail, setThumbnail] = useState<string | null>(
		thumbnailCache.get(item) || null
	);
	const [isLoading, setIsLoading] = useState(!thumbnailCache.has(item));
	const [error, setError] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState(0);
	const { toast } = useToast();
	const { openViewer } = useImageViewer();
	const { toggleItemSelection, selectedItems } = useFileManager();
	const { toggleFavorite } = useFavorites();
	const [isHovered, setIsHovered] = useState(false);
	const [isMarked, setIsMarked] = useState(false);
	const hasLoaded = useRef(false);
	const shouldReduceMotion = useReducedMotion();

	// Memoizar los datos de las entidades relacionadas
	const entityData = useMemo(() => {
		return {
			collections: item.collections || [],
			tags: item.tags || [],
			albums: item.albums || [],
			characters: item.characters || [],
			places: item.places || [],
			objects: item.objects || [],
		};
	}, [
		item.collections,
		item.tags,
		item.albums,
		item.characters,
		item.places,
		item.objects,
	]);

	// Escuchar eventos de cambios con debounce optimizado
	useEffect(() => {
		if (!shouldLoad) return;

		let isSubscribed = true;
		let timeoutId: NodeJS.Timeout;

		const handleStatsUpdate = async (events: StatsUpdateEvent[]) => {
			if (!isSubscribed) return;

			const relevantEvents = new Set<StatsUpdateEvent>([
				"collection_change",
				"tag_change",
				"favorite_change",
				"album_change",
				"character_change",
				"place_change",
				"object_change",
			]);

			const shouldUpdate = events.some(
				(event) =>
					relevantEvents.has(event) &&
					((event === "collection_change" &&
						entityData.collections.length > 0) ||
						(event === "tag_change" && entityData.tags.length > 0) ||
						(event === "favorite_change" && item.isFavorite) ||
						(event === "album_change" && entityData.albums.length > 0) ||
						(event === "character_change" &&
							entityData.characters.length > 0) ||
						(event === "place_change" && entityData.places.length > 0) ||
						(event === "object_change" && entityData.objects.length > 0))
			);

			if (shouldUpdate) {
				clearTimeout(timeoutId);
				timeoutId = setTimeout(async () => {
					if (!isSubscribed) return;
					try {
						toggleItemSelection(item, false);
						if (
							events.includes("favorite_change" as StatsUpdateEvent) &&
							item.isFavorite
						) {
							toastService.favorite.updated();
						}
					} catch (error) {
						console.error("Error actualizando FileCard:", error);
						toastService.system.error("Error actualizando la tarjeta");
					}
				}, 300);
			}
		};

		statsEventEmitter.setMaxListeners(20);
		statsEventEmitter.on(STATS_EVENTS.STATS_UPDATE_NEEDED, handleStatsUpdate);

		return () => {
			isSubscribed = false;
			clearTimeout(timeoutId);
			statsEventEmitter.off(
				STATS_EVENTS.STATS_UPDATE_NEEDED,
				handleStatsUpdate
			);
		};
	}, [item, entityData, shouldLoad, toggleItemSelection]);

	// Memoizar el estado de selección
	const isSelected = useMemo(
		() => selectedItems.some((i) => i.id === item.id),
		[selectedItems, item.id]
	);

	// Función optimizada para cargar thumbnails
	const loadThumbnail = useCallback(async () => {
		if (hasLoaded.current || !shouldLoad) return;

		try {
			setIsLoading(true);
			setError(null);

			// Intentar obtener de la caché primero
			const cachedThumbnail = thumbnailCache.get(item);
			if (cachedThumbnail) {
				setThumbnail(cachedThumbnail);
				setIsLoading(false);
				hasLoaded.current = true;
				return;
			}

			const thumbnailData = await thumbnailService.getThumbnail(
				item.id,
				THUMBNAIL_CACHE_CONFIG.quality
			);

			if (typeof thumbnailData !== "string" || !thumbnailData.length) {
				throw new Error("Formato de miniatura inválido");
			}

			const mimeType = item.metadata?.mimeType || "image/jpeg";
			const dataUrl = `data:${mimeType};base64,${thumbnailData}`;

			// Precargar la imagen
			await new Promise((resolve, reject) => {
				const img = new Image();
				img.onload = resolve;
				img.onerror = () => reject(new Error("Error cargando la imagen"));
				img.src = dataUrl;
			});

			// Guardar en caché y actualizar estado
			thumbnailCache.set(item, dataUrl);
			setThumbnail(dataUrl);
			hasLoaded.current = true;
			setIsLoading(false);
		} catch (error) {
			console.error("Error cargando miniatura:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Error desconocido";
			setError(errorMessage);
			setIsLoading(false);

			// Reintentar con backoff exponencial
			if (
				retryCount < THUMBNAIL_CACHE_CONFIG.retryAttempts &&
				!hasLoaded.current &&
				shouldLoad
			) {
				const delay =
					THUMBNAIL_CACHE_CONFIG.retryDelay * Math.pow(2, retryCount);
				setTimeout(() => {
					setRetryCount((prev) => prev + 1);
					hasLoaded.current = false;
					loadThumbnail();
				}, delay);
			} else if (errorMessage.includes("después de reintentos")) {
				toast({
					title: "Error de miniatura",
					description: "No se pudo cargar la vista previa de la imagen",
					variant: "destructive",
				});
			}
		}
	}, [item, thumbnailSize, toast, shouldLoad, retryCount]);

	useEffect(() => {
		if (shouldLoad) {
			loadThumbnail();
		}
	}, [loadThumbnail, shouldLoad]);

	// Renderizar el icono de la entidad principal
	const renderEntityIcon = useCallback(() => {
		if (entityData.albums?.length > 0)
			return <Camera size={9} className="text-blue-400" />;
		if (entityData.characters?.length > 0)
			return <User2 size={9} className="text-green-400" />;
		if (entityData.places?.length > 0)
			return <MapPin size={9} className="text-yellow-400" />;
		if (entityData.objects?.length > 0)
			return <Box size={9} className="text-purple-400" />;
		if (entityData.collections?.length > 0)
			return <BookmarkIcon size={9} className="text-blue-400" />;
		return null;
	}, [entityData]);

	// Renderizar badges de entidades
	const renderEntityBadges = useCallback(() => {
		const allEntities = [
			...(entityData.tags || []).slice(0, 2).map((tag) => ({
				id: tag.id,
				name: tag.name,
				color: tag.color,
				type: "tag" as const,
			})),
			...(entityData.collections || []).slice(0, 1).map((collection) => ({
				id: collection.id,
				name: collection.name,
				color: collection.color,
				type: "collection" as const,
			})),
			...(entityData.albums || []).slice(0, 1).map((album) => ({
				id: album.id,
				name: album.name,
				color: album.color,
				type: "album" as const,
			})),
			...(entityData.characters || []).slice(0, 1).map((character) => ({
				id: character.id,
				name: character.name,
				color: character.color,
				type: "character" as const,
			})),
			...(entityData.places || []).slice(0, 1).map((place) => ({
				id: place.id,
				name: place.name,
				color: place.color,
				type: "place" as const,
			})),
			...(entityData.objects || []).slice(0, 1).map((object) => ({
				id: object.id,
				name: object.name,
				color: object.color,
				type: "object" as const,
			})),
		].slice(0, 3);

		const totalRemaining =
			(entityData.tags?.length || 0) +
			(entityData.collections?.length || 0) +
			(entityData.albums?.length || 0) +
			(entityData.characters?.length || 0) +
			(entityData.places?.length || 0) +
			(entityData.objects?.length || 0) -
			allEntities.length;

		return (
			<div className="flex flex-wrap justify-end gap-1">
				{allEntities.map((entity) => (
					<Badge
						key={`${entity.type}-${entity.id}`}
						variant="secondary"
						className="h-4 text-[8px] bg-white/10 hover:bg-white/20"
						style={{ borderColor: entity.color }}
					>
						<div
							className="w-1.5 h-1.5 rounded-full mr-1"
							style={{ backgroundColor: entity.color }}
						/>
						{entity.name}
					</Badge>
				))}
				{totalRemaining > 0 && (
					<span className="text-[8px] text-white/50 self-center">
						+{totalRemaining}
					</span>
				)}
			</div>
		);
	}, [entityData]);

	const handleToggleFavorite = useCallback(async () => {
		try {
			await toggleFavorite(item.id);
			fileCardLogger.info("💫 Estado de favorito cambiado:", {
				fileId: item.id,
			});
			statsService.emitFavoriteChange(item.id);
		} catch (error) {
			fileCardLogger.error("❌ Error al cambiar estado de favorito:", {
				error,
			});
		}
	}, [item.id, toggleFavorite]);

	const handleAddToAlbum = useCallback(
		async (albumId: string, file: FileItem) => {
			try {
				await addImageToAlbum(albumId, file.id);
				toast({
					title: "Agregado al álbum",
					description: `${file.name} ha sido agregado al álbum`,
				});
			} catch (error) {
				toast({
					title: "Error",
					description: "No se pudo agregar al álbum",
					variant: "destructive",
				});
			}
		},
		[toast]
	);

	const handleAddToCharacter = useCallback(
		async (characterId: string, file: FileItem) => {
			try {
				await addImageToCharacter(characterId, file.id);
				toast({
					title: "Agregado al personaje",
					description: `${file.name} ha sido agregado al personaje`,
				});
			} catch (error) {
				toast({
					title: "Error",
					description: "No se pudo agregar al personaje",
					variant: "destructive",
				});
			}
		},
		[toast]
	);

	const handleAddToPlace = useCallback(
		async (placeId: string, file: FileItem) => {
			try {
				await addImageToPlace(placeId, file.id);
				toast({
					title: "Agregado al lugar",
					description: `${file.name} ha sido agregado al lugar`,
				});
			} catch (error) {
				toast({
					title: "Error",
					description: "No se pudo agregar al lugar",
					variant: "destructive",
				});
			}
		},
		[toast]
	);

	const handleAddToObject = useCallback(
		async (objectId: string, file: FileItem) => {
			try {
				await addImageToObject(objectId, file.id);
				toast({
					title: "Agregado al objeto",
					description: `${file.name} ha sido agregado al objeto`,
				});
			} catch (error) {
				toast({
					title: "Error",
					description: "No se pudo agregar al objeto",
					variant: "destructive",
				});
			}
		},
		[toast]
	);

	const handleContextMenuAction = useCallback(
		async (action: ContextMenuAction, file: FileItem, data?: any) => {
			try {
				switch (action) {
					case "mark-toggle":
						setIsMarked((prev) => !prev);
						break;
					case "favorite-toggle":
						await handleToggleFavorite();
						break;
					case "collection-add":
						if (!data?.collectionId) break;
						await addImageToCollection(data.collectionId, file.id);
						statsService.emitCollectionChange(file.id);
						break;
					case "tag-add":
						if (!data?.tagId) break;
						await addImageToTag(data.tagId, file.id);
						statsService.emitTagChange(file.id);
						break;
					case "album-add":
						if (!data?.albumId) break;
						await handleAddToAlbum(data.albumId, file);
						statsService.emitAlbumChange(file.id);
						break;
					case "character-add":
						if (!data?.characterId) break;
						await handleAddToCharacter(data.characterId, file);
						statsService.emitCharacterChange(file.id);
						break;
					case "place-add":
						if (!data?.placeId) break;
						await handleAddToPlace(data.placeId, file);
						statsService.emitPlaceChange(file.id);
						break;
					case "object-add":
						if (!data?.objectId) break;
						await handleAddToObject(data.objectId, file);
						statsService.emitObjectChange(file.id);
						break;
					case "preview":
						if (file.metadata?.mimeType?.startsWith("image/")) {
							openViewer([file], 0);
						} else {
							onDoubleClick?.(file);
						}
						break;
					case "open":
						window.electron?.openPath(file.path);
						break;
					case "download":
						window.electron?.downloadFile(file.path);
						break;
					case "copy":
						window.electron?.copyFile(file.path);
						break;
					case "delete":
						if (window.confirm("¿Estás seguro de eliminar este archivo?")) {
							window.electron?.deleteFile(file.path);
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
		[
			toast,
			openViewer,
			toggleItemSelection,
			onDoubleClick,
			handleToggleFavorite,
			handleAddToAlbum,
			handleAddToCharacter,
			handleAddToPlace,
			handleAddToObject,
		]
	);

	return (
		<motion.div
			whileHover={shouldReduceMotion ? undefined : "hover"}
			whileTap={shouldReduceMotion ? undefined : "tap"}
			animate={isSelected ? "selected" : isMarked ? "marked" : ""}
			variants={variants}
			className={cn(
				"relative overflow-hidden w-full h-full transition-[shadow,ring] duration-200 rounded-sm cursor-pointer",
				isSelected
					? "ring-1 ring-primary ring-inset shadow-lg"
					: isMarked
					? "ring-1 ring-warning ring-inset shadow-lg"
					: isHovered
					? "ring-1 ring-white/30 ring-inset"
					: "hover:ring-1 hover:ring-white/30 hover:ring-inset"
			)}
			onClick={(e) => {
				if (e.shiftKey) e.preventDefault();
				toggleItemSelection(item, e.shiftKey || e.ctrlKey || e.metaKey);
				onClick?.(item);
			}}
			onDoubleClick={(e) => {
				e.preventDefault();
				if (item.metadata?.mimeType?.startsWith("image/")) {
					openViewer([item], 0);
				}
				onDoubleClick?.(item);
			}}
			onMouseDown={(e) => {
				if (e.shiftKey || e.ctrlKey || e.metaKey) {
					e.preventDefault();
				}
			}}
			onHoverStart={() => shouldLoad && setIsHovered(true)}
			onHoverEnd={() => shouldLoad && setIsHovered(false)}
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
							{/* Favorito */}
							{item.isFavorite && (
								<div
									className={cn(
										"absolute top-2 right-2 z-30 transition-transform duration-200 bg-black/30 p-1 rounded-full",
										isSelected || isMarked || isHovered
											? "scale-110"
											: "scale-100"
									)}
								>
									<StarIcon
										size={14}
										className="text-yellow-400 drop-shadow-lg"
									/>
								</div>
							)}

							{/* Imagen */}
							<div
								className={cn(
									"absolute inset-0 flex justify-center items-center transition-transform duration-200",
									isSelected || isMarked || isHovered
										? "scale-75 -translate-y-[20px]"
										: ""
								)}
							>
								<ImageCard
									src={thumbnail}
									alt={item.name}
									width={item.metadata?.dimensions?.width || 300}
									height={item.metadata?.dimensions?.height || 300}
									className="h-full w-full rounded-sm border-1 bg-black/50 border-white/10"
									priority={false}
								/>
							</div>

							{/* Información */}
							<div
								className={cn(
									"absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-2 transition-[opacity,transform] duration-200",
									isSelected || isMarked || isHovered
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
										{/* Entidad Principal */}
										{renderEntityIcon() && (
											<div className="flex items-center justify-end gap-1 text-[9px] text-white/70">
												{renderEntityIcon()}
												<span>
													{entityData.collections[0]?.name ||
														entityData.albums[0]?.name ||
														entityData.characters[0]?.name ||
														entityData.places[0]?.name ||
														entityData.objects[0]?.name}
												</span>
											</div>
										)}
										{/* Badges */}
										{renderEntityBadges()}
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
