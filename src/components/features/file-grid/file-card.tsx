"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { FileItem } from "@/types/file-item";
import { formatBytes, formatDate } from "@/lib/utils";
import { AlertCircle, FileIcon, ImageIcon, VideoIcon } from "lucide-react";

interface FileCardProps {
	item: FileItem;
	onClick?: (item: FileItem) => void;
	onDoubleClick?: (item: FileItem) => void;
	index: number;
	totalColumns: number;
	shouldLoad: boolean;
	hasBeenRendered: boolean;
}

export function FileCard({
	item,
	onClick,
	onDoubleClick,
	index,
	totalColumns,
	shouldLoad,
	hasBeenRendered,
}: FileCardProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState(0);
	const MAX_RETRIES = 3;

	const handleLoad = useCallback(() => {
		setIsLoading(false);
		setError(null);
	}, []);

	const handleError = useCallback(() => {
		setIsLoading(false);
		if (retryCount < MAX_RETRIES) {
			setRetryCount((prev) => prev + 1);
		} else {
			setError("Error al cargar la miniatura");
		}
	}, [retryCount]);

	const handleRetry = useCallback(() => {
		setIsLoading(true);
		setError(null);
		setRetryCount(0);
	}, []);

	useEffect(() => {
		if (shouldLoad && !hasBeenRendered) {
			setIsLoading(true);
			setError(null);
		}
	}, [shouldLoad, hasBeenRendered]);

	const renderThumbnail = () => {
		if (error) {
			return (
				<div className="absolute inset-0 flex items-center justify-center bg-muted">
					<div className="text-center p-2">
						<AlertCircle className="h-6 w-6 mx-auto mb-2 text-destructive" />
						<p className="text-xs text-muted-foreground">{error}</p>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleRetry}
							className="mt-2"
						>
							Reintentar
						</Button>
					</div>
				</div>
			);
		}

		if (!shouldLoad || !hasBeenRendered) {
			return (
				<div className="absolute inset-0 flex items-center justify-center bg-muted">
					{item.type === "image" ? (
						<ImageIcon className="h-6 w-6 text-muted-foreground" />
					) : item.type === "video" ? (
						<VideoIcon className="h-6 w-6 text-muted-foreground" />
					) : (
						<FileIcon className="h-6 w-6 text-muted-foreground" />
					)}
				</div>
			);
		}

		return (
			<>
				{isLoading && (
					<div className="absolute inset-0">
						<Skeleton className="w-full h-full" />
					</div>
				)}
				<Image
					src={`/api/images/${item.id}/thumbnail`}
					alt={item.name}
					fill
					className={cn(
						"object-cover transition-all duration-200",
						isLoading && "opacity-0",
						!isLoading && "opacity-100"
					)}
					onLoad={handleLoad}
					onError={handleError}
					priority={index < totalColumns * 2}
				/>
			</>
		);
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{
				duration: 0.2,
				delay: Math.min(index * 0.05, 1),
			}}
			className="h-full w-full"
		>
			<Card
				className={cn(
					"group relative h-full w-full overflow-hidden rounded-sm border-0 bg-muted/30",
					"hover:bg-muted/50 transition-colors duration-200"
				)}
				onClick={() => onClick?.(item)}
				onDoubleClick={() => onDoubleClick?.(item)}
			>
				<div className="relative aspect-square">
					{renderThumbnail()}
					<div
						className={cn(
							"absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0",
							"group-hover:opacity-100 transition-opacity duration-200"
						)}
					>
						<div className="absolute bottom-0 left-0 right-0 p-2">
							<p className="text-xs font-medium text-white truncate">
								{item.name}
							</p>
							<div className="flex items-center justify-between mt-1">
								<Badge
									variant="secondary"
									className="text-[10px] px-1 h-4 bg-white/20"
								>
									{formatBytes(item.size)}
								</Badge>
								<span className="text-[10px] text-white/70">
									{formatDate(item.createdAt)}
								</span>
							</div>
						</div>
					</div>
				</div>
			</Card>
		</motion.div>
	);
}
