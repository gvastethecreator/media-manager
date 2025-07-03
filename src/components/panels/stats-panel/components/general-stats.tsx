import { AlertCircle, BarChart } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStats } from '@/lib/api/stats';
import { formatBytes } from '@/lib/utils/format.utils';
import { StatCard } from './stat-card';

export function GeneralStats() {
	// Usar React Query hook en lugar de server action
	const { data: stats, isLoading, error } = useStats();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-4 gap-2">
				<BarChart className="h-4 w-4 animate-pulse" />
				<span>Cargando estadísticas...</span>
			</div>
		);
	}

	if (error || !stats) {
		return (
			<div className="flex items-center justify-center p-4 text-destructive gap-2">
				<AlertCircle className="h-4 w-4" />
				<span>Error al cargar estadísticas</span>
			</div>
		);
	}

	// Estadísticas principales
	const mainStats = [
		{
			title: 'Imágenes',
			value: stats.totalImages,
			icon: 'Image',
			color: 'text-primary',
		},
		{
			title: 'Carpetas',
			value: stats.totalFolders,
			icon: 'Folder',
			color: 'text-orange-500',
		},
		{
			title: 'Colecciones',
			value: stats.totalCollections,
			icon: 'Bookmark',
			color: 'text-blue-500',
		},
		{
			title: 'Etiquetas',
			value: stats.totalTags,
			icon: 'Tag',
			color: 'text-green-500',
		},
		{
			title: 'Álbumes',
			value: stats.totalAlbums,
			icon: 'Album',
			color: 'text-purple-500',
		},
		{
			title: 'Personajes',
			value: stats.totalCharacters,
			icon: 'Users',
			color: 'text-pink-500',
		},
		{
			title: 'Lugares',
			value: stats.totalPlaces,
			icon: 'MapPin',
			color: 'text-red-500',
		},
		{
			title: 'Objetos',
			value: stats.totalWorldItems,
			icon: 'Box',
			color: 'text-amber-500',
		},
		{
			title: 'Documentos',
			value: stats.totalDocuments,
			icon: 'Book',
			color: 'text-amber-500',
		},
		{
			title: 'Audio',
			value: stats.totalAudio,
			icon: 'Activity',
			color: 'text-sky-500',
		},
		{
			title: 'JSON',
			value: stats.totalJsonFiles,
			icon: 'Box',
			color: 'text-pink-500',
		},
		{
			title: 'Workflows',
			value: stats.totalWorkflows,
			icon: 'Grid2X2',
			color: 'text-lime-500',
		},
		{
			title: '3D',
			value: stats.totalFile3D,
			icon: 'Box',
			color: 'text-indigo-500',
		},
	] as const;

	// Estadísticas adicionales
	const additionalStats = [
		{
			title: 'Favoritos',
			value: stats.totalFavorites,
			icon: 'Star',
			color: 'text-yellow-500',
		},
		{
			title: 'Vistas',
			value: stats.totalViews,
			icon: 'Eye',
			color: 'text-cyan-500',
		},
		{
			title: 'Descargas',
			value: stats.totalDownloads,
			icon: 'Download',
			color: 'text-indigo-500',
		},
		{
			title: 'Espacio Usado',
			value: formatBytes(stats.totalSize),
			icon: 'HardDrive',
			color: 'text-rose-500',
		},
		{
			title: 'Actividades',
			value: stats.totalActivities,
			icon: 'Activity',
			color: 'text-violet-500',
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
