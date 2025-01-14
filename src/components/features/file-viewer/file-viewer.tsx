"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import { useImageViewer } from "@/store/image-viewer.store";
import dynamic from "next/dynamic";
import type { FileItem, ImageItem } from "@/types/file-item";
import { getImageUrl } from "@/app/actions/image.actions";

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
	const [retryCount, setRetryCount] = useState<Record<string, number>>({});

	// Efecto para manejar el montaje
	useEffect(() => {
		setIsMounted(true);
		return () => setIsMounted(false);
	}, []);

	// Función para cargar una URL individual con reintentos
	const loadSingleUrl = useCallback(
		async (img: FileItem) => {
			const maxRetries = 3;
			const currentRetries = retryCount[img.id] || 0;

			if (currentRetries >= maxRetries) {
				console.error(`Máximo de reintentos alcanzado para ${img.name}`);
				return "";
			}

			try {
				const url = await getImageUrl(img.id);
				setRetryCount((prev) => ({ ...prev, [img.id]: 0 }));
				return url;
			} catch (error) {
				console.error(`Error cargando URL para ${img.name}:`, error);
				setRetryCount((prev) => ({
					...prev,
					[img.id]: (prev[img.id] || 0) + 1,
				}));
				return "";
			}
		},
		[retryCount]
	);

	// Cargar URLs temporales cuando cambian las imágenes
	const loadUrls = useCallback(async () => {
		if (!images || !images.length) return;

		setIsLoading(true);
		setError(null);

		try {
			const urls: Record<string, string> = {};
			await Promise.all(
				images.map(async (img) => {
					urls[img.id] = await loadSingleUrl(img);
				})
			);
			setSignedUrls(urls);
		} catch (error) {
			console.error("Error cargando URLs:", error);
			setError("Error cargando imágenes");
		} finally {
			setIsLoading(false);
		}
	}, [images, loadSingleUrl]);

	useEffect(() => {
		if (isOpen && isMounted) {
			console.info("🖼️ Cargando URLs para", images.length, "imágenes");
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
			const url = signedUrls[img.id];

			return {
				...img,
				width: width || undefined,
				height: height || undefined,
				src: url || "",
				alt: img.name,
				thumbnail: url || "", // Usar la misma URL para thumbnail
				metadata: {
					...parsedMetadata,
					isLocal: true, // Indicador para manejo especial de archivos locales
				},
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

	console.info("🖼️ Renderizando visor con", mappedImages.length, "imágenes");
	return (
		<AdvancedImageViewer
			images={mappedImages}
			initialIndex={Math.min(currentIndex, mappedImages.length - 1)}
			isOpen={isOpen}
			onClose={closeViewer}
		/>
	);
}
