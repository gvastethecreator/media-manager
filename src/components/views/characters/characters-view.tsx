"use client";

import { useEffect, useState, useCallback } from "react";
import { ViewProps } from "../types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "motion/react";
import { Users } from "lucide-react";
import { LoadingScreen } from "@/components/core/feedback";
import { EmptyState } from "@/components/core/data-display";
import { useNavigationStore } from "@/store/navigation.store";
import { useFileManager } from "@/store/file-manager.store";
import { eventsService, type EventData } from "@/services/events.service";
import { logger } from "@/lib/logger";
import { CharacterCard } from "@/components/cards/character-card";
import type { CharacterWithStats } from "@/app/actions/character.actions";
import { getCharacters } from "@/app/actions/character.actions";

const viewLogger = logger.withContext("CharactersView");

export function CharactersView({ isResizing }: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentCharacter } = useFileManager();
	const [characters, setCharacters] = useState<CharacterWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchCharacters = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info("🔄 Cargando personajes...");
			const data = await getCharacters();
			setCharacters(data);
			viewLogger.info(`✅ ${data.length} personajes cargados`);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Error desconocido";
			viewLogger.error("❌ Error cargando personajes:", err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		// Cargar personajes inicialmente
		fetchCharacters();

		// Suscribirse a eventos relevantes
		const handleCharacterModified = (data?: EventData) => {
			viewLogger.info(
				"📢 Evento de modificación de personajes recibido:",
				data
			);
			fetchCharacters();
		};

		eventsService.on("characters:modified", handleCharacterModified);

		return () => {
			eventsService.off("characters:modified", handleCharacterModified);
		};
	}, [fetchCharacters]);

	const handleCharacterClick = useCallback(
		(character: CharacterWithStats) => {
			viewLogger.info("🖱️ Click en personaje:", character.name);
			setCurrentView("character-content");
			setCurrentCharacter(character.id);
		},
		[setCurrentView, setCurrentCharacter]
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

	if (!characters || characters.length === 0) {
		return (
			<EmptyState
				icon={Users}
				title="No hay personajes"
				description="Los personajes te ayudan a organizar tus imágenes. Crea un nuevo personaje desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{characters.map((character) => (
						<motion.div
							key={character.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<CharacterCard
								character={{
									...character,
									featuredImage: character.recentImages?.[0] || null,
								}}
								onClick={() => handleCharacterClick(character)}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
