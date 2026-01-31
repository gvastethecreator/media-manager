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
	gradientFrom: string;
	gradientTo: string;
	previews?: PreviewItem[];
	isLoading?: boolean;
	stats?: { label: string; value: string }[];
}

const CategoryCard = memo(function CategoryCard({
	title,
	icon: Icon,
	count,
	href,
	color,
	gradientFrom,
	gradientTo,
	previews,
	isLoading,
	stats,
}: CategoryCardProps) {
	return (
		<Link
			className={cn(
				'group relative overflow-hidden rounded-dt-xl border backdrop-blur-md transition-all duration-dt-normal',
				'hover:scale-[1.02] hover:shadow-dt-3',
				'bg-gradient-to-br from-card/90 to-card/70',
				'border-border/30 hover:border-border/50'
			)}
			style={{
				background: `linear-gradient(135deg, color-mix(in oklch, ${gradientFrom} 8%, var(--card)) 0%, color-mix(in oklch, ${gradientTo} 5%, var(--card)) 100%)`,
			}}
			to={href}
		>
			{/* Glow Effect */}
			<div
				className="absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
				style={{
					background: `radial-gradient(600px circle at 50% 0%, ${color}20, transparent 40%)`,
				}}
			/>

			{/* Header */}
			<div className="relative flex items-center justify-between p-5">
				<div className="flex items-center gap-4">
					<div
						className={cn(
							'flex h-12 w-12 items-center justify-center rounded-dt-lg',
							'transition-transform duration-dt-normal group-hover:scale-110'
						)}
						style={{
							background: `linear-gradient(135deg, ${gradientFrom}40 0%, ${gradientTo}30 100%)`,
							boxShadow: `0 4px 20px ${color}20`,
						}}
					>
						<Icon className="h-6 w-6" style={{ color }} />
					</div>
					<div>
						<h3 className="font-bold text-foreground">{title}</h3>
						<p className="text-muted-foreground text-sm">{formatNumber(count)} items</p>
					</div>
				</div>
				<div
					className={cn(
						'flex h-8 w-8 items-center justify-center rounded-full',
						'transition-all duration-dt-normal',
						'opacity-0 group-hover:opacity-100',
						'-translate-x-2 group-hover:translate-x-0'
					)}
					style={{ backgroundColor: `${color}15` }}
				>
					<ArrowRight className="h-4 w-4" style={{ color }} />
				</div>
			</div>

			{/* Mini Stats */}
			{stats && stats.length > 0 && (
				<div className="relative flex gap-4 px-5 pb-3">
					{stats.map((stat, i) => (
						<div className="flex flex-col" key={i}>
							<span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
							<span className="font-semibold text-sm" style={{ color }}>
								{stat.value}
							</span>
						</div>
					))}
				</div>
			)}

			{/* Previews Grid */}
			<div className="relative px-5 pb-5">
				{isLoading ? (
					<div className="flex gap-2">
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								className="aspect-square flex-1 animate-pulse rounded-dt-md bg-muted/50"
								key={i}
								style={{ animationDelay: `${i * 100}ms` }}
							/>
						))}
					</div>
				) : previews && previews.length > 0 ? (
					<div className="flex gap-2">
						{previews.slice(0, 4).map((item, index) => (
							<div
								className={cn(
									'group/item relative aspect-square flex-1 overflow-hidden rounded-dt-md',
									'border border-border/20',
									'transition-all duration-dt-normal',
									'hover:scale-105 hover:shadow-lg'
								)}
								key={item.id}
								style={{
									animationDelay: `${index * 50}ms`,
									zIndex: 4 - index,
								}}
							>
								{item.thumbnailUrl ? (
									<img
										alt={item.name || ''}
										className="h-full w-full object-cover transition-transform duration-500 group-hover/item:scale-110"
										loading="lazy"
										src={item.thumbnailUrl}
									/>
								) : (
									<div className="flex h-full w-full flex-col items-center justify-center bg-muted/30">
										<Icon className="mb-1 h-5 w-5 opacity-30" />
										<span className="max-w-[80%] truncate px-1 text-[10px] text-muted-foreground/60">
											{item.name || 'Sin nombre'}
										</span>
									</div>
								)}

								{/* Hover Overlay */}
								<div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover/item:bg-black/20">
									<div className="scale-0 opacity-0 transition-all duration-300 group-hover/item:scale-100 group-hover/item:opacity-100">
										<div
											className="flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm"
											style={{ backgroundColor: `${color}90` }}
										>
											<ArrowRight className="h-4 w-4 text-white" />
										</div>
									</div>
								</div>
							</div>
						))}
						{previews.length > 4 && (
							<div className="flex aspect-square flex-1 items-center justify-center rounded-dt-md border border-border/20 bg-muted/40">
								<span className="font-bold text-muted-foreground text-sm">+{previews.length - 4}</span>
							</div>
						)}
					</div>
				) : (
					<div className="flex aspect-[4/1] flex-col items-center justify-center gap-2 rounded-dt-md border border-border/30 border-dashed bg-muted/20">
						<Icon className="h-6 w-6 opacity-20" style={{ color }} />
						<span className="text-muted-foreground/50 text-xs">Sin contenido aún</span>
					</div>
				)}
			</div>

			{/* Bottom Accent Line */}
			<div
				className="absolute right-0 bottom-0 left-0 h-1 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
				style={{
					background: `linear-gradient(90deg, transparent 0%, ${color}60 50%, transparent 100%)`,
				}}
			/>
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

	// Main categories with real previews
	const mainCategories = useMemo(
		() => [
			{
				title: 'Imágenes',
				icon: ImageIcon,
				count: combinedStats.totalImages,
				href: '/all-images',
				color: 'var(--entity-image)',
				gradientFrom: '#3b82f6',
				gradientTo: '#8b5cf6',
				previews: recentImages?.data?.map((img) => ({
					id: img.id,
					thumbnailUrl: img.thumbnailUrl,
					name: img.name,
				})),
				isLoading: imagesLoading,
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
				gradientFrom: '#8b5cf6',
				gradientTo: '#ec4899',
				previews: recentVideos?.data?.map((video) => ({
					id: video.id,
					thumbnailUrl: video.thumbnailUrl,
					name: video.name,
				})),
				isLoading: videosLoading,
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
				color: 'var(--dt-success-500)',
				gradientFrom: '#10b981',
				gradientTo: '#059669',
				previews: recentAudio?.slice(0, 4).map((audio) => ({
					id: audio.id,
					name: audio.name,
				})),
				isLoading: audioLoading,
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
				gradientFrom: '#f59e0b',
				gradientTo: '#d97706',
				previews: [],
				isLoading: folderLoading,
				stats: [{ label: 'Total', value: formatNumber(combinedStats.totalFolders) }],
			},
			{
				title: 'Álbumes',
				icon: Camera,
				count: combinedStats.totalAlbums,
				href: '/albums',
				color: 'var(--entity-album)',
				gradientFrom: '#06b6d4',
				gradientTo: '#0891b2',
				previews: recentAlbums?.data?.slice(0, 4).map((album) => ({
					id: album.id,
					name: album.name,
				})),
				isLoading: albumsLoading,
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
				gradientFrom: '#f97316',
				gradientTo: '#ea580c',
				previews: recentCollections?.data?.slice(0, 4).map((collection) => ({
					id: collection.id,
					name: collection.name,
				})),
				isLoading: collectionsLoading,
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
				color: 'var(--dt-primary-500)',
				gradientFrom: '#6366f1',
				gradientTo: '#4f46e5',
				previews: [],
				isLoading: tagsLoading,
				stats: [{ label: 'Total', value: formatNumber(combinedStats.totalTags) }],
			},
			{
				title: 'Favoritos',
				icon: Heart,
				count: combinedStats.totalFavorites,
				href: '/favorites',
				color: 'var(--dt-danger-500)',
				gradientFrom: '#ef4444',
				gradientTo: '#dc2626',
				previews: [],
				isLoading: false,
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
				gradientFrom: '#14b8a6',
				gradientTo: '#0d9488',
				previews: [],
				isLoading: false,
				stats: [{ label: 'Total', value: formatNumber(combinedStats.totalCharacters) }],
			},
			{
				title: 'Lugares',
				icon: Calendar,
				count: combinedStats.totalPlaces,
				href: '/places',
				color: 'var(--entity-place)',
				gradientFrom: '#22c55e',
				gradientTo: '#16a34a',
				previews: [],
				isLoading: false,
				stats: [{ label: 'Total', value: formatNumber(combinedStats.totalPlaces) }],
			},
			{
				title: 'Conceptos',
				icon: Zap,
				count: combinedStats.totalConcepts,
				href: '/concepts',
				color: 'var(--dt-violet-500)',
				gradientFrom: '#8b5cf6',
				gradientTo: '#7c3aed',
				previews: [],
				isLoading: false,
				stats: [{ label: 'Total', value: formatNumber(combinedStats.totalConcepts) }],
			},
			{
				title: 'Notas',
				icon: BookOpen,
				count: combinedStats.totalNotes,
				href: '/notes',
				color: 'var(--dt-warning-500)',
				gradientFrom: '#eab308',
				gradientTo: '#ca8a04',
				previews: [],
				isLoading: false,
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
					<Silk color="var(--background)" noiseIntensity={1.2} rotation={0.1} scale={1.2} speed={3} />
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
				<Silk color="var(--background)" noiseIntensity={1.5} rotation={0.2} scale={1.3} speed={4} />
			</div>

			{/* Content */}
			<div className="relative z-10 h-full overflow-auto">
				<div className="container mx-auto max-w-7xl space-y-8 p-6">
					{/* Enhanced Header */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="relative">
								<div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
								<div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary/40 shadow-lg">
									<Sparkles className="h-6 w-6 text-primary-foreground" />
								</div>
							</div>
							<div>
								<h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text font-bold text-3xl text-transparent">
									Dashboard
								</h1>
								<p className="text-muted-foreground">Bienvenido a tu gestor de multimedia</p>
							</div>
						</div>

						{/* Quick Stats Summary */}
						<div className="hidden items-center gap-6 md:flex">
							<div className="text-right">
								<p className="text-muted-foreground text-xs uppercase tracking-wider">Total Media</p>
								<p className="font-bold text-2xl text-foreground">{formatNumber(totalMediaFiles)}</p>
							</div>
							<div className="h-10 w-px bg-border/50" />
							<div className="text-right">
								<p className="text-muted-foreground text-xs uppercase tracking-wider">Almacenamiento</p>
								<p className="font-bold text-2xl text-foreground">{formatBytes(combinedStats.storageUsed)}</p>
							</div>
						</div>
					</div>

					{/* Stats Grid */}
					<section className="rounded-dt-xl border border-border/20 bg-card/30 p-6 backdrop-blur-sm">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="font-semibold text-foreground">Resumen Rápido</h2>
							<Badge variant="outline">{formatNumber(totalMediaFiles)} archivos totales</Badge>
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

					{/* Main Categories - Elevated Design */}
					<section>
						<div className="mb-4 flex items-center gap-2">
							<div className="h-6 w-1 rounded-full bg-gradient-to-b from-primary to-primary/50" />
							<h2 className="font-semibold text-foreground text-xl">Categorías Principales</h2>
						</div>
						<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
								<div className="h-6 w-1 rounded-full bg-gradient-to-b from-secondary to-secondary/50" />
								<h2 className="font-semibold text-foreground text-xl">Worldbuilding</h2>
							</div>
							<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
								{worldbuildingCategories.map((category) => (
									<CategoryCard key={category.title} {...category} />
								))}
							</div>
						</section>
					)}

					{/* Bottom Info Cards */}
					<div className="grid grid-cols-1 gap-5 md:grid-cols-3">
						{/* Storage Card */}
						<div className="group relative overflow-hidden rounded-dt-xl border border-border/30 bg-gradient-to-br from-card/80 to-card/60 p-5 backdrop-blur-md transition-all duration-300 hover:border-border/50 hover:shadow-lg">
							<div className="mb-4 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-dt-lg bg-gradient-to-br from-slate-500/20 to-slate-600/20">
									<HardDrive className="h-5 w-5 text-slate-500" />
								</div>
								<div>
									<h3 className="font-semibold text-foreground">Almacenamiento</h3>
									<p className="text-muted-foreground text-xs">Espacio utilizado</p>
								</div>
							</div>

							<div className="space-y-3">
								<div className="flex items-baseline justify-between">
									<span className="font-bold text-2xl text-foreground">{formatBytes(combinedStats.storageUsed)}</span>
									<span className="text-muted-foreground text-sm">
										de {formatBytes(combinedStats.storageUsed + combinedStats.storageAvailable)}
									</span>
								</div>

								<div className="relative h-2 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-1000"
										style={{ width: `${storageUsedPercentage}%` }}
									/>
								</div>

								<div className="flex justify-between text-xs">
									<span className="text-muted-foreground">{storageUsedPercentage.toFixed(1)}% usado</span>
									<span className="text-muted-foreground">{formatBytes(combinedStats.storageAvailable)} libre</span>
								</div>

								{combinedStats.averageFileSize > 0 && (
									<div className="mt-3 flex items-center gap-2 border-border/20 border-t pt-3 text-xs">
										<span className="text-muted-foreground">Tamaño promedio:</span>
										<span className="font-medium">{formatBytes(combinedStats.averageFileSize)}</span>
									</div>
								)}
							</div>
						</div>

						{/* Activity Card */}
						<div className="group relative overflow-hidden rounded-dt-xl border border-border/30 bg-gradient-to-br from-card/80 to-card/60 p-5 backdrop-blur-md transition-all duration-300 hover:border-border/50 hover:shadow-lg">
							<div className="mb-4 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-dt-lg bg-gradient-to-br from-success/20 to-success/30">
									<Activity className="h-5 w-5 text-success" />
								</div>
								<div>
									<h3 className="font-semibold text-foreground">Actividad Reciente</h3>
									<p className="text-muted-foreground text-xs">Últimas acciones</p>
								</div>
							</div>

							{activityLoading ? (
								<div className="space-y-2">
									{Array.from({ length: 3 }).map((_, i) => (
										<div className="h-8 animate-pulse rounded bg-muted/50" key={i} />
									))}
								</div>
							) : recentActivity && recentActivity.length > 0 ? (
								<div className="space-y-3">
									{recentActivity.slice(0, 3).map((activity, i) => (
										<div
											className="flex items-center gap-3 rounded-lg border border-border/20 bg-background/50 p-2 transition-colors hover:bg-background/80"
											key={activity.id || i}
										>
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
												<span className="text-primary text-xs">{activity.entityType?.[0]?.toUpperCase()}</span>
											</div>
											<div className="min-w-0 flex-1">
												<p className="truncate font-medium text-sm">{activity.entityName}</p>
												<p className="text-muted-foreground text-xs capitalize">
													{activity.type} • {activity.entityType}
												</p>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-8 text-center">
									<Activity className="mb-2 h-8 w-8 opacity-20" />
									<p className="text-muted-foreground text-sm">Sin actividad reciente</p>
								</div>
							)}
						</div>

						{/* Tags Card */}
						<div className="group relative overflow-hidden rounded-dt-xl border border-border/30 bg-gradient-to-br from-card/80 to-card/60 p-5 backdrop-blur-md transition-all duration-300 hover:border-border/50 hover:shadow-lg">
							<div className="mb-4 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-dt-lg bg-gradient-to-br from-warning/20 to-warning/30">
									<Star className="h-5 w-5 text-warning" />
								</div>
								<div>
									<h3 className="font-semibold text-foreground">Tags Populares</h3>
									<p className="text-muted-foreground text-xs">Más utilizados</p>
								</div>
							</div>

							{tagsLoading ? (
								<div className="space-y-2">
									{Array.from({ length: 4 }).map((_, i) => (
										<div className="h-10 animate-pulse rounded bg-muted/50" key={i} />
									))}
								</div>
							) : topTags && topTags.length > 0 ? (
								<div className="space-y-2">
									{topTags.slice(0, 5).map((tag) => (
										<div
											className="flex items-center justify-between rounded-lg border border-border/20 bg-background/50 p-2 transition-colors hover:bg-background/80"
											key={tag.id}
										>
											<div className="flex min-w-0 items-center gap-2">
												{tag.emoji && <span className="text-lg">{tag.emoji}</span>}
												<span className="truncate font-medium text-sm">{tag.name}</span>
											</div>
											<Badge variant="secondary">{tag.imageCount}</Badge>
										</div>
									))}
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-8 text-center">
									<Tags className="mb-2 h-8 w-8 opacity-20" />
									<p className="text-muted-foreground text-sm">Sin etiquetas aún</p>
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
