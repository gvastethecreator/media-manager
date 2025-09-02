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
import { memo } from 'react';
import { useFolderStats } from '@/components/settings/folders/hooks/use-folder-stats';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Silk from '@/components/ui/silk-background';
import { useGeneralStats, useRecentActivity, useSystemStatsExtended, useTopTags } from '@/lib/api/stats';
import { useSystemStats } from '@/lib/api/system';

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
	const combinedStats = {
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
			generalStats?.usedSpace || systemStats?.storageUsed || extendedStats?.storageUsed || folderStats?.totalSize || 0,
		storageAvailable: generalStats?.freeSpace || systemStats?.storageAvailable || 1_000_000_000, // 1GB por defecto
		totalSize:
			generalStats?.usedSpace || generalStats?.storageUsed || extendedStats?.storageUsed || folderStats?.totalSize || 0,
		averageFileSize: generalStats?.averageFileSize || extendedStats?.averageFileSize || 0,
		diskUsage: generalStats?.diskUsage || extendedStats?.diskUsage,

		// Datos del sistema legacy
		dbSize: systemStats?.dbSize || 0,
		lastBackup: systemStats?.lastBackup,
	};

	// Calcular totales y estadísticas derivadas
	const totalMediaFiles = combinedStats.totalImages + combinedStats.totalVideos + combinedStats.totalAudio;
	const totalContentFiles =
		totalMediaFiles + combinedStats.totalDocuments + combinedStats.totalJsonFiles + combinedStats.totalFile3D;
	const totalOrganizationEntities =
		combinedStats.totalFolders + combinedStats.totalAlbums + combinedStats.totalCollections + combinedStats.totalTags;
	const totalWorldbuildingEntities =
		combinedStats.totalCharacters +
		combinedStats.totalPlaces +
		combinedStats.totalConcepts +
		combinedStats.totalNotes +
		combinedStats.totalWorldItems +
		combinedStats.totalPrompts;
	const totalSystemEntities =
		combinedStats.totalThumbnails + combinedStats.totalMetadata + combinedStats.totalWorkflows;
	const totalAllEntities =
		totalContentFiles + totalOrganizationEntities + totalWorldbuildingEntities + totalSystemEntities;

	const storageUsedPercentage =
		combinedStats.storageAvailable > 0
			? (combinedStats.storageUsed / (combinedStats.storageUsed + combinedStats.storageAvailable)) * 100
			: 0;

	const formatBytes = (bytes: number): string => {
		if (bytes === 0) {
			return '0 B';
		}
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const formatNumber = (num: number): string => {
		if (num === 0) {
			return '0';
		}
		if (num < 1000) {
			return num.toString();
		}
		if (num < 1_000_000) {
			return `${(num / 1000).toFixed(1)}K`;
		}
		return `${(num / 1_000_000).toFixed(1)}M`;
	};

	if (isLoading) {
		return (
			<div className="relative h-full w-full">
				{/* Silk Background */}
				<div className="absolute inset-0 z-0">
					<Silk color="#000000" noiseIntensity={1.2} rotation={0.1} scale={1.2} speed={3} />
				</div>

				{/* Content overlay */}
				<div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-4">
					<div className="animate-pulse space-y-4">
						<div className="h-6 w-56 rounded bg-white/20" />
						<div className="h-3.5 w-40 rounded bg-white/10" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="relative h-full w-full">
			{/* Silk Background */}
			<div className="absolute inset-0 z-0">
				<Silk color="#111111" noiseIntensity={1.2} rotation={0.2} scale={1.2} speed={6} />
			</div>

			{/* Content overlay */}
			<div className="relative z-10 h-full w-full overflow-auto">
				<div className="-translate-y-1/2 -translate-x-1/2 container absolute top-1/2 left-1/2 mx-auto max-w-screen-xl space-y-3 p-2 md:p-3">
					{/* Grid única: KPIs + Extendidas (compacto) */}
					<div className="grid grid-cols-6 gap-2 sm:grid-cols-4 md:grid-cols-5">
						{/* Imágenes */}
						<div className="border-blue-300/30 bg-gradient-to-br from-blue-500/15 to-blue-600/25 backdrop-blur-sm transition-all hover:from-blue-500/25 hover:to-blue-600/35">
							<div className="p-2 pb-1">
								<div className="flex items-center gap-1.5 font-medium text-xs">
									<ImageIcon className="h-4 w-4 text-blue-400" />
									Imágenes
								</div>
							</div>
							<div className="px-2 pt-0 pb-2">
								<div className="font-bold text-lg text-white">{formatNumber(combinedStats.totalImages)}</div>
								<div className="text-[10px] text-blue-200">
									{totalMediaFiles > 0 ? `${((combinedStats.totalImages / totalMediaFiles) * 100).toFixed(1)}%` : '0%'}{' '}
									del total
								</div>
							</div>
						</div>

						{/* Videos */}
						<div className="border-purple-300/30 bg-gradient-to-br from-purple-500/15 to-purple-600/25 backdrop-blur-sm transition-all hover:from-purple-500/25 hover:to-purple-600/35">
							<div className="p-2 pb-1">
								<div className="flex items-center gap-1.5 font-medium text-xs">
									<Video className="h-4 w-4 text-purple-400" />
									Videos
								</div>
							</div>
							<div className="px-2 pt-0 pb-2">
								<div className="font-bold text-lg text-white">{formatNumber(combinedStats.totalVideos)}</div>
								<div className="text-[10px] text-purple-200">
									{totalMediaFiles > 0 ? `${((combinedStats.totalVideos / totalMediaFiles) * 100).toFixed(1)}%` : '0%'}{' '}
									del total
								</div>
							</div>
						</div>

						{/* Audio */}
						<div className="border-green-300/30 bg-gradient-to-br from-green-500/15 to-green-600/25 backdrop-blur-sm transition-all hover:from-green-500/25 hover:to-green-600/35">
							<div className="p-2 pb-1">
								<div className="flex items-center gap-1.5 font-medium text-xs">
									<Music className="h-4 w-4 text-green-400" />
									Audio
								</div>
							</div>
							<div className="px-2 pt-0 pb-2">
								<div className="font-bold text-lg text-white">{formatNumber(combinedStats.totalAudio)}</div>
								<div className="text-[10px] text-green-200">
									{totalMediaFiles > 0 ? `${((combinedStats.totalAudio / totalMediaFiles) * 100).toFixed(1)}%` : '0%'}{' '}
									del total
								</div>
							</div>
						</div>

						{/* Documentos */}
						<div className="border-orange-300/30 bg-gradient-to-br from-orange-500/15 to-orange-600/25 backdrop-blur-sm transition-all hover:from-orange-500/25 hover:to-orange-600/35">
							<div className="p-2 pb-1">
								<div className="flex items-center gap-1.5 font-medium text-xs">
									<FileImage className="h-4 w-4 text-orange-400" />
									Docs
								</div>
							</div>
							<div className="px-2 pt-0 pb-2">
								<div className="font-bold text-lg text-white">{formatNumber(combinedStats.totalDocuments)}</div>
								<div className="text-[10px] text-orange-200">
									{totalContentFiles > 0
										? `${((combinedStats.totalDocuments / totalContentFiles) * 100).toFixed(1)}%`
										: '0%'}{' '}
									del total
								</div>
							</div>
						</div>

						{/* Carpetas */}
						<div className="border-yellow-300/30 bg-gradient-to-br from-yellow-500/15 to-yellow-600/25 backdrop-blur-sm transition-all hover:from-yellow-500/25 hover:to-yellow-600/35">
							<div className="p-2 pb-1">
								<div className="flex items-center gap-1.5 font-medium text-xs">
									<FolderOpen className="h-4 w-4 text-yellow-400" />
									Carpetas
								</div>
							</div>
							<div className="px-2 pt-0 pb-2">
								<div className="font-bold text-lg text-white">{formatNumber(combinedStats.totalFolders)}</div>
								<div className="text-[10px] text-yellow-200">Organizadas</div>
							</div>
						</div>

						{/* Álbumes */}
						<div className="border-indigo-300/30 bg-gradient-to-br from-indigo-500/15 to-indigo-600/25 backdrop-blur-sm transition-all hover:from-indigo-500/25 hover:to-indigo-600/35">
							<div className="p-2 pb-1">
								<div className="flex items-center gap-1.5 font-medium text-xs">
									<Camera className="h-4 w-4 text-indigo-400" />
									Álbumes
								</div>
							</div>
							<div className="px-2 pt-0 pb-2">
								<div className="font-bold text-lg text-white">{formatNumber(combinedStats.totalAlbums)}</div>
								<div className="text-[10px] text-indigo-200">Colecciones</div>
							</div>
						</div>

						{/* Tags */}
						<div className="border-cyan-300/30 bg-gradient-to-br from-cyan-500/15 to-cyan-600/25 backdrop-blur-sm transition-all hover:from-cyan-500/25 hover:to-cyan-600/35">
							<div className="p-2 pb-1">
								<div className="flex items-center gap-1.5 font-medium text-xs">
									<Tags className="h-4 w-4 text-cyan-400" />
									Tags
								</div>
							</div>
							<div className="px-2 pt-0 pb-2">
								<div className="font-bold text-lg text-white">{formatNumber(combinedStats.totalTags)}</div>
								<div className="text-[10px] text-cyan-200">Etiquetas</div>
							</div>
						</div>

						{/* JSON Files */}
						<div className="border-amber-300/30 bg-gradient-to-br from-amber-500/15 to-amber-600/25 backdrop-blur-sm transition-all hover:from-amber-500/25 hover:to-amber-600/35">
							<div className="p-2 pb-1">
								<div className="flex items-center gap-1.5 font-medium text-xs">
									<Code className="h-4 w-4 text-amber-400" />
									JSON
								</div>
							</div>
							<div className="px-2 pt-0 pb-2">
								<div className="font-bold text-lg text-white">{formatNumber(combinedStats.totalJsonFiles)}</div>
								<div className="text-[10px] text-amber-200">Archivos</div>
							</div>
						</div>

						{/* Archivos 3D */}
						<div className="border-purple-300/30 bg-gradient-to-br from-purple-500/15 to-purple-600/25 backdrop-blur-sm transition-all hover:from-purple-500/25 hover:to-purple-600/35">
							<div className="p-2 pb-1">
								<div className="flex items-center gap-1.5 font-medium text-xs">
									<Boxes className="h-4 w-4 text-purple-400" />
									3D
								</div>
							</div>
							<div className="px-2 pt-0 pb-2">
								<div className="font-bold text-lg text-white">{formatNumber(combinedStats.totalFile3D)}</div>
								<div className="text-[10px] text-purple-200">Modelos</div>
							</div>
						</div>

						{/* Workflows */}
						<div className="border-teal-300/30 bg-gradient-to-br from-teal-500/15 to-teal-600/25 backdrop-blur-sm transition-all hover:from-teal-500/25 hover:to-teal-600/35">
							<div className="p-2 pb-1">
								<div className="flex items-center gap-1.5 font-medium text-xs">
									<Settings className="h-4 w-4 text-teal-400" />
									Workflows
								</div>
							</div>
							<div className="px-2 pt-0 pb-2">
								<div className="font-bold text-lg text-white">{formatNumber(combinedStats.totalWorkflows)}</div>
								<div className="text-[10px] text-teal-200">Flujos</div>
							</div>
						</div>

						{/* Extendidas (solo si hay datos) */}
						{combinedStats.totalCharacters > 0 && (
							<div className="border-white/10 bg-card/80 backdrop-blur-sm">
								<div className="p-2 pb-1">
									<div className="flex items-center gap-1.5 text-xs">
										<Users className="h-4 w-4 text-teal-400" />
										Personajes
									</div>
								</div>
								<div className="px-2 pt-0 pb-2">
									<div className="font-bold text-lg">{formatNumber(combinedStats.totalCharacters)}</div>
								</div>
							</div>
						)}
						{combinedStats.totalPlaces > 0 && (
							<div className="border-white/10 bg-card/80 backdrop-blur-sm">
								<div className="p-2 pb-1">
									<div className="flex items-center gap-1.5 text-xs">
										<Calendar className="h-4 w-4 text-emerald-400" />
										Lugares
									</div>
								</div>
								<div className="px-2 pt-0 pb-2">
									<div className="font-bold text-lg">{formatNumber(combinedStats.totalPlaces)}</div>
								</div>
							</div>
						)}
						{combinedStats.totalConcepts > 0 && (
							<div className="border-white/10 bg-card/80 backdrop-blur-sm">
								<div className="p-2 pb-1">
									<div className="flex items-center gap-1.5 text-xs">
										<Zap className="h-4 w-4 text-violet-400" />
										Conceptos
									</div>
								</div>
								<div className="px-2 pt-0 pb-2">
									<div className="font-bold text-lg">{formatNumber(combinedStats.totalConcepts)}</div>
								</div>
							</div>
						)}
						{combinedStats.totalNotes > 0 && (
							<div className="border-white/10 bg-card/80 backdrop-blur-sm">
								<div className="p-2 pb-1">
									<div className="flex items-center gap-1.5 text-xs">
										<BookOpen className="h-4 w-4 text-amber-400" />
										Notas
									</div>
								</div>
								<div className="px-2 pt-0 pb-2">
									<div className="font-bold text-lg">{formatNumber(combinedStats.totalNotes)}</div>
								</div>
							</div>
						)}
						{combinedStats.totalPrompts > 0 && (
							<div className="border-white/10 bg-card/80 backdrop-blur-sm">
								<div className="p-2 pb-1">
									<div className="flex items-center gap-1.5 text-xs">
										<Wand2 className="h-4 w-4 text-indigo-400" />
										Prompts
									</div>
								</div>
								<div className="px-2 pt-0 pb-2">
									<div className="font-bold text-lg">{formatNumber(combinedStats.totalPrompts)}</div>
								</div>
							</div>
						)}
						{combinedStats.totalProperties > 0 && (
							<div className="border-white/10 bg-card/80 backdrop-blur-sm">
								<div className="p-2 pb-1">
									<div className="flex items-center gap-1.5 text-xs">
										<Key className="h-4 w-4 text-slate-400" />
										Propiedades
									</div>
								</div>
								<div className="px-2 pt-0 pb-2">
									<div className="font-bold text-lg">{formatNumber(combinedStats.totalProperties)}</div>
								</div>
							</div>
						)}
						{combinedStats.totalWildcards > 0 && (
							<div className="border-white/10 bg-card/80 backdrop-blur-sm">
								<div className="p-2 pb-1">
									<div className="flex items-center gap-1.5 text-xs">
										<Shuffle className="h-4 w-4 text-cyan-400" />
										Comodines
									</div>
								</div>
								<div className="px-2 pt-0 pb-2">
									<div className="font-bold text-lg">{formatNumber(combinedStats.totalWildcards)}</div>
								</div>
							</div>
						)}
						{combinedStats.totalFavorites > 0 && (
							<div className="border-white/10 bg-card/80 backdrop-blur-sm">
								<div className="p-2 pb-1">
									<div className="flex items-center gap-1.5 text-xs">
										<Heart className="h-4 w-4 text-red-400" />
										Favoritos
									</div>
								</div>
								<div className="px-2 pt-0 pb-2">
									<div className="font-bold text-lg">{formatNumber(combinedStats.totalFavorites)}</div>
								</div>
							</div>
						)}
						{combinedStats.totalWorldItems > 0 && (
							<div className="border-white/10 bg-card/80 backdrop-blur-sm">
								<div className="p-2 pb-1">
									<div className="flex items-center gap-1.5 text-xs">
										<Archive className="h-4 w-4 text-rose-400" />
										Mundos
									</div>
								</div>
								<div className="px-2 pt-0 pb-2">
									<div className="font-bold text-lg">{formatNumber(combinedStats.totalWorldItems)}</div>
								</div>
							</div>
						)}
						{combinedStats.dbSize > 0 && (
							<div className="border-white/10 bg-card/80 backdrop-blur-sm">
								<div className="p-2 pb-1">
									<div className="flex items-center gap-1.5 text-xs">
										<Database className="h-4 w-4 text-slate-400" />
										BD
									</div>
								</div>
								<div className="px-2 pt-0 pb-2">
									<div className="font-bold text-lg">{formatBytes(combinedStats.dbSize)}</div>
								</div>
							</div>
						)}
					</div>

					{/* Secundarias compactas */}
					<div className="grid grid-cols-3 gap-2 md:grid-cols-3">
						{/* Almacenamiento */}
						<div className="border-white/15 bg-card/90 backdrop-blur-sm md:col-span-1">
							<div className="p-3 pb-2">
								<div className="flex items-center gap-2 text-sm">
									<HardDrive className="h-5 w-5 text-slate-400" />
									Almacenamiento
								</div>
							</div>
							<div className="space-y-2 px-3 pt-0 pb-3">
								<div className="space-y-1.5">
									<div className="flex justify-between text-xs">
										<span>Espacio utilizado</span>
										<span className="font-medium">{formatBytes(combinedStats.storageUsed)}</span>
									</div>
									<Progress className="h-1.5" value={storageUsedPercentage} />
									<div className="flex justify-between text-[10px] text-muted-foreground">
										<span>{storageUsedPercentage.toFixed(1)}% usado</span>
										<span>{formatBytes(combinedStats.storageAvailable)} disponible</span>
									</div>
								</div>

								{combinedStats.averageFileSize > 0 && (
									<div className="border-white/10 border-t pt-2">
										<div className="text-xs">
											<span className="text-muted-foreground">Promedio: </span>
											<span className="font-medium">{formatBytes(combinedStats.averageFileSize)}</span>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Actividad reciente */}
						<div className="border-white/15 bg-card/90 backdrop-blur-sm">
							<div className="p-3 pb-2">
								<div className="flex items-center gap-2 text-sm">
									<Activity className="h-5 w-5 text-emerald-400" />
									Actividad
								</div>
							</div>
							<div className="px-3 pt-0 pb-3">
								{activityLoading ? (
									<div className="space-y-1.5">
										{Array.from({ length: 3 }, (_, i) => (
											<div
												className="h-3.5 animate-pulse rounded bg-white/10"
												key={`activity-skeleton-${Date.now()}-${i}`}
											/>
										))}
									</div>
								) : recentActivity && recentActivity.length > 0 ? (
									<div className="space-y-1.5">
										{recentActivity.slice(0, 2).map((activity, i) => (
											<div className="text-xs" key={activity.id || i}>
												<div className="truncate font-medium">{activity.entityName}</div>
												<div className="text-[10px] text-muted-foreground capitalize">
													{activity.type} • {activity.entityType}
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="text-muted-foreground text-xs">Sin actividad reciente</div>
								)}
							</div>
						</div>

						{/* Top Tags */}
						<div className="border-white/15 bg-card/90 backdrop-blur-sm">
							<div className="p-3 pb-2">
								<div className="flex items-center gap-2 text-sm">
									<Star className="h-5 w-5 text-yellow-400" />
									Tags Populares
								</div>
							</div>
							<div className="px-3 pt-0 pb-3">
								{tagsLoading ? (
									<div className="space-y-1.5">
										{Array.from({ length: 3 }, (_, i) => (
											<div
												className="h-3.5 animate-pulse rounded bg-white/10"
												key={`tag-skeleton-${Date.now()}-${i}`}
											/>
										))}
									</div>
								) : topTags && topTags.length > 0 ? (
									<div className="space-y-1.5">
										{topTags.slice(0, 4).map((tag, i) => (
											<div className="flex items-center justify-between text-xs" key={tag.id || i}>
												<div className="flex items-center gap-1 truncate">
													{tag.emoji && <span className="text-[10px]">{tag.emoji}</span>}
													<span className="truncate">{tag.name}</span>
												</div>
												<Badge className="ml-2 text-[10px]" variant="secondary">
													{tag.imageCount}
												</Badge>
											</div>
										))}
									</div>
								) : (
									<div className="text-muted-foreground text-xs">Sin etiquetas</div>
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
