import {
    Activity,
    Archive,
    BarChart3,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
		storageAvailable: generalStats?.freeSpace || systemStats?.storageAvailable || 1000000000, // 1GB por defecto
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
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const formatNumber = (num: number): string => {
		if (num === 0) return '0';
		if (num < 1000) return num.toString();
		if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
		return `${(num / 1000000).toFixed(1)}M`;
	};

	if (isLoading) {
		return (
			<div className="relative h-full w-full">
				{/* Silk Background */}
				<div className="absolute inset-0 z-0">
					<Silk speed={3} scale={1.2} color="#7B7481" noiseIntensity={1.2} rotation={0.1} />
				</div>

				{/* Content overlay */}
				<div className="relative z-10 h-full w-full flex flex-col items-center justify-center p-6">
					<div className="animate-pulse space-y-4">
						<div className="h-8 w-64 bg-white/20 rounded" />
						<div className="h-4 w-48 bg-white/10 rounded" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="relative h-full w-full">
			{/* Silk Background */}
			<div className="absolute inset-0 z-0">
				<Silk speed={3} scale={1.2} color="#7B7481" noiseIntensity={1.2} rotation={0.1} />
			</div>

			{/* Content overlay */}
			<div className="relative z-10 h-full w-full overflow-auto">
				<div className="container mx-auto p-4 space-y-6 max-w-7xl">
					{/* Header - Más compacto */}
					<div className="text-center space-y-1">
						<h1 className="text-3xl font-bold text-white drop-shadow-lg">📊 Panel de Control</h1>
						<p className="text-white/80 drop-shadow-md">
							Gestión avanzada de archivos multimedia - {formatNumber(totalAllEntities)} elementos
						</p>
					</div>

					{/* Main KPIs Grid - Más compacto para desktop */}
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-4">
						{/* Imágenes */}
						<Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 backdrop-blur-sm border-blue-300/30 hover:from-blue-500/30 hover:to-blue-600/40 transition-all">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium flex items-center gap-2">
									<ImageIcon className="h-4 w-4 text-blue-400" />
									Imágenes
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-white">{formatNumber(combinedStats.totalImages)}</div>
								<div className="text-xs text-blue-200">
									{totalMediaFiles > 0 ? `${((combinedStats.totalImages / totalMediaFiles) * 100).toFixed(1)}%` : '0%'}{' '}
									del total
								</div>
							</CardContent>
						</Card>

						{/* Videos */}
						<Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/30 backdrop-blur-sm border-purple-300/30 hover:from-purple-500/30 hover:to-purple-600/40 transition-all">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium flex items-center gap-2">
									<Video className="h-4 w-4 text-purple-400" />
									Videos
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-white">{formatNumber(combinedStats.totalVideos)}</div>
								<div className="text-xs text-purple-200">
									{totalMediaFiles > 0 ? `${((combinedStats.totalVideos / totalMediaFiles) * 100).toFixed(1)}%` : '0%'}{' '}
									del total
								</div>
							</CardContent>
						</Card>

						{/* Audio */}
						<Card className="bg-gradient-to-br from-green-500/20 to-green-600/30 backdrop-blur-sm border-green-300/30 hover:from-green-500/30 hover:to-green-600/40 transition-all">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium flex items-center gap-2">
									<Music className="h-4 w-4 text-green-400" />
									Audio
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-white">{formatNumber(combinedStats.totalAudio)}</div>
								<div className="text-xs text-green-200">
									{totalMediaFiles > 0 ? `${((combinedStats.totalAudio / totalMediaFiles) * 100).toFixed(1)}%` : '0%'}{' '}
									del total
								</div>
							</CardContent>
						</Card>

						{/* Documentos */}
						<Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/30 backdrop-blur-sm border-orange-300/30 hover:from-orange-500/30 hover:to-orange-600/40 transition-all">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium flex items-center gap-2">
									<FileImage className="h-4 w-4 text-orange-400" />
									Docs
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-white">{formatNumber(combinedStats.totalDocuments)}</div>
								<div className="text-xs text-orange-200">
									{totalContentFiles > 0
										? `${((combinedStats.totalDocuments / totalContentFiles) * 100).toFixed(1)}%`
										: '0%'}{' '}
									del total
								</div>
							</CardContent>
						</Card>

						{/* Carpetas */}
						<Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/30 backdrop-blur-sm border-yellow-300/30 hover:from-yellow-500/30 hover:to-yellow-600/40 transition-all">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium flex items-center gap-2">
									<FolderOpen className="h-4 w-4 text-yellow-400" />
									Carpetas
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-white">{formatNumber(combinedStats.totalFolders)}</div>
								<div className="text-xs text-yellow-200">Organizadas</div>
							</CardContent>
						</Card>

						{/* Álbumes */}
						<Card className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/30 backdrop-blur-sm border-indigo-300/30 hover:from-indigo-500/30 hover:to-indigo-600/40 transition-all">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium flex items-center gap-2">
									<Camera className="h-4 w-4 text-indigo-400" />
									Álbumes
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-white">{formatNumber(combinedStats.totalAlbums)}</div>
								<div className="text-xs text-indigo-200">Colecciones</div>
							</CardContent>
						</Card>

						{/* Tags */}
						<Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/30 backdrop-blur-sm border-cyan-300/30 hover:from-cyan-500/30 hover:to-cyan-600/40 transition-all">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium flex items-center gap-2">
									<Tags className="h-4 w-4 text-cyan-400" />
									Tags
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-white">{formatNumber(combinedStats.totalTags)}</div>
								<div className="text-xs text-cyan-200">Etiquetas</div>
							</CardContent>
						</Card>

						{/* JSON Files */}
						<Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/30 backdrop-blur-sm border-amber-300/30 hover:from-amber-500/30 hover:to-amber-600/40 transition-all">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium flex items-center gap-2">
									<Code className="h-4 w-4 text-amber-400" />
									JSON
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-white">{formatNumber(combinedStats.totalJsonFiles)}</div>
								<div className="text-xs text-amber-200">Archivos</div>
							</CardContent>
						</Card>

						{/* Archivos 3D */}
						<Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/30 backdrop-blur-sm border-purple-300/30 hover:from-purple-500/30 hover:to-purple-600/40 transition-all">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium flex items-center gap-2">
									<Boxes className="h-4 w-4 text-purple-400" />
									3D
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-white">{formatNumber(combinedStats.totalFile3D)}</div>
								<div className="text-xs text-purple-200">Modelos</div>
							</CardContent>
						</Card>

						{/* Workflows */}
						<Card className="bg-gradient-to-br from-teal-500/20 to-teal-600/30 backdrop-blur-sm border-teal-300/30 hover:from-teal-500/30 hover:to-teal-600/40 transition-all">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium flex items-center gap-2">
									<Settings className="h-4 w-4 text-teal-400" />
									Workflows
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-white">{formatNumber(combinedStats.totalWorkflows)}</div>
								<div className="text-xs text-teal-200">Flujos</div>
							</CardContent>
						</Card>
					</div>

					{/* Secondary Stats Grid - Información adicional en diseño compacto */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{/* Almacenamiento */}
						<Card className="bg-card/90 backdrop-blur-sm border-white/20 lg:col-span-2">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base">
									<HardDrive className="h-5 w-5 text-slate-400" />
									Almacenamiento
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>Espacio utilizado</span>
										<span className="font-medium">{formatBytes(combinedStats.storageUsed)}</span>
									</div>
									<Progress value={storageUsedPercentage} className="h-2" />
									<div className="flex justify-between text-xs text-muted-foreground">
										<span>{storageUsedPercentage.toFixed(1)}% usado</span>
										<span>{formatBytes(combinedStats.storageAvailable)} disponible</span>
									</div>
								</div>

								{combinedStats.averageFileSize > 0 && (
									<div className="pt-2 border-t border-white/10">
										<div className="text-sm">
											<span className="text-muted-foreground">Tamaño promedio: </span>
											<span className="font-medium">{formatBytes(combinedStats.averageFileSize)}</span>
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Actividad reciente */}
						<Card className="bg-card/90 backdrop-blur-sm border-white/20">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base">
									<Activity className="h-5 w-5 text-emerald-400" />
									Actividad
								</CardTitle>
							</CardHeader>
							<CardContent>
								{activityLoading ? (
									<div className="space-y-2">
										{Array.from({ length: 3 }, (_, i) => (
											<div
												key={`activity-skeleton-${Date.now()}-${i}`}
												className="h-4 bg-white/10 rounded animate-pulse"
											/>
										))}
									</div>
								) : recentActivity && recentActivity.length > 0 ? (
									<div className="space-y-2">
										{recentActivity.slice(0, 3).map((activity, i) => (
											<div key={activity.id || i} className="text-sm">
												<div className="font-medium truncate">{activity.entityName}</div>
												<div className="text-xs text-muted-foreground capitalize">
													{activity.type} • {activity.entityType}
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="text-sm text-muted-foreground">Sin actividad reciente</div>
								)}
							</CardContent>
						</Card>

						{/* Top Tags */}
						<Card className="bg-card/90 backdrop-blur-sm border-white/20">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base">
									<Star className="h-5 w-5 text-yellow-400" />
									Tags Populares
								</CardTitle>
							</CardHeader>
							<CardContent>
								{tagsLoading ? (
									<div className="space-y-2">
										{Array.from({ length: 3 }, (_, i) => (
											<div key={`tag-skeleton-${Date.now()}-${i}`} className="h-4 bg-white/10 rounded animate-pulse" />
										))}
									</div>
								) : topTags && topTags.length > 0 ? (
									<div className="space-y-2">
										{topTags.slice(0, 4).map((tag, i) => (
											<div key={tag.id || i} className="flex justify-between items-center text-sm">
												<div className="flex items-center gap-1 truncate">
													{tag.emoji && <span className="text-xs">{tag.emoji}</span>}
													<span className="truncate">{tag.name}</span>
												</div>
												<Badge variant="secondary" className="text-xs ml-2">
													{tag.imageCount}
												</Badge>
											</div>
										))}
									</div>
								) : (
									<div className="text-sm text-muted-foreground">Sin etiquetas</div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Extended Stats - Entidades adicionales */}
					{(combinedStats.totalCharacters > 0 ||
						combinedStats.totalPlaces > 0 ||
						combinedStats.totalConcepts > 0 ||
						combinedStats.totalNotes > 0 ||
						combinedStats.totalPrompts > 0 ||
						combinedStats.totalProperties > 0 ||
						combinedStats.totalWildcards > 0 ||
						combinedStats.totalFavorites > 0) && (
						<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
							{combinedStats.totalCharacters > 0 && (
								<Card className="bg-card/80 backdrop-blur-sm border-white/10">
									<CardHeader className="pb-2">
										<CardTitle className="text-sm flex items-center gap-2">
											<Users className="h-4 w-4 text-teal-400" />
											Personajes
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-xl font-bold">{formatNumber(combinedStats.totalCharacters)}</div>
									</CardContent>
								</Card>
							)}

							{combinedStats.totalPlaces > 0 && (
								<Card className="bg-card/80 backdrop-blur-sm border-white/10">
									<CardHeader className="pb-2">
										<CardTitle className="text-sm flex items-center gap-2">
											<Calendar className="h-4 w-4 text-emerald-400" />
											Lugares
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-xl font-bold">{formatNumber(combinedStats.totalPlaces)}</div>
									</CardContent>
								</Card>
							)}

							{combinedStats.totalConcepts > 0 && (
								<Card className="bg-card/80 backdrop-blur-sm border-white/10">
									<CardHeader className="pb-2">
										<CardTitle className="text-sm flex items-center gap-2">
											<Zap className="h-4 w-4 text-violet-400" />
											Conceptos
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-xl font-bold">{formatNumber(combinedStats.totalConcepts)}</div>
									</CardContent>
								</Card>
							)}

							{combinedStats.totalNotes > 0 && (
								<Card className="bg-card/80 backdrop-blur-sm border-white/10">
									<CardHeader className="pb-2">
										<CardTitle className="text-sm flex items-center gap-2">
											<BookOpen className="h-4 w-4 text-amber-400" />
											Notas
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-xl font-bold">{formatNumber(combinedStats.totalNotes)}</div>
									</CardContent>
								</Card>
							)}

							{combinedStats.totalPrompts > 0 && (
								<Card className="bg-card/80 backdrop-blur-sm border-white/10">
									<CardHeader className="pb-2">
										<CardTitle className="text-sm flex items-center gap-2">
											<Wand2 className="h-4 w-4 text-indigo-400" />
											Prompts
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-xl font-bold">{formatNumber(combinedStats.totalPrompts)}</div>
									</CardContent>
								</Card>
							)}

							{combinedStats.totalProperties > 0 && (
								<Card className="bg-card/80 backdrop-blur-sm border-white/10">
									<CardHeader className="pb-2">
										<CardTitle className="text-sm flex items-center gap-2">
											<Key className="h-4 w-4 text-slate-400" />
											Propiedades
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-xl font-bold">{formatNumber(combinedStats.totalProperties)}</div>
									</CardContent>
								</Card>
							)}

							{combinedStats.totalWildcards > 0 && (
								<Card className="bg-card/80 backdrop-blur-sm border-white/10">
									<CardHeader className="pb-2">
										<CardTitle className="text-sm flex items-center gap-2">
											<Shuffle className="h-4 w-4 text-cyan-400" />
											Comodines
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-xl font-bold">{formatNumber(combinedStats.totalWildcards)}</div>
									</CardContent>
								</Card>
							)}

							{combinedStats.totalFavorites > 0 && (
								<Card className="bg-card/80 backdrop-blur-sm border-white/10">
									<CardHeader className="pb-2">
										<CardTitle className="text-sm flex items-center gap-2">
											<Heart className="h-4 w-4 text-red-400" />
											Favoritos
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-xl font-bold">{formatNumber(combinedStats.totalFavorites)}</div>
									</CardContent>
								</Card>
							)}

							{combinedStats.totalWorldItems > 0 && (
								<Card className="bg-card/80 backdrop-blur-sm border-white/10">
									<CardHeader className="pb-2">
										<CardTitle className="text-sm flex items-center gap-2">
											<Archive className="h-4 w-4 text-rose-400" />
											Mundos
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-xl font-bold">{formatNumber(combinedStats.totalWorldItems)}</div>
									</CardContent>
								</Card>
							)}

							{combinedStats.dbSize > 0 && (
								<Card className="bg-card/80 backdrop-blur-sm border-white/10">
									<CardHeader className="pb-2">
										<CardTitle className="text-sm flex items-center gap-2">
											<Database className="h-4 w-4 text-slate-400" />
											BD
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-xl font-bold">{formatBytes(combinedStats.dbSize)}</div>
									</CardContent>
								</Card>
							)}
						</div>
					)}

					{/* Sistema Overview - Resumen final compacto */}
					<Card className="bg-card/90 backdrop-blur-sm border-white/20">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BarChart3 className="h-5 w-5 text-emerald-500" />
								Resumen del Sistema
							</CardTitle>
							<CardDescription>
								Estado actual de tu biblioteca multimedia
								{combinedStats.lastBackup && (
									<span className="ml-2 text-xs">
										• Último respaldo: {new Date(combinedStats.lastBackup).toLocaleDateString()}
									</span>
								)}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
								<div className="text-center">
									<div className="text-2xl font-bold text-blue-500">
										{totalMediaFiles > 0 ? ((combinedStats.totalImages / totalMediaFiles) * 100).toFixed(1) : '0'}%
									</div>
									<p className="text-xs text-muted-foreground">Imágenes</p>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-purple-500">
										{totalMediaFiles > 0 ? ((combinedStats.totalVideos / totalMediaFiles) * 100).toFixed(1) : '0'}%
									</div>
									<p className="text-xs text-muted-foreground">Videos</p>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-green-500">
										{totalMediaFiles > 0 ? ((combinedStats.totalAudio / totalMediaFiles) * 100).toFixed(1) : '0'}%
									</div>
									<p className="text-xs text-muted-foreground">Audio</p>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-yellow-500">{formatNumber(combinedStats.totalFolders)}</div>
									<p className="text-xs text-muted-foreground">Carpetas</p>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-cyan-500">{formatNumber(combinedStats.totalTags)}</div>
									<p className="text-xs text-muted-foreground">Etiquetas</p>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-indigo-500">{formatNumber(totalAllEntities)}</div>
									<p className="text-xs text-muted-foreground">Total</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
});

export default Dashboard;
