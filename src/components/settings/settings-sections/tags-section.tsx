"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Palette } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";
import { useTagsStore } from "@/store/tags.store";
import { TagForm } from "@/components/forms/tag-form";
import { TagCard } from "@/components/cards/tag-card";
import {
	tagToFormData,
	formDataToTag,
	type TagFormData,
} from "@/components/forms/entity-types";
import { StatsCard } from "@/components/ui/stats-card";

const tagsLogger = logger.withContext("TagsSection");

export function TagsSection() {
	const { tags, createTag, updateTag, deleteTag, loadTags } = useTagsStore();
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [isLoading, setIsLoading] = React.useState(false);
	const { toast } = useToast();

	// Calcular estadísticas
	const stats = React.useMemo(() => {
		const totalImages = tags.reduce(
			(acc, tag) => acc + (tag._count?.images || 0),
			0
		);
		const totalSize = tags.reduce((acc, tag) => acc + (tag.totalSize || 0), 0);

		// Ordenar tags por número de imágenes
		const sortedTags = [...tags].sort(
			(a, b) => (b._count?.images || 0) - (a._count?.images || 0)
		);

		// Calcular distribución por rango de imágenes
		const distribution = [
			{ name: "0 imágenes", count: 0 },
			{ name: "1-10 imágenes", count: 0 },
			{ name: "11-50 imágenes", count: 0 },
			{ name: "51-100 imágenes", count: 0 },
			{ name: "100+ imágenes", count: 0 },
		];

		tags.forEach((tag) => {
			const count = tag._count?.images || 0;
			if (count === 0) distribution[0].count++;
			else if (count <= 10) distribution[1].count++;
			else if (count <= 50) distribution[2].count++;
			else if (count <= 100) distribution[3].count++;
			else distribution[4].count++;
		});

		return {
			totalItems: tags.length,
			totalImages,
			totalSize,
			lastUpdated: sortedTags[0]?.lastUpdated,
			recentItems: sortedTags.slice(0, 5).map((tag) => ({
				id: tag.id,
				name: tag.name,
				color: tag.color || "#94a3b8",
				count: tag._count?.images || 0,
			})),
			distribution: distribution.filter((d) => d.count > 0),
		};
	}, [tags]);

	React.useEffect(() => {
		loadTags();
	}, [loadTags]);

	const handleCreate = async (data: TagFormData) => {
		try {
			setIsLoading(true);
			tagsLogger.info("✨ Creando nueva etiqueta:", data);
			await createTag({
				...formDataToTag(data),
				description: data.description || null,
				shortcut: data.shortcut || null,
			});
			toast({
				title: "Éxito",
				description: "Etiqueta creada correctamente",
			});
		} catch (error) {
			tagsLogger.error("❌ Error al crear etiqueta:", error);
			toast({
				title: "Error",
				description: "No se pudo crear la etiqueta",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdate = async (data: TagFormData) => {
		if (!editingId) return;
		try {
			setIsLoading(true);
			tagsLogger.info("💾 Actualizando etiqueta:", data);
			await updateTag(editingId, {
				...formDataToTag(data, editingId),
				description: data.description || null,
				shortcut: data.shortcut || null,
			});
			setEditingId(null);
			toast({
				title: "Éxito",
				description: "Etiqueta actualizada correctamente",
			});
		} catch (error) {
			tagsLogger.error("❌ Error al actualizar etiqueta:", error);
			toast({
				title: "Error",
				description: "No se pudo actualizar la etiqueta",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("¿Estás seguro de eliminar esta etiqueta?")) return;
		try {
			setIsLoading(true);
			tagsLogger.info("🗑️ Eliminando etiqueta:", id);
			await deleteTag(id);
			toast({
				title: "Éxito",
				description: "Etiqueta eliminada correctamente",
			});
		} catch (error) {
			tagsLogger.error("❌ Error al eliminar etiqueta:", error);
			toast({
				title: "Error",
				description: "No se pudo eliminar la etiqueta",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Card className="rounded-sm bg-muted/30">
					<CardHeader className="p-3">
						<CardTitle className="flex items-center gap-2 text-sm">
							<Palette className="h-5 w-5" />
							Crear nueva etiqueta
						</CardTitle>
					</CardHeader>
					<CardContent>
						<TagForm onSubmit={handleCreate} isLoading={isLoading} />
					</CardContent>
				</Card>

				<StatsCard
					title="Estadísticas"
					icon={<Palette className="h-5 w-5" />}
					isLoading={isLoading}
					stats={stats}
				/>
			</div>

			<Card className="rounded-sm bg-muted/30">
				<CardHeader className="p-3">
					<CardTitle className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2">
							<Palette className="h-5 w-5" />
							Etiquetas
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => loadTags()}
							disabled={isLoading}
						>
							{isLoading ?
								<Loader2 className="h-4 w-4 animate-spin" />
							:	"Recargar"}
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading && tags.length === 0 ?
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					: tags.length === 0 ?
						<div className="flex flex-col items-center justify-center gap-2 p-8">
							<Palette className="h-8 w-8 text-muted-foreground" />
							<p className="text-sm text-muted-foreground text-center">
								No hay etiquetas creadas
							</p>
							<p className="text-xs text-muted-foreground/75">
								Crea una etiqueta para clasificar tus imágenes
							</p>
						</div>
					:	<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
							<AnimatePresence>
								{tags.map((tag) => (
									<motion.div
										key={tag.id}
										layout
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.9 }}
										transition={{
											duration: 0.2,
											ease: "easeInOut",
										}}
									>
										{editingId === tag.id ?
											<Card className="relative">
												<CardContent className="p-4">
													<TagForm
														initialData={tagToFormData(tag)}
														onSubmit={handleUpdate}
														onCancel={() => setEditingId(null)}
														isLoading={isLoading}
													/>
												</CardContent>
											</Card>
										:	<TagCard
												tag={tag}
												onEdit={() => setEditingId(tag.id)}
												onDelete={handleDelete}
											/>
										}
									</motion.div>
								))}
							</AnimatePresence>
						</div>
					}
				</CardContent>
			</Card>
		</div>
	);
}
