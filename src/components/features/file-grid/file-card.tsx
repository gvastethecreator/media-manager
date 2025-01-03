"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileItem } from "@/types/file-item";
import { ThumbnailSize } from "@/types/ui";
import { cn } from "@/lib/utils";
import { thumbnailService } from "@/services/thumbnail.service";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface FileCardProps {
	item: FileItem;
	viewMode?: "grid" | "list";
	thumbnailSize?: ThumbnailSize;
	isSelected?: boolean;
	onClick?: (item: FileItem) => void;
	onDoubleClick?: (item: FileItem) => void;
}

export function FileCard({
	item,
	viewMode = "grid",
	thumbnailSize = "medium",
	isSelected = false,
	onClick,
	onDoubleClick,
}: FileCardProps) {
	const [thumbnail, setThumbnail] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { toast } = useToast();

	useEffect(() => {
		let isMounted = true;
		let retryCount = 0;
		const maxRetries = 3;

		const loadThumbnail = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Calidad basada en el tamaño de la miniatura
				const quality =
					thumbnailSize === "small"
						? "compressed"
						: thumbnailSize === "large"
						? "high"
						: "mid";

				const thumbnailData = await thumbnailService.getThumbnail(
					item.id,
					quality
				);

				if (isMounted) {
					setThumbnail(thumbnailData);
					setIsLoading(false);
					retryCount = 0; // Reset retry count on success
				}
			} catch (error) {
				console.error("Error cargando miniatura:", error);

				if (!isMounted) return;

				// Si no existe thumbnail, intentar generarlo
				if (error instanceof Error && error.message.includes("no encontrada")) {
					try {
						await thumbnailService.generateThumbnail(item.id, quality);
						// Reintentar cargar después de generar
						if (retryCount < maxRetries) {
							retryCount++;
							setTimeout(loadThumbnail, 1000); // Esperar 1s antes de reintentar
							return;
						}
					} catch (genError) {
						console.error("Error generando thumbnail:", genError);
					}
				}

				setError(
					error instanceof Error ? error.message : "Error cargando miniatura"
				);
				setIsLoading(false);

				// Mostrar toast solo para errores críticos
				if (retryCount >= maxRetries) {
					toast({
						title: "Error",
						description:
							"No se pudo cargar la miniatura después de varios intentos",
						variant: "destructive",
					});
				}
			}
		};

		loadThumbnail();
		return () => {
			isMounted = false;
		};
	}, [item.id, thumbnailSize, toast]);

	const handleClick = () => {
		if (onClick) onClick(item);
	};

	const handleDoubleClick = () => {
		if (onDoubleClick) onDoubleClick(item);
	};

	return (
		<motion.div
			layout
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			className={cn(
				"relative rounded-lg overflow-hidden border transition-colors",
				isSelected ? "border-primary" : "border-border",
				viewMode === "grid" ? "aspect-square" : "h-12"
			)}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
		>
			{isLoading ? (
				<Skeleton className="w-full h-full" />
			) : error ? (
				<div className="w-full h-full flex items-center justify-center bg-muted">
					<span className="text-xs text-muted-foreground">Error</span>
				</div>
			) : (
				<div className="relative w-full h-full">
					{thumbnail && (
						<img
							src={thumbnail}
							alt={item.name}
							className={cn(
								"w-full h-full object-cover transition-transform duration-200",
								!isSelected && "hover:scale-105"
							)}
						/>
					)}
					{viewMode === "list" && (
						<div className="absolute inset-0 flex items-center px-4">
							<span className="text-sm truncate">{item.name}</span>
						</div>
					)}
				</div>
			)}
		</motion.div>
	);
}
