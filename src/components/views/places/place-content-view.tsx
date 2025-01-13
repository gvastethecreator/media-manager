"use client";

import { useEffect, useState } from "react";
import { ViewProps } from "../types";
import { FileGrid } from "@/components/features/file-grid/file-grid";
import { LoadingScreen } from "@/components/core/feedback";
import { EmptyState } from "@/components/core/data-display";
import { MapPin } from "lucide-react";
import { useFileManager } from "@/store/file-manager.store";
import { FileItem } from "@/types/file-item";

export function PlaceContentView({ isResizing }: ViewProps) {
	const { currentPlaceId } = useFileManager();
	const [images, setImages] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchPlaceImages = async () => {
			if (!currentPlaceId) return;

			try {
				setIsLoading(true);
				const response = await fetch(`/api/places/${currentPlaceId}/images`);
				const data = await response.json();
				setImages(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Error desconocido");
			} finally {
				setIsLoading(false);
			}
		};

		fetchPlaceImages();
	}, [currentPlaceId]);

	if (!currentPlaceId) {
		return (
			<EmptyState
				icon={MapPin}
				title="No hay lugar seleccionado"
				description="Selecciona un lugar para ver su contenido."
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
				icon={MapPin}
				title="Lugar sin imágenes"
				description="Este lugar no tiene imágenes asociadas."
			/>
		);
	}

	return <FileGrid items={images} isResizing={isResizing} />;
}
