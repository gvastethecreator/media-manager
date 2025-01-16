"use client";

import { useEffect, useState, useCallback } from "react";
import { ViewProps } from "../types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "motion/react";
import { Album as AlbumIcon } from "lucide-react";
import { LoadingScreen } from "@/components/core/feedback";
import { EmptyState } from "@/components/core/data-display";
import { useNavigationStore } from "@/store/navigation.store";
import { useFileManager } from "@/store/file-manager.store";
import { useRouter } from "next/navigation";
import { getAlbums } from "@/app/actions/album.actions";
import { eventsService, type EventData } from "@/services/events.service";
import { logger } from "@/lib/logger";
import { AlbumCard } from "@/components/cards/album-card";
import type { AlbumWithStats } from "@/app/actions/album.actions";

const viewLogger = logger.withContext("AlbumsView");

export function AlbumsView({ isResizing }: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentAlbum } = useFileManager();
	const router = useRouter();
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

	const handleEditAlbum = useCallback(
		(album: AlbumWithStats) => {
			viewLogger.info("⚙️ Editando álbum:", album.name);
			router.push("/settings/albums");
		},
		[router]
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
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{albums.map((album) => (
						<motion.div
							key={album.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<AlbumCard
								album={album}
								onClick={handleAlbumClick}
								onEdit={handleEditAlbum}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
