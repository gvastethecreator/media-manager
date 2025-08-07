import {
	ArchiveIcon,
	BoxIcon,
	FileTextIcon,
	FolderIcon,
	ImageIcon,
	MapPinIcon,
	SparklesIcon,
	TagIcon,
	UsersIcon,
} from 'lucide-react';
import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigationStats } from '@/lib/api/navigation';
import { formatFileSize } from '@/lib/utils';

const StatsItem = memo(function StatsItem({
	icon: Icon,
	label,
	value,
	color = 'text-muted-foreground',
}: {
	icon: any;
	label: string;
	value: string | number;
	color?: string;
}) {
	return (
		<div className="flex items-center gap-3 rounded-lg bg-muted/30 p-2 transition-colors hover:bg-muted/50">
			<Icon className={`h-4 w-4 ${color}`} />
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium text-sm">{label}</p>
				<p className="text-muted-foreground text-xs">{value}</p>
			</div>
		</div>
	);
});

const StatsGrid = memo(function StatsGrid({
	title,
	items,
}: {
	title: string;
	items: Array<{ icon: any; label: string; value: string | number; color?: string }>;
}) {
	return (
		<Card className="mb-4">
			<CardHeader className="pb-3">
				<CardTitle className="font-medium text-sm">{title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{items.map((item, index) => (
					<StatsItem key={`${title}-${item.label}-${index}`} {...item} />
				))}
			</CardContent>
		</Card>
	);
});

/**
 * Componente para mostrar estadísticas generales del sistema
 * Se muestra cuando no hay ninguna carpeta específica seleccionada
 */
export const SystemStatsDisplay = memo(function SystemStatsDisplay() {
	const { data: stats, isLoading, error } = useNavigationStats();

	if (isLoading) {
		return (
			<div className="space-y-4 p-4">
				<div className="space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-3 w-32" />
				</div>
				{Array.from({ length: 6 }).map((_, i) => (
					<div className="space-y-2" key={`skeleton-${i}`}>
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 text-center">
				<p className="text-destructive text-sm">Error al cargar estadísticas</p>
				<p className="mt-1 text-muted-foreground text-xs">{error.message || 'Error desconocido'}</p>
			</div>
		);
	}

	if (!stats) {
		return (
			<div className="p-4 text-center">
				<p className="text-muted-foreground text-sm">No hay datos disponibles</p>
			</div>
		);
	}

	// Estadísticas de contenido principal
	const contentStats = [
		{
			icon: ImageIcon,
			label: 'Imágenes',
			value: stats.totalImages.toLocaleString(),
			color: 'text-blue-500',
		},
		{
			icon: TagIcon,
			label: 'Etiquetas',
			value: stats.totalTags.toLocaleString(),
			color: 'text-green-500',
		},
		{
			icon: ArchiveIcon,
			label: 'Colecciones',
			value: stats.totalCollections.toLocaleString(),
			color: 'text-purple-500',
		},
		{
			icon: FolderIcon,
			label: 'Álbumes',
			value: stats.totalAlbums.toLocaleString(),
			color: 'text-yellow-500',
		},
	];

	// Estadísticas de worldbuilding
	const worldStats = [
		{
			icon: UsersIcon,
			label: 'Personajes',
			value: stats.totalCharacters.toLocaleString(),
			color: 'text-pink-500',
		},
		{
			icon: MapPinIcon,
			label: 'Lugares',
			value: stats.totalPlaces.toLocaleString(),
			color: 'text-orange-500',
		},
		{
			icon: BoxIcon,
			label: 'Objetos del mundo',
			value: stats.totalWorldItems.toLocaleString(),
			color: 'text-indigo-500',
		},
		{
			icon: SparklesIcon,
			label: 'Favoritos',
			value: stats.totalFavorites.toLocaleString(),
			color: 'text-cyan-500',
		},
	];

	// Estadísticas de actividad
	const activityStats = [
		{
			icon: FileTextIcon,
			label: 'Actividades',
			value: stats.totalActivities.toLocaleString(),
			color: 'text-slate-500',
		},
	];

	// Estadísticas de almacenamiento
	const storageStats = [
		{
			icon: FolderIcon,
			label: 'Carpetas',
			value: stats.totalFolders.toLocaleString(),
			color: 'text-amber-500',
		},
		{
			icon: ImageIcon,
			label: 'Tamaño total',
			value: formatFileSize(stats.totalSize),
			color: 'text-blue-400',
		},
	];

	return (
		<div className="max-h-full space-y-4 overflow-y-auto p-4">
			<div className="mb-4 text-center">
				<h4 className="font-medium text-muted-foreground text-sm">Estadísticas del Sistema</h4>
				<p className="mt-1 text-muted-foreground text-xs">Resumen general de todo el contenido</p>
			</div>

			<StatsGrid items={contentStats} title="📁 Contenido Principal" />
			<StatsGrid items={worldStats} title="🌍 Worldbuilding" />
			<StatsGrid items={activityStats} title="📊 Actividad" />
			<StatsGrid items={storageStats} title="💾 Almacenamiento" />
		</div>
	);
});
