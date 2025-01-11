"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "@/components/core/icons";
import { StatCard } from "./components/stat-card";
import { TagUsage } from "./components/tag-usage";
import { Activity } from "./components/activity";
import { useStats } from "@/hooks/use-stats";
import { formatBytes } from "@/lib/utils";
import { Meteors } from "@/components/ui/meteors";
import type { IconName } from "@/components/core/icons";

export function StatsPanel() {
	const { stats, isLoading } = useStats();

	// Estadísticas principales
	const mainStats = [
		{
			title: "Imágenes",
			value: stats?.totalImages || 0,
			icon: "Image" as IconName,
			color: "text-primary",
		},
		{
			title: "Carpetas",
			value: stats?.totalFolders || 0,
			icon: "Folder" as IconName,
			color: "text-orange-500",
		},
		{
			title: "Colecciones",
			value: stats?.totalCollections || 0,
			icon: "Bookmark" as IconName,
			color: "text-blue-500",
		},
		{
			title: "Etiquetas",
			value: stats?.totalTags || 0,
			icon: "Tag" as IconName,
			color: "text-green-500",
		},
		{
			title: "Álbumes",
			value: stats?.totalAlbums || 0,
			icon: "Album" as IconName,
			color: "text-purple-500",
		},
		{
			title: "Personajes",
			value: stats?.totalCharacters || 0,
			icon: "Users" as IconName,
			color: "text-pink-500",
		},
		{
			title: "Lugares",
			value: stats?.totalPlaces || 0,
			icon: "MapPin" as IconName,
			color: "text-red-500",
		},
		{
			title: "Objetos",
			value: stats?.totalObjects || 0,
			icon: "Box" as IconName,
			color: "text-amber-500",
		},
	];

	// Estadísticas adicionales
	const additionalStats = [
		{
			title: "Favoritos",
			value: stats?.totalFavorites || 0,
			icon: "Star" as IconName,
			color: "text-yellow-500",
		},
		{
			title: "Vistas",
			value: stats?.totalViews || 0,
			icon: "Eye" as IconName,
			color: "text-cyan-500",
		},
		{
			title: "Descargas",
			value: stats?.totalDownloads || 0,
			icon: "Download" as IconName,
			color: "text-indigo-500",
		},
		{
			title: "Espacio Usado",
			value: formatBytes(stats?.totalSize || 0),
			icon: "HardDrive" as IconName,
			color: "text-rose-500",
		},
		{
			title: "Actividades",
			value: stats?.totalActivities || 0,
			icon: "Activity" as IconName,
			color: "text-violet-500",
		},
	];

	return (
		<ScrollArea className="h-full w-full p-0">
			<div className="p-0 w-full h-full">
				<Meteors />
				<Card className="border-none rounded-none">
					<CardHeader className="p-0 py-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
							<Icons.BarChart className="h-4 w-4 text-primary" />
							Estadísticas generales
						</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-2 p-0 gap-2">
						{mainStats.map((stat, i) => (
							<StatCard key={i} {...stat} isLoading={isLoading} />
						))}
						{additionalStats.map((stat, i) => (
							<StatCard key={i} {...stat} isLoading={isLoading} />
						))}
					</CardContent>

					<CardHeader className="px-0 py-2 mt-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
							<Icons.Tag className="h-4 w-4 text-primary" />
							Etiquetas Más Usadas
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0 space-y-1 w-full gap-2">
						{(isLoading ? Array(5).fill(null) : stats?.topTags || []).map(
							(tag, i) => (
								<TagUsage key={i} tag={tag} isLoading={isLoading} />
							)
						)}
					</CardContent>

					<CardHeader className="p-0 pb-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
							<Icons.Clock className="h-4 w-4 text-primary" />
							Actividad Reciente
						</CardTitle>
					</CardHeader>
					<CardContent className="p-2 space-y-1">
						{(isLoading
							? Array(5).fill(null)
							: stats?.recentActivity || []
						).map((activity, i) => (
							<Activity key={i} activity={activity} isLoading={isLoading} />
						))}
					</CardContent>
				</Card>
			</div>
		</ScrollArea>
	);
}
