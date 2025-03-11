"use client";

import { PromptCard } from "@/components/features/entity-cards/cards/prompt-card";
import { PromptForm } from "@/components/features/entity-cards/forms/prompt-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { useToast } from "@/components/ui/use-toast";
import { calculateStats } from "@/lib/entity.utils";
import { logger } from "@/lib/logger/logger";
import {
	type PromptFormData,
	usePromptStore,
} from "@/store/entities/prompt.store";
import { Loader2, MessageSquare } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";

const promptLogger = logger.withContext("PromptsSection");

export function PromptsSection() {
	const {
		prompts,
		isLoading,
		error,
		loadPrompts,
		createPrompt,
		updatePrompt,
		deletePrompt,
	} = usePromptStore();
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const { toast } = useToast();

	React.useEffect(() => {
		loadPrompts();
	}, [loadPrompts]);

	const handleCreate = async (data: PromptFormData) => {
		try {
			promptLogger.info("✨ Creando nuevo prompt:", data);
			await createPrompt(data);
			toast({
				title: "Éxito",
				description: "Prompt creado correctamente",
			});
		} catch (error) {
			promptLogger.error("❌ Error al crear prompt:", error);
			toast({
				title: "Error",
				description: "No se pudo crear el prompt",
				variant: "destructive",
			});
		}
	};

	const handleUpdate = async (data: PromptFormData) => {
		if (!editingId) {
			return;
		}
		try {
			promptLogger.info("💾 Actualizando prompt:", data);
			await updatePrompt(editingId, data);
			setEditingId(null);
			toast({
				title: "Éxito",
				description: "Prompt actualizado correctamente",
			});
		} catch (error) {
			promptLogger.error("❌ Error al actualizar prompt:", error);
			toast({
				title: "Error",
				description: "No se pudo actualizar el prompt",
				variant: "destructive",
			});
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("¿Estás seguro de eliminar este prompt?")) {
			return;
		}
		try {
			promptLogger.info("🗑️ Eliminando prompt:", { id });
			await deletePrompt(id);
			toast({
				title: "Éxito",
				description: "Prompt eliminado correctamente",
			});
		} catch (error) {
			promptLogger.error("❌ Error al eliminar prompt:", error);
			toast({
				title: "Error",
				description: "No se pudo eliminar el prompt",
				variant: "destructive",
			});
		}
	};

	// Calcular estadísticas
	const stats = React.useMemo(() => calculateStats(prompts), [prompts]);

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Card className="rounded-sm bg-muted/30">
					<CardHeader className="p-3">
						<CardTitle className="flex items-center gap-2 text-sm">
							<MessageSquare className="h-5 w-5" />
							Crear nuevo prompt
						</CardTitle>
					</CardHeader>
					<CardContent>
						<PromptForm onSubmit={handleCreate} isLoading={isLoading} />
					</CardContent>
				</Card>

				<StatsCard
					title="Estadísticas"
					icon={<MessageSquare className="h-5 w-5" />}
					isLoading={isLoading}
					stats={stats}
				/>
			</div>

			<Card className="rounded-sm bg-muted/30">
				<CardHeader className="p-3">
					<CardTitle className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2">
							<MessageSquare className="h-5 w-5" />
							Prompts
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => loadPrompts()}
							disabled={isLoading}
						>
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Recargar"
							)}
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading && prompts.length === 0 ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : error ? (
						<div className="flex flex-col items-center justify-center gap-2 p-8">
							<p className="text-sm text-muted-foreground text-center">
								{error.message}
							</p>
							<Button variant="outline" size="sm" onClick={() => loadPrompts()}>
								Reintentar
							</Button>
						</div>
					) : prompts.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 p-8">
							<MessageSquare className="h-8 w-8 text-muted-foreground" />
							<p className="text-sm text-muted-foreground text-center">
								No hay prompts creados
							</p>
							<p className="text-xs text-muted-foreground/75">
								Crea un prompt para empezar
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
							<AnimatePresence>
								{prompts.map((prompt) => (
									<motion.div
										key={prompt.id}
										layout
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.9 }}
										transition={{
											duration: 0.2,
											ease: "easeInOut",
										}}
									>
										{editingId === prompt.id ? (
											<Card className="relative">
												<CardContent className="p-4">
													<PromptForm
														initialData={{
															id: prompt.id,
															name: prompt.name,
															description: prompt.description || undefined,
															content: prompt.content,
															type: prompt.type,
															tags: prompt.tags,
														}}
														onSubmit={handleUpdate}
														onCancel={() => setEditingId(null)}
														isLoading={isLoading}
													/>
												</CardContent>
											</Card>
										) : (
											<PromptCard
												prompt={prompt}
												onEdit={() => setEditingId(prompt.id)}
												onDelete={handleDelete}
											/>
										)}
									</motion.div>
								))}
							</AnimatePresence>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
