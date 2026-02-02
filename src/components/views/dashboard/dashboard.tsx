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
	Settings,
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

/* =====================================================
 * 🔧 UTILITY FUNCTIONS
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

/* =====================================================
 * 📊 PREVIEW ITEM TYPES
 * ===================================================== */

interface PreviewItem {
	id: string;
	thumbnailUrl?: string | null;
	name?: string;
	type?: string;
}

/* =====================================================
 * 🎴 ENHANCED CATEGORY CARD COMPONENT
 * ===================================================== */

interface CategoryCardProps {
	title: string;
	icon: React.ElementType;
	count: number;
	href: string;
	color: string;
	stats?: { label: string; value: string }[];
}

const CategoryCard = memo(function CategoryCard({
	title,
	icon: Icon,
	count,
	href,
	color,
	stats,
}: CategoryCardProps) {
	return (
		<Link
			className={cn(
				'group relative overflow-hidden rounded-dt-sm border transition-all duration-dt-normal',
				'hover:scale-[1.01]'
			)}
			style={{
				background: 'var(--card)',
				borderColor: 'var(--border)',
			}}
			to={href}
		>
			{/* Subtle Glow Effect on Hover */}
			<div
				className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
				style={{
					background: `radial-gradient(600px circle at top right, color-mix(in oklch, ${color} 6%, transparent), transparent 50%)`,
				}}
			/>

			{/* Header */}
			<div className="relative flex items-center justify-between p-4">
				<div className="flex items-center gap-3">
					<div
						className="flex h-10 w-10 items-center justify-center rounded-dt-xs"
						style={{
							backgroundColor: `color-mix(in oklch, ${color} 8%, transparent)`,
							borderColor: `color-mix(in oklch, ${color} 20%, var(--border))`,
							borderWidth: '1px',
						}}
					>
						<Icon className="h-5 w-5" style={{ color }} />
					</div>
					<div className="flex flex-col">
						<h3 className="font-bold text-foreground text-sm tracking-tight">{title}</h3>
						<div className="flex items-baseline gap-1">
							<span className="font-bold text-lg leading-none" style={{ color }}>
								{count === 0 ? '0' : formatNumber(count)}
							</span>
							<span className="text-muted-foreground/50 text-xs font-normal">items</span>
						</div>
					</div>
				</div>
				<div
					className={cn(
						'flex h-7 w-7 items-center justify-center rounded-full',
						'transition-all duration-dt-normal',
						'opacity-0 group-hover:opacity-100',
						'-translate-x-2 group-hover:translate-x-0'
					)}
					style={{ backgroundColor: `color-mix(in oklch, ${color} 10%, transparent)` }}
				>
					<ArrowRight className="h-3.5 w-3.5" style={{ color }} />
				</div>
			</div>

			{/* Divider */}
			<div className="relative mx-4 h-px bg-border/10" />

			{/* Mini Stats */}
			{stats && stats.length > 0 && (
				<div className="relative grid grid-cols-2 gap-2 px-4 py-3">
					{stats.map((stat, i) => (
						<div className="flex flex-col" key={i}>
							<span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">{stat.label}</span>
							<span className="font-medium text-xs text-muted-foreground/70">{stat.value}</span>
						</div>
					))}
				</div>
			)}
		</Link>
	);
});

/* =====================================================
 * 🎯 MAIN DASHBOARD COMPONENT
 * ===================================================== */

export const Dashboard = memo(function Dashboard() {
	// System stats
	const { data: systemStats, isLoading: systemLoading } = useSystemStats();
	const { data: extendedStats, isLoading: extendedLoading } = useSystemStatsExtended();
	const { data: generalStats, isLoading: generalLoading } = useGeneralStats();
	const { data: folderStats, isLoading: folderLoading } = useFolderStats();
	const { data: recentActivity, isLoading: activityLoading } = useRecentActivity({ limit: 5 });
	const { data: topTags, isLoading: tagsLoading } = useTopTags(6);

	// Entity data with previews
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

	// Loading state
	const isLoading = systemLoading || extendedLoading || generalLoading || folderLoading;

	// Combined stats
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

	// Main categories
	const mainCategories = useMemo(
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
			{
				title: 'Favoritos',
				icon: Heart,
				count: combinedStats.totalFavorites,
				href: '/favorites',
				color: 'var(--entity-favorite)',
				stats: [{ label: 'Total', value: formatNumber(combinedStats.totalFavorites) }],
			},
		],
		[
			combinedStats,
			recentImages,
			recentVideos,
			recentAudio,
			recentAlbums,
			recentCollections,
			imagesLoading,
			videosLoading,
			audioLoading,
			folderLoading,
			albumsLoading,
			collectionsLoading,
			tagsLoading,
		]
	);

	// Worldbuilding categories
	const worldbuildingCategories = useMemo(
		() => [
			{
				title: 'Personajes',
				icon: Users,
				count: combinedStats.totalCharacters,
				href: '/characters',
				color: 'var(--entity-character)',
				stats: [{ label: 'Total', value: formatNumber(combinedStats.totalCharacters) }],
			},
			{
				title: 'Lugares',
				icon: Calendar,
				count: combinedStats.totalPlaces,
				href: '/places',
				color: 'var(--entity-place)',
				stats: [{ label: 'Total', value: formatNumber(combinedStats.totalPlaces) }],
			},
			{
				title: 'Conceptos',
				icon: Zap,
				count: combinedStats.totalConcepts,
				href: '/concepts',
				color: 'var(--entity-concept)',
				stats: [{ label: 'Total', value: formatNumber(combinedStats.totalConcepts) }],
			},
			{
				title: 'Notas',
				icon: BookOpen,
				count: combinedStats.totalNotes,
				href: '/notes',
				color: 'var(--entity-note)',
				stats: [{ label: 'Total', value: formatNumber(combinedStats.totalNotes) }],
			},
		],
		[combinedStats]
	);

	// Main stat cards
	const mainStatCards = useMemo<DashboardStatCardProps[]>(
		() => [
			{
				icon: ImageIcon,
				label: 'Imágenes',
				value: formatNumber(combinedStats.totalImages),
				subtitle: totalMediaFiles > 0 ? `${((combinedStats.totalImages / totalMediaFiles) * 100).toFixed(1)}%` : '0%',
				variant: 'image',
			},
			{
				icon: Video,
				label: 'Videos',
				value: formatNumber(combinedStats.totalVideos),
				subtitle: totalMediaFiles > 0 ? `${((combinedStats.totalVideos / totalMediaFiles) * 100).toFixed(1)}%` : '0%',
				variant: 'video',
			},
			{
				icon: Music,
				label: 'Audio',
				value: formatNumber(combinedStats.totalAudio),
				subtitle: totalMediaFiles > 0 ? `${((combinedStats.totalAudio / totalMediaFiles) * 100).toFixed(1)}%` : '0%',
				variant: 'success',
			},
			{
				icon: FileText,
				label: 'Docs',
				value: formatNumber(combinedStats.totalDocuments),
				subtitle: 'Documentos',
				variant: 'warning',
			},
			{
				icon: FolderOpen,
				label: 'Carpetas',
				value: formatNumber(combinedStats.totalFolders),
				subtitle: 'Organizadas',
				variant: 'folder',
			},
			{
				icon: Camera,
				label: 'Álbumes',
				value: formatNumber(combinedStats.totalAlbums),
				subtitle: 'Colecciones',
				variant: 'album',
			},
			{
				icon: Tags,
				label: 'Tags',
				value: formatNumber(combinedStats.totalTags),
				subtitle: 'Etiquetas',
				variant: 'primary',
			},
			{
				icon: Code,
				label: 'JSON',
				value: formatNumber(combinedStats.totalJsonFiles),
				subtitle: 'Archivos',
				variant: 'accent',
			},
			{
				icon: Boxes,
				label: '3D',
				value: formatNumber(combinedStats.totalFile3D),
				subtitle: 'Modelos',
				variant: 'secondary',
			},
			{
				icon: Settings,
				label: 'Workflows',
				value: formatNumber(combinedStats.totalWorkflows),
				subtitle: 'Flujos',
				variant: 'info',
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
		]
	);

	// Extended stat cards
	const extendedStatCards = useMemo<DashboardStatCardProps[]>(() => {
		const cards: DashboardStatCardProps[] = [];
		if (combinedStats.totalCharacters > 0) {
			cards.push({
				icon: Users,
				label: 'Personajes',
				value: formatNumber(combinedStats.totalCharacters),
				variant: 'character',
			});
		}
		if (combinedStats.totalPlaces > 0) {
			cards.push({
				icon: Calendar,
				label: 'Lugares',
				value: formatNumber(combinedStats.totalPlaces),
				variant: 'place',
			});
		}
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
			cards.push({
				icon: Key,
				label: 'Propiedades',
				value: formatNumber(combinedStats.totalProperties),
				variant: 'muted',
			});
		}
		if (combinedStats.totalWildcards > 0) {
			cards.push({
				icon: Shuffle,
				label: 'Comodines',
				value: formatNumber(combinedStats.totalWildcards),
				variant: 'primary',
			});
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
		if (combinedStats.dbSize > 0) {
			cards.push({ icon: Database, label: 'BD', value: formatBytes(combinedStats.dbSize), variant: 'muted' });
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
			{/* Animated Background */}
			<div className="absolute inset-0 z-0">
				<Silk color="var(--canvas-bg-dark)" noiseIntensity={1.5} rotation={0.2} scale={1.3} speed={4} />
				<div className="absolute inset-0 bg-background/94" />
			</div>

			{/* Content */}
			<div className="relative z-10 h-full overflow-auto">
				<div className="container mx-auto max-w-7xl space-y-6 p-6">
					{/* Enhanced Header */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="relative">
								<div className="absolute inset-0 rounded-full bg-primary/15 blur-xl" />
								<div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/70 to-primary/40 shadow-dt-2">
									<Sparkles className="h-6 w-6 text-primary-foreground" />
								</div>
							</div>
							<div>
								<h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text font-bold text-3xl text-transparent">
									Dashboard
								</h1>
								<p className="text-muted-foreground/70">Bienvenido a tu gestor de multimedia</p>
							</div>
						</div>

						{/* Quick Stats Summary */}
						<div className="hidden items-center gap-6 md:flex">
							<div className="text-right">
								<p className="text-muted-foreground/50 text-xs uppercase tracking-wider">Total Media</p>
								<p className="font-bold text-2xl text-foreground">{formatNumber(totalMediaFiles)}</p>
							</div>
							<div className="h-10 w-px bg-border/40" />
							<div className="text-right">
								<p className="text-muted-foreground/50 text-xs uppercase tracking-wider">Almacenamiento</p>
								<p className="font-bold text-2xl text-foreground">{formatBytes(combinedStats.storageUsed)}</p>
							</div>
						</div>
					</div>

					{/* Stats Grid */}
					<section className="rounded-dt-sm border border-border/20 bg-card/50 p-6 shadow-dt-2">
						<div className="mb-6 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="h-5 w-1 rounded-full bg-primary" />
								<h2 className="font-bold text-foreground text-lg tracking-tight">Resumen Rápido</h2>
							</div>
							<Badge className="rounded-dt-xs border-border/15 bg-background/10 font-mono text-xs text-muted-foreground/60" variant="outline">
								{formatNumber(totalMediaFiles)} archivos totales
							</Badge>
						</div>
						<DashboardStatGrid>
							{mainStatCards.map((card) => (
								<DashboardStatCard key={`main-${card.label}`} {...card} />
							))}
							{extendedStatCards.map((card) => (
								<DashboardStatCard key={`ext-${card.label}`} {...card} />
							))}
						</DashboardStatGrid>
					</section>

					{/* Main Categories */}
					<section>
						<div className="mb-4 flex items-center gap-2">
							<div className="h-5 w-1 rounded-full bg-primary" />
							<h2 className="font-bold text-foreground text-xl tracking-tight">Categorías Principales</h2>
						</div>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{mainCategories.map((category, index) => (
								<div
									className="fade-in slide-in-from-bottom-4 animate-in duration-500"
									key={category.title}
									style={{ animationDelay: `${index * 50}ms` }}
								>
									<CategoryCard {...category} />
								</div>
							))}
						</div>
					</section>

					{/* Worldbuilding Categories */}
					{combinedStats.totalCharacters + combinedStats.totalPlaces + combinedStats.totalConcepts > 0 && (
						<section>
							<div className="mb-4 flex items-center gap-2">
								<div className="h-5 w-1 rounded-full bg-secondary" />
								<h2 className="font-bold text-foreground text-xl tracking-tight">Worldbuilding</h2>
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
								{worldbuildingCategories.map((category) => (
									<CategoryCard key={category.title} {...category} />
								))}
							</div>
						</section>
					)}

					{/* Bottom Info Cards */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						{/* Storage Card */}
						<div className="group relative overflow-hidden rounded-dt-sm border border-border/20 bg-card/60 p-5 shadow-dt-1 transition-all duration-dt-normal hover:border-border/40">
							<div className="mb-4 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-dt-xs bg-background/8 border border-border/10">
									<HardDrive className="h-5 w-5 text-muted-foreground/80" />
								</div>
								<div>
									<h3 className="font-bold text-foreground text-sm">Almacenamiento</h3>
									<p className="text-muted-foreground/40 text-[10px] uppercase tracking-wider">Espacio utilizado</p>
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex items-baseline justify-between">
									<span className="font-bold text-2xl text-foreground tracking-tight">{formatBytes(combinedStats.storageUsed)}</span>
									<span className="text-muted-foreground/40 text-xs">
										de {formatBytes(combinedStats.storageUsed + combinedStats.storageAvailable)}
									</span>
								</div>

								<div className="relative h-1.5 overflow-hidden rounded-full bg-border/15">
									<div
										className="h-full rounded-full bg-primary transition-all duration-1000"
										style={{ width: `${storageUsedPercentage}%` }}
									/>
								</div>

								<div className="flex justify-between text-[10px] text-muted-foreground/40 font-mono">
									<span>{storageUsedPercentage.toFixed(1)}% USADO</span>
									<span>{formatBytes(combinedStats.storageAvailable)} LIBRE</span>
								</div>
							</div>
						</div>

						{/* Activity Card */}
						<div className="group relative overflow-hidden rounded-dt-sm border border-border/20 bg-card/60 p-5 shadow-dt-1 transition-all duration-dt-normal hover:border-border/40">
							<div className="mb-4 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-dt-xs bg-background/8 border border-border/10">
									<Activity className="h-5 w-5 text-status-success/80" />
								</div>
								<div>
									<h3 className="font-bold text-foreground text-sm">Actividad</h3>
									<p className="text-muted-foreground/40 text-[10px] uppercase tracking-wider">Últimas acciones</p>
								</div>
							</div>

							{activityLoading ? (
								<div className="space-y-2">
									{Array.from({ length: 3 }).map((_, i) => (
										<div className="h-10 animate-pulse rounded-dt-xs bg-border/10" key={i} />
									))}
								</div>
							) : recentActivity && recentActivity.length > 0 ? (
								<div className="space-y-2">
									{recentActivity.slice(0, 3).map((activity, i) => (
										<div
											className="flex items-center gap-3 rounded-dt-xs border border-border/10 bg-background/5 p-2 transition-colors hover:bg-background/10"
											key={activity.id || i}
										>
											<div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/8 border border-primary/15">
												<span className="text-primary/80 text-[10px] font-bold">{activity.entityType?.[0]?.toUpperCase()}</span>
											</div>
											<div className="min-w-0 flex-1">
												<p className="truncate font-semibold text-xs text-foreground/80">{activity.entityName}</p>
												<p className="text-muted-foreground/40 text-[10px] uppercase tracking-tighter">
													{activity.type} • {activity.entityType}
												</p>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-6 text-center">
									<Activity className="mb-2 h-6 w-6 opacity-10" />
									<p className="text-muted-foreground/30 text-xs">Sin actividad reciente</p>
								</div>
							)}
						</div>

						{/* Tags Card */}
						<div className="group relative overflow-hidden rounded-dt-sm border border-border/20 bg-card/60 p-5 shadow-dt-1 transition-all duration-dt-normal hover:border-border/40">
							<div className="mb-4 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-dt-xs bg-background/8 border border-border/10">
									<Star className="h-5 w-5 text-status-warning/80" />
								</div>
								<div>
									<h3 className="font-bold text-foreground text-sm">Tags Populares</h3>
									<p className="text-muted-foreground/40 text-[10px] uppercase tracking-wider">Más utilizados</p>
								</div>
							</div>

							{tagsLoading ? (
								<div className="space-y-2">
									{Array.from({ length: 4 }).map((_, i) => (
										<div className="h-10 animate-pulse rounded-dt-xs bg-border/10" key={i} />
									))}
								</div>
							) : topTags && topTags.length > 0 ? (
								<div className="space-y-2">
									{topTags.slice(0, 5).map((tag) => (
										<div
											className="flex items-center justify-between rounded-dt-xs border border-border/10 bg-background/5 p-2 transition-colors hover:bg-background/10"
											key={tag.id}
										>
											<div className="flex min-w-0 items-center gap-2">
												{tag.emoji && <span className="text-base">{tag.emoji}</span>}
												<span className="truncate font-semibold text-xs text-foreground/80">{tag.name}</span>
											</div>
											<Badge className="rounded-dt-xs bg-background/10 text-[10px] text-muted-foreground/60" variant="secondary">{tag.imageCount}</Badge>
										</div>
									))}
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-6 text-center">
									<Tags className="mb-2 h-6 w-6 opacity-10" />
									<p className="text-muted-foreground/30 text-xs">Sin etiquetas aún</p>
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
