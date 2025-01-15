"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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

// Configuración de animaciones optimizada
const springConfig = {
	type: "spring" as const,
	stiffness: 200,
	damping: 25,
	mass: 1,
};

// Configuración de reintentos y precarga
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
	image: ImageItem;
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

// Componente para la imagen principal
function MainImage({
	image,
	scale,
	position,
	imageRef,
	containerRef,
}: {
	image: ImageItem;
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
	}>({
		thumbnail: null,
		originalUrl: null,
		error: null,
		isLoading: true,
	});

	// Efecto para cargar la imagen original primero
	React.useEffect(() => {
		let mounted = true;

		const loadOriginal = async () => {
			if (!mounted) return;

			try {
				setResources((prev) => ({ ...prev, isLoading: true }));
				const origUrl = await imageResources.getOriginalUrl(image.id);

				if (!mounted) return;

				if (origUrl) {
					setResources((prev) => ({
						...prev,
						originalUrl: origUrl,
						isLoading: false,
					}));

					// Cargar thumbnail en segundo plano
					imageResources.getThumbnail(image.id).then((thumbUrl) => {
						if (mounted && thumbUrl) {
							setResources((prev) => ({
								...prev,
								thumbnail: thumbUrl,
							}));
						}
					});
				} else {
					// Si no hay URL original, intentar con thumbnail
					const thumbUrl = await imageResources.getThumbnail(image.id);
					if (mounted) {
						setResources({
							thumbnail: thumbUrl || null,
							originalUrl: null,
							error: thumbUrl ? null : "Error al cargar la imagen",
							isLoading: false,
						});
					}
				}
			} catch (error) {
				console.error("Error loading resources:", error);
				if (mounted) {
					setResources({
						thumbnail: null,
						originalUrl: null,
						error: "Error al cargar la imagen",
						isLoading: false,
					});
				}
			}
		};

		loadOriginal();
		return () => {
			mounted = false;
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
			{/* Imagen original */}
			{resources.originalUrl && (
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
			{/* Thumbnail como fallback */}
			{!resources.originalUrl && resources.thumbnail && (
				<motion.img
					src={resources.thumbnail}
					alt={image.name}
					className="absolute inset-0 w-full h-full object-contain"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3 }}
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

	// Optimizar precarga
	useEffect(() => {
		if (!isOpen || !images.length || !currentImage) return;

		const preloadImages = async () => {
			const nextIndex = (index + 1) % images.length;
			const prevIndex = index - 1 >= 0 ? index - 1 : images.length - 1;

			// Precargar solo las imágenes adyacentes
			return preloadDebounce.current(async () => {
				const batch = [images[prevIndex].id, images[nextIndex].id];
				return imageResources.preloadResources(batch);
			});
		};

		preloadImages();
	}, [isOpen, index, images, imageResources, currentImage]);

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

	const handleZoom = (factor: number) => {
		const newScale = Math.min(Math.max(0.1, scale * factor), 5);
		setScale(newScale);
	};

	// Optimizar renderizado de thumbnails
	const renderThumbnails = () => {
		const start = Math.max(0, index - 3);
		const end = Math.min(images.length - 1, index + 3);
		setVisibleRange({ start, end });

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
	};

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
						{renderThumbnails()}
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
}
