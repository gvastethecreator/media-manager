"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import { useImageViewer } from "@/store/image-viewer.store";
import dynamic from "next/dynamic";
import type { FileItem, ImageItem } from "@/types/file-item";
import { getImageUrl } from "@/app/actions/image.actions";
import { logger } from "@/lib/logger";

const viewerLogger = logger.withContext("FileViewer");

interface AdvancedImageViewerProps {
	images: ImageItem[];
	initialIndex: number;
	isOpen: boolean;
	onClose: () => void;
}

// Lazy load del AdvancedImageViewer
const AdvancedImageViewer = dynamic(
	() =>
		import("./components/advanced-file-viewer").then(
			(mod) => mod.AdvancedImageViewer
		),
	{
		loading: () => null,
		ssr: false,
	}
);

const getMetadata = (metadata: string | null) => {
	if (!metadata) return null;
	try {
		return JSON.parse(metadata);
	} catch {
		return null;
	}
};

interface ViewerImage extends Omit<FileItem, "width" | "height" | "metadata"> {
	src: string;
	alt: string;
	thumbnail: string;
	width?: number;
	height?: number;
	metadata?: {
		dimensions?: { width: number; height: number };
		mimeType?: string;
	};
}

export function ImageViewer() {
	const { isOpen, images, currentIndex, closeViewer } = useImageViewer();
	const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isMounted, setIsMounted] = useState(false);

	// Efecto para manejar el montaje
	useEffect(() => {
		setIsMounted(true);
		return () => setIsMounted(false);
	}, []);

	// Cargar URLs temporales cuando cambian las imágenes
	const loadUrls = useCallback(async () => {
		if (!images || !images.length) return;

		setIsLoading(true);
		setError(null);

		try {
			const urls: Record<string, string> = {};
			await Promise.all(
				images.map(async (img) => {
					try {
						urls[img.id] = await getImageUrl(img.id);
						viewerLogger.info(`🔗 URL cargada para ${img.name}:`, urls[img.id]);
					} catch (error) {
						viewerLogger.error(
							`❌ Error cargando URL para ${img.name}:`,
							error
						);
						urls[img.id] = ""; // URL vacía en caso de error
					}
				})
			);
			setSignedUrls(urls);
		} catch (error) {
			viewerLogger.error("Error cargando URLs:", error);
			setError("Error cargando imágenes");
		} finally {
			setIsLoading(false);
		}
	}, [images]);

	useEffect(() => {
		if (isOpen && isMounted) {
			viewerLogger.info("🖼️ Cargando URLs para", images.length, "imágenes");
			loadUrls();
		}
	}, [isOpen, isMounted, loadUrls, images]);

	// Optimizamos el mapeo de imágenes con useMemo
	const mappedImages = useMemo(() => {
		if (!images || !images.length) return [];

		return images.map((img) => {
			const parsedMetadata = getMetadata(img.metadata);
			const width = parsedMetadata?.dimensions?.width;
			const height = parsedMetadata?.dimensions?.height;

			return {
				...img,
				width: width || undefined,
				height: height || undefined,
				src: signedUrls[img.id] || "",
				alt: img.name,
				thumbnail: `/api/thumbnails/${img.id}?quality=medium`,
				metadata: parsedMetadata || undefined,
			} as ViewerImage;
		});
	}, [images, signedUrls]);

	// Si no está montado, no renderizamos nada
	if (!isMounted) return null;

	// Si no hay imágenes o el visor está cerrado, no renderizamos nada
	if (!mappedImages.length || !isOpen) {
		return null;
	}

	if (error) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
				<div className="text-white text-center">
					<p className="text-red-500 mb-4">{error}</p>
					<button
						onClick={closeViewer}
						className="px-4 py-2 bg-white/10 rounded hover:bg-white/20"
					>
						Cerrar
					</button>
				</div>
			</div>
		);
	}

	viewerLogger.info(
		"🖼️ Renderizando visor con",
		mappedImages.length,
		"imágenes"
	);
	return (
		<AdvancedImageViewer
			images={mappedImages}
			initialIndex={Math.min(currentIndex, mappedImages.length - 1)}
			isOpen={isOpen}
			onClose={closeViewer}
		/>
	);
}
