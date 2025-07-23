import { AlertCircle, BarChart, Clock, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBytes } from '@/lib/utils/format';
import { Activity } from './components/activity';
import { StatCard } from './components/stat-card';
import { TagUsage } from './components/tag-usage';
import type { TopTag, RecentActivity } from '@/types/stats';
// Función para obtener estadísticas cliente-side
import { getStatsData } from './stats-actions-client';

// Tipo local para estadísticas generales
export interface GeneralStats {
	totalImages: number;
	totalFolders: number;
	totalCollections: number;
	totalTags: number;
	totalAlbums: number;
	totalCharacters: number;
	totalPlaces: number;
	totalWorldItems: number;
	totalFavorites: number;
	totalViews: number;
	totalDownloads: number;
	totalSize: number;
	totalActivities: number;
	topTags: TopTag[];
	recentActivity: RecentActivity[];
}

// Componente cliente para estadísticas generales
export function ClientGeneralStats() {
	const [stats, setStats] = useState<GeneralStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		let mounted = true;
		setLoading(true);

		const fetchData = async () => {
			try {
				const data = await getStatsData();
				if (mounted) {
					setStats(data);
					setError(false);
				}
			} catch (err) {
				if (mounted) {
					console.error('Error cargando estadísticas:', err);
					setError(true);
				}
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		};

		// Retrasar la carga para evitar múltiples peticiones
		const timer = setTimeout(fetchData, 500);

		return () => {
			mounted = false;
			clearTimeout(timer);
		};
	}, []);

	if (loading) {
		return <div className="p-4 text-muted-foreground text-sm animate-pulse">Cargando estadísticas generales...</div>;
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
				<CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
					<BarChart className="h-3.5 w-3.5 text-primary" />
					Estadísticas generales
				</CardTitle>
			</CardHeader>
			<CardContent className="grid grid-cols-1 p-0 gap-1.5">
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

// Componente cliente para etiquetas principales
export function ClientTopTags() {
	const [stats, setStats] = useState<GeneralStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		let mounted = true;
		setLoading(true);

		const fetchData = async () => {
			try {
				const data = await getStatsData();
				if (mounted) {
					setStats(data);
					setError(false);
				}
			} catch (err) {
				if (mounted) {
					console.error('Error cargando etiquetas:', err);
					setError(true);
				}
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		};

		// Retrasar la carga para evitar múltiples peticiones
		const timer = setTimeout(fetchData, 800);

		return () => {
			mounted = false;
			clearTimeout(timer);
		};
	}, []);

	if (loading) {
		return <div className="p-4 text-muted-foreground text-sm animate-pulse">Cargando etiquetas populares...</div>;
	}

	if (error || !stats) {
		return (
			<div className="flex items-center justify-center p-4 text-destructive gap-2">
				<AlertCircle className="h-4 w-4" />
				<span>Error al cargar etiquetas más usadas</span>
			</div>
		);
	}

	return (
		<>
			<CardHeader className="px-0 py-2 mt-1.5">
				<CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
					<Tag className="h-3.5 w-3.5 text-primary" />
					Etiquetas Más Usadas
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0 space-y-0.5 w-full">
				{stats.topTags.map((tag: TopTag) => (
					<TagUsage key={tag.id} tag={tag} />
				))}
			</CardContent>
		</>
	);
}

// Componente cliente para actividad reciente
export function ClientRecentActivity() {
	const [stats, setStats] = useState<GeneralStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		let mounted = true;
		setLoading(true);

		const fetchData = async () => {
			try {
				const data = await getStatsData();
				if (mounted) {
					setStats(data);
					setError(false);
				}
			} catch (err) {
				if (mounted) {
					console.error('Error cargando actividad reciente:', err);
					setError(true);
				}
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		};

		// Retrasar la carga para evitar múltiples peticiones
		const timer = setTimeout(fetchData, 1000);

		return () => {
			mounted = false;
			clearTimeout(timer);
		};
	}, []);

	if (loading) {
		return <div className="p-4 text-muted-foreground text-sm animate-pulse">Cargando actividad reciente...</div>;
	}

	if (error || !stats) {
		return (
			<div className="flex items-center justify-center p-4 text-destructive gap-2">
				<AlertCircle className="h-4 w-4" />
				<span>Error al cargar actividad reciente</span>
			</div>
		);
	}

	return (
		<>
			<CardHeader className="px-0 py-2 mt-1.5">
				<CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
					<Clock className="h-3.5 w-3.5 text-primary" />
					Actividad Reciente
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0 w-full space-y-0">
				{stats.recentActivity.map((activity: RecentActivity) => (
					<Activity key={activity.id} activity={activity} />
				))}
			</CardContent>
		</>
	);
}
