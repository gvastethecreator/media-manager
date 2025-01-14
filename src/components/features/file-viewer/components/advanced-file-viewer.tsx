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

interface AdvancedImageViewerProps {
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

export function AdvancedImageViewer({
	images,
	initialIndex = 0,
	isOpen,
	onClose,
}: AdvancedImageViewerProps) {
	const { toast } = useToast();
	const [index, setIndex] = useState(initialIndex);
	const [scale, setScale] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
	const [originalUrls, setOriginalUrls] = useState<Record<string, string>>({});
	const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
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
		if (!isOpen || !images.length) return;

		const loadInitialUrls = async () => {
			const currentImage = images[index];
			const nextImage = images[(index + 1) % images.length];
			const prevImage = images[index > 0 ? index - 1 : images.length - 1];

			const imagesToLoad = [currentImage, nextImage, prevImage];
			const urls: Record<string, string> = {};

			try {
				await Promise.all(
					imagesToLoad.map(async (img) => {
						if (!img || urls[img.id]) return;
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
		if (!isOpen || !images.length) return;

		const preloadAdjacentImages = async () => {
			const nextIndex = (index + 1) % images.length;
			const prevIndex = index > 0 ? index - 1 : images.length - 1;
			const imagesToPreload = [images[nextIndex], images[prevIndex]].filter(
				(img) => img && !originalUrls[img.id]
			);

			if (!imagesToPreload.length) return;

			try {
				const urls: Record<string, string> = {};
				await Promise.all(
					imagesToPreload.map(async (img) => {
						if (!img) return;
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
			5
		);
		setScale(newScale);
	};

	const resetView = () => {
		setScale(1);
		setPosition({ x: 0, y: 0 });
	};

	const getImageSource = (image?: ImageItem) => {
		if (!image) return "";

		// Si ya tenemos una URL original, usarla
		if (originalUrls[image.id]) {
			return originalUrls[image.id];
		}

		// Fallback a thumbnail mientras se carga la original
		return image.thumbnail || "";
	};

	const getImageAlt = (image?: ImageItem) => {
		if (!image) return "Image";
		return image.alt || image.name || "Image";
	};

	const handleImageError = () => {
		setError("No se pudo cargar la imagen");
		setIsLoading(false);
	};

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

	// Función para cargar thumbnail
	const loadThumbnail = useCallback(async (imageId: string) => {
		try {
			const data = await getThumbnail(imageId, ThumbnailQuality.MEDIUM);
			const thumbnailUrl = `data:${data.mimeType || "image/webp"};base64,${
				data.thumbnail
			}`;
			setThumbnails((prev) => ({ ...prev, [imageId]: thumbnailUrl }));
		} catch (error) {
			console.error("Error loading thumbnail:", error);
		}
	}, []);

	// Cargar thumbnails cuando cambia el índice
	useEffect(() => {
		if (!isOpen || !images.length) return;

		const currentImage = images[index];
		const nextImage = images[(index + 1) % images.length];
		const prevImage = images[index > 0 ? index - 1 : images.length - 1];

		[currentImage, nextImage, prevImage].forEach((img) => {
			if (img && !thumbnails[img.id]) {
				loadThumbnail(img.id);
			}
		});
	}, [isOpen, index, images, loadThumbnail, thumbnails]);

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
					key={currentImage.id}
					className="absolute inset-0 flex items-center justify-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3 }}
				>
					<div className="relative w-[90vw] h-[80vh] flex items-center justify-center overflow-hidden">
						<div
							className="relative w-full h-full"
							style={{
								aspectRatio: `${getImageDimensions(currentImage).width} / ${
									getImageDimensions(currentImage).height
								}`,
								maxWidth: "100%",
								maxHeight: "100%",
								margin: "auto",
							}}
						>
							<AnimatePresence mode="wait">
								{isLoading && (
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.5 }}
										className="absolute inset-0 flex items-center justify-center"
									>
										{thumbnails[currentImage.id] ? (
											<motion.div
												className="absolute inset-0 flex items-center justify-center"
												initial={{ opacity: 0, filter: "blur(20px)" }}
												animate={{ opacity: 1, filter: "blur(8px)" }}
												exit={{ opacity: 0, filter: "blur(0px)" }}
												transition={{
													duration: 0.8,
													opacity: { duration: 0.5 },
													filter: { duration: 0.8 },
												}}
											>
												<motion.img
													src={thumbnails[currentImage.id]}
													alt="Loading preview"
													className="w-full h-full object-contain"
													initial={{ scale: 1.1 }}
													animate={{ scale: 1 }}
													exit={{ scale: 0.95 }}
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
										"absolute inset-0 w-full h-full object-contain shadow-2xl rounded-lg select-none",
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
										opacity: { duration: 0.5 },
										scale: { ...springConfig, duration: 0.5 },
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
										setTimeout(() => {
											setIsLoading(false);
											setError(null);
										}, 100);
									}}
								/>
							)}
						</div>
					</div>
				</motion.div>

				{/* Thumbnails */}
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center z-20">
					<div className="flex items-center bg-background/5 backdrop-blur-sm px-2 py-1 rounded-lg">
						{images
							.slice(Math.max(0, index - 3), Math.min(images.length, index + 4))
							.map((image, i) => {
								const thumbSrc = getImageThumbnail(image);
								return (
									<motion.div
										key={image.id}
										animate={{
											opacity: i + Math.max(0, index - 3) === index ? 1 : 0.7,
											scale: i + Math.max(0, index - 3) === index ? 1 : 0.95,
										}}
										className={cn(
											"w-20 h-20 relative cursor-pointer rounded-md overflow-hidden mx-1",
											i + Math.max(0, index - 3) === index &&
												"ring-2 ring-primary ring-offset-2 ring-offset-background"
										)}
										style={{
											zIndex: i + Math.max(0, index - 3) === index ? 10 : 1,
										}}
										onClick={() => setIndex(i + Math.max(0, index - 3))}
									>
										{thumbSrc ? (
											<ImageFallback
												src={thumbSrc}
												alt={getImageAlt(image)}
												className="w-full h-full object-cover transition-all duration-200 hover:scale-110"
												gradientColors={[
													`hsl(${
														(parseInt(image.id.split("-")[1] || "0") * 40) % 360
													}, 95%, 75%)`,
													`hsl(${
														(parseInt(image.id.split("-")[1] || "0") * 40 +
															60) %
														360
													}, 95%, 75%)`,
												]}
											/>
										) : (
											<Skeleton className="w-full h-full" />
										)}
									</motion.div>
								);
							})}
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
