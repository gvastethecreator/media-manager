"use client";

import { getImageUrl } from "@/app/actions/images/image.actions";
import { getThumbnail } from "@/app/actions/thumbnails/thumbnails.actions";
import { Button } from "@/components/ui/button";
import { ImageFallback } from "@/components/ui/image-fallback";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { ThumbnailQuality } from "@/lib/config/thumbnail.config";
import { cn } from "@/lib/utils";
import { useImageResources } from "@/store/image-resources.store";
import {
	Copy,
	Download,
	Image as ImageIcon,
	RotateCcw,
	X,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface ImageItem {
	id: string;
	name: string;
	type: string;
	path: string;
	size: number;
	width: number | null;
	height: number | null;
	url?: string;
	thumbnail: string | null;
	src?: string;
	alt?: string;
	mimeType?: string;
	metadata: string | null;
	parsedMetadata?: {
		dimensions?: {
			width: number;
			height: number;
		};
		mimeType?: string;
		isLocal?: boolean;
	};
}

interface FileViewerProps {
	images: ImageItem[];
	initialIndex?: number;
	isOpen: boolean;
	onClose: () => void;
}

const _isLocalFile = (url: string) => url.startsWith("file://");

// Configuración de animaciones del visor
const VIEWER_CONFIG = {
	type: "spring" as const,
	stiffness: 200,
	damping: 25,
	mass: 0.8,
};

// Configuración de dimensiones fijas para thumbnails
const THUMBNAIL_SIZES = {
	normal: {
		width: 80,
		height: 80,
	},
	active: {
		width: 96,
		height: 96,
	},
} as const;

// Configuración de animaciones mejorada y suavizada para thumbnails
const THUMBNAIL_ANIMATION = {
	type: "spring" as const,
	stiffness: 300,
	damping: 30,
	mass: 0.8,
	duration: 0.2,
};

// Cache optimizado con tiempo de vida
const _imageCache = new Map<
	string,
	{
		url: string;
		timestamp: number;
		expiresIn: number;
	}
>();

// Cache optimizado para thumbnails
const thumbnailCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const getThumbnailFromCache = (id: string): string | null => {
	const cached = thumbnailCache.get(id);
	if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
		return cached.url;
	}
	thumbnailCache.delete(id); // Limpiar entradas expiradas
	return null;
};

const setThumbnailInCache = (id: string, url: string) => {
	thumbnailCache.set(id, { url, timestamp: Date.now() });

	// Limpiar caché si es muy grande
	if (thumbnailCache.size > 100) {
		const now = Date.now();
		for (const [key, value] of thumbnailCache.entries()) {
			if (now - value.timestamp > CACHE_DURATION) {
				thumbnailCache.delete(key);
			}
		}
	}
};

// Función de debounce mejorada
const _createDebounce = <T,>(wait: number) => {
	let timeout: NodeJS.Timeout;
	let currentPromise: Promise<T> | null = null;

	return (fn: () => Promise<T>) => {
		if (currentPromise) {
			return currentPromise;
		}

		currentPromise = new Promise((resolve) => {
			if (timeout) {
				clearTimeout(timeout);
			}
			timeout = setTimeout(async () => {
				const result = await fn();
				currentPromise = null;
				resolve(result);
			}, wait);
		});

		return currentPromise;
	};
};

// Validación de src mejorada
const isValidSrc = (src: string | undefined | null): src is string => {
	return typeof src === "string" && src.trim() !== "";
};

// Componente para thumbnail individual optimizado
function ThumbnailItem({
	image,
	isActive,
	onClick,
	images,
}: {
	image: ImageItem;
	isActive: boolean;
	onClick: () => void;
	images: ImageItem[];
}) {
	const imageResources = useImageResources();
	const [isLoading, setIsLoading] = useState(true);
	const [thumbnail, setThumbnail] = useState<string | null>(() => {
		if (!image?.id) {
			return null;
		}
		const cached = getThumbnailFromCache(image.id);
		return cached || null;
	});
	const [error, setError] = useState<string | null>(null);
	const _isMounted = useRef<boolean>(true);
	const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Efecto para cargar el thumbnail con debounce
	useEffect(() => {
		let mounted = true;

		const loadThumbnail = async () => {
			if (!image?.id) {
				return;
			}

			// Si ya tenemos el thumbnail en caché, lo usamos
			const cached = getThumbnailFromCache(image.id);
			if (cached) {
				setThumbnail(cached);
				setIsLoading(false);
				return;
			}

			try {
				setIsLoading(true);

				// Debounce la carga
				if (loadingTimeoutRef.current) {
					clearTimeout(loadingTimeoutRef.current);
				}

				loadingTimeoutRef.current = setTimeout(async () => {
					const url = await imageResources.getThumbnail(image.id);

					if (mounted && url) {
						setThumbnailInCache(image.id, url);
						setThumbnail(url);
						setError(null);
					}
				}, 100);
			} catch (error) {
				if (mounted) {
					console.error("Error loading thumbnail:", error);
					setError("Error al cargar miniatura");
				}
			} finally {
				if (mounted) {
					setIsLoading(false);
				}
			}
		};

		loadThumbnail();

		return () => {
			mounted = false;
			if (loadingTimeoutRef.current) {
				clearTimeout(loadingTimeoutRef.current);
			}
		};
	}, [image?.id, imageResources]);

	// Precargar thumbnails adyacentes cuando está activo
	useEffect(() => {
		if (isActive && image?.id && images?.length) {
			const preloadAdjacentThumbnails = async () => {
				const currentIndex = images.findIndex((img) => img.id === image.id);
				const adjacentIndexes = [
					currentIndex - 2,
					currentIndex - 1,
					currentIndex + 1,
					currentIndex + 2,
				].filter((i) => i >= 0 && i < images.length);

				for (const index of adjacentIndexes) {
					const adjacentImage = images[index];
					if (adjacentImage?.id && !getThumbnailFromCache(adjacentImage.id)) {
						try {
							const url = await imageResources.getThumbnail(adjacentImage.id);
							if (url) {
								setThumbnailInCache(adjacentImage.id, url);
							}
						} catch (error) {
							console.warn("Error preloading thumbnail:", error);
						}
					}
				}
			};

			preloadAdjacentThumbnails();
		}
	}, [isActive, image?.id, imageResources, images]);

	const baseClassName = cn(
		"relative mx-1 overflow-hidden rounded-md transition-shadow duration-200",
		isActive &&
			"ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg"
	);

	if (isLoading) {
		return (
			<motion.div
				className={baseClassName}
				animate={{
					width: isActive
						? THUMBNAIL_SIZES.active.width
						: THUMBNAIL_SIZES.normal.width,
					height: isActive
						? THUMBNAIL_SIZES.active.height
						: THUMBNAIL_SIZES.normal.height,
				}}
				transition={THUMBNAIL_ANIMATION}
			>
				<Skeleton className="w-full h-full rounded-md" />
			</motion.div>
		);
	}

	if (error || !thumbnail) {
		return (
			<motion.div
				className={baseClassName}
				animate={{
					width: isActive
						? THUMBNAIL_SIZES.active.width
						: THUMBNAIL_SIZES.normal.width,
					height: isActive
						? THUMBNAIL_SIZES.active.height
						: THUMBNAIL_SIZES.normal.height,
				}}
				transition={THUMBNAIL_ANIMATION}
			>
				<div className="w-full h-full flex items-center justify-center bg-muted">
					<ImageIcon className="w-6 h-6 text-muted-foreground/50" />
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			className={baseClassName}
			animate={{
				width: isActive
					? THUMBNAIL_SIZES.active.width
					: THUMBNAIL_SIZES.normal.width,
				height: isActive
					? THUMBNAIL_SIZES.active.height
					: THUMBNAIL_SIZES.normal.height,
				opacity: isActive ? 1 : 0.8,
			}}
			transition={THUMBNAIL_ANIMATION}
			onClick={onClick}
			whileHover={{
				opacity: 1,
				scale: 1.02,
			}}
			whileTap={{ scale: 0.98 }}
		>
			<div className="w-full h-full">
				{isValidSrc(thumbnail) ? (
					<img
						src={thumbnail}
						alt={image.name}
						className="w-full h-full object-cover"
						loading="lazy"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center bg-muted">
						<ImageIcon className="w-6 h-6 text-muted-foreground/50" />
					</div>
				)}
			</div>
			{isActive && (
				<motion.div
					className="absolute inset-0 bg-primary/10 pointer-events-none"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.2 }}
				/>
			)}
		</motion.div>
	);
}

export function FileViewer({
	images,
	initialIndex = 0,
	isOpen,
	onClose,
}: FileViewerProps) {
	const { toast } = useToast();
	const [index, setIndex] = useState(initialIndex);
	const [scale, setScale] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
	const [originalUrls, setOriginalUrls] = useState<Record<string, string>>({});
	const [_loadingStates, _setLoadingStates] = useState<Record<string, boolean>>(
		{}
	);
	const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
	const containerRef = useRef<HTMLDivElement>(null);
	const imageRef = useRef<HTMLImageElement>(null);

	// Get current image
	const currentImage = images[index];

	// Reset state when opening viewer
	useEffect(() => {
		if (isOpen) {
			setIndex(initialIndex);
			resetView();
			setIsLoading(true);
			setError(null);
		}
	}, [isOpen, initialIndex]);

	// Validate images and index
	useEffect(() => {
		if (!images || !images.length) {
			setError("No hay imágenes disponibles");
			return;
		}
		if (index < 0 || index >= images.length) {
			setIndex(0);
		}
	}, [images, index]);

	// Cargar solo las URLs necesarias inicialmente
	useEffect(() => {
		if (!isOpen || !images.length) {
			return;
		}

		const loadInitialUrls = async () => {
			const currentImage = images[index];
			const nextImage = images[(index + 1) % images.length];
			const prevImage = images[index > 0 ? index - 1 : images.length - 1];

			const imagesToLoad = [currentImage, nextImage, prevImage];
			const urls: Record<string, string> = {};

			try {
				await Promise.all(
					imagesToLoad.map(async (img) => {
						if (!img || urls[img.id]) {
							return;
						}
						try {
							const url = await getImageUrl(img.id);
							urls[img.id] = url;
							console.info(`URL inicial cargada para ${img.name}:`, url);
						} catch (error) {
							console.error(
								`Error cargando URL inicial para ${img.name}:`,
								error
							);
						}
					})
				);
				setOriginalUrls((prev) => ({ ...prev, ...urls }));
			} catch (error) {
				console.error("Error cargando URLs iniciales:", error);
				setError("Error cargando imágenes iniciales");
			}
		};

		loadInitialUrls();
	}, [isOpen, index, images]);

	// Precargar siguiente/anterior cuando cambia el índice
	useEffect(() => {
		if (!isOpen || !images.length) {
			return;
		}

		const preloadAdjacentImages = async () => {
			const nextIndex = (index + 1) % images.length;
			const prevIndex = index > 0 ? index - 1 : images.length - 1;
			const imagesToPreload = [images[nextIndex], images[prevIndex]].filter(
				(img) => img && !originalUrls[img.id]
			);

			if (!imagesToPreload.length) {
				return;
			}

			try {
				const urls: Record<string, string> = {};
				await Promise.all(
					imagesToPreload.map(async (img) => {
						if (!img) {
							return;
						}
						try {
							const url = await getImageUrl(img.id);
							urls[img.id] = url;
							console.info(`URL precargada para ${img.name}:`, url);
						} catch (error) {
							console.warn(`Error precargando URL para ${img.name}:`, error);
						}
					})
				);
				setOriginalUrls((prev) => ({ ...prev, ...urls }));
			} catch (error) {
				console.warn("Error en precarga de URLs:", error);
			}
		};

		const timer = setTimeout(preloadAdjacentImages, 300);
		return () => clearTimeout(timer);
	}, [isOpen, index, images, originalUrls]);

	// Keyboard navigation
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
			if (e.key === "ArrowLeft") {
				setIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
			}
			if (e.key === "ArrowRight") {
				setIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
			}
			if (e.key === "0" || e.key === "r") {
				resetView();
			}
			if (e.key === "+") {
				handleZoom(1.2);
			}
			if (e.key === "-") {
				handleZoom(0.8);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, images.length, onClose]);

	// Preload adjacent images with original URLs
	useEffect(() => {
		const preloadImage = (imageUrl: string) => {
			if (!imageUrl || loadedImages.has(imageUrl)) {
				return;
			}

			const img = new Image();
			img.src = imageUrl;
			img.onload = () => {
				setLoadedImages((prev) => new Set([...prev, imageUrl]));
			};
		};

		if (currentImage && originalUrls[currentImage.id]) {
			const currentUrl = originalUrls[currentImage.id];
			preloadImage(currentUrl);

			// Preload next and previous images
			const nextIndex = (index + 1) % images.length;
			const prevIndex = index > 0 ? index - 1 : images.length - 1;

			if (images[nextIndex] && originalUrls[images[nextIndex].id]) {
				preloadImage(originalUrls[images[nextIndex].id]);
			}
			if (images[prevIndex] && originalUrls[images[prevIndex].id]) {
				preloadImage(originalUrls[images[prevIndex].id]);
			}
		}
	}, [index, images, loadedImages, originalUrls, currentImage]);

	// Resetear posición y escala cuando cambia la imagen seleccionada
	const resetPositionAndScale = useCallback(() => {
		setPosition({ x: 0, y: 0 });
		setScale(1);
	}, []);

	// Aplicar reset cuando cambia el índice
	useEffect(() => {
		resetPositionAndScale();
	}, [resetPositionAndScale]);

	const handleWheel = (e: React.WheelEvent) => {
		e.preventDefault();
		const zoomFactor = 0.1;
		const newScale = Math.min(
			Math.max(0.1, scale * (1 - Math.sign(e.deltaY) * zoomFactor)),
			8
		);
		setScale(newScale);
	};

	const resetView = () => {
		setScale(1);
		setPosition({ x: 0, y: 0 });
	};

	const getImageSource = useCallback(
		(image?: ImageItem): string | undefined => {
			if (!image) {
				return undefined;
			}
			const url = originalUrls[image.id];
			return isValidSrc(url) ? url : undefined;
		},
		[originalUrls]
	);

	const getImageAlt = (image?: ImageItem) => {
		if (!image) {
			return "Image";
		}
		return image.alt || image.name || "Image";
	};

	const handleImageError = () => {
		setError("No se pudo cargar la imagen");
		setIsLoading(false);
	};

	const handleCopy = async () => {
		try {
			if (!currentImage) {
				return;
			}
			const imageUrl = getImageSource(currentImage);
			if (!imageUrl) {
				throw new Error("No se pudo obtener la URL de la imagen");
			}

			const response = await fetch(imageUrl);
			const blob = await response.blob();
			await navigator.clipboard.write([
				new ClipboardItem({
					[blob.type]: blob,
				}),
			]);
			toast({
				title: "Imagen copiada",
				description: "La imagen ha sido copiada al portapapeles",
			});
		} catch (_error) {
			toast({
				title: "Error",
				description: "No se pudo copiar la imagen",
				variant: "destructive",
			});
		}
	};

	const handleDownload = async () => {
		try {
			if (!currentImage) {
				return;
			}
			const imageUrl = getImageSource(currentImage);
			if (!imageUrl) {
				throw new Error("No se pudo obtener la URL de la imagen");
			}

			const response = await fetch(imageUrl);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = currentImage.name;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
			toast({
				title: "Descarga iniciada",
				description: "La imagen se está descargando",
			});
		} catch (_error) {
			toast({
				title: "Error",
				description: "No se pudo descargar la imagen",
				variant: "destructive",
			});
		}
	};

	const handleZoom = (factor: number) => {
		const newScale = Math.min(Math.max(0.1, scale * factor), 5);
		setScale(newScale);
	};

	// Función mejorada para obtener thumbnail
	const _getImageThumbnail = (image?: ImageItem): string | undefined => {
		if (!image) {
			return undefined;
		}
		return (
			thumbnails[image.id] ||
			image.thumbnail ||
			image.src ||
			image.url ||
			undefined
		);
	};

	// Función para calcular dimensiones
	const _getImageDimensions = (image: ImageItem) => {
		const defaultDimensions = { width: 1920, height: 1080 };

		if (image.parsedMetadata?.dimensions) {
			return image.parsedMetadata.dimensions;
		}

		if (image.width && image.height) {
			return { width: image.width, height: image.height };
		}

		return defaultDimensions;
	};

	// Función para cargar thumbnail
	const loadThumbnail = useCallback(async (imageId: string) => {
		try {
			const data = await getThumbnail(imageId, ThumbnailQuality.MEDIUM);
			const thumbnailUrl = `data:${data.mimeType || "image/webp"};base64,${data.thumbnail}`;
			setThumbnails((prev) => ({ ...prev, [imageId]: thumbnailUrl }));
		} catch (error) {
			console.error("Error loading thumbnail:", error);
		}
	}, []);

	// Cargar thumbnails cuando cambia el índice
	useEffect(() => {
		if (!isOpen || !images.length) {
			return;
		}

		const currentImage = images[index];
		const nextImage = images[(index + 1) % images.length];
		const prevImage = images[index > 0 ? index - 1 : images.length - 1];

		const imagesToLoad = [currentImage, nextImage, prevImage];
		for (const img of imagesToLoad) {
			if (img && !thumbnails[img.id]) {
				loadThumbnail(img.id);
			}
		}
	}, [isOpen, index, images, loadThumbnail, thumbnails]);

	if (!isOpen || !images || !images.length) {
		return null;
	}

	if (!currentImage) {
		return null;
	}

	return (
		<dialog
			className={cn(
				"fixed inset-0 z-50 flex flex-col items-center justify-center w-full h-full bg-black/90 backdrop-blur-sm p-0 m-0",
				isOpen ? "flex" : "hidden"
			)}
			open={isOpen}
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}
			onKeyDown={(e) => {
				if (e.key === "Escape") {
					onClose();
				}
			}}
			aria-modal="true"
		>
			<div
				ref={containerRef}
				className="relative w-full h-full flex flex-col items-center justify-center"
				onClick={(e) => e.stopPropagation()}
				onWheel={handleWheel}
				onDoubleClick={resetView}
				onKeyDown={(e) => {
					e.stopPropagation();
					if (e.key === "Enter" || e.key === " ") {
						resetView();
					}
				}}
				role="presentation"
			>
				{/* Toolbar */}
				<div className="fixed top-4 inset-x-4 flex items-center justify-between z-20">
					<div className="flex space-x-2">
						<Button
							variant="outline"
							size="icon"
							onClick={() => handleZoom(1.2)}
							title="Acercar"
						>
							<ZoomIn className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={() => handleZoom(0.8)}
							title="Alejar"
						>
							<ZoomOut className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={resetView}
							title="Restablecer vista"
						>
							<RotateCcw className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={handleCopy}
							title="Copiar"
						>
							<Copy className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={handleDownload}
							title="Descargar"
						>
							<Download className="h-4 w-4" />
						</Button>
					</div>

					<Button
						variant="outline"
						size="icon"
						onClick={onClose}
						title="Cerrar"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* Main Image Container */}
				<motion.div
					key={currentImage.id}
					className="absolute inset-0 flex items-center justify-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3 }}
				>
					<div className="relative w-full h-full flex items-center justify-center overflow-hidden">
						<AnimatePresence mode="wait">
							{isLoading && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.3 }}
									className="absolute inset-0 flex items-center justify-center"
								>
									{thumbnails[currentImage.id] ? (
										<motion.div
											className="absolute inset-0 flex items-center justify-center"
											initial={{ opacity: 0, filter: "blur(10px)" }}
											animate={{ opacity: 1, filter: "blur(3px)" }}
											exit={{ opacity: 0, filter: "blur(0px)" }}
											transition={{
												duration: 0.8,
												opacity: { duration: 0.5 },
												filter: { duration: 0.4 },
											}}
										>
											<motion.img
												src={thumbnails[currentImage.id]}
												alt="Loading preview"
												className="w-full h-full object-contain"
												initial={{ scale: 1.1 }}
												animate={{ scale: 1 }}
												exit={{ scale: 1 }}
												transition={{ duration: 0.5 }}
											/>
										</motion.div>
									) : (
										<Skeleton className="w-full h-full" />
									)}
								</motion.div>
							)}
						</AnimatePresence>

						{error ? (
							<div className="absolute inset-0 flex items-center justify-center text-center text-muted-foreground">
								<p>{error}</p>
							</div>
						) : (
							<motion.img
								ref={imageRef}
								src={getImageSource(currentImage)}
								alt={getImageAlt(currentImage)}
								onError={handleImageError}
								className={cn(
									"object-contain max-w-[90vw] max-h-[80vh] shadow-2xl rounded-lg select-none",
									isLoading ? "opacity-0" : "opacity-100"
								)}
								style={{
									cursor: "grab",
									touchAction: "none",
								}}
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{
									opacity: isLoading ? 0 : 1,
									scale: scale,
									x: position.x,
									y: position.y,
								}}
								transition={{
									opacity: { duration: 0.3 },
									scale: { ...VIEWER_CONFIG },
									x: { ...VIEWER_CONFIG },
									y: { ...VIEWER_CONFIG },
								}}
								drag
								dragConstraints={containerRef}
								onDragStart={() => {
									if (imageRef.current) {
										imageRef.current.style.cursor = "grabbing";
									}
								}}
								onDragEnd={() => {
									if (imageRef.current) {
										imageRef.current.style.cursor = "grab";
									}
								}}
								onLoad={() => {
									setTimeout(() => {
										setIsLoading(false);
										setError(null);
									}, 100);
								}}
							/>
						)}
					</div>
				</motion.div>

				{/* Thumbnails */}
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center z-20">
					<div className="flex items-center bg-background/5 backdrop-blur-xs px-2 py-1 rounded-lg">
						{images
							.slice(Math.max(0, index - 3), Math.min(images.length, index + 4))
							.map((image, i) => (
								<ThumbnailItem
									key={image.id}
									image={image}
									images={images}
									isActive={i + Math.max(0, index - 3) === index}
									onClick={() => setIndex(i + Math.max(0, index - 3))}
								/>
							))}
					</div>
				</div>

				{/* Navigation hints */}
				<div className="fixed bottom-4 left-4 text-xs text-muted-foreground/50 pointer-events-none select-none max-w-[300px]">
					<p>Flechas: navegar • Rueda: zoom • Arrastrar: mover</p>
					<p>ESC: cerrar • R: restablecer • +/-: zoom</p>
				</div>
			</div>
		</dialog>
	);
}
