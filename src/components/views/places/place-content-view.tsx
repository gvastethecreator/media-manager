"use client";

import { useEffect, useState } from "react";
import { useFileManager } from "@/store/file-manager.store";
import { EmptyState } from "@/components/core/data-display/empty-state/empty-state";
import { MapPin } from "lucide-react";
import { BaseContentView } from "../base/base-content-view";
import { getPlaceImages } from "@/app/actions/place.actions";
import { ContentViewProvider } from "../base/content-view-provider";
import type { FileItem } from "@/types/file-item";

export function PlaceContentView() {
	const { currentPlaceId } = useFileManager();
	const [items, setItems] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadPlaceImages = async () => {
			if (!currentPlaceId) return;

			try {
				setIsLoading(true);
				const images = await getPlaceImages(currentPlaceId);
				setItems(images as unknown as FileItem[]);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Error desconocido");
			} finally {
				setIsLoading(false);
			}
		};

		loadPlaceImages();
	}, [currentPlaceId]);

	if (!currentPlaceId) {
		return (
			<EmptyState
				icon={MapPin}
				title="No hay lugar seleccionado"
				description="Selecciona un lugar para ver su contenido"
			/>
		);
	}

	return (
		<ContentViewProvider
			items={items}
			isLoading={isLoading}
			error={error}
			currentContainerId={currentPlaceId}
			containerName="lugar"
			emptyState={{
				icon: MapPin,
				title: "No hay imágenes en este lugar",
				description: "Este lugar no tiene imágenes asociadas",
			}}
		>
			<BaseContentView />
		</ContentViewProvider>
	);
}
