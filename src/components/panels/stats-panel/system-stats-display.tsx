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
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigationStats } from '@/lib/api/navigation';
import { cn, formatFileSize } from '@/lib/utils';

const StatsItem = memo(function StatsItemComponent({
	icon: Icon,
	label,
	value,
	color = 'text-muted-foreground',
}: {
	icon: React.ElementType;
	label: string;
	value: string | number;
	color?: string;
}) {
	return (
		<div className="flex items-center gap-3 rounded-dt-xs p-2 transition-colors duration-dt-fast hover:bg-muted/50">
			<div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-dt-xs bg-current/10', color)}>
				<Icon className="h-3.5 w-3.5" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="body-sm truncate font-medium">{label}</p>
				<p className="caption tabular-nums">{value}</p>
			</div>
		</div>
	);
});

const StatsGrid = memo(function StatsGridComponent({
	title,
	items,
}: {
	title: string;
	items: Array<{ icon: React.ElementType; label: string; value: string | number; color?: string }>;
}) {
	return (
		<div className="rounded-dt-md border border-border/50 bg-card/50 p-3">
			<h2 className="heading-sm mb-2 flex items-center gap-2">{title}</h2>
			<div className="stack-xs">
				{items.map((item) => (
					<StatsItem key={`${title}-${item.label}`} {...item} />
				))}
			</div>
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
			<div className="stack-md p-4">
				<div className="stack-xs">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-3 w-32" />
				</div>
				{['a', 'b', 'c', 'd'].map((id) => (
					<div className="stack-xs rounded-dt-md border border-border/50 p-3" key={`skeleton-${id}`}>
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
				<div className="flex h-12 w-12 items-center justify-center rounded-dt-md bg-destructive/10">
					<FolderIcon className="h-6 w-6 text-destructive" />
				</div>
				<p className="heading-sm text-destructive">Error al cargar estadísticas</p>
				<p className="caption">{error.message || 'Error desconocido'}</p>
			</div>
		);
	}

	if (!stats) {
		return (
			<div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
				<p className="body-sm text-muted-foreground">No hay datos disponibles</p>
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
		<div className="stack-sm max-h-full w-full overflow-y-auto p-3">
			<StatsGrid items={contentStats} title="📁 Contenido Principal" />
			<StatsGrid items={worldStats} title="🌍 Worldbuilding" />
			<StatsGrid items={activityStats} title="📊 Actividad" />
			<StatsGrid items={storageStats} title="💾 Almacenamiento" />
		</div>
	);
});
