import { getSystemStats } from "@/app/actions/stats/stats.actions";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes } from "@/lib/utils";
import { BarChart } from "lucide-react";
import { StatCard } from "./stat-card";

export async function GeneralStats() {
	const stats = await getSystemStats();

	// Estadísticas principales
	const mainStats = [
		{
			title: "Imágenes",
			value: stats.totalImages,
			icon: "Image",
			color: "text-primary",
		},
		{
			title: "Carpetas",
			value: stats.totalFolders,
			icon: "Folder",
			color: "text-orange-500",
		},
		{
			title: "Colecciones",
			value: stats.totalCollections,
			icon: "Bookmark",
			color: "text-blue-500",
		},
		{
			title: "Etiquetas",
			value: stats.totalTags,
			icon: "Tag",
			color: "text-green-500",
		},
		{
			title: "Álbumes",
			value: stats.totalAlbums,
			icon: "Album",
			color: "text-purple-500",
		},
		{
			title: "Personajes",
			value: stats.totalCharacters,
			icon: "Users",
			color: "text-pink-500",
		},
		{
			title: "Lugares",
			value: stats.totalPlaces,
			icon: "MapPin",
			color: "text-red-500",
		},
		{
			title: "Objetos",
			value: stats.totalObjects,
			icon: "Box",
			color: "text-amber-500",
		},
	] as const;

	// Estadísticas adicionales
	const additionalStats = [
		{
			title: "Favoritos",
			value: stats.totalFavorites,
			icon: "Star",
			color: "text-yellow-500",
		},
		{
			title: "Vistas",
			value: stats.totalViews,
			icon: "Eye",
			color: "text-cyan-500",
		},
		{
			title: "Descargas",
			value: stats.totalDownloads,
			icon: "Download",
			color: "text-indigo-500",
		},
		{
			title: "Espacio Usado",
			value: formatBytes(stats.totalSize),
			icon: "HardDrive",
			color: "text-rose-500",
		},
		{
			title: "Actividades",
			value: stats.totalActivities,
			icon: "Activity",
			color: "text-violet-500",
		},
	] as const;

	return (
		<>
			<CardHeader className="p-0 py-2">
				<CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
					<BarChart className="h-4 w-4 text-primary" />
					Estadísticas generales
				</CardTitle>
			</CardHeader>
			<CardContent className="grid grid-cols-2 p-0 gap-2">
				{mainStats.map((stat) => (
					<StatCard key={`main-stat-${stat.title}`} {...stat} />
				))}
				{additionalStats.map((stat) => (
					<StatCard key={`additional-stat-${stat.title}`} {...stat} />
				))}
			</CardContent>
		</>
	);
}
