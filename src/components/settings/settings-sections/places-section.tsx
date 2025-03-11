"use client";

import {
	type PlaceFormData,
	formDataToPlace,
	placeToFormData,
} from "@/components/features/entity-cards/entity-types";
import { PlaceCard } from "@/components/features/entity-cards/place/place-card";
import { PlaceForm } from "@/components/features/entity-cards/place/place-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard, type StatsCardProps } from "@/components/ui/stats-card";
import { logger } from "@/lib/logger/logger";
import { toastService } from "@/lib/services/toast.service";
import { usePlacesStore } from "@/store/entities/places.store";
import { Loader2, MapPin } from "lucide-react";
import { motion } from "motion/react";
import * as React from "react";

const placeLogger = logger.withContext("PlacesSection");

export function PlacesSection() {
	const {
		places,
		isLoading,
		error,
		loadPlaces,
		createPlace,
		updatePlace,
		deletePlace,
	} = usePlacesStore();
	const [editingId, setEditingId] = React.useState<string | null>(null);

	// Calcular estadísticas
	const stats = React.useMemo(() => {
		if (!places.length) {
			return {
				totalItems: 0,
				totalImages: 0,
				totalSize: 0,
				distribution: [],
				recentItems: [],
				lastUpdated: undefined,
			};
		}

		const totalImages = places.reduce(
			(acc, place) => acc + (place._count?.images || 0),
			0
		);
		const totalSize = places.reduce(
			(acc, place) => acc + (place.totalSize || 0),
			0
		);

		// Obtener lugares recientes
		const recentPlaces = [...places]
			.sort(
				(a, b) =>
					new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
			)
			.slice(0, 5)
			.map((place) => ({
				id: place.id,
				name: place.name,
				emoji: place.emoji,
				count: place._count?.images || 0,
			}));

		return {
			totalItems: places.length,
			totalImages,
			totalSize,
			distribution: places[0]?.distribution || [],
			recentItems: recentPlaces,
			lastUpdated: places[0]?.lastUpdated,
		};
	}, [places]);

	React.useEffect(() => {
		loadPlaces();
	}, [loadPlaces]);

	const handleCreate = async (data: PlaceFormData) => {
		try {
			placeLogger.info("✨ Creando nuevo lugar:", data);
			await createPlace(formDataToPlace(data));
			toastService.success("Lugar creado correctamente");
		} catch (error) {
			placeLogger.error("❌ Error al crear lugar:", error);
			toastService.error("No se pudo crear el lugar");
		}
	};

	const handleUpdate = async (data: PlaceFormData) => {
		if (!data.id) {
			return;
		}
		try {
			placeLogger.info("💾 Actualizando lugar:", data);
			const updateData = {
				...formDataToPlace(data),
				id: data.id,
			};
			await updatePlace(updateData);
			setEditingId(null);
			toastService.success("Lugar actualizado correctamente");
		} catch (error) {
			placeLogger.error("❌ Error al actualizar lugar:", error);
			toastService.error("No se pudo actualizar el lugar");
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("¿Estás seguro de eliminar este lugar?")) {
			return;
		}
		try {
			placeLogger.info("🗑️ Eliminando lugar:", { id });
			await deletePlace(id);
			toastService.success("Lugar eliminado correctamente");
		} catch (error) {
			placeLogger.error("❌ Error al eliminar lugar:", error);
			toastService.error("No se pudo eliminar el lugar");
		}
	};

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 md:grid-cols-2 gap-4">
				<Card className="rounded-sm bg-muted/30">
					<CardHeader className="p-3">
						<CardTitle className="flex items-center gap-2 text-sm">
							<MapPin className="h-5 w-5" />
							Crear nuevo lugar
						</CardTitle>
					</CardHeader>
					<CardContent>
						<PlaceForm onSubmit={handleCreate} isLoading={isLoading} />
					</CardContent>
				</Card>

				<StatsCard
					title="Estadísticas"
					icon={<MapPin className="h-5 w-5" />}
					isLoading={isLoading}
					stats={stats as StatsCardProps["stats"]}
				/>
			</div>

			<Card className="rounded-sm bg-muted/30">
				<CardHeader className="p-3">
					<CardTitle className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2">
							<MapPin className="h-5 w-5" />
							Lugares
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => loadPlaces()}
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
					{isLoading && places.length === 0 ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : error ? (
						<div className="flex flex-col items-center justify-center gap-2 p-8">
							<p className="text-sm text-muted-foreground text-center">
								{error}
							</p>
							<Button variant="outline" size="sm" onClick={() => loadPlaces()}>
								Reintentar
							</Button>
						</div>
					) : places.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 p-8">
							<MapPin className="h-8 w-8 text-muted-foreground" />
							<p className="text-sm text-muted-foreground text-center">
								No hay lugares creados
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{places.map((place) => (
								<motion.div
									key={place.id}
									layout
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
								>
									{editingId === place.id ? (
										<Card className="relative">
											<CardContent className="p-4">
												<PlaceForm
													initialData={placeToFormData(place)}
													onSubmit={handleUpdate}
													onCancel={() => setEditingId(null)}
													isLoading={isLoading}
												/>
											</CardContent>
										</Card>
									) : (
										<PlaceCard
											data={place}
											onEdit={() => setEditingId(place.id)}
											onDelete={handleDelete}
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
