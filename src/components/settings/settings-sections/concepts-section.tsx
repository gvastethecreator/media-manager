"use client";

import { ConceptCard } from "@/components/features/entity-cards/cards/concept-card";
import { ConceptForm } from "@/components/features/entity-cards/forms/concept-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { useToast } from "@/components/ui/use-toast";
import { calculateStats } from "@/lib/entity.utils";
import { logger } from "@/lib/logger/logger";
import {
	type ConceptFormData,
	useConceptStore,
} from "@/store/entities/concept.store";
import { Lightbulb, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";

const conceptLogger = logger.withContext("ConceptsSection");

export function ConceptsSection() {
	const {
		concepts,
		isLoading,
		error,
		loadConcepts,
		createConcept,
		updateConcept,
		deleteConcept,
	} = useConceptStore();
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const { toast } = useToast();

	React.useEffect(() => {
		loadConcepts();
	}, [loadConcepts]);

	const handleCreate = async (data: ConceptFormData) => {
		try {
			conceptLogger.info("✨ Creando nuevo concepto:", data);
			await createConcept(data);
			toast({
				title: "Éxito",
				description: "Concepto creado correctamente",
			});
		} catch (error) {
			conceptLogger.error("❌ Error al crear concepto:", error);
			toast({
				title: "Error",
				description: "No se pudo crear el concepto",
				variant: "destructive",
			});
		}
	};

	const handleUpdate = async (data: ConceptFormData) => {
		if (!editingId) {
			return;
		}
		try {
			conceptLogger.info("💾 Actualizando concepto:", data);
			await updateConcept(editingId, data);
			setEditingId(null);
			toast({
				title: "Éxito",
				description: "Concepto actualizado correctamente",
			});
		} catch (error) {
			conceptLogger.error("❌ Error al actualizar concepto:", error);
			toast({
				title: "Error",
				description: "No se pudo actualizar el concepto",
				variant: "destructive",
			});
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("¿Estás seguro de eliminar este concepto?")) {
			return;
		}
		try {
			conceptLogger.info("🗑️ Eliminando concepto:", { id });
			await deleteConcept(id);
			toast({
				title: "Éxito",
				description: "Concepto eliminado correctamente",
			});
		} catch (error) {
			conceptLogger.error("❌ Error al eliminar concepto:", error);
			toast({
				title: "Error",
				description: "No se pudo eliminar el concepto",
				variant: "destructive",
			});
		}
	};

	// Calcular estadísticas
	const stats = React.useMemo(() => calculateStats(concepts), [concepts]);

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Card className="rounded-sm bg-muted/30">
					<CardHeader className="p-3">
						<CardTitle className="flex items-center gap-2 text-sm">
							<Lightbulb className="h-5 w-5" />
							Crear nuevo concepto
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ConceptForm onSubmit={handleCreate} isLoading={isLoading} />
					</CardContent>
				</Card>

				<StatsCard
					title="Estadísticas"
					icon={<Lightbulb className="h-5 w-5" />}
					isLoading={isLoading}
					stats={stats}
				/>
			</div>

			<Card className="rounded-sm bg-muted/30">
				<CardHeader className="p-3">
					<CardTitle className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2">
							<Lightbulb className="h-5 w-5" />
							Conceptos
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => loadConcepts()}
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
					{isLoading && concepts.length === 0 ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : error ? (
						<div className="flex flex-col items-center justify-center gap-2 p-8">
							<p className="text-sm text-muted-foreground text-center">
								{error}
							</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() => loadConcepts()}
							>
								Reintentar
							</Button>
						</div>
					) : concepts.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 p-8">
							<Lightbulb className="h-8 w-8 text-muted-foreground" />
							<p className="text-sm text-muted-foreground text-center">
								No hay conceptos creados
							</p>
							<p className="text-xs text-muted-foreground/75">
								Crea un concepto para empezar
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
							<AnimatePresence>
								{concepts.map((concept) => (
									<motion.div
										key={concept.id}
										layout
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.9 }}
										transition={{
											duration: 0.2,
											ease: "easeInOut",
										}}
									>
										{editingId === concept.id ? (
											<Card className="relative">
												<CardContent className="p-4">
													<ConceptForm
														initialData={{
															name: concept.name,
															description: concept.description || undefined,
															content: concept.content,
															type: concept.type,
															tags: concept.tags,
														}}
														onSubmit={handleUpdate}
														onCancel={() => setEditingId(null)}
														isLoading={isLoading}
													/>
												</CardContent>
											</Card>
										) : (
											<ConceptCard
												concept={concept}
												onEdit={() => setEditingId(concept.id)}
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
