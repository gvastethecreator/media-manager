"use client";

import React, {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import {
	X,
	RotateCcw,
	ZoomIn,
	ZoomOut,
	Copy,
	Download,
	ImageOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { ImageFallback } from "@/components/ui/image-fallback";
import { getImageUrl } from "@/app/actions/image.actions";
import { getThumbnail } from "@/app/actions/thumbnails.actions";
import { ThumbnailQuality } from "@/config/thumbnail.config";
import { useImageResources } from "@/store/image-resources.store";
import type { FileItem } from "@/types/file-item";

interface FileViewerProps {
	images: FileItem[];
	initialIndex?: number;
	isOpen: boolean;
	onClose: () => void;
}

const isLocalFile = (url: string) => url.startsWith("file://");

// Configuración optimizada
const VIEWER_CONFIG = {
	preload: {
		batchSize: 2,
		delay: 2000,
		maxConcurrent: 3,
		retryDelay: 1000,
		maxRetries: 2,
	},
	thumbnails: {
		visibleItems: 7,
		preloadItems: 2,
		loadThreshold: 0.7,
	},
	transitions: {
		duration: 0.3,
		ease: [0.32, 0.72, 0, 1],
	},
};

// Cache optimizado con tiempo de vida
const imageCache = new Map<
	string,
	{
		url: string;
		timestamp: number;
		expiresIn: number;
	}
>();

// Función de debounce mejorada
const createDebounce = (wait: number) => {
	let timeout: NodeJS.Timeout;
	let currentPromise: Promise<any> | null = null;

	return (fn: () => Promise<any>) => {
		if (currentPromise) return currentPromise;

		currentPromise = new Promise((resolve) => {
			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(async () => {
				const result = await fn();
				currentPromise = null;
				resolve(result);
			}, wait);
		});

		return currentPromise;
	};
};

// Componente para thumbnail individual
function ThumbnailItem({
	image,
	isActive,
	onClick,
}: {
	image: FileItem;
	isActive: boolean;
	onClick: () => void;
}) {
	const imageResources = useImageResources();
	const isLoading = imageResources.isLoading(image.id);
	const [thumbnail, setThumbnail] = useState<string | null>(null);

	// Efecto para cargar el thumbnail
	useEffect(() => {
		let mounted = true;
		const loadThumbnail = async () => {
			try {
				const url = await imageResources.getThumbnail(image.id);
				if (mounted && url) {
					setThumbnail(url);
				}
			} catch (error) {
				console.error("Error loading thumbnail:", error);
			}
		};
		loadThumbnail();
		return () => {
			mounted = false;
		};
	}, [image.id, imageResources]);

	if (isLoading || !thumbnail) {
		return (
			<div
				className={cn("relative mx-1", isActive ? "w-24 h-24" : "w-20 h-20")}
			>
				<Skeleton className="w-full h-full rounded-md" />
			</div>
		);
	}

	return (
		<motion.div
			animate={{
				opacity: isActive ? 1 : 0.8,
				scale: isActive ? 1 : 0.9,
				width: isActive ? 96 : 80,
				height: isActive ? 96 : 80,
			}}
			transition={{
				duration: 0.2,
				ease: "easeOut",
			}}
			className={cn(
				"relative cursor-pointer rounded-md overflow-hidden mx-1",
				isActive &&
					"ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg"
			)}
			onClick={onClick}
			whileHover={{
				scale: isActive ? 1.02 : 0.95,
				opacity: 1,
			}}
		>
			<ImageFallback
				src={thumbnail}
				alt={image.name}
				className="w-full h-full object-cover"
			/>
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

// Componente optimizado para la imagen principal
const MainImage = React.memo(function MainImage({
	image,
	scale,
	position,
	imageRef,
	containerRef,
}: {
	image: FileItem;
	scale: number;
	position: { x: number; y: number };
	imageRef: React.RefObject<HTMLImageElement | null>;
	containerRef: React.RefObject<HTMLDivElement | null>;
}) {
	const imageResources = useImageResources();
	const [resources, setResources] = React.useState<{
		thumbnail: string | null;
		originalUrl: string | null;
		error: string | null;
		isLoading: boolean;
		originalLoaded: boolean;
	}>({
		thumbnail: null,
		originalUrl: null,
		error: null,
		isLoading: true,
		originalLoaded: false,
	});

	// Efecto optimizado para cargar recursos
	React.useEffect(() => {
		let mounted = true;
		let loadingTimeout: NodeJS.Timeout;

		const loadResources = async () => {
			if (!mounted) return;

			try {
				console.log("🔄 Cargando recursos para imagen:", image.id);

				// Cargar thumbnail
				const thumbUrl = await imageResources.getThumbnail(image.id);
				console.log("📸 Thumbnail cargado:", !!thumbUrl);

				if (mounted && thumbUrl) {
					setResources((prev) => ({
						...prev,
						thumbnail: thumbUrl,
						isLoading: false,
					}));

					// Cargar URL original
					console.log("🖼️ Cargando URL original...");
					const origUrl = await imageResources.getOriginalUrl(image.id);
					console.log("🔗 URL original obtenida:", !!origUrl);

					if (mounted && origUrl) {
						// Precargar la imagen original
						const img = new Image();

						img.onload = () => {
							console.log("✅ Imagen original cargada completamente");
							if (mounted) {
								setResources((prev) => ({
									...prev,
									originalUrl: origUrl,
									originalLoaded: true,
								}));
							}
						};

						img.onerror = (error) => {
							console.error("❌ Error cargando imagen original:", error);
							if (mounted) {
								setResources((prev) => ({
									...prev,
									error: "Error al cargar la imagen original",
								}));
							}
						};

						console.log("🔄 Iniciando precarga de imagen original");
						img.src = origUrl;
					}
				}
			} catch (error) {
				console.error("Error loading resources:", error);
				if (mounted) {
					setResources((prev) => ({
						...prev,
						error:
							error instanceof Error ?
								error.message
							:	"Error al cargar la imagen",
						isLoading: false,
					}));
				}
			}
		};

		// Reset state on image change
		console.log("🔄 Cambiando imagen:", image.id);
		setResources({
			thumbnail: null,
			originalUrl: null,
			error: null,
			isLoading: true,
			originalLoaded: false,
		});

		loadResources();

		return () => {
			mounted = false;
			if (loadingTimeout) {
				clearTimeout(loadingTimeout);
			}
		};
	}, [image.id, imageResources]);

	if (resources.isLoading) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<Skeleton className="w-full h-full" />
			</div>
		);
	}

	if (resources.error) {
		return (
			<div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground">
				<ImageOff className="h-8 w-8 mb-2" />
				<span className="text-xs">{resources.error}</span>
			</div>
		);
	}

	return (
		<motion.div className="relative w-full h-full">
			{/* Thumbnail como fallback */}
			{resources.thumbnail && (
				<motion.img
					src={resources.thumbnail}
					alt={image.name}
					className="absolute inset-0 w-full h-full object-contain transition-opacity duration-300"
					initial={{ opacity: 0 }}
					animate={{ opacity: resources.originalLoaded ? 0 : 1 }}
					transition={{ duration: 0.3 }}
				/>
			)}

			{/* Imagen original con transición suave */}
			{resources.originalUrl && resources.originalLoaded && (
				<motion.img
					ref={imageRef}
					src={resources.originalUrl}
					alt={image.name}
					className="absolute inset-0 w-full h-full object-contain"
					style={{
						scale,
						x: position.x,
						y: position.y,
						cursor: "grab",
						touchAction: "none",
					}}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3 }}
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
				/>
			)}
		</motion.div>
	);
});

export const FileViewer = React.memo(function FileViewer({
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
	const [error, setError] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const imageRef = useRef<HTMLImageElement>(null);
	const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
	const preloadDebounce = useRef(createDebounce(VIEWER_CONFIG.preload.delay));

	// Get current image
	const currentImage = images[index];

	// Optimizar precarga con useCallback
	const preloadImages = useCallback(async () => {
		if (!isOpen || !images.length || !currentImage) return;

		const nextIndex = (index + 1) % images.length;
		const prevIndex = index - 1 >= 0 ? index - 1 : images.length - 1;

		return preloadDebounce.current(async () => {
			const batch = [images[prevIndex].id, images[nextIndex].id];
			return imageResources.preloadResources(batch);
		});
	}, [isOpen, index, images, imageResources, currentImage]);

	// Efecto optimizado para precarga
	useEffect(() => {
		preloadImages();
	}, [preloadImages]);

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

	// Keyboard navigation optimizado
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
			if (e.key === "ArrowLeft")
				setIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
			if (e.key === "ArrowRight")
				setIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
			if (e.key === "0" || e.key === "r") resetView();
			if (e.key === "+") handleZoom(1.2);
			if (e.key === "-") handleZoom(0.8);
		},
		[images.length, onClose]
	);

	useEffect(() => {
		if (!isOpen) return;
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, handleKeyDown]);

	const handleWheel = useCallback(
		(e: React.WheelEvent) => {
			e.preventDefault();
			const zoomFactor = 0.1;
			const newScale = Math.min(
				Math.max(0.1, scale * (1 - Math.sign(e.deltaY) * zoomFactor)),
				8
			);
			setScale(newScale);
		},
		[scale]
	);

	const resetView = useCallback(() => {
		setScale(1);
		setPosition({ x: 0, y: 0 });
	}, []);

	const handleZoom = useCallback((factor: number) => {
		setScale((prev) => Math.min(Math.max(0.1, prev * factor), 5));
	}, []);

	// Optimizar cálculo de visibleRange
	const calculateVisibleRange = useCallback(
		(currentIndex: number, total: number) => {
			const halfVisible = Math.floor(VIEWER_CONFIG.thumbnails.visibleItems / 2);
			let start = currentIndex - halfVisible;
			let end = currentIndex + halfVisible;

			// Ajustar rangos si están fuera de límites
			if (start < 0) {
				end = Math.min(end - start, total - 1);
				start = 0;
			}
			if (end >= total) {
				start = Math.max(0, start - (end - total + 1));
				end = total - 1;
			}

			return { start, end };
		},
		[]
	);

	// Actualizar visibleRange cuando cambia el índice
	useEffect(() => {
		if (images.length) {
			const range = calculateVisibleRange(index, images.length);
			setVisibleRange(range);
		}
	}, [index, images.length, calculateVisibleRange]);

	// Optimizar renderizado de thumbnails
	const thumbnailsToRender = useMemo(() => {
		if (!images.length) return [];
		const { start, end } = visibleRange;

		return images.slice(start, end + 1).map((image, i) => {
			const actualIndex = start + i;
			const isActive = actualIndex === index;

			return (
				<ThumbnailItem
					key={image.id}
					image={image}
					isActive={isActive}
					onClick={() => setIndex(actualIndex)}
				/>
			);
		});
	}, [images, index, visibleRange]);

	if (!isOpen || !images || !images.length || !currentImage) {
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
				<div className="absolute inset-0 flex items-center justify-center">
					{error ?
						<div className="text-center text-muted-foreground">
							<p>{error}</p>
						</div>
					:	<MainImage
							image={currentImage}
							scale={scale}
							position={position}
							imageRef={imageRef}
							containerRef={containerRef}
						/>
					}
				</div>

				{/* Thumbnails */}
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center z-20">
					<div className="flex items-center bg-background/5 backdrop-blur-sm px-2 py-1 rounded-lg">
						{thumbnailsToRender}
					</div>
				</div>

				{/* Navigation hints */}
				<div className="fixed bottom-4 left-4 text-xs text-muted-foreground/50 pointer-events-none select-none">
					<p>Flechas: navegar • Rueda: zoom • Arrastrar: mover</p>
					<p>ESC: cerrar • R: restablecer • +/-: zoom</p>
				</div>
			</div>
		</motion.div>
	);
});
