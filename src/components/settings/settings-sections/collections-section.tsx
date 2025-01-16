"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Grid2X2 as CollectionIcon } from "lucide-react";
import { motion } from "motion/react";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";
import { useCollectionsStore } from "@/store/collections.store";
import { CollectionForm } from "@/components/forms/collection-form";
import { CollectionCard } from "@/components/cards/collection-card";
import {
	collectionToFormData,
	formDataToCollection,
	type CollectionFormData,
} from "@/components/forms/entity-types";
import { StatsCard } from "@/components/ui/stats-card";

const collectionLogger = logger.withContext("CollectionsSection");

export function CollectionsSection() {
	const {
		collections,
		isLoading,
		error,
		loadCollections,
		createCollection,
		updateCollection,
		deleteCollection,
	} = useCollectionsStore();
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const { toast } = useToast();

	// Calcular estadísticas
	const stats = React.useMemo(() => {
		if (!collections.length)
			return {
				totalItems: 0,
				totalImages: 0,
				totalSize: 0,
				distribution: [],
				recentItems: [],
				lastUpdated: undefined,
			};

		const totalImages = collections.reduce(
			(acc, col) => acc + (col._count?.images || 0),
			0
		);
		const totalSize = collections.reduce(
			(acc, col) => acc + (col.totalSize || 0),
			0
		);

		// Obtener colecciones recientes
		const recentCollections = [...collections]
			.sort(
				(a, b) =>
					new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
			)
			.slice(0, 5)
			.map((col) => ({
				id: col.id,
				name: col.name,
				emoji: col.emoji,
				count: col._count?.images || 0,
			}));

		return {
			totalItems: collections.length,
			totalImages,
			totalSize,
			distribution: collections[0]?.distribution || [],
			recentItems: recentCollections,
			lastUpdated: collections[0]?.lastUpdated,
		};
	}, [collections]);

	React.useEffect(() => {
		loadCollections();
	}, [loadCollections]);

	const handleCreate = async (data: CollectionFormData) => {
		try {
			collectionLogger.info("📝 Creando nueva colección:", data);
			await createCollection(formDataToCollection(data));
			toast({
				title: "Colección creada",
				description: "La colección se ha creado correctamente.",
			});
		} catch (error) {
			collectionLogger.error("❌ Error al crear colección:", error);
			toast({
				title: "Error al crear colección",
				description: "No se pudo crear la colección.",
				variant: "destructive",
			});
		}
	};

	const handleUpdate = async (data: CollectionFormData) => {
		if (!editingId) return;
		try {
			collectionLogger.info("💾 Actualizando colección:", data);
			await updateCollection(formDataToCollection(data, editingId));
			toast({
				title: "Colección actualizada",
				description: "La colección se ha actualizado correctamente.",
			});
			setEditingId(null);
		} catch (error) {
			collectionLogger.error("❌ Error al actualizar colección:", error);
			toast({
				title: "Error al actualizar colección",
				description: "No se pudo actualizar la colección.",
				variant: "destructive",
			});
		}
	};

	const handleDelete = async (id: string) => {
		try {
			collectionLogger.info("🗑️ Eliminando colección:", id);
			await deleteCollection(id);
			toast({
				title: "Colección eliminada",
				description: "La colección se ha eliminado correctamente.",
			});
		} catch (error) {
			collectionLogger.error("❌ Error al eliminar colección:", error);
			toast({
				title: "Error al eliminar colección",
				description: "No se pudo eliminar la colección.",
				variant: "destructive",
			});
		}
	};

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 md:grid-cols-2 gap-4">
				<Card className="rounded-sm bg-muted/30">
					<CardHeader className="p-3">
						<CardTitle className="flex items-center gap-2 text-sm">
							<CollectionIcon className="h-5 w-5" />
							Crear nueva colección
						</CardTitle>
					</CardHeader>
					<CardContent>
						<CollectionForm onSubmit={handleCreate} isLoading={isLoading} />
					</CardContent>
				</Card>

				<StatsCard
					title="Estadísticas"
					icon={<CollectionIcon className="h-5 w-5" />}
					isLoading={isLoading}
					stats={stats}
				/>
			</div>

			<Card className="rounded-sm bg-muted/30">
				<CardHeader className="p-3">
					<CardTitle className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2">
							<CollectionIcon className="h-5 w-5" />
							Colecciones
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => loadCollections()}
							disabled={isLoading}
						>
							{isLoading ?
								<Loader2 className="h-4 w-4 animate-spin" />
							:	"Recargar"}
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading && collections.length === 0 ?
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					: error ?
						<div className="flex flex-col items-center justify-center gap-2 p-8">
							<p className="text-sm text-muted-foreground text-center">
								{error.message}
							</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() => loadCollections()}
							>
								Reintentar
							</Button>
						</div>
					: collections.length === 0 ?
						<div className="flex flex-col items-center justify-center gap-2 p-8">
							<CollectionIcon className="h-8 w-8 text-muted-foreground" />
							<p className="text-sm text-muted-foreground text-center">
								No hay colecciones creadas
							</p>
						</div>
					:	<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{collections.map((collection) => (
								<motion.div
									key={collection.id}
									layout
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
								>
									{editingId === collection.id ?
										<Card className="relative">
											<CardContent className="p-4">
												<CollectionForm
													initialData={collectionToFormData(collection)}
													onSubmit={handleUpdate}
													onCancel={() => setEditingId(null)}
													isLoading={isLoading}
												/>
											</CardContent>
										</Card>
									:	<CollectionCard
											collection={collection}
											onEdit={() => setEditingId(collection.id)}
											onDelete={handleDelete}
										/>
									}
								</motion.div>
							))}
						</div>
					}
				</CardContent>
			</Card>
		</div>
	);
}
