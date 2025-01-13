"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { ViewProps } from "../types";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Album as AlbumIcon, ImageIcon, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/core/feedback";
import { EmptyState } from "@/components/core/data-display";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useNavigationStore } from "@/store/navigation.store";
import { useFileManager } from "@/store/file-manager.store";
import { useRouter } from "next/navigation";
import { getAlbums } from "@/app/actions/album.actions";
import { eventsService, type EventData } from "@/services/events.service";
import { logger } from "@/lib/logger";
import type { AlbumWithStats } from "@/app/actions/album.actions";

const viewLogger = logger.withContext("AlbumsView");

interface AlbumCardProps {
	album: AlbumWithStats;
	onClick: () => void;
}

function getRandomGradient() {
	const gradients = [
		"from-rose-500 to-indigo-500",
		"from-emerald-500 to-sky-500",
		"from-amber-500 to-pink-500",
		"from-violet-500 to-orange-500",
		"from-cyan-500 to-yellow-500",
		"from-fuchsia-500 to-lime-500",
		"from-purple-500 to-teal-500",
		"from-blue-500 to-red-500",
		"from-green-500 to-purple-500",
	];
	return gradients[Math.floor(Math.random() * gradients.length)];
}

const AlbumCard = memo(function AlbumCard({ album, onClick }: AlbumCardProps) {
	const gradient = getRandomGradient();
	const router = useRouter();

	const handleEdit = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			viewLogger.info("⚙️ Editando álbum:", album.name);
			router.push("/settings/albums");
		},
		[router, album.name]
	);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<HoverCard>
				<HoverCardTrigger asChild>
					<Card
						className={cn(
							"group relative overflow-hidden transition-all hover:shadow-md",
							"cursor-pointer border-2 border-primary/10"
						)}
						onClick={onClick}
					>
						<CardHeader className="p-4">
							<CardTitle className="flex items-center gap-2 text-base">
								{album.emoji && <span>{album.emoji}</span>}
								<span className="truncate">{album.name}</span>
							</CardTitle>
							<CardDescription className="flex items-center gap-2 text-xs">
								<ImageIcon className="h-3 w-3" />
								<span>{album._count.images} imágenes</span>
							</CardDescription>
						</CardHeader>
						<CardContent className="p-4 pt-0">
							<div className="flex items-center justify-between text-sm text-muted-foreground">
								<div className="flex items-center gap-2">
									{album.shortcut && (
										<Badge variant="secondary" className="font-normal">
											{album.shortcut}
										</Badge>
									)}
									{album.sortBy && (
										<Badge variant="secondary" className="font-normal">
											{album.sortBy}
										</Badge>
									)}
								</div>

							</div>
							<div
								className={cn(
									"absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r",
									gradient
								)}
							/>
						</CardContent>
					</Card>
				</HoverCardTrigger>
				<HoverCardContent
					align="start"
					className="w-[300px] border-2 border-primary/10"
				>
					<div className="flex justify-between">
						<div className="space-y-1">
							<h4 className="text-sm font-semibold">
								{album.emoji && <span className="mr-2">{album.emoji}</span>}
								{album.name}
							</h4>
							<div className="flex items-center gap-4">
								<Badge variant="secondary" className="font-normal">
									{album._count.images} imágenes
								</Badge>
							</div>
						</div>
				
					</div>
				</HoverCardContent>
			</HoverCard>
		</motion.div>
	);
});

export function AlbumsView({ isResizing }: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentAlbum } = useFileManager();
	const [albums, setAlbums] = useState<AlbumWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAlbums = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info("🔄 Cargando álbumes...");
			const data = await getAlbums();
			setAlbums(data);
			viewLogger.info(`✅ ${data.length} álbumes cargados`);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Error desconocido";
			viewLogger.error("❌ Error cargando álbumes:", err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		// Cargar álbumes inicialmente
		fetchAlbums();

		// Suscribirse a eventos relevantes
		const handleAlbumModified = (data?: EventData) => {
			viewLogger.info("📢 Evento de modificación de álbumes recibido:", data);
			fetchAlbums();
		};

		eventsService.on("albums:modified", handleAlbumModified);

		return () => {
			eventsService.off("albums:modified", handleAlbumModified);
		};
	}, [fetchAlbums]);

	const handleAlbumClick = useCallback(
		(album: AlbumWithStats) => {
			viewLogger.info("🖱️ Click en álbum:", album.name);
			setCurrentView("album-content");
			setCurrentAlbum(album.id);
		},
		[setCurrentView, setCurrentAlbum]
	);

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

	if (!albums || albums.length === 0) {
		return (
			<EmptyState
				icon={AlbumIcon}
				title="No hay álbumes"
				description="Los álbumes te ayudan a organizar tus imágenes. Crea un nuevo álbum desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{albums.map((album) => (
						<AlbumCard
							key={album.id}
							album={album}
							onClick={() => handleAlbumClick(album)}
						/>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
