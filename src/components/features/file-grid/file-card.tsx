"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FileItem } from "@/types/file-item";
import { ThumbnailSize } from "@/types/ui";
import { cn } from "@/lib/utils";
import { thumbnailService } from "@/services/thumbnail.service";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon } from "lucide-react";

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

	const loadThumbnail = useCallback(async () => {
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
			setThumbnail(thumbnailData);
			setIsLoading(false);
		} catch (error) {
			console.error("Error cargando miniatura:", error);

			// El servicio ya maneja los reintentos internamente
			setError(
				error instanceof Error ? error.message : "Error cargando miniatura"
			);
			setIsLoading(false);

			// Solo mostrar toast para errores críticos (después de reintentos)
			if (
				error instanceof Error &&
				error.message.includes("después de reintentos")
			) {
				toast({
					title: "Error",
					description: "No se pudo cargar la miniatura",
					variant: "destructive",
				});
			}
		}
	}, [item.id, thumbnailSize, toast]);

	useEffect(() => {
		let isMounted = true;

		const init = async () => {
			if (!isMounted) return;
			await loadThumbnail();
		};

		init();

		return () => {
			isMounted = false;
		};
	}, [loadThumbnail]);

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
				viewMode === "grid" ? "aspect-square" : "h-12",
				"group hover:border-primary/50"
			)}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
		>
			{isLoading ? (
				<Skeleton className="w-full h-full" />
			) : error ? (
				<div className="w-full h-full flex flex-col items-center justify-center bg-muted gap-2 p-4">
					<ImageIcon className="h-8 w-8 text-muted-foreground/50" />
					<span className="text-xs text-muted-foreground text-center">
						{error}
					</span>
				</div>
			) : (
				<div className="relative w-full h-full">
					{thumbnail ? (
						<>
							<img
								src={thumbnail}
								alt={item.name}
								className={cn(
									"w-full h-full object-cover transition-all duration-200",
									!isSelected && "group-hover:scale-105"
								)}
								loading="lazy"
								decoding="async"
							/>
							<div
								className={cn(
									"absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-200",
									"group-hover:opacity-100"
								)}
							>
								<div className="absolute bottom-0 left-0 right-0 p-2">
									<p className="text-xs text-white truncate">{item.name}</p>
								</div>
							</div>
						</>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-muted">
							<ImageIcon className="h-8 w-8 text-muted-foreground/50" />
						</div>
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
