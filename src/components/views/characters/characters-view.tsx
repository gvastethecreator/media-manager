"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Users, ImageIcon, Settings2 } from "lucide-react";
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
import { getCharacters } from "@/app/actions/character.actions";
import { eventsService, type EventData } from "@/services/events.service";
import { logger } from "@/lib/logger";
import type { CharacterWithStats } from "@/app/actions/character.actions";

const viewLogger = logger.withContext("CharactersView");

interface CharacterCardProps {
	character: CharacterWithStats;
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

function CharacterCard({ character, onClick }: CharacterCardProps) {
	const gradient = getRandomGradient();
	const router = useRouter();

	const handleEdit = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			viewLogger.info("⚙️ Editando personaje:", character.name);
			router.push("/settings/characters");
		},
		[router, character.name]
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
								{character.emoji && <span>{character.emoji}</span>}
								<span className="truncate">{character.name}</span>
							</CardTitle>
							<CardDescription className="flex items-center gap-2 text-xs">
								<ImageIcon className="h-3 w-3" />
								<span>{character._count.images} imágenes</span>
							</CardDescription>
						</CardHeader>
						<CardContent className="p-4 pt-0">
							<div className="flex items-center justify-between text-sm text-muted-foreground">
								<div className="flex items-center gap-2">
									<Badge variant="secondary" className="font-normal">
										{character.race}
									</Badge>
									<Badge variant="secondary" className="font-normal">
										{character.class}
									</Badge>
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
								{character.emoji && (
									<span className="mr-2">{character.emoji}</span>
								)}
								{character.name}
							</h4>
							<div className="flex items-center gap-4">
								<Badge variant="secondary" className="font-normal">
									{character._count.images} imágenes
								</Badge>
							</div>
						</div>
						
					</div>
				</HoverCardContent>
			</HoverCard>
		</motion.div>
	);
}

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
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{characters.map((character) => (
						<CharacterCard
							key={character.id}
							character={character}
							onClick={() => handleCharacterClick(character)}
						/>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
