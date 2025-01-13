"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { X, RotateCcw, ZoomIn, ZoomOut, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { ImageFallback } from "@/components/ui/image-fallback";

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
	};
}

interface AdvancedImageViewerProps {
	images: ImageItem[];
	initialIndex?: number;
	isOpen: boolean;
	onClose: () => void;
}

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
	const containerRef = useRef<HTMLDivElement>(null);
	const imageRef = useRef<HTMLImageElement>(null);

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
		return image.url || image.src || image.thumbnail || "";
	};

	const getImageAlt = (image?: ImageItem) => {
		if (!image) return "Image";
		return image.alt || image.name || "Image";
	};

	const getCurrentImage = () => {
		if (!images || !images.length || index < 0 || index >= images.length) {
			return null;
		}
		return images[index];
	};

	const handleImageError = () => {
		setError("No se pudo cargar la imagen");
		setIsLoading(false);
	};

	const handleCopy = async () => {
		try {
			const image = getCurrentImage();
			if (!image) return;

			const response = await fetch(getImageSource(image));
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
			const image = getCurrentImage();
			if (!image) return;

			const response = await fetch(getImageSource(image));
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = image.name;
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

	const getImageThumbnail = (image?: ImageItem) => {
		if (!image) return "";
		return image.thumbnail || image.src || image.url || "";
	};

	if (!isOpen || !images || !images.length) {
		return null;
	}

	const currentImage = getCurrentImage();
	if (!currentImage) {
		return null;
	}

	return isOpen ? (
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

				{/* Main Image */}
				<motion.div
					key={getImageSource(currentImage)}
					className="absolute inset-0 flex items-center justify-center"
				>
					{isLoading && <Skeleton className="w-[80vw] h-[80vh] absolute" />}
					{error ? (
						<div className="text-center text-muted-foreground">
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
							animate={{
								opacity: [0, 1],
								scale,
								x: position.x,
								y: position.y,
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
								setIsLoading(false);
								setError(null);
							}}
						/>
					)}
				</motion.div>

				{/* Thumbnails */}
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center z-20">
					<div className="flex items-center bg-background/5 backdrop-blur-sm px-2 py-1 rounded-lg">
						{images
							.slice(Math.max(0, index - 3), Math.min(images.length, index + 4))
							.map((image, i) => (
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
									<ImageFallback
										src={getImageThumbnail(image)}
										alt={getImageAlt(image)}
										className="w-full h-full object-cover transition-all duration-200 hover:scale-110"
										gradientColors={[
											`hsl(${
												(parseInt(image.id.split("-")[1] || "0") * 40) % 360
											}, 95%, 75%)`,
											`hsl(${
												(parseInt(image.id.split("-")[1] || "0") * 40 + 60) %
												360
											}, 95%, 75%)`,
										]}
										showPlaceholder={!getImageThumbnail(image)}
									/>
								</motion.div>
							))}
					</div>
				</div>

				{/* Navigation hints */}
				<div className="fixed bottom-4 left-4 text-xs text-muted-foreground/50 pointer-events-none select-none max-w-[300px]">
					<p>Flechas: navegar • Rueda: zoom • Arrastrar: mover</p>
					<p>ESC: cerrar • R: restablecer • +/-: zoom</p>
				</div>
			</div>
		</motion.div>
	) : null;
}
