"use client";

import { ObjectCard } from "@/components/features/entity-cards/cards/object-card";
import {
	type ObjectFormData,
	formDataToObject,
	objectToFormData,
} from "@/components/features/entity-cards/forms/entity-types";
import { ObjectForm } from "@/components/features/entity-cards/forms/object-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard, type StatsCardProps } from "@/components/ui/stats-card";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";
import { useObjectsStore } from "@/store/objects.store";
import { Box, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import * as React from "react";

const objectLogger = logger.withContext("ObjectsSection");

export function ObjectsSection() {
	const {
		objects,
		isLoading,
		error,
		loadObjects,
		createObject,
		updateObject,
		deleteObject,
	} = useObjectsStore();
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const { toast } = useToast();

	// Calcular estadísticas
	const stats = React.useMemo(() => {
		if (!objects.length) {
			return {
				totalItems: 0,
				totalImages: 0,
				totalSize: 0,
				distribution: [],
				recentItems: [],
				lastUpdated: undefined,
			};
		}

		const totalImages = objects.reduce(
			(acc, obj) => acc + (obj._count?.images || 0),
			0
		);
		const totalSize = objects.reduce(
			(acc, obj) => acc + (obj.totalSize || 0),
			0
		);

		// Calcular distribución por tipo
		const typeDistribution = objects.reduce(
			(acc, obj) => {
				const type = obj.type || "Sin tipo";
				acc[type] = (acc[type] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const distribution = Object.entries(typeDistribution)
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);

		// Obtener objetos recientes
		const recentObjects = [...objects]
			.sort(
				(a, b) =>
					new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
			)
			.slice(0, 5)
			.map((obj) => ({
				id: obj.id,
				name: obj.name,
				emoji: obj.emoji,
				count: obj._count?.images || 0,
			}));

		return {
			totalItems: objects.length,
			totalImages,
			totalSize,
			distribution,
			recentItems: recentObjects,
			lastUpdated: objects[0]?.updatedAt,
		};
	}, [objects]);

	React.useEffect(() => {
		loadObjects();
	}, [loadObjects]);

	const handleCreate = async (data: ObjectFormData) => {
		try {
			objectLogger.info("🎯 Creando nuevo objeto:", data.name);
			await createObject(formDataToObject(data));
			toast({
				title: "Objeto creado",
				description: "El objeto se ha creado correctamente.",
			});
		} catch (error) {
			objectLogger.error("❌ Error creando objeto:", error);
			toast({
				title: "Error al crear objeto",
				description: "No se pudo crear el objeto.",
				variant: "destructive",
			});
		}
	};

	const handleUpdate = async (data: ObjectFormData) => {
		if (!data.id) {
			return;
		}
		try {
			objectLogger.info("🎯 Actualizando objeto:", data.name);
			await updateObject(data.id, formDataToObject(data));
			toast({
				title: "Objeto actualizado",
				description: "El objeto se ha actualizado correctamente.",
			});
			setEditingId(null);
		} catch (error) {
			objectLogger.error("❌ Error actualizando objeto:", error);
			toast({
				title: "Error al actualizar objeto",
				description: "No se pudo actualizar el objeto.",
				variant: "destructive",
			});
		}
	};

	const handleDelete = async (id: string) => {
		try {
			objectLogger.info("🎯 Eliminando objeto:", id);
			await deleteObject(id);
			toast({
				title: "Objeto eliminado",
				description: "El objeto se ha eliminado correctamente.",
			});
		} catch (error) {
			objectLogger.error("❌ Error eliminando objeto:", error);
			toast({
				title: "Error al eliminar objeto",
				description: "No se pudo eliminar el objeto.",
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
							Crear nuevo objeto
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ObjectForm onSubmit={handleCreate} isLoading={isLoading} />
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
							Objetos
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => loadObjects()}
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
					{objects.length === 0 && !isLoading ? (
						<div className="text-sm text-muted-foreground text-center py-4">
							No hay objetos creados
						</div>
					) : (
						<div className="grid grid-cols-4 gap-4">
							{objects.map((object) => (
								<motion.div
									key={object.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3 }}
								>
									{editingId === object.id ? (
										<ObjectForm
											initialData={objectToFormData(object)}
											onSubmit={handleUpdate}
											onCancel={() => setEditingId(null)}
											isLoading={isLoading}
										/>
									) : (
										<ObjectCard
											object={object}
											onEdit={() => setEditingId(object.id)}
											onDelete={() => handleDelete(object.id)}
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
