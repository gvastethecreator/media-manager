"use client";

import { WorldItemCard } from "@/components/features/entity-cards/cards/world-item-card";
import {
	type WorldItemFormData,
	formDataToWorldItem,
	worldItemToFormData,
} from "@/components/features/entity-cards/forms/entity-types";
import { WorldItemForm } from "@/components/features/entity-cards/forms/world-item-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard, type StatsCardProps } from "@/components/ui/stats-card";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger/logger";
import { useWorldItemsStore } from "@/store/entities/world-items.store";
import { Box, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import * as React from "react";

const worldItemLogger = logger.withContext("WorldItemsSection");

export function WorldItemsSection() {
	const {
		worldItems,
		isLoading,
		error,
		loadWorldItems,
		createWorldItem,
		updateWorldItem,
		deleteWorldItem,
	} = useWorldItemsStore();
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const { toast } = useToast();

	// Calcular estadísticas
	const stats = React.useMemo(() => {
		if (!worldItems.length) {
			return {
				totalItems: 0,
				totalImages: 0,
				totalSize: 0,
				distribution: [],
				recentItems: [],
				lastUpdated: undefined,
			};
		}

		const totalImages = worldItems.reduce(
			(acc, item) => acc + (item._count?.images || 0),
			0
		);
		const totalSize = worldItems.reduce(
			(acc, item) => acc + (item.totalSize || 0),
			0
		);

		// Calcular distribución por categoría
		const categoryDistribution = worldItems.reduce(
			(acc, item) => {
				const category = item.category || "Sin categoría";
				acc[category] = (acc[category] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const distribution = Object.entries(categoryDistribution)
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);

		// Obtener objetos recientes
		const recentWorldItems = [...worldItems]
			.sort(
				(a, b) =>
					new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
			)
			.slice(0, 5)
			.map((item) => ({
				id: item.id,
				name: item.name,
				emoji: item.emoji,
				count: item._count?.images || 0,
			}));

		return {
			totalItems: worldItems.length,
			totalImages,
			totalSize,
			distribution,
			recentItems: recentWorldItems,
			lastUpdated: worldItems[0]?.updatedAt,
		};
	}, [worldItems]);

	React.useEffect(() => {
		loadWorldItems();
	}, [loadWorldItems]);

	const handleCreate = async (data: WorldItemFormData) => {
		try {
			worldItemLogger.info("🎯 Creando nuevo objeto del mundo:", data.name);
			await createWorldItem(formDataToWorldItem(data));
			toast({
				title: "Objeto del mundo creado",
				description: "El objeto del mundo se ha creado correctamente.",
			});
		} catch (error) {
			worldItemLogger.error("❌ Error creando objeto del mundo:", error);
			toast({
				title: "Error al crear objeto del mundo",
				description: "No se pudo crear el objeto del mundo.",
				variant: "destructive",
			});
		}
	};

	const handleUpdate = async (data: WorldItemFormData) => {
		if (!data.id) {
			return;
		}
		try {
			worldItemLogger.info("🎯 Actualizando objeto del mundo:", data.name);
			await updateWorldItem(data.id, formDataToWorldItem(data));
			toast({
				title: "Objeto del mundo actualizado",
				description: "El objeto del mundo se ha actualizado correctamente.",
			});
			setEditingId(null);
		} catch (error) {
			worldItemLogger.error("❌ Error actualizando objeto del mundo:", error);
			toast({
				title: "Error al actualizar objeto del mundo",
				description: "No se pudo actualizar el objeto del mundo.",
				variant: "destructive",
			});
		}
	};

	const handleDelete = async (id: string) => {
		try {
			worldItemLogger.info("🎯 Eliminando objeto del mundo:", id);
			await deleteWorldItem(id);
			toast({
				title: "Objeto del mundo eliminado",
				description: "El objeto del mundo se ha eliminado correctamente.",
			});
		} catch (error) {
			worldItemLogger.error("❌ Error eliminando objeto del mundo:", error);
			toast({
				title: "Error al eliminar objeto del mundo",
				description: "No se pudo eliminar el objeto del mundo.",
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
							<Box className="h-5 w-5" />
							Crear nuevo objeto del mundo
						</CardTitle>
					</CardHeader>
					<CardContent>
						<WorldItemForm onSubmit={handleCreate} isLoading={isLoading} />
					</CardContent>
				</Card>

				<StatsCard
					title="Estadísticas"
					icon={<Box className="h-5 w-5" />}
					isLoading={isLoading}
					stats={stats as StatsCardProps["stats"]}
				/>
			</div>

			<Card className="rounded-sm bg-muted/30">
				<CardHeader className="p-3">
					<CardTitle className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2">
							<Box className="h-5 w-5" />
							Objetos del mundo
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => loadWorldItems()}
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
					{error && (
						<div className="text-sm text-red-500 p-2 bg-red-50 rounded-md">
							{error}
						</div>
					)}
					{worldItems.length === 0 && !isLoading ? (
						<div className="text-sm text-muted-foreground text-center py-4">
							No hay objetos del mundo creados
						</div>
					) : (
						<div className="grid grid-cols-4 gap-4">
							{worldItems.map((worldItem) => (
								<motion.div
									key={worldItem.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3 }}
								>
									{editingId === worldItem.id ? (
										<WorldItemForm
											initialData={worldItemToFormData(worldItem)}
											onSubmit={handleUpdate}
											onCancel={() => setEditingId(null)}
											isLoading={isLoading}
										/>
									) : (
										<WorldItemCard
											worldItem={worldItem}
											onEdit={() => setEditingId(worldItem.id)}
											onDelete={() => handleDelete(worldItem.id)}
										/>
									)}
								</motion.div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
