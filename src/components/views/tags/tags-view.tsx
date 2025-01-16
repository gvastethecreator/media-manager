"use client";

import { useEffect, useCallback } from "react";
import { ViewProps } from "../types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "motion/react";
import { TagIcon } from "lucide-react";
import { LoadingScreen } from "@/components/core/feedback";
import { EmptyState } from "@/components/core/data-display";
import { useNavigationStore } from "@/store/navigation.store";
import { useFileManager } from "@/store/file-manager.store";
import { useTagsStore } from "@/store/tags.store";
import { eventsService, type EventData } from "@/services/events.service";
import { logger } from "@/lib/logger";
import { TagCard } from "@/components/cards/tag-card";

const viewLogger = logger.withContext("TagsView");

export function TagsView({ isResizing }: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentTag } = useFileManager();
	const { tags, isLoading, error, loadTags } = useTagsStore();

	const fetchTags = useCallback(async () => {
		try {
			viewLogger.info("🔄 Cargando etiquetas...");
			await loadTags();
			viewLogger.info(`✅ ${tags.length} etiquetas cargadas`);
		} catch (error) {
			viewLogger.error("❌ Error al cargar etiquetas:", error);
		}
	}, [loadTags, tags.length]);

	useEffect(() => {
		fetchTags();

		const handleTagModified = (data?: EventData) => {
			viewLogger.info("📢 Evento de modificación de etiquetas recibido:", data);
			fetchTags();
		};

		eventsService.on("tags:modified", handleTagModified);

		return () => {
			eventsService.off("tags:modified", handleTagModified);
		};
	}, [fetchTags]);

	const handleTagClick = useCallback(
		(tagId: string) => {
			viewLogger.info("🖱️ Click en etiqueta:", tagId);
			setCurrentView("tag-content");
			setCurrentTag(tagId);
		},
		[setCurrentView, setCurrentTag]
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

	if (!tags || tags.length === 0) {
		return (
			<EmptyState
				icon={TagIcon}
				title="No hay etiquetas"
				description="Las etiquetas te ayudan a organizar y encontrar tus imágenes. Crea una nueva etiqueta desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{tags.map((tag) => (
						<div
							key={tag.id}
							className="cursor-pointer"
							onClick={() => handleTagClick(tag.id)}
						>
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3 }}
							>
								<TagCard tag={tag} />
							</motion.div>
						</div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
