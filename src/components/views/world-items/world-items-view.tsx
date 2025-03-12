"use client";

import { getWorldItems } from "@/app/actions/world-items/world-item.actions";
import type { WorldItemWithStats } from "@/app/actions/world-items/world-item.actions";
import { EmptyState } from "@/components/core/data-display";
import { LoadingScreen } from "@/components/core/feedback";
import { WorldItemCard } from "@/components/features/entity-cards/layouts/world-item-card-layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { clientEvents } from "@/lib/client/events.client";
import { logger } from "@/lib/logger/logger";
import { useFileManager } from "@/store/file-manager.store";
import { useNavigationStore } from "@/store/navigation.store";
import type { WorldItem } from "@prisma/client";
import { Box } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ViewProps } from "../types";

const viewLogger = logger.withContext("WorldItemsView");

export function WorldItemsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentWorldItem } = useFileManager();
	const [worldItems, setWorldItems] = useState<WorldItemWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticWorldItems, _addEvent] =
		clientEvents.useEvents<WorldItemWithStats[]>(worldItems);

	const fetchWorldItems = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info("🔄 Cargando objetos del mundo...");
			const data = await getWorldItems();
			setWorldItems(data);
			viewLogger.info(`✅ ${data.length} objetos del mundo cargados`);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Error desconocido";
			viewLogger.error("❌ Error cargando objetos del mundo:", err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		// Cargar objetos inicialmente
		fetchWorldItems();
	}, [fetchWorldItems]);

	const handleWorldItemClick = useCallback(
		(worldItem: WorldItemWithStats) => {
			viewLogger.info("🖱️ Click en objeto del mundo:", worldItem.name);
			setCurrentView("world-item-content");
			setCurrentWorldItem(worldItem.id);
		},
		[setCurrentView, setCurrentWorldItem]
	);

	const handleEditWorldItem = useCallback((worldItem: WorldItemWithStats) => {
		viewLogger.info("✏️ Editando objeto del mundo:", worldItem.name);
		// Implementar lógica de edición
	}, []);

	const handleDeleteWorldItem = useCallback((id: string) => {
		viewLogger.info("🗑️ Eliminando objeto del mundo:", id);
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

	if (!optimisticWorldItems || optimisticWorldItems.length === 0) {
		return (
			<EmptyState
				icon={Box}
				title="No hay objetos del mundo"
				description="Los objetos del mundo te ayudan a organizar tus imágenes. Crea un nuevo objeto del mundo desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{optimisticWorldItems.map((worldItem, index) => (
						<motion.div
							key={worldItem.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<WorldItemCard
								worldItem={worldItem}
								onClick={() => handleWorldItemClick(worldItem)}
								onEdit={() => handleEditWorldItem(worldItem)}
								onDelete={() => handleDeleteWorldItem(worldItem.id)}
								enableExplode={true}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
