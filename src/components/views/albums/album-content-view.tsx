"use client";

import { useEffect, useState } from "react";
import { ViewProps } from "../types";
import { FileGrid } from "@/components/features/file-grid/file-grid";
import { LoadingScreen } from "@/components/core/feedback";
import { EmptyState } from "@/components/core/data-display";
import { Album } from "lucide-react";
import { useFileManager } from "@/store/file-manager";
import { FileItem } from "@/types/file-item";

export function AlbumContentView({ isResizing }: ViewProps) {
	const { currentAlbumId } = useFileManager();
	const [images, setImages] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchAlbumImages = async () => {
			if (!currentAlbumId) return;

			try {
				setIsLoading(true);
				const response = await fetch(`/api/albums/${currentAlbumId}/images`);
				const data = await response.json();
				setImages(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Error desconocido");
			} finally {
				setIsLoading(false);
			}
		};

		fetchAlbumImages();
	}, [currentAlbumId]);

	if (!currentAlbumId) {
		return (
			<EmptyState
				icon={Album}
				title="No hay álbum seleccionado"
				description="Selecciona un álbum para ver su contenido."
			/>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (!images || images.length === 0) {
		return (
			<EmptyState
				icon={Album}
				title="Álbum vacío"
				description="Este álbum no contiene imágenes."
			/>
		);
	}

	return <FileGrid items={images} isResizing={isResizing} />;
}
