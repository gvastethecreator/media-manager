import {
	Activity,
	Archive,
	ArrowRight,
	BookOpen,
	Boxes,
	Calendar,
	Camera,
	Code,
	Database,
	FileText,
	Folder,
	FolderOpen,
	HardDrive,
	Heart,
	Image as ImageIcon,
	Key,
	Layers,
	Music,
	Shuffle,
	Sparkles,
	Star,
	Tags,
	Users,
	Video,
	Wand2,
	Zap,
} from 'lucide-react';
import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFolderStats } from '@/components/settings/folders/hooks/use-folder-stats';
import { Badge } from '@/components/ui/badge';
import { DashboardStatCard, type DashboardStatCardProps, DashboardStatGrid } from '@/components/ui/dashboard-stat-card';
import Silk from '@/components/ui/silk-background';
import { useAlbums } from '@/lib/api/albums';
import { useAudios } from '@/lib/api/audio';
import { useCollections } from '@/lib/api/collections';
import { useImages } from '@/lib/api/images';
import { useGeneralStats, useRecentActivity, useSystemStatsExtended, useTopTags } from '@/lib/api/stats';
import { useSystemStats } from '@/lib/api/system';
import { useVideos } from '@/lib/api/videos';
import { cn } from '@/lib/utils';

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

interface CategoryCardProps {
	color: string;
	count: number;
	href: string;
	icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
	stats?: { label: string; value: string }[];
	title: string;
}

const CategoryCard = memo(function CategoryCard({ title, icon: Icon, count, href, color, stats }: CategoryCardProps) {
	return (
		<Link
			className={cn(
				'group relative overflow-hidden rounded-dt-xs border transition-all duration-dt-normal',
				'hover:scale-[1.01]'
			)}
			style={{
				background: 'var(--card)',
				borderColor: 'var(--border)',
			}}
			to={href}
		>
			<div
				className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
				style={{
					background: `radial-gradient(600px circle at top right, color-mix(in oklch, ${color} 15%, transparent), transparent 50%)`,
				}}
			/>
			<div className="flex items-center justify-between p-3">
				<div className="flex items-center gap-2.5">
					<div
						className="flex h-8 w-8 items-center justify-center rounded-dt-xs"
						style={{
							backgroundColor: `color-mix(in oklch, ${color} 20%, transparent)`,
							borderColor: `color-mix(in oklch, ${color} 40%, var(--border))`,
							borderWidth: '1px',
						}}
					>
						<Icon className="h-4 w-4" style={{ color }} />
					</div>
					<div className="flex flex-col">
						<h3 className="font-semibold text-foreground text-xs">{title}</h3>
						<span className="font-bold text-base leading-none" style={{ color }}>
							{count === 0 ? '0' : formatNumber(count)}
						</span>
					</div>
				</div>
				<div
					className={cn(
						'flex h-5 w-5 items-center justify-center rounded-full',
						'transition-all duration-dt-normal',
						'opacity-0 group-hover:opacity-100',
						'-translate-x-1 group-hover:translate-x-0'
					)}
					style={{ backgroundColor: `color-mix(in oklch, ${color} 10%, transparent)` }}
				>
					<ArrowRight className="h-3 w-3" style={{ color }} />
				</div>
			</div>
			{stats && stats.length > 0 && (
				<div className="grid grid-cols-2 gap-1 px-3 pb-2.5">
					{stats.map((stat, i) => (
						<div className="flex flex-col" key={i}>
							<span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">{stat.label}</span>
							<span className="font-medium text-[10px] text-muted-foreground/75">{stat.value}</span>
						</div>
					))}
				</div>
			)}
		</Link>
	);
});

const QuickStatItem = memo(function QuickStatItem({
	icon: Icon,
	label,
	value,
	color,
}: {
	icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
	label: string;
	value: string;
	color: string;
}) {
	return (
		<div className="flex items-center gap-2 rounded-dt-xs border border-border/30 bg-card/50 p-2">
			<div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: `${color}20` }}>
				<Icon className="h-3.5 w-3.5" style={{ color }} />
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium text-foreground text-xs">{label}</p>
				<p className="font-bold text-foreground text-sm tabular-nums">{value}</p>
			</div>
		</div>
	);
});

export const Dashboard = memo(function Dashboard() {
	const { data: systemStats, isLoading: systemLoading } = useSystemStats();
	const { data: extendedStats, isLoading: extendedLoading } = useSystemStatsExtended();
	const { data: generalStats, isLoading: generalLoading } = useGeneralStats();
	const { data: folderStats, isLoading: folderLoading } = useFolderStats();
	const { data: recentActivity, isLoading: activityLoading } = useRecentActivity({ limit: 5 });
	const { data: topTags, isLoading: tagsLoading } = useTopTags(5);
	const { data: recentImages, isLoading: imagesLoading } = useImages({
		limit: 4,
		sortBy: 'createdAt',
		sortOrder: 'desc',
	});
	const { data: recentVideos, isLoading: videosLoading } = useVideos({
		limit: 4,
		sortBy: 'createdAt',
		sortOrder: 'desc',
	});
	const { data: recentAudio, isLoading: audioLoading } = useAudios();
	const { data: recentAlbums, isLoading: albumsLoading } = useAlbums({
		limit: 4,
		sortBy: 'createdAt',
		sortOrder: 'desc',
	});
	const { data: recentCollections, isLoading: collectionsLoading } = useCollections({
		limit: 4,
		sortBy: 'createdAt',
		sortOrder: 'desc',
	});

	const isLoading = systemLoading || extendedLoading || generalLoading || folderLoading;

	const combinedStats = useMemo(
		() => ({
			totalImages: systemStats?.totalImages || generalStats?.totalImages || extendedStats?.totalImages || 0,
			totalVideos: systemStats?.totalVideos || generalStats?.totalVideos || extendedStats?.totalVideos || 0,
			totalAudio: systemStats?.totalAudio || generalStats?.totalAudio || extendedStats?.totalAudio || 0,
			totalDocuments: generalStats?.totalDocuments || extendedStats?.totalDocuments || 0,
			totalJsonFiles: generalStats?.totalJsonFiles || extendedStats?.totalJsonFiles || 0,
			totalFile3D: generalStats?.totalFile3D || extendedStats?.totalFile3D || 0,
			totalWorkflows: generalStats?.totalWorkflows || extendedStats?.totalWorkflows || 0,
			totalFolders: systemStats?.totalFolders || folderStats?.totalFolders || generalStats?.totalFolders || 0,
			totalAlbums: systemStats?.totalAlbums || generalStats?.totalAlbums || extendedStats?.totalAlbums || 0,
			totalCollections:
				systemStats?.totalCollections || generalStats?.totalCollections || extendedStats?.totalCollections || 0,
			totalTags: systemStats?.totalTags || generalStats?.totalTags || extendedStats?.totalTags || 0,
			totalFavorites: generalStats?.totalFavorites || extendedStats?.totalFavorites || 0,
			totalCharacters:
				systemStats?.totalCharacters || generalStats?.totalCharacters || extendedStats?.totalCharacters || 0,
			totalPlaces: generalStats?.totalPlaces || extendedStats?.totalPlaces || 0,
			totalConcepts: generalStats?.totalConcepts || extendedStats?.totalConcepts || 0,
			totalNotes: generalStats?.totalNotes || extendedStats?.totalNotes || 0,
			totalWorldItems: generalStats?.totalWorldItems || extendedStats?.totalWorldItems || 0,
			totalPrompts: generalStats?.totalPrompts || extendedStats?.totalPrompts || 0,
			totalProperties: generalStats?.totalProperties || extendedStats?.totalProperties || 0,
			totalWildcards: generalStats?.totalWildcards || extendedStats?.totalWildcards || 0,
			totalThumbnails: generalStats?.totalThumbnails || extendedStats?.totalThumbnails || 0,
			totalMetadata: generalStats?.totalMetadata || extendedStats?.totalMetadata || 0,
			totalActivities: generalStats?.totalActivities || extendedStats?.totalActivities || 0,
			storageUsed:
				generalStats?.usedSpace ||
				systemStats?.storageUsed ||
				extendedStats?.storageUsed ||
				folderStats?.totalSize ||
				0,
			storageAvailable: generalStats?.freeSpace || systemStats?.storageAvailable || 1_000_000_000,
			averageFileSize: generalStats?.averageFileSize || extendedStats?.averageFileSize || 0,
			dbSize: systemStats?.dbSize || 0,
		}),
		[systemStats, extendedStats, generalStats, folderStats]
	);

	const totalMediaFiles = combinedStats.totalImages + combinedStats.totalVideos + combinedStats.totalAudio;

	const storageUsedPercentage =
		combinedStats.storageAvailable > 0
			? (combinedStats.storageUsed / (combinedStats.storageUsed + combinedStats.storageAvailable)) * 100
			: 0;

	const mediaCategories = useMemo(
		() => [
			{
				title: 'Imágenes',
				icon: ImageIcon,
				count: combinedStats.totalImages,
				href: '/all-images',
				color: 'var(--entity-image)',
				stats: [
					{ label: 'Nuevas', value: formatNumber(recentImages?.data?.length || 0) },
					{ label: 'Total', value: formatNumber(combinedStats.totalImages) },
				],
			},
			{
				title: 'Videos',
				icon: Video,
				count: combinedStats.totalVideos,
				href: '/videos',
				color: 'var(--entity-video)',
				stats: [
					{ label: 'Nuevos', value: formatNumber(recentVideos?.data?.length || 0) },
					{ label: 'Total', value: formatNumber(combinedStats.totalVideos) },
				],
			},
			{
				title: 'Audio',
				icon: Music,
				count: combinedStats.totalAudio,
				href: '/audio',
				color: 'var(--entity-audio)',
				stats: [
					{ label: 'Nuevos', value: formatNumber(recentAudio?.length || 0) },
					{ label: 'Total', value: formatNumber(combinedStats.totalAudio) },
				],
			},
			{
				title: 'Docs',
				icon: FileText,
				count: combinedStats.totalDocuments,
				href: '/documents',
				color: 'var(--entity-document)',
				stats: [{ label: 'Total', value: formatNumber(combinedStats.totalDocuments) }],
			},
		],
		[combinedStats, recentImages, recentVideos, recentAudio]
	);

	const orgCategories = useMemo(
		() => [
			{
				title: 'Carpetas',
				icon: Folder,
				count: combinedStats.totalFolders,
				href: '/folders',
				color: 'var(--entity-folder)',
				stats: [{ label: 'Total', value: formatNumber(combinedStats.totalFolders) }],
			},
			{
				title: 'Álbumes',
				icon: Camera,
				count: combinedStats.totalAlbums,
				href: '/albums',
				color: 'var(--entity-album)',
				stats: [
					{ label: 'Nuevos', value: formatNumber(recentAlbums?.data?.length || 0) },
					{ label: 'Total', value: formatNumber(combinedStats.totalAlbums) },
				],
			},
			{
				title: 'Colecciones',
				icon: Layers,
				count: combinedStats.totalCollections,
				href: '/collections',
				color: 'var(--entity-collection)',
				stats: [
					{ label: 'Nuevas', value: formatNumber(recentCollections?.data?.length || 0) },
					{ label: 'Total', value: formatNumber(combinedStats.totalCollections) },
				],
			},
			{
				title: 'Tags',
				icon: Tags,
				count: combinedStats.totalTags,
				href: '/tags',
				color: 'var(--entity-tag)',
				stats: [{ label: 'Total', value: formatNumber(combinedStats.totalTags) }],
			},
		],
		[combinedStats, recentAlbums, recentCollections]
	);

	const worldbuildingCategories = useMemo(
		() => [
			{
				title: 'Personajes',
				icon: Users,
				count: combinedStats.totalCharacters,
				href: '/characters',
				color: 'var(--entity-character)',
			},
			{
				title: 'Lugares',
				icon: Calendar,
				count: combinedStats.totalPlaces,
				href: '/places',
				color: 'var(--entity-place)',
			},
			{
				title: 'Conceptos',
				icon: Zap,
				count: combinedStats.totalConcepts,
				href: '/concepts',
				color: 'var(--entity-concept)',
			},
			{
				title: 'Notas',
				icon: BookOpen,
				count: combinedStats.totalNotes,
				href: '/notes',
				color: 'var(--entity-note)',
			},
		],
		[combinedStats]
	);

	const extraCategories = useMemo(
		() => [
			{
				title: 'JSON',
				icon: Code,
				count: combinedStats.totalJsonFiles,
				href: '/json-files',
				color: 'var(--entity-json-file)',
			},
			{
				title: '3D',
				icon: Boxes,
				count: combinedStats.totalFile3D,
				href: '/file-3ds',
				color: 'var(--entity-file-3d)',
			},
			{
				title: 'Favoritos',
				icon: Heart,
				count: combinedStats.totalFavorites,
				href: '/favorites',
				color: 'var(--entity-favorite)',
			},
			{
				title: 'Mundos',
				icon: Archive,
				count: combinedStats.totalWorldItems,
				href: '/world-items',
				color: 'var(--entity-world-item)',
			},
		],
		[combinedStats]
	);

	const quickStats = useMemo<DashboardStatCardProps[]>(
		() => [
			{
				icon: ImageIcon,
				label: 'Imágenes',
				value: formatNumber(combinedStats.totalImages),
				subtitle: totalMediaFiles > 0 ? `${((combinedStats.totalImages / totalMediaFiles) * 100).toFixed(0)}%` : '0%',
				variant: 'image',
			},
			{
				icon: Video,
				label: 'Videos',
				value: formatNumber(combinedStats.totalVideos),
				subtitle: totalMediaFiles > 0 ? `${((combinedStats.totalVideos / totalMediaFiles) * 100).toFixed(0)}%` : '0%',
				variant: 'video',
			},
			{
				icon: Music,
				label: 'Audio',
				value: formatNumber(combinedStats.totalAudio),
				variant: 'success',
			},
			{
				icon: FolderOpen,
				label: 'Carpetas',
				value: formatNumber(combinedStats.totalFolders),
				variant: 'folder',
			},
			{
				icon: Tags,
				label: 'Tags',
				value: formatNumber(combinedStats.totalTags),
				variant: 'primary',
			},
			{
				icon: Users,
				label: 'Personajes',
				value: formatNumber(combinedStats.totalCharacters),
				variant: 'character',
			},
			{
				icon: Calendar,
				label: 'Lugares',
				value: formatNumber(combinedStats.totalPlaces),
				variant: 'place',
			},
			{
				icon: Database,
				label: 'BD',
				value: formatBytes(combinedStats.dbSize),
				variant: 'muted',
			},
		],
		[combinedStats, totalMediaFiles]
	);

	const extendedStatsCards = useMemo<DashboardStatCardProps[]>(() => {
		const cards: DashboardStatCardProps[] = [];
		if (combinedStats.totalConcepts > 0) {
			cards.push({
				icon: Zap,
				label: 'Conceptos',
				value: formatNumber(combinedStats.totalConcepts),
				variant: 'secondary',
			});
		}
		if (combinedStats.totalNotes > 0) {
			cards.push({ icon: BookOpen, label: 'Notas', value: formatNumber(combinedStats.totalNotes), variant: 'warning' });
		}
		if (combinedStats.totalPrompts > 0) {
			cards.push({
				icon: Wand2,
				label: 'Prompts',
				value: formatNumber(combinedStats.totalPrompts),
				variant: 'primary',
			});
		}
		if (combinedStats.totalProperties > 0) {
			cards.push({ icon: Key, label: 'Props', value: formatNumber(combinedStats.totalProperties), variant: 'muted' });
		}
		if (combinedStats.totalWildcards > 0) {
			cards.push({
				icon: Shuffle,
				label: 'Comodines',
				value: formatNumber(combinedStats.totalWildcards),
				variant: 'accent',
			});
		}
		if (combinedStats.totalJsonFiles > 0) {
			cards.push({ icon: Code, label: 'JSON', value: formatNumber(combinedStats.totalJsonFiles), variant: 'info' });
		}
		if (combinedStats.totalFile3D > 0) {
			cards.push({ icon: Boxes, label: '3D', value: formatNumber(combinedStats.totalFile3D), variant: 'secondary' });
		}
		if (combinedStats.totalFavorites > 0) {
			cards.push({
				icon: Heart,
				label: 'Favoritos',
				value: formatNumber(combinedStats.totalFavorites),
				variant: 'destructive',
			});
		}
		if (combinedStats.totalWorldItems > 0) {
			cards.push({
				icon: Archive,
				label: 'Mundos',
				value: formatNumber(combinedStats.totalWorldItems),
				variant: 'collection',
			});
		}
		return cards;
	}, [combinedStats]);

	if (isLoading) {
		return (
			<div className="relative flex h-full w-full items-center justify-center">
				<div className="absolute inset-0 z-0">
					<Silk color="var(--canvas-bg-dark)" noiseIntensity={1.2} rotation={0.1} scale={1.2} speed={3} />
					<div className="absolute inset-0 bg-background/96" />
				</div>
				<div className="relative z-10 flex flex-col items-center gap-4">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					<p className="text-muted-foreground text-sm">Cargando dashboard...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="relative h-full w-full overflow-hidden">
			<div className="absolute inset-0 z-0">
				<Silk color="var(--canvas-bg-dark)" noiseIntensity={1.5} rotation={0.2} scale={1.3} speed={4} />
				<div className="absolute inset-0 bg-background/94" />
			</div>

			<div className="relative z-10 h-full overflow-auto">
				<div className="container mx-auto max-w-6xl space-y-5 p-5">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="relative">
								<div className="absolute inset-0 rounded-full bg-primary/15 blur-xl" />
								<div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/70 to-primary/40 shadow-dt-2">
									<Sparkles className="h-5 w-5 text-primary-foreground" />
								</div>
							</div>
							<div>
								<h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text font-bold text-2xl text-transparent">
									Dashboard
								</h1>
								<p className="text-muted-foreground/70 text-xs">Bienvenido a tu gestor de multimedia</p>
							</div>
						</div>
						<div className="flex items-center gap-4 text-right">
							<div>
								<p className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Total Media</p>
								<p className="font-bold text-foreground text-xl tabular-nums">{formatNumber(totalMediaFiles)}</p>
							</div>
							<div className="h-8 w-px bg-border/40" />
							<div>
								<p className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Almacenamiento</p>
								<p className="font-bold text-foreground text-xl tabular-nums">
									{formatBytes(combinedStats.storageUsed)}
								</p>
							</div>
						</div>
					</div>

					<section className="rounded-dt-sm border border-border/40 bg-card/90 p-4 shadow-dt-1">
						<div className="mb-3 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="h-4 w-1 rounded-full bg-primary" />
								<h2 className="font-semibold text-foreground text-sm">Estadísticas Rápidas</h2>
							</div>
							<Badge
								className="rounded-dt-xs border-border/25 bg-background/50 font-mono text-[10px] text-muted-foreground/75"
								variant="outline"
							>
								{formatNumber(totalMediaFiles)} archivos
							</Badge>
						</div>
						<DashboardStatGrid columns={{ default: 2, sm: 3, md: 4, lg: 4, xl: 4 }}>
							{quickStats.map((card) => (
								<DashboardStatCard key={`stat-${card.label}`} {...card} />
							))}
						</DashboardStatGrid>
					</section>

					<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
						<section>
							<div className="mb-3 flex items-center gap-2">
								<div className="h-4 w-1 rounded-full bg-[var(--entity-image)]" />
								<h2 className="font-semibold text-base text-foreground">Media</h2>
							</div>
							<div className="grid grid-cols-2 gap-3">
								{mediaCategories.map((category, index) => (
									<div
										className="fade-in animate-in duration-400"
										key={category.title}
										style={{ animationDelay: `${index * 50}ms` }}
									>
										<CategoryCard {...category} />
									</div>
								))}
							</div>
						</section>

						<section>
							<div className="mb-3 flex items-center gap-2">
								<div className="h-4 w-1 rounded-full bg-[var(--entity-folder)]" />
								<h2 className="font-semibold text-base text-foreground">Organización</h2>
							</div>
							<div className="grid grid-cols-2 gap-3">
								{orgCategories.map((category, index) => (
									<div
										className="fade-in animate-in duration-400"
										key={category.title}
										style={{ animationDelay: `${index * 50}ms` }}
									>
										<CategoryCard {...category} />
									</div>
								))}
							</div>
						</section>
					</div>

					<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
						<section>
							<div className="mb-3 flex items-center gap-2">
								<div className="h-4 w-1 rounded-full bg-[var(--entity-character)]" />
								<h2 className="font-semibold text-base text-foreground">Worldbuilding</h2>
							</div>
							<div className="grid grid-cols-2 gap-3">
								{worldbuildingCategories.map((category, index) => (
									<div
										className="fade-in animate-in duration-400"
										key={category.title}
										style={{ animationDelay: `${index * 50}ms` }}
									>
										<CategoryCard {...category} />
									</div>
								))}
							</div>
						</section>

						<section>
							<div className="mb-3 flex items-center gap-2">
								<div className="h-4 w-1 rounded-full bg-secondary" />
								<h2 className="font-semibold text-base text-foreground">Extras</h2>
							</div>
							<div className="grid grid-cols-2 gap-3">
								{extraCategories.map((category, index) => (
									<div
										className="fade-in animate-in duration-400"
										key={category.title}
										style={{ animationDelay: `${index * 50}ms` }}
									>
										<CategoryCard {...category} />
									</div>
								))}
							</div>
						</section>
					</div>

					{extendedStatsCards.length > 0 && (
						<section className="rounded-dt-sm border border-border/30 bg-card/70 p-4">
							<div className="mb-3 flex items-center gap-2">
								<div className="h-4 w-1 rounded-full bg-muted" />
								<h2 className="font-semibold text-foreground text-sm">Más Estadísticas</h2>
							</div>
							<DashboardStatGrid columns={{ default: 3, sm: 4, md: 5, lg: 6, xl: 7 }}>
								{extendedStatsCards.map((card) => (
									<DashboardStatCard key={`ext-${card.label}`} {...card} />
								))}
							</DashboardStatGrid>
						</section>
					)}

					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="rounded-dt-sm border border-border/40 bg-card/90 p-4 shadow-dt-1">
							<div className="mb-3 flex items-center gap-2">
								<div className="flex h-8 w-8 items-center justify-center rounded-dt-xs border border-border/10 bg-background/20">
									<HardDrive className="h-4 w-4 text-muted-foreground/80" />
								</div>
								<div>
									<h3 className="font-semibold text-foreground text-xs">Almacenamiento</h3>
									<p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
										{storageUsedPercentage.toFixed(1)}% usado
									</p>
								</div>
							</div>
							<div className="space-y-2">
								<div className="flex items-baseline justify-between">
									<span className="font-bold text-foreground text-xl tracking-tight">
										{formatBytes(combinedStats.storageUsed)}
									</span>
									<span className="text-[10px] text-muted-foreground/70">
										de {formatBytes(combinedStats.storageUsed + combinedStats.storageAvailable)}
									</span>
								</div>
								<div className="relative h-1.5 overflow-hidden rounded-full bg-border/30">
									<div
										className="h-full rounded-full bg-primary transition-all duration-1000"
										style={{ width: `${storageUsedPercentage}%` }}
									/>
								</div>
								<div className="flex justify-between font-mono text-[9px] text-muted-foreground/60">
									<span>{formatBytes(combinedStats.storageAvailable)} libre</span>
								</div>
							</div>
						</div>

						<div className="rounded-dt-sm border border-border/40 bg-card/90 p-4 shadow-dt-1">
							<div className="mb-3 flex items-center gap-2">
								<div className="flex h-8 w-8 items-center justify-center rounded-dt-xs border border-border/10 bg-background/20">
									<Activity className="h-4 w-4 text-status-success/80" />
								</div>
								<div>
									<h3 className="font-semibold text-foreground text-xs">Actividad Reciente</h3>
									<p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Últimas acciones</p>
								</div>
							</div>
							{activityLoading ? (
								<div className="space-y-2">
									{Array.from({ length: 3 }).map((_, i) => (
										<div className="h-8 animate-pulse rounded-dt-xs bg-border/10" key={i} />
									))}
								</div>
							) : recentActivity && recentActivity.length > 0 ? (
								<div className="space-y-1.5">
									{recentActivity.slice(0, 4).map((activity, i) => (
										<div
											className="flex items-center gap-2 rounded-dt-xs border border-border/10 bg-background/5 p-1.5 transition-colors hover:bg-background/10"
											key={activity.id || i}
										>
											<div className="flex h-5 w-5 items-center justify-center rounded-full border border-primary/25 bg-primary/15">
												<span className="font-bold text-[9px] text-primary/80">
													{activity.entityType?.[0]?.toUpperCase()}
												</span>
											</div>
											<div className="min-w-0 flex-1">
												<p className="truncate font-medium text-[10px] text-foreground/80">{activity.entityName}</p>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-4 text-center">
									<Activity className="mb-1 h-5 w-5 opacity-10" />
									<p className="text-[10px] text-muted-foreground/60">Sin actividad reciente</p>
								</div>
							)}
						</div>

						<div className="rounded-dt-sm border border-border/40 bg-card/90 p-4 shadow-dt-1">
							<div className="mb-3 flex items-center gap-2">
								<div className="flex h-8 w-8 items-center justify-center rounded-dt-xs border border-border/10 bg-background/20">
									<Star className="h-4 w-4 text-status-warning/80" />
								</div>
								<div>
									<h3 className="font-semibold text-foreground text-xs">Tags Populares</h3>
									<p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Más utilizados</p>
								</div>
							</div>
							{tagsLoading ? (
								<div className="space-y-2">
									{Array.from({ length: 4 }).map((_, i) => (
										<div className="h-8 animate-pulse rounded-dt-xs bg-border/10" key={i} />
									))}
								</div>
							) : topTags && topTags.length > 0 ? (
								<div className="space-y-1.5">
									{topTags.slice(0, 5).map((tag) => (
										<div
											className="flex items-center justify-between rounded-dt-xs border border-border/10 bg-background/5 p-1.5 transition-colors hover:bg-background/10"
											key={tag.id}
										>
											<div className="flex min-w-0 items-center gap-1.5">
												{tag.emoji && <span className="text-xs">{tag.emoji}</span>}
												<span className="truncate font-medium text-[10px] text-foreground/80">{tag.name}</span>
											</div>
											<Badge
												className="rounded-dt-xs bg-background/20 text-[9px] text-muted-foreground/80"
												variant="secondary"
											>
												{tag.imageCount}
											</Badge>
										</div>
									))}
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-4 text-center">
									<Tags className="mb-1 h-5 w-5 opacity-10" />
									<p className="text-[10px] text-muted-foreground/60">Sin etiquetas aún</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
});

export default Dashboard;
