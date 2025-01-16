"use client";

import { useEffect, useState, useCallback } from "react";
import { ViewProps } from "../types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "motion/react";
import { MapPin } from "lucide-react";
import { LoadingScreen } from "@/components/core/feedback";
import { EmptyState } from "@/components/core/data-display";
import { useNavigationStore } from "@/store/navigation.store";
import { useFileManager } from "@/store/file-manager.store";
import { eventsService, type EventData } from "@/services/events.service";
import { logger } from "@/lib/logger";
import { getPlaces, type PlaceWithStats } from "@/app/actions/place.actions";
import { PlaceCard } from "@/components/cards/place-card";

const viewLogger = logger.withContext("PlacesView");

export function PlacesView({ isResizing }: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentPlace } = useFileManager();
	const [places, setPlaces] = useState<PlaceWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchPlaces = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info("🔄 Cargando lugares...");
			const data = await getPlaces();
			setPlaces(data);
			viewLogger.info(`✅ ${data.length} lugares cargados`);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Error desconocido";
			viewLogger.error("❌ Error cargando lugares:", err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPlaces();

		const handlePlaceModified = (data?: EventData) => {
			viewLogger.info("📢 Evento de modificación de lugares recibido:", data);
			fetchPlaces();
		};

		eventsService.on("places:modified", handlePlaceModified);

		return () => {
			eventsService.off("places:modified", handlePlaceModified);
		};
	}, [fetchPlaces]);

	const handlePlaceClick = useCallback(
		(place: PlaceWithStats) => {
			viewLogger.info("🖱️ Click en lugar:", place.name);
			setCurrentView("place-content");
			setCurrentPlace(place.id);
		},
		[setCurrentView, setCurrentPlace]
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

	if (!places || places.length === 0) {
		return (
			<EmptyState
				icon={MapPin}
				title="No hay lugares"
				description="Los lugares te ayudan a organizar tus imágenes. Crea un nuevo lugar desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{places.map((place) => (
						<div
							key={place.id}
							className="cursor-pointer"
							onClick={() => handlePlaceClick(place)}
						>
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3 }}
							>
								<PlaceCard place={place} />
							</motion.div>
						</div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
