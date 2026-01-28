import {
	Activity,
	Archive,
	BookOpen,
	Boxes,
	Calendar,
	Camera,
	Code,
	Database,
	FileImage,
	FolderOpen,
	HardDrive,
	Heart,
	Image as ImageIcon,
	Key,
	Music,
	Settings,
	Shuffle,
	Star,
	Tags,
	Users,
	Video,
	Wand2,
	Zap,
} from 'lucide-react';
import { memo, useMemo } from 'react';
import { useFolderStats } from '@/components/settings/folders/hooks/use-folder-stats';
import { Badge } from '@/components/ui/badge';
import { DashboardStatCard, type DashboardStatCardProps, DashboardStatGrid } from '@/components/ui/dashboard-stat-card';
import { Progress } from '@/components/ui/progress';
import Silk from '@/components/ui/silk-background';
import { useGeneralStats, useRecentActivity, useSystemStatsExtended, useTopTags } from '@/lib/api/stats';
import { useSystemStats } from '@/lib/api/system';

/* =====================================================
 * 🔧 UTILITY FUNCTIONS (fuera del componente para estabilidad)
 * ===================================================== */

const formatBytes = (bytes: number): string => {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

const formatNumber = (num: number): string => {
	if (num === 0) return '0';
	if (num < 1000) return num.toString();
	if (num < 1_000_000) return `${(num / 1000).toFixed(1)}K`;
	return `${(num / 1_000_000).toFixed(1)}M`;
};

export const Dashboard = memo(function Dashboard() {
	// Usar hooks de estadísticas más detalladas
	const { data: systemStats, isLoading: systemLoading } = useSystemStats();
	const { data: extendedStats, isLoading: extendedLoading } = useSystemStatsExtended();
	const { data: generalStats, isLoading: generalLoading } = useGeneralStats();
	const { data: folderStats, isLoading: folderLoading } = useFolderStats();
	const { data: recentActivity, isLoading: activityLoading } = useRecentActivity({ limit: 5 });
	const { data: topTags, isLoading: tagsLoading } = useTopTags(6);

	// Estados de carga combinados
	const isLoading = systemLoading || extendedLoading || generalLoading || folderLoading;

	// Combinar estadísticas de diferentes fuentes con fallbacks inteligentes
	const combinedStats = useMemo(
		() => ({
			// Datos principales de archivos multimedia
			totalImages: systemStats?.totalImages || generalStats?.totalImages || extendedStats?.totalImages || 0,
			totalVideos: systemStats?.totalVideos || generalStats?.totalVideos || extendedStats?.totalVideos || 0,
			totalAudio: systemStats?.totalAudio || generalStats?.totalAudio || extendedStats?.totalAudio || 0,
			totalDocuments: generalStats?.totalDocuments || extendedStats?.totalDocuments || 0,
			totalJsonFiles: generalStats?.totalJsonFiles || extendedStats?.totalJsonFiles || 0,
			totalFile3D: generalStats?.totalFile3D || extendedStats?.totalFile3D || 0,
			totalWorkflows: generalStats?.totalWorkflows || extendedStats?.totalWorkflows || 0,

			// Datos de organización
			totalFolders: systemStats?.totalFolders || folderStats?.totalFolders || generalStats?.totalFolders || 0,
			totalAlbums: systemStats?.totalAlbums || generalStats?.totalAlbums || extendedStats?.totalAlbums || 0,
			totalCollections:
				systemStats?.totalCollections || generalStats?.totalCollections || extendedStats?.totalCollections || 0,
			totalTags: systemStats?.totalTags || generalStats?.totalTags || extendedStats?.totalTags || 0,
			totalFavorites: generalStats?.totalFavorites || extendedStats?.totalFavorites || 0,

			// Datos de worldbuilding
			totalCharacters:
				systemStats?.totalCharacters || generalStats?.totalCharacters || extendedStats?.totalCharacters || 0,
			totalPlaces: generalStats?.totalPlaces || extendedStats?.totalPlaces || 0,
			totalConcepts: generalStats?.totalConcepts || extendedStats?.totalConcepts || 0,
			totalNotes: generalStats?.totalNotes || extendedStats?.totalNotes || 0,
			totalWorldItems: generalStats?.totalWorldItems || extendedStats?.totalWorldItems || 0,
			totalPrompts: generalStats?.totalPrompts || extendedStats?.totalPrompts || 0,
			totalProperties: generalStats?.totalProperties || extendedStats?.totalProperties || 0,
			totalWildcards: generalStats?.totalWildcards || extendedStats?.totalWildcards || 0,

			// Datos del sistema
			totalThumbnails: generalStats?.totalThumbnails || extendedStats?.totalThumbnails || 0,
			totalMetadata: generalStats?.totalMetadata || extendedStats?.totalMetadata || 0,
			totalActivities: generalStats?.totalActivities || extendedStats?.totalActivities || 0,

			// Datos de almacenamiento y espacio
			storageUsed:
				generalStats?.usedSpace ||
				systemStats?.storageUsed ||
				extendedStats?.storageUsed ||
				folderStats?.totalSize ||
				0,
			storageAvailable: generalStats?.freeSpace || systemStats?.storageAvailable || 1_000_000_000, // 1GB por defecto
			totalSize:
				generalStats?.usedSpace ||
				generalStats?.storageUsed ||
				extendedStats?.storageUsed ||
				folderStats?.totalSize ||
				0,
			averageFileSize: generalStats?.averageFileSize || extendedStats?.averageFileSize || 0,
			diskUsage: generalStats?.diskUsage || extendedStats?.diskUsage,

			// Datos del sistema legacy
			dbSize: systemStats?.dbSize || 0,
			lastBackup: systemStats?.lastBackup,
		}),
		[systemStats, extendedStats, generalStats, folderStats]
	);

	// Calcular totales y estadísticas derivadas
	const totalMediaFiles = combinedStats.totalImages + combinedStats.totalVideos + combinedStats.totalAudio;
	const totalContentFiles =
		totalMediaFiles + combinedStats.totalDocuments + combinedStats.totalJsonFiles + combinedStats.totalFile3D;

	const storageUsedPercentage =
		combinedStats.storageAvailable > 0
			? (combinedStats.storageUsed / (combinedStats.storageUsed + combinedStats.storageAvailable)) * 100
			: 0;

	// Definir tarjetas de estadísticas principales
	const mainStatCards = useMemo<DashboardStatCardProps[]>(
		() => [
			{
				icon: ImageIcon,
				label: 'Imágenes',
				value: formatNumber(combinedStats.totalImages),
				subtitle:
					totalMediaFiles > 0
						? `${((combinedStats.totalImages / totalMediaFiles) * 100).toFixed(1)}% del total`
						: '0% del total',
				variant: 'blue',
			},
			{
				icon: Video,
				label: 'Videos',
				value: formatNumber(combinedStats.totalVideos),
				subtitle:
					totalMediaFiles > 0
						? `${((combinedStats.totalVideos / totalMediaFiles) * 100).toFixed(1)}% del total`
						: '0% del total',
				variant: 'purple',
			},
			{
				icon: Music,
				label: 'Audio',
				value: formatNumber(combinedStats.totalAudio),
				subtitle:
					totalMediaFiles > 0
						? `${((combinedStats.totalAudio / totalMediaFiles) * 100).toFixed(1)}% del total`
						: '0% del total',
				variant: 'green',
			},
			{
				icon: FileImage,
				label: 'Docs',
				value: formatNumber(combinedStats.totalDocuments),
				subtitle:
					totalContentFiles > 0
						? `${((combinedStats.totalDocuments / totalContentFiles) * 100).toFixed(1)}% del total`
						: '0% del total',
				variant: 'orange',
			},
			{
				icon: FolderOpen,
				label: 'Carpetas',
				value: formatNumber(combinedStats.totalFolders),
				subtitle: 'Organizadas',
				variant: 'yellow',
			},
			{
				icon: Camera,
				label: 'Álbumes',
				value: formatNumber(combinedStats.totalAlbums),
				subtitle: 'Colecciones',
				variant: 'indigo',
			},
			{
				icon: Tags,
				label: 'Tags',
				value: formatNumber(combinedStats.totalTags),
				subtitle: 'Etiquetas',
				variant: 'cyan',
			},
			{
				icon: Code,
				label: 'JSON',
				value: formatNumber(combinedStats.totalJsonFiles),
				subtitle: 'Archivos',
				variant: 'amber',
			},
			{
				icon: Boxes,
				label: '3D',
				value: formatNumber(combinedStats.totalFile3D),
				subtitle: 'Modelos',
				variant: 'purple',
			},
			{
				icon: Settings,
				label: 'Workflows',
				value: formatNumber(combinedStats.totalWorkflows),
				subtitle: 'Flujos',
				variant: 'teal',
			},
		],
		[
			combinedStats.totalImages,
			combinedStats.totalVideos,
			combinedStats.totalAudio,
			combinedStats.totalDocuments,
			combinedStats.totalFolders,
			combinedStats.totalAlbums,
			combinedStats.totalTags,
			combinedStats.totalJsonFiles,
			combinedStats.totalFile3D,
			combinedStats.totalWorkflows,
			totalMediaFiles,
			totalContentFiles,
		]
	);

	// Tarjetas extendidas (worldbuilding y otras)
	const extendedStatCards = useMemo<DashboardStatCardProps[]>(() => {
		const cards: DashboardStatCardProps[] = [];

		if (combinedStats.totalCharacters > 0) {
			cards.push({
				icon: Users,
				label: 'Personajes',
				value: formatNumber(combinedStats.totalCharacters),
				variant: 'teal',
			});
		}
		if (combinedStats.totalPlaces > 0) {
			cards.push({
				icon: Calendar,
				label: 'Lugares',
				value: formatNumber(combinedStats.totalPlaces),
				variant: 'emerald',
			});
		}
		if (combinedStats.totalConcepts > 0) {
			cards.push({
				icon: Zap,
				label: 'Conceptos',
				value: formatNumber(combinedStats.totalConcepts),
				variant: 'violet',
			});
		}
		if (combinedStats.totalNotes > 0) {
			cards.push({ icon: BookOpen, label: 'Notas', value: formatNumber(combinedStats.totalNotes), variant: 'amber' });
		}
		if (combinedStats.totalPrompts > 0) {
			cards.push({ icon: Wand2, label: 'Prompts', value: formatNumber(combinedStats.totalPrompts), variant: 'indigo' });
		}
		if (combinedStats.totalProperties > 0) {
			cards.push({
				icon: Key,
				label: 'Propiedades',
				value: formatNumber(combinedStats.totalProperties),
				variant: 'slate',
			});
		}
		if (combinedStats.totalWildcards > 0) {
			cards.push({
				icon: Shuffle,
				label: 'Comodines',
				value: formatNumber(combinedStats.totalWildcards),
				variant: 'cyan',
			});
		}
		if (combinedStats.totalFavorites > 0) {
			cards.push({
				icon: Heart,
				label: 'Favoritos',
				value: formatNumber(combinedStats.totalFavorites),
				variant: 'rose',
			});
		}
		if (combinedStats.totalWorldItems > 0) {
			cards.push({
				icon: Archive,
				label: 'Mundos',
				value: formatNumber(combinedStats.totalWorldItems),
				variant: 'rose',
			});
		}
		if (combinedStats.dbSize > 0) {
			cards.push({ icon: Database, label: 'BD', value: formatBytes(combinedStats.dbSize), variant: 'slate' });
		}

		return cards;
	}, [
		combinedStats.totalCharacters,
		combinedStats.totalPlaces,
		combinedStats.totalConcepts,
		combinedStats.totalNotes,
		combinedStats.totalPrompts,
		combinedStats.totalProperties,
		combinedStats.totalWildcards,
		combinedStats.totalFavorites,
		combinedStats.totalWorldItems,
		combinedStats.dbSize,
	]);

	if (isLoading) {
		return (
			<div className="relative h-full w-full">
				{/* Silk Background */}
				<div className="absolute inset-0 z-0">
					<Silk color="var(--background)" noiseIntensity={1.2} rotation={0.1} scale={1.2} speed={3} />
				</div>

				{/* Content overlay */}
				<div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-4">
					<div className="animate-pulse space-y-4">
						<div className="h-6 w-56 rounded bg-foreground/20" />
						<div className="h-3.5 w-40 rounded bg-foreground/10" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="relative h-full w-full">
			{/* Silk Background */}
			<div className="absolute inset-0 z-0">
				<Silk color="var(--background)" noiseIntensity={1.2} rotation={0.2} scale={1.2} speed={6} />
			</div>

			{/* Content overlay */}
			<div className="relative z-10 h-full w-full overflow-auto">
				<div className="container absolute top-1/2 left-1/2 mx-auto max-w-7xl -translate-x-1/2 -translate-y-1/2 space-y-3 p-2 md:p-3">
					{/* Grid única: KPIs + Extendidas usando DashboardStatCard */}
					<DashboardStatGrid>
						{/* Tarjetas principales */}
						{mainStatCards.map((card, index) => (
							<DashboardStatCard key={`main-${card.label}-${index}`} {...card} />
						))}

						{/* Tarjetas extendidas (solo si hay datos) */}
						{extendedStatCards.map((card, index) => (
							<DashboardStatCard key={`ext-${card.label}-${index}`} {...card} />
						))}
					</DashboardStatGrid>

					{/* Secundarias compactas */}
					<div className="grid grid-cols-3 gap-2 md:grid-cols-3">
						{/* Almacenamiento */}
						<div className="rounded-dt-md border border-border/40 bg-card/90 backdrop-blur-sm md:col-span-1">
							<div className="p-3 pb-2">
								<div className="flex items-center gap-2 text-sm">
									<div className="flex h-7 w-7 items-center justify-center rounded-dt-xs bg-slate-500/20">
										<HardDrive className="h-4 w-4 text-muted-foreground" />
									</div>
									<span className="body-sm font-medium">Almacenamiento</span>
								</div>
							</div>
							<div className="space-y-2 px-3 pt-0 pb-3">
								<div className="space-y-1.5">
									<div className="flex justify-between text-xs">
										<span className="caption">Espacio utilizado</span>
										<span className="font-medium tabular-nums">{formatBytes(combinedStats.storageUsed)}</span>
									</div>
									<Progress className="h-1.5" value={storageUsedPercentage} />
									<div className="caption flex justify-between text-muted-foreground">
										<span>{storageUsedPercentage.toFixed(1)}% usado</span>
										<span>{formatBytes(combinedStats.storageAvailable)} disponible</span>
									</div>
								</div>

								{combinedStats.averageFileSize > 0 && (
									<div className="border-border/20 border-t pt-2">
										<div className="caption">
											<span className="text-muted-foreground">Promedio: </span>
											<span className="font-medium tabular-nums">{formatBytes(combinedStats.averageFileSize)}</span>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Actividad reciente */}
						<div className="rounded-dt-md border border-border/40 bg-card/90 backdrop-blur-sm">
							<div className="p-3 pb-2">
								<div className="flex items-center gap-2 text-sm">
									<div className="flex h-7 w-7 items-center justify-center rounded-dt-xs bg-success/20">
										<Activity className="h-4 w-4 text-success" />
									</div>
									<span className="body-sm font-medium">Actividad</span>
								</div>
							</div>
							<div className="px-3 pt-0 pb-3">
								{activityLoading ? (
									<div className="space-y-1.5">
										{Array.from({ length: 3 }, (_, i) => (
											<div
												className="h-3.5 animate-pulse rounded-dt-xs bg-foreground/10"
												key={`activity-skeleton-${Date.now()}-${i}`}
											/>
										))}
									</div>
								) : recentActivity && recentActivity.length > 0 ? (
									<div className="space-y-1.5">
										{recentActivity.slice(0, 2).map((activity, i) => (
											<div className="text-xs" key={activity.id || i}>
												<div className="body-sm truncate font-medium">{activity.entityName}</div>
												<div className="caption text-muted-foreground capitalize">
													{activity.type} • {activity.entityType}
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="caption text-muted-foreground">Sin actividad reciente</div>
								)}
							</div>
						</div>

						{/* Top Tags */}
						<div className="rounded-dt-md border border-border/40 bg-card/90 backdrop-blur-sm">
							<div className="p-3 pb-2">
								<div className="flex items-center gap-2 text-sm">
									<div className="flex h-7 w-7 items-center justify-center rounded-dt-xs bg-warning/20">
										<Star className="h-4 w-4 text-warning" />
									</div>
									<span className="body-sm font-medium">Tags Populares</span>
								</div>
							</div>
							<div className="px-3 pt-0 pb-3">
								{tagsLoading ? (
									<div className="space-y-1.5">
										{Array.from({ length: 3 }, (_, i) => (
											<div
												className="h-3.5 animate-pulse rounded-dt-xs bg-foreground/10"
												key={`tag-skeleton-${Date.now()}-${i}`}
											/>
										))}
									</div>
								) : topTags && topTags.length > 0 ? (
									<div className="space-y-1.5">
										{topTags.slice(0, 4).map((tag, i) => (
											<div className="flex items-center justify-between text-xs" key={tag.id || i}>
												<div className="flex items-center gap-1 truncate">
													{tag.emoji && <span className="caption">{tag.emoji}</span>}
													<span className="body-sm truncate">{tag.name}</span>
												</div>
												<Badge className="caption ml-2" variant="secondary">
													{tag.imageCount}
												</Badge>
											</div>
										))}
									</div>
								) : (
									<div className="caption text-muted-foreground">Sin etiquetas</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
});

export default Dashboard;
