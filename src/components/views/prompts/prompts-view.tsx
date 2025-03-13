"use client";

import { getPrompts } from "@/app/actions/prompts/prompt.actions";
import type { PromptWithStats } from "@/app/actions/prompts/prompt.actions";
import { EmptyState } from "@/components/core/data-display";
import { LoadingScreen } from "@/components/core/feedback";
import { PromptCard } from "@/components/features/entity-cards/layouts/prompt-card-layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { clientEvents } from "@/lib/client/events.client";
import { logger } from "@/lib/logger/logger";
import { useFileManager } from "@/store/file-manager.store";
import { useNavigationStore } from "@/store/navigation.store";
import type { Prompt } from "@prisma/client";
import { MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ViewProps } from "../types";

const viewLogger = logger.withContext("PromptsView");

// Función adaptadora para convertir PromptWithStats a CardData (Prompt)
const adaptPromptWithStats = (prompt: PromptWithStats): Prompt => {
	// Extraemos solo las propiedades que coincidan con el tipo Prompt
	const { _count, lastUpdated, ...promptData } = prompt;
	return promptData as Prompt;
};

export function PromptsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentPrompt } = useFileManager();
	const router = useRouter();
	const [prompts, setPrompts] = useState<PromptWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticPrompts, _addEvent] =
		clientEvents.useEvents<PromptWithStats[]>(prompts);

	const fetchPrompts = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info("🔄 Cargando prompts...");
			const data = await getPrompts();
			setPrompts(data);
			viewLogger.info(`✅ ${data.length} prompts cargados`);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Error desconocido";
			viewLogger.error("❌ Error cargando prompts:", err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		// Cargar prompts inicialmente
		fetchPrompts();
	}, [fetchPrompts]);

	const handlePromptClick = useCallback(
		(prompt: PromptWithStats) => {
			viewLogger.info("🖱️ Click en prompt:", prompt.name);
			setCurrentView("prompt-content");
			setCurrentPrompt(prompt.id);
		},
		[setCurrentView, setCurrentPrompt]
	);

	const handleEditPrompt = useCallback(
		(id: string) => {
			viewLogger.info("⚙️ Editando prompt:", id);
			router.push(`/settings/prompts?id=${id}`);
		},
		[router]
	);

	const handleDeletePrompt = useCallback((id: string) => {
		viewLogger.info("🗑️ Eliminando prompt:", id);
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

	if (!optimisticPrompts || optimisticPrompts.length === 0) {
		return (
			<EmptyState
				icon={MessageSquare}
				title="No hay prompts"
				description="Los prompts te ayudan a generar contenido con IA. Crea un nuevo prompt desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{optimisticPrompts.map((prompt, index) => (
						<motion.div
							key={prompt.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
							className="cursor-pointer"
							onClick={() => handlePromptClick(prompt)}
						>
							<PromptCard
								data={adaptPromptWithStats(prompt)}
								onEdit={() => handleEditPrompt(prompt.id)}
								onDelete={() => handleDeletePrompt(prompt.id)}
								className="h-full"
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
