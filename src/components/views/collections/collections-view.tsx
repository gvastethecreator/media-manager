"use client";

import { useEffect, useState, useCallback } from "react";
import { ViewProps } from "../types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "motion/react";
import { LibraryBig } from "lucide-react";
import { LoadingScreen } from "@/components/core/feedback";
import { EmptyState } from "@/components/core/data-display";
import { useNavigationStore } from "@/store/navigation.store";
import { useFileManager } from "@/store/file-manager.store";
import { useRouter } from "next/navigation";
import {
	CollectionWithStats,
	getCollections,
} from "@/app/actions/collection.actions";
import { eventsService, EventType, type EventData } from "@/services/events.service";
import { logger } from "@/lib/logger";
import { CollectionCard } from "@/components/cards/collection-card";

const viewLogger = logger.withContext("CollectionsView");

export function CollectionsView({ isResizing }: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentCollection } = useFileManager();
	const router = useRouter();
	const [collections, setCollections] = useState<CollectionWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchCollections = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info("🔄 Cargando colecciones...");
			const data = await getCollections();
			setCollections(data);
			viewLogger.info(`✅ ${data.length} colecciones cargadas`);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Error desconocido";
			viewLogger.error("❌ Error cargando colecciones:", err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		// Cargar colecciones inicialmente
		fetchCollections();

		// Suscribirse a eventos relevantes
		const handleCollectionModified = (data?: EventData) => {
			viewLogger.info(
				"📢 Evento de modificación de colecciones recibido:",
				data
			);
			fetchCollections();
		};

		eventsService.on("collections:modified" as EventType, handleCollectionModified);

		return () => {
			eventsService.off("collections:modified" as EventType, handleCollectionModified);
		};
	}, [fetchCollections]);

	const handleCollectionClick = useCallback(
		(collection: CollectionWithStats) => {
			viewLogger.info("🖱️ Click en colección:", collection.name);
			setCurrentView("collection-content");
			setCurrentCollection(collection.id);
		},
		[setCurrentView, setCurrentCollection]
	);

	const handleEdit = useCallback(
		(collection: { id: string; name: string }) => {
			viewLogger.info("⚙️ Editando colección:", collection.name);
			router.push("/settings/collections");
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

	if (!collections || collections.length === 0) {
		return (
			<EmptyState
				icon={LibraryBig}
				title="No hay colecciones"
				description="Las colecciones te ayudan a organizar tus imágenes. Crea una nueva colección desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{collections.map((collection) => (
						<motion.div
							key={collection.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<CollectionCard
								collection={{
									...collection,
									_count: collection._count || { images: 0 },
									totalSize: collection.totalSize || 0,
								}}
								onClick={() => handleCollectionClick(collection)}
								onEdit={handleEdit}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
