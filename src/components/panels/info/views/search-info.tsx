"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Icons } from "@/components/core/icons";
import { formatBytes, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useStatsStore } from "@/store/stats.store";
import { Search, Tag, Folder, Camera, HardDrive, Star, Download, Eye } from "lucide-react";

export function SearchInfo() {
	const { stats, isLoading } = useStatsStore();

	return (
		<div className="space-y-4 p-2">
			{/* Resumen General */}
			<div className="flex items-center gap-2">
				<div className="h-8 w-8 rounded-sm bg-cyan-500/10 flex items-center justify-center">
					<Search className="h-4 w-4 text-cyan-500" />
				</div>
				<div className="flex flex-col">
					<h3 className="text-sm font-medium">Búsqueda</h3>
					<p className="text-xs text-muted-foreground">
						{isLoading ? (
							<Skeleton className="h-4 w-20" />
						) : (
							`${stats?.totalImages || 0} imágenes disponibles`
						)}
					</p>
				</div>
			</div>

			{/* Estadísticas */}
			<Card className="border-none bg-muted/50">
				<CardContent className="p-4 space-y-3">
					{/* Filtros disponibles */}
					<div className="space-y-1.5">
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">Filtros disponibles</span>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<div className="flex items-center gap-2">
								<Tag className="h-3 w-3 text-muted-foreground" />
								<span className="text-xs">
									{isLoading ? (
										<Skeleton className="h-4 w-12" />
									) : (
										`${stats?.totalTags || 0} etiquetas`
									)}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Tag className="h-3 w-3 text-muted-foreground" />
								<span className="text-xs">
									{isLoading ? (
										<Skeleton className="h-4 w-12" />
									) : (
										`${stats?.totalCollections || 0} colecciones`
									)}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Folder className="h-3 w-3 text-muted-foreground" />
								<span className="text-xs">
									{isLoading ? (
										<Skeleton className="h-4 w-12" />
									) : (
										`${stats?.totalFolders || 0} carpetas`
									)}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Camera className="h-3 w-3 text-muted-foreground" />
								<span className="text-xs">
									{isLoading ? (
										<Skeleton className="h-4 w-12" />
									) : (
										`${stats?.totalAlbums || 0} álbumes`
									)}
								</span>
							</div>
						</div>
					</div>

					{/* Distribución por tipo */}
					<div className="space-y-1.5">
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">
								Distribución por tipo
							</span>
						</div>
						<div className="space-y-1">
							{/* Personajes */}
							<div className="space-y-1">
								<div className="flex items-center justify-between text-xs">
									<span className="text-xs text-muted-foreground">
										Personajes
									</span>
									<span>{stats?.totalCharacters || 0}</span>
								</div>
								<Progress
									value={
										stats?.totalCharacters
											? (stats.totalCharacters / stats.totalImages) * 100
											: 0
									}
									className="h-1"
								/>
							</div>
							{/* Lugares */}
							<div className="space-y-1">
								<div className="flex items-center justify-between text-xs">
									<span className="text-xs text-muted-foreground">Lugares</span>
									<span>{stats?.totalPlaces || 0}</span>
								</div>
								<Progress
									value={
										stats?.totalPlaces
											? (stats.totalPlaces / stats.totalImages) * 100
											: 0
									}
									className="h-1"
								/>
							</div>
							{/* Objetos */}
							<div className="space-y-1">
								<div className="flex items-center justify-between text-xs">
									<span className="text-xs text-muted-foreground">Objetos</span>
									<span>{stats?.totalObjects || 0}</span>
								</div>
								<Progress
									value={
										stats?.totalObjects
											? (stats.totalObjects / stats.totalImages) * 100
											: 0
									}
									className="h-1"
								/>
							</div>
						</div>
					</div>

					{/* Estadísticas adicionales */}
					<div className="grid grid-cols-2 gap-2">
						<div className="flex items-center gap-2">
							<Eye className="h-3 w-3 text-muted-foreground" />
							<span className="text-xs">
								{isLoading ? (
									<Skeleton className="h-4 w-12" />
								) : (
									stats?.totalViews || 0
								)}{" "}
								vistas
							</span>
						</div>
						<div className="flex items-center gap-2">
							<Download className="h-3 w-3 text-muted-foreground" />
							<span className="text-xs">
								{isLoading ? (
									<Skeleton className="h-4 w-12" />
								) : (
									stats?.totalDownloads || 0
								)}{" "}
								descargas
							</span>
						</div>
						<div className="flex items-center gap-2">
							<Star className="h-3 w-3 text-muted-foreground" />
							<span className="text-xs">
								{isLoading ? (
									<Skeleton className="h-4 w-12" />
								) : (
									stats?.totalFavorites || 0
								)}{" "}
								favoritos
							</span>
						</div>
						<div className="flex items-center gap-2">
							<HardDrive className="h-3 w-3 text-muted-foreground" />
							<span className="text-xs">
								{isLoading ? (
									<Skeleton className="h-4 w-12" />
								) : (
									formatBytes(stats?.totalSize || 0)
								)}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Búsquedas recientes */}
			<div className="space-y-2">
				<h4 className="text-xs font-medium text-muted-foreground">
					Búsquedas recientes
				</h4>
				<div className="space-y-2">
					{(isLoading ? Array(3).fill(null) : stats?.recentActivity || []).map(
						(activity, i) => (
							<div key={i} className="flex items-center gap-2">
								{isLoading ? (
									<Skeleton className="h-8 w-full" />
								) : (
									<>
										<div className="h-8 w-8 rounded-sm bg-muted flex items-center justify-center">
											<Search className="h-4 w-4 text-muted-foreground" />
										</div>
										<div className="flex flex-col flex-1">
											<p className="text-xs">{activity?.description}</p>
											<span className="text-[10px] text-muted-foreground">
												{formatDate(activity?.date)}
											</span>
										</div>
									</>
								)}
							</div>
						)
					)}
				</div>
			</div>
		</div>
	);
}
