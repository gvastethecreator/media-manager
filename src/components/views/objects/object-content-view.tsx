"use client";

import { useEffect, useState } from "react";
import { ViewProps } from "../types";
import { FileGrid } from "@/components/features/file-grid/file-grid";
import { LoadingScreen } from "@/components/core/feedback";
import { EmptyState } from "@/components/core/data-display";
import { Box } from "lucide-react";
import { useFileManager } from "@/store/file-manager.store";
import { FileItem } from "@/types/file-item";

export function ObjectContentView({ isResizing }: ViewProps) {
	const { currentObjectId } = useFileManager();
	const [images, setImages] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchObjectImages = async () => {
			if (!currentObjectId) return;

			try {
				setIsLoading(true);
				const response = await fetch(`/api/objects/${currentObjectId}/images`);
				const data = await response.json();
				setImages(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Error desconocido");
			} finally {
				setIsLoading(false);
			}
		};

		fetchObjectImages();
	}, [currentObjectId]);

	if (!currentObjectId) {
		return (
			<EmptyState
				icon={Box}
				title="No hay objeto seleccionado"
				description="Selecciona un objeto para ver su contenido."
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
				icon={Box}
				title="Objeto sin imágenes"
				description="Este objeto no tiene imágenes asociadas."
			/>
		);
	}

	return <FileGrid items={images} isResizing={isResizing} />;
}
