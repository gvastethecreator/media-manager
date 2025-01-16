"use client";

import { useEffect, useState, useCallback } from "react";
import { ViewProps } from "../types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "motion/react";
import { Box } from "lucide-react";
import { LoadingScreen } from "@/components/core/feedback";
import { EmptyState } from "@/components/core/data-display";
import { useNavigationStore } from "@/store/navigation.store";
import { useFileManager } from "@/store/file-manager.store";
import { getObjects } from "@/app/actions/object.actions";
import { eventsService, type EventData } from "@/services/events.service";
import { logger } from "@/lib/logger";
import type { ObjectWithStats } from "@/app/actions/object.actions";
import { ObjectCard } from "@/components/cards/object-card";
import type { Object } from "@prisma/client";

const viewLogger = logger.withContext("ObjectsView");

export function ObjectsView({ isResizing }: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentObject } = useFileManager();
	const [objects, setObjects] = useState<ObjectWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchObjects = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info("🔄 Cargando objetos...");
			const data = await getObjects();
			setObjects(data);
			viewLogger.info(`✅ ${data.length} objetos cargados`);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Error desconocido";
			viewLogger.error("❌ Error cargando objetos:", err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		// Cargar objetos inicialmente
		fetchObjects();

		// Suscribirse a eventos relevantes
		const handleObjectModified = (data?: EventData) => {
			viewLogger.info("📢 Evento de modificación de objetos recibido:", data);
			fetchObjects();
		};

		eventsService.on("objects:modified", handleObjectModified);

		return () => {
			eventsService.off("objects:modified", handleObjectModified);
		};
	}, [fetchObjects]);

	const handleObjectClick = useCallback(
		(object: ObjectWithStats) => {
			viewLogger.info("🖱️ Click en objeto:", object.name);
			setCurrentView("object-content");
			setCurrentObject(object.id);
		},
		[setCurrentView, setCurrentObject]
	);

	const handleEditObject = useCallback((object: Object) => {
		viewLogger.info("✏️ Editando objeto:", object.name);
		// Implementar lógica de edición
	}, []);

	const handleDeleteObject = useCallback((id: string) => {
		viewLogger.info("🗑️ Eliminando objeto:", id);
		// Implementar lógica de eliminación
	}, []);

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

	if (!objects || objects.length === 0) {
		return (
			<EmptyState
				icon={Box}
				title="No hay objetos"
				description="Los objetos te ayudan a organizar tus imágenes. Crea un nuevo objeto desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{objects.map((object, index) => (
						<motion.div
							key={object.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<ObjectCard
								object={object}
								onClick={(e) => {
									e.stopPropagation();
									handleObjectClick(object);
								}}
								onEdit={handleEditObject}
								onDelete={handleDeleteObject}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
