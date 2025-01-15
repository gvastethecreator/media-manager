"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, RotateCcw, ZoomIn, ZoomOut, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { ImageFallback } from "@/components/ui/image-fallback";
import { getImageUrl } from "@/app/actions/image.actions";
import { getThumbnail } from "@/app/actions/thumbnails.actions";
import { ThumbnailQuality } from "@/config/thumbnail.config";
import { useImageResources } from "@/store/image-resources.store";

export interface ImageItem {
	id: string;
	name: string;
	type: string;
	url?: string;
	thumbnail?: string;
	src?: string;
	alt?: string;
	width?: number;
	height?: number;
	mimeType?: string;
	metadata?: {
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

const isLocalFile = (url: string) => url.startsWith("file://");

// Configuración de animaciones mejorada
const springConfig = {
	type: "spring" as const,
	stiffness: 300,
	damping: 30,
	mass: 0.5,
};

// Configuración de reintentos
const RETRY_CONFIG = {
	maxRetries: 3,
	delay: 1000,
	backoff: 2,
};

// Cache en memoria
const imageCache = new Map<
	string,
	{
		url: string;
		timestamp: number;
		expiresIn: number;
	}
>();

// Configuración de thumbnails
const THUMBNAIL_CONFIG = {
	visibleItems: 9, // 4 antes + 1 activa + 4 después
	preloadItems: 4, // Cantidad de thumbnails a precargar
	batchSize: 5, // Tamaño del lote para carga
	loadThreshold: 0.5, // Umbral para cargar más thumbnails
	thumbnailSize: {
		width: 80,
		height: 80,
	},
};

// Mejorar la gestión de estados
interface LoadingState {
	thumbnail: boolean;
	original: boolean;
}

export function FileViewer({
	images,
	initialIndex = 0,
	isOpen,
	onClose,
}: FileViewerProps) {
	const imageResources = useImageResources();
	const { toast } = useToast();
	const [index, setIndex] = useState(initialIndex);
	const [scale, setScale] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [loadingStates, setLoadingStates] = useState<
		Record<string, LoadingState>
	>({});
	const [error, setError] = useState<string | null>(null);
	const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
	const [originalUrls, setOriginalUrls] = useState<Record<string, string>>({});
	const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
	const containerRef = useRef<HTMLDivElement>(null);
	const imageRef = useRef<HTMLImageElement>(null);
	const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
	const [loadedThumbnails, setLoadedThumbnails] = useState<Set<string>>(
		new Set()
	);
	const preloadQueueRef = useRef<string[]>([]);
	const isLoadingRef = useRef<boolean>(false);
	const loadingControlRef = useRef<{
		inProgress: Set<string>;
		lastLoadTime: Record<string, number>;
	}>({
		inProgress: new Set(),
		lastLoadTime: {},
	});
	const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>(
		{}
	);

	// Get current image
	const currentImage = images[index];

	// Funciones de carga de imágenes
	const loadThumbnail = useCallback(async (imageId: string) => {
		if (!imageId) return null;
		try {
			return await retryWithBackoff(async () => {
				const data = await getThumbnail(imageId, ThumbnailQuality.MEDIUM);
				if (!data?.thumbnail) throw new Error("No thumbnail data");
				return data;
			});
		} catch (error) {
			console.warn(`Error loading thumbnail for ${imageId}:`, error);
			return null;
		}
	}, []);

	const loadImageUrl = useCallback(async (imageId: string) => {
		if (!imageId) return null;
		const cached = imageCache.get(imageId);
		if (cached && Date.now() - cached.timestamp < cached.expiresIn) {
			return cached.url;
		}
		try {
			return await retryWithBackoff(async () => {
				const url = await getImageUrl(imageId);
				if (!url) throw new Error("No image URL");
				imageCache.set(imageId, {
					url,
					timestamp: Date.now(),
					expiresIn: 5 * 60 * 1000,
				});
				return url;
			});
		} catch (error) {
			console.warn(`Error loading image URL for ${imageId}:`, error);
			return null;
		}
	}, []);

	// Mejorar sistema de precarga
	const preloadQueue = useCallback(async () => {
		if (isLoadingRef.current || preloadQueueRef.current.length === 0) return;

		const imageId = preloadQueueRef.current[0];

		// Evitar cargar si ya está en progreso o se cargó recientemente
		if (loadingControlRef.current.inProgress.has(imageId)) return;
		const lastLoad = loadingControlRef.current.lastLoadTime[imageId] || 0;
		if (Date.now() - lastLoad < 1000) return; // Evitar recargas frecuentes

		isLoadingRef.current = true;
		loadingControlRef.current.inProgress.add(imageId);

		try {
			// Cargar thumbnail primero si no existe
			if (!thumbnails[imageId]) {
				const data = await loadThumbnail(imageId);
				if (data) {
					const thumbnailUrl = `data:${data.mimeType || "image/webp"};base64,${data.thumbnail}`;
					setThumbnails((prev) => ({ ...prev, [imageId]: thumbnailUrl }));
				}
			}

			// Cargar URL original si no existe
			if (!originalUrls[imageId]) {
				const url = await loadImageUrl(imageId);
				if (url) {
					setOriginalUrls((prev) => ({ ...prev, [imageId]: url }));
					setLoadedImages((prev) => new Set([...prev, imageId]));
				}
			}
		} catch (error) {
			console.error(`Error preloading image ${imageId}:`, error);
		} finally {
			loadingControlRef.current.inProgress.delete(imageId);
			loadingControlRef.current.lastLoadTime[imageId] = Date.now();
			preloadQueueRef.current = preloadQueueRef.current.slice(1);
			isLoadingRef.current = false;

			// Continuar con la siguiente imagen después de un pequeño delay
			if (preloadQueueRef.current.length > 0) {
				setTimeout(() => requestAnimationFrame(() => preloadQueue()), 100);
			}
		}
	}, [loadThumbnail, loadImageUrl, thumbnails, originalUrls]);

	// Separar efecto de carga inicial
	useEffect(() => {
		if (!isOpen || !currentImage?.id) return;

		const imageId = currentImage.id;
		if (loadingControlRef.current.inProgress.has(imageId)) return;

		const loadImage = async () => {
			loadingControlRef.current.inProgress.add(imageId);

			try {
				setLoadingStates((prev) => ({
					...prev,
					[imageId]: { thumbnail: true, original: true },
				}));

				// Cargar thumbnail si no existe
				if (!thumbnails[imageId]) {
					const data = await loadThumbnail(imageId);
					if (data) {
						const thumbnailUrl = `data:${data.mimeType || "image/webp"};base64,${data.thumbnail}`;
						setThumbnails((prev) => ({ ...prev, [imageId]: thumbnailUrl }));
					}
				}

				// Cargar URL original si no existe
				if (!originalUrls[imageId]) {
					const url = await loadImageUrl(imageId);
					if (url) {
						setOriginalUrls((prev) => ({ ...prev, [imageId]: url }));
						setLoadedImages((prev) => new Set([...prev, imageId]));
					}
				}
			} catch (error) {
				console.error("Error loading image:", error);
				setError("Error al cargar la imagen");
			} finally {
				loadingControlRef.current.inProgress.delete(imageId);
				loadingControlRef.current.lastLoadTime[imageId] = Date.now();
				setLoadingStates((prev) => ({
					...prev,
					[imageId]: { thumbnail: false, original: false },
				}));
			}
		};

		loadImage();
	}, [isOpen, currentImage?.id, loadThumbnail, loadImageUrl]);

	// Efecto separado para gestionar la cola de precarga
	useEffect(() => {
		if (!isOpen || !images.length || !currentImage) return;

		// Preparar cola de precarga
		const preloadIndexes = [];
		for (let i = 1; i <= 5; i++) {
			const nextIndex = (index + i) % images.length;
			const prevIndex =
				index - i >= 0 ? index - i : images.length + (index - i);
			preloadIndexes.push(nextIndex, prevIndex);
		}

		// Filtrar índices únicos y válidos
		const uniqueIndexes = [...new Set(preloadIndexes)]
			.filter((i) => i >= 0 && i < images.length && i !== index)
			.filter((i) => {
				const imageId = images[i].id;
				const lastLoad = loadingControlRef.current.lastLoadTime[imageId] || 0;
				return Date.now() - lastLoad > 1000; // Solo precargar si no se cargó recientemente
			});

		// Actualizar cola de precarga
		preloadQueueRef.current = uniqueIndexes.map((i) => images[i].id);

		// Iniciar precarga con delay
		if (preloadQueueRef.current.length > 0) {
			setTimeout(() => requestAnimationFrame(() => preloadQueue()), 500);
		}

		return () => {
			preloadQueueRef.current = [];
			isLoadingRef.current = false;
		};
	}, [isOpen, index, images, preloadQueue]);

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

	// Función de reintento con backoff exponencial
	const retryWithBackoff = useCallback(
		async <T,>(
			fn: () => Promise<T>,
			retries: number = RETRY_CONFIG.maxRetries,
			delay: number = RETRY_CONFIG.delay
		): Promise<T> => {
			try {
				return await fn();
			} catch (error) {
				if (retries === 0) throw error;
				await new Promise((resolve) => setTimeout(resolve, delay));
				return retryWithBackoff(fn, retries - 1, delay * RETRY_CONFIG.backoff);
			}
		},
		[]
	);

	// Keyboard navigation
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
			if (e.key === "ArrowLeft")
				setIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
			if (e.key === "ArrowRight")
				setIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
			if (e.key === "0" || e.key === "r") resetView();
			if (e.key === "+") handleZoom(1.2);
			if (e.key === "-") handleZoom(0.8);
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, images.length, onClose]);

	// Preload adjacent images with original URLs
	useEffect(() => {
		const preloadImage = (imageUrl: string) => {
			if (!imageUrl || loadedImages.has(imageUrl)) return;

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

	useEffect(() => {
		// Reset position and scale when changing images
		setPosition({ x: 0, y: 0 });
		setScale(1);
	}, [index]);

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
		(image?: ImageItem): string => {
			if (!image?.id) return "";

			// Usar URL original si está disponible
			if (originalUrls[image.id]) {
				return originalUrls[image.id];
			}

			// Fallback a thumbnail mientras se carga la original
			if (thumbnails[image.id]) {
				return thumbnails[image.id];
			}

			// Usar URL existente si está disponible
			if (image.url) {
				return image.url;
			}

			return "";
		},
		[originalUrls, thumbnails]
	);

	const getImageAlt = (image?: ImageItem) => {
		if (!image) return "Image";
		return image.alt || image.name || "Image";
	};

	const handleImageError = useCallback(() => {
		setError("No se pudo cargar la imagen");
		if (currentImage) {
			setLoadingStates((prev) => ({
				...prev,
				[currentImage.id]: { thumbnail: false, original: false },
			}));
		}
	}, [currentImage]);

	const handleCopy = async () => {
		try {
			if (!currentImage) return;

			const response = await fetch(getImageSource(currentImage));
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
		} catch (error) {
			toast({
				title: "Error",
				description: "No se pudo copiar la imagen",
				variant: "destructive",
			});
		}
	};

	const handleDownload = async () => {
		try {
			if (!currentImage) return;

			const response = await fetch(getImageSource(currentImage));
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
		} catch (error) {
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
	const getImageThumbnail = (image?: ImageItem): string | undefined => {
		if (!image) return undefined;
		return (
			thumbnails[image.id] ||
			image.thumbnail ||
			image.src ||
			image.url ||
			undefined
		);
	};

	// Función para calcular dimensiones
	const getImageDimensions = (image: ImageItem) => {
		const defaultDimensions = { width: 1920, height: 1080 };

		if (image.metadata?.dimensions) {
			return image.metadata.dimensions;
		}

		if (image.width && image.height) {
			return { width: image.width, height: image.height };
		}

		return defaultDimensions;
	};

	// Calcular rango visible de thumbnails
	const calculateVisibleRange = useCallback(
		(currentIndex: number) => {
			const halfVisible = Math.floor((THUMBNAIL_CONFIG.visibleItems - 1) / 2);
			let start = currentIndex - halfVisible;
			let end = currentIndex + halfVisible;

			// Ajustar rango si está fuera de límites
			if (start < 0) {
				end = Math.min(THUMBNAIL_CONFIG.visibleItems - 1, images.length - 1);
				start = 0;
			} else if (end >= images.length) {
				start = Math.max(0, images.length - THUMBNAIL_CONFIG.visibleItems);
				end = images.length - 1;
			}

			return { start, end };
		},
		[images.length]
	);

	// Actualizar rango visible cuando cambia el índice
	useEffect(() => {
		if (!isOpen || !images.length) return;
		const range = calculateVisibleRange(index);
		setVisibleRange(range);
	}, [isOpen, index, images.length, calculateVisibleRange]);

	// Cargar thumbnails del rango visible
	useEffect(() => {
		if (!isOpen || !images.length) return;

		const loadThumbnailBatch = async (start: number, end: number) => {
			const batch = images.slice(start, end + 1);
			for (const img of batch) {
				if (!loadedThumbnails.has(img.id) && !thumbnails[img.id]) {
					try {
						const data = await loadThumbnail(img.id);
						if (data?.thumbnail) {
							setLoadedThumbnails((prev) => new Set([...prev, img.id]));
						}
					} catch (error) {
						console.warn(`Error loading thumbnail for ${img.id}:`, error);
					}
				}
			}
		};

		// Cargar rango visible
		const { start, end } = visibleRange;
		loadThumbnailBatch(start, end);

		// Precargar siguiente lote
		const nextStart = end + 1;
		const nextEnd = Math.min(
			nextStart + THUMBNAIL_CONFIG.preloadItems - 1,
			images.length - 1
		);
		if (nextStart < images.length) {
			loadThumbnailBatch(nextStart, nextEnd);
		}

		// Precargar lote anterior
		const prevEnd = start - 1;
		const prevStart = Math.max(0, prevEnd - THUMBNAIL_CONFIG.preloadItems + 1);
		if (prevEnd >= 0) {
			loadThumbnailBatch(prevStart, prevEnd);
		}
	}, [
		isOpen,
		images,
		visibleRange,
		loadedThumbnails,
		thumbnails,
		loadThumbnail,
	]);

	// Reset state when opening viewer
	useEffect(() => {
		if (isOpen) {
			setIndex(initialIndex);
			resetView();
			setError(null);

			// Limpiar todos los estados
			setLoadedImages(new Set());
			setOriginalUrls({});
			setLoadingStates({});
			setThumbnails({});

			// Limpiar controles de carga
			loadingControlRef.current = {
				inProgress: new Set(),
				lastLoadTime: {},
			};
			preloadQueueRef.current = [];
			isLoadingRef.current = false;

			// Limpiar timeouts
			if (loadingTimeoutRef.current) {
				clearTimeout(loadingTimeoutRef.current);
			}
		}
	}, [isOpen, initialIndex]);

	// Cargar URLs cuando cambian las imágenes visibles
	useEffect(() => {
		if (!isOpen || !images.length) return;

		const range = calculateVisibleRange(index);
		setVisibleRange(range);

		const visibleImages = images.slice(range.start, range.end + 1);

		// Cargar thumbnails
		visibleImages.forEach(async (image) => {
			try {
				const url = await imageResources.getThumbnail(image.id);
				if (url) {
					setThumbnailUrls((prev) => ({ ...prev, [image.id]: url }));
				}
			} catch (error) {
				console.error("Error loading thumbnail:", error);
			}
		});

		// Cargar originales
		visibleImages.forEach(async (image) => {
			try {
				const url = await imageResources.getOriginalUrl(image.id);
				if (url) {
					setOriginalUrls((prev) => ({ ...prev, [image.id]: url }));
				}
			} catch (error) {
				console.error("Error loading original:", error);
			}
		});

		// Precargar siguiente lote
		const nextBatch = images.slice(
			range.end + 1,
			range.end + 1 + THUMBNAIL_CONFIG.preloadItems
		);
		if (nextBatch.length > 0) {
			setTimeout(() => {
				imageResources.preloadResources(nextBatch.map((img) => img.id));
			}, 1000);
		}
	}, [isOpen, index, images]);

	// Renderizar thumbnails
	const renderThumbnails = () => {
		return images
			.slice(visibleRange.start, visibleRange.end + 1)
			.map((image, i) => {
				const actualIndex = visibleRange.start + i;
				const isActive = actualIndex === index;
				const thumbnailUrl = thumbnailUrls[image.id];
				const isLoading = imageResources.isLoading(image.id) || !thumbnailUrl;

				if (isLoading) {
					return (
						<motion.div
							key={image.id}
							className={cn(
								"relative mx-1",
								isActive ? "w-24 h-24" : "w-20 h-20"
							)}
						>
							<Skeleton className="w-full h-full rounded-md" />
						</motion.div>
					);
				}

				return (
					<motion.div
						key={image.id}
						animate={{
							opacity: isActive ? 1 : 0.7,
							scale: isActive ? 1 : 0.85,
							width: isActive ? 96 : 80,
							height: isActive ? 96 : 80,
						}}
						transition={springConfig}
						className={cn(
							"relative cursor-pointer rounded-md overflow-hidden mx-1",
							isActive &&
								"ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg"
						)}
						style={{
							zIndex: isActive ? 10 : 1,
						}}
						onClick={() => setIndex(actualIndex)}
						whileHover={{
							scale: isActive ? 1.05 : 0.95,
							opacity: 1,
						}}
						layout
					>
						<ImageFallback
							src={thumbnailUrl}
							alt={image.name}
							className={cn(
								"w-full h-full object-cover transition-all duration-200",
								isActive ? "scale-100" : "hover:scale-110"
							)}
						/>
						{isActive && (
							<motion.div
								className="absolute inset-0 bg-primary/10 pointer-events-none"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
							/>
						)}
					</motion.div>
				);
			});
	};

	// Renderizar imagen principal
	const renderMainImage = () => {
		const currentImage = images[index];
		if (!currentImage) return null;

		const originalUrl = originalUrls[currentImage.id];
		const isLoading = imageResources.isLoading(currentImage.id) || !originalUrl;

		if (isLoading) {
			return (
				<div className="w-full h-full flex items-center justify-center">
					<Skeleton className="w-full h-full" />
				</div>
			);
		}

		return (
			<ImageFallback
				src={originalUrl}
				alt={currentImage.name}
				className="w-full h-full object-contain"
				onError={() => setError("Error al cargar la imagen")}
			/>
		);
	};

	if (!isOpen || !images || !images.length) {
		return null;
	}

	if (!currentImage) {
		return null;
	}

	return (
		<motion.div
			animate={{ opacity: [0, 1] }}
			className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				ref={containerRef}
				className="relative w-full h-full flex flex-col items-center justify-center"
				onClick={(e) => e.stopPropagation()}
				onWheel={handleWheel}
				onDoubleClick={resetView}
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
					key={currentImage?.id}
					className="absolute inset-0 flex items-center justify-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3 }}
				>
					<div className="relative w-full h-full flex items-center justify-center overflow-hidden">
						<AnimatePresence mode="wait">
							{loadingStates[currentImage?.id]?.original && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.3 }}
									className="absolute inset-0 flex items-center justify-center"
								>
									{thumbnails[currentImage?.id] ?
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
									:	<Skeleton className="w-full h-full" />}
								</motion.div>
							)}
						</AnimatePresence>

						{error ?
							<div className="absolute inset-0 flex items-center justify-center text-center text-muted-foreground">
								<p>{error}</p>
							</div>
						:	currentImage &&
							(originalUrls[currentImage.id] ||
								thumbnails[currentImage.id]) && (
								<motion.img
									ref={imageRef}
									src={
										originalUrls[currentImage.id] || thumbnails[currentImage.id]
									}
									alt={currentImage.name}
									onError={handleImageError}
									className={cn(
										"object-contain max-w-[90vw] max-h-[80vh] shadow-2xl rounded-lg select-none",
										loadingStates[currentImage.id]?.original ?
											"opacity-0"
										:	"opacity-100"
									)}
									style={{
										cursor: "grab",
										touchAction: "none",
									}}
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{
										opacity: loadingStates[currentImage.id]?.original ? 0 : 1,
										scale: scale,
										x: position.x,
										y: position.y,
									}}
									transition={{
										opacity: { duration: 0.3 },
										scale: { ...springConfig, duration: 0.3 },
										x: springConfig,
										y: springConfig,
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
										loadingTimeoutRef.current = setTimeout(() => {
											setLoadingStates((prev) => ({
												...prev,
												[currentImage.id]: {
													...prev[currentImage.id],
													original: false,
												},
											}));
											setError(null);
										}, 100);
									}}
								/>
							)
						}
					</div>
				</motion.div>

				{/* Thumbnails */}
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center z-20">
					<div className="flex items-center bg-background/5 backdrop-blur-sm px-2 py-1 rounded-lg">
						{renderThumbnails()}
					</div>
				</div>

				{/* Navigation hints */}
				<div className="fixed bottom-4 left-4 text-xs text-muted-foreground/50 pointer-events-none select-none max-w-[300px]">
					<p>Flechas: navegar • Rueda: zoom • Arrastrar: mover</p>
					<p>ESC: cerrar • R: restablecer • +/-: zoom</p>
				</div>
			</div>
		</motion.div>
	);
}
