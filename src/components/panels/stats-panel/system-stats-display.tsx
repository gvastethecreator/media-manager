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

const StatsItem = memo(function StatsItemComponent({
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
		<div className="flex items-center gap-3 p-1 transition-colors hover:bg-muted/50">
			<Icon className={`h-4 w-4 ${color}`} />
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm">{label}</p>
				<p className="text-muted-foreground text-xs">{value}</p>
			</div>
		</div>
	);
});

const StatsGrid = memo(function StatsGridComponent({
	title,
	items,
}: {
	title: string;
	items: Array<{ icon: any; label: string; value: string | number; color?: string }>;
}) {
	return (
		<div className="mb-3 border-2 border-accent/20 p-2">
			<h2 className="mb-2 font-medium text-md">{title} </h2>

			{items.map((item) => (
				<StatsItem key={`${title}-${item.label}`} {...item} />
			))}
		</div>
	);
});

/**
 * Componente para mostrar estadísticas generales del sistema
 * Se muestra cuando no hay ninguna carpeta específica seleccionada
 */
export const SystemStatsDisplay = memo(function SystemStatsDisplayImpl() {
	const { data: stats, isLoading, error } = useNavigationStats();

	if (isLoading) {
		return (
			<div className="space-y-4 p-4">
				<div className="space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-3 w-32" />
				</div>
				{['a', 'b', 'c', 'd', 'e', 'f'].map((id) => (
					<div className="space-y-2" key={`skeleton-${id}`}>
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
		<div className="max-h-full w-full space-y-4 overflow-y-auto p-4">
			<StatsGrid items={contentStats} title="📁 Contenido Principal" />
			<StatsGrid items={worldStats} title="🌍 Worldbuilding" />
			<StatsGrid items={activityStats} title="📊 Actividad" />
			<StatsGrid items={storageStats} title="💾 Almacenamiento" />
		</div>
	);
});
