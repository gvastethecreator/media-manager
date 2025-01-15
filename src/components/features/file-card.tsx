import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useFileManager } from "../../contexts/FileManagerContext";
import { useImageViewer } from "../../contexts/ImageViewerContext";
import { useImageResources } from "../../contexts/ImageResourcesContext";
import { useToast } from "../../contexts/ToastContext";
import { ImageItem } from "../../types/ImageItem";
import { getMetadata } from "../../utils/getMetadata";

export function FileCard({
	item,
	onClick,
	onDoubleClick,
	style,
	shouldLoad = false,
	isSelected = false,
	viewMode,
}: FileCardProps) {
	const [isHovered, setIsHovered] = useState(false);
	const { toggleItemSelection } = useFileManager();
	const { openViewer } = useImageViewer();
	const imageResources = useImageResources();
	const { toast } = useToast();

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			toggleItemSelection(item, false);
			if (onClick) onClick(item);
		},
		[item, onClick, toggleItemSelection]
	);

	const handleDoubleClick = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			try {
				if (onDoubleClick) {
					onDoubleClick(item);
					return;
				}

				const url = await imageResources.getOriginalUrl(item.id);
				if (!url) {
					throw new Error("No se pudo obtener la URL de la imagen");
				}

				const metadata = getMetadata(item.metadata);
				const imageToView: ImageItem = {
					...item,
					url,
					src: url,
					alt: item.name,
					mimeType: metadata?.mimeType || "image/jpeg",
				};

				toast({
					title: "Abriendo imagen",
					description: `Cargando ${imageToView.name}...`,
				});

				openViewer([imageToView], 0);
			} catch (error) {
				console.error("Error al abrir imagen:", error);
				toast({
					title: "Error",
					description: "No se pudo abrir la imagen",
					variant: "destructive",
				});
			}
		},
		[item, onDoubleClick, imageResources, openViewer, toast]
	);

	const handleHoverStart = useCallback(() => {
		if (!shouldLoad) return;
		setIsHovered(true);
	}, [shouldLoad]);

	const handleHoverEnd = useCallback(() => {
		if (!shouldLoad) return;
		setIsHovered(false);
	}, [shouldLoad]);

	// Cargar thumbnail cuando sea necesario
	useEffect(() => {
		if (shouldLoad) {
			imageResources.getThumbnail(item.id);
		}
	}, [item.id, shouldLoad, imageResources]);

	const isLoading = imageResources.isLoading(item.id);
	const thumbnail = useMemo(() => {
		if (!shouldLoad) return null;
		return imageResources.getThumbnail(item.id);
	}, [item.id, shouldLoad, imageResources]);

	// ... rest of the component code ...
}
