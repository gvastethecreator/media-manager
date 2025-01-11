"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Icons } from "@/components/core/icons";
import { formatBytes, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/hooks/use-stats";

export function AllImagesInfo() {
	const { stats, isLoading } = useStats();

	return (
		<div className="space-y-4 p-2">
			{/* Resumen General */}
			<div className="flex items-center gap-2">
				<div className="h-8 w-8 rounded-sm bg-primary/10 flex items-center justify-center">
					<Icons.Image className="h-4 w-4 text-primary" />
				</div>
				<div className="flex flex-col">
					<h3 className="text-sm font-medium">Galería</h3>
					<p className="text-xs text-muted-foreground">
						{isLoading ? (
							<Skeleton className="h-4 w-20" />
						) : (
							`${stats?.totalImages || 0} imágenes`
						)}
					</p>
				</div>
			</div>

			{/* Estadísticas */}
			<Card className="border-none bg-muted/50">
				<CardContent className="p-4 space-y-3">
					{/* Distribución por tipo */}
					<div className="space-y-1.5">
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">
								Distribución por tipo
							</span>
						</div>
						<div className="space-y-1">
							{/* Colecciones */}
							<div className="space-y-1">
								<div className="flex items-center justify-between text-xs">
									<span className="text-xs text-muted-foreground">
										Colecciones
									</span>
									<span>{stats?.totalCollections || 0}</span>
								</div>
								<Progress
									value={
										stats?.totalCollections
											? (stats.totalCollections / stats.totalImages) * 100
											: 0
									}
									className="h-1"
								/>
							</div>
							{/* Carpetas */}
							<div className="space-y-1">
								<div className="flex items-center justify-between text-xs">
									<span className="text-xs text-muted-foreground">
										Carpetas
									</span>
									<span>{stats?.totalFolders || 0}</span>
								</div>
								<Progress
									value={
										stats?.totalFolders
											? (stats.totalFolders / stats.totalImages) * 100
											: 0
									}
									className="h-1"
								/>
							</div>
							{/* Álbumes */}
							<div className="space-y-1">
								<div className="flex items-center justify-between text-xs">
									<span className="text-xs text-muted-foreground">Álbumes</span>
									<span>{stats?.totalAlbums || 0}</span>
								</div>
								<Progress
									value={
										stats?.totalAlbums
											? (stats.totalAlbums / stats.totalImages) * 100
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
							<Icons.Eye className="h-3 w-3 text-muted-foreground" />
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
							<Icons.Download className="h-3 w-3 text-muted-foreground" />
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
							<Icons.Star className="h-3 w-3 text-muted-foreground" />
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
							<Icons.HardDrive className="h-3 w-3 text-muted-foreground" />
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

			{/* Actividad reciente */}
			<div className="space-y-2">
				<h4 className="text-xs font-medium text-muted-foreground">
					Actividad reciente
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
											<Icons.Clock className="h-4 w-4 text-muted-foreground" />
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
