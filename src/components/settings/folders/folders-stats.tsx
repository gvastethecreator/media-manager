import { Database, File, FileText, Folder, HardDrive, Image, ImageIcon, Music, Video } from 'lucide-react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FILE_TYPE_COLORS } from '@/lib/styles/chart-colors';
import type { FolderStats } from '@/types/folders';

interface FoldersStatsProps {
	stats: FolderStats;
}

export function FoldersStats({ stats }: FoldersStatsProps) {
	// Datos para el gráfico de pie
	const pieData = [
		{ name: 'Imágenes', value: stats.totalImages, color: FILE_TYPE_COLORS.images },
		{ name: 'Videos', value: stats.totalVideos, color: FILE_TYPE_COLORS.videos },
		{ name: 'Audio', value: stats.totalAudio, color: FILE_TYPE_COLORS.audio },
		{ name: 'Documentos', value: stats.totalDocuments, color: FILE_TYPE_COLORS.documents },
		{ name: 'Otros', value: stats.totalOthers, color: FILE_TYPE_COLORS.others },
		...(stats.databaseSize
			? [{ name: 'Base de Datos', value: Math.round(stats.databaseSize / (1024 * 1024)), color: FILE_TYPE_COLORS.database }]
			: []),
		...(stats.thumbnailsCacheSize
			? [{ name: 'Caché Thumbnails', value: Math.round(stats.thumbnailsCacheSize / (1024 * 1024)), color: FILE_TYPE_COLORS.cache }]
			: []),
	].filter((item) => item.value > 0);

	// Datos para gráfico de barras de distribución de archivos
	const barData = [
		{ name: 'Imágenes', value: stats.totalImages, color: FILE_TYPE_COLORS.images },
		{ name: 'Videos', value: stats.totalVideos, color: FILE_TYPE_COLORS.videos },
		{ name: 'Audio', value: stats.totalAudio, color: FILE_TYPE_COLORS.audio },
		{ name: 'Documentos', value: stats.totalDocuments, color: FILE_TYPE_COLORS.documents },
		{ name: 'Otros', value: stats.totalOthers, color: FILE_TYPE_COLORS.others },
	].filter((item) => item.value > 0);

	// Datos simulados para tendencias (en un caso real vendrían del backend)
	const trendData = [
		{ name: 'Ene', archivos: stats.totalFiles * 0.6 },
		{ name: 'Feb', archivos: stats.totalFiles * 0.7 },
		{ name: 'Mar', archivos: stats.totalFiles * 0.8 },
		{ name: 'Abr', archivos: stats.totalFiles * 0.85 },
		{ name: 'May', archivos: stats.totalFiles * 0.9 },
		{ name: 'Jun', archivos: stats.totalFiles },
	];

	return (
		<div className="space-y-3" data-testid="folders-stats-inner">
			{/* Contenedor principal con estadísticas y gráfico */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				{/* Estadísticas organizadas en 3 filas */}
				<div className="lg:col-span-3">
					<div className="rounded-sm border-none bg-muted/30">
						<CardContent className="grid grid-cols-1 p-4">
							<div className="space-y-3">
								{/* Primera fila: Carpetas y Archivos totales */}
								<div className="grid grid-cols-2 gap-4">
									<div className="flex items-center gap-2 rounded bg-background/50 p-2">
										<Folder className="h-5 w-5 text-blue-600" />
										<div>
											<div className="text-muted-foreground text-xs">Carpetas</div>
											<div className="font-semibold text-lg" data-testid="stats-total-folders">
												{stats.totalFolders}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2 rounded bg-background/50 p-2">
										<File className="h-5 w-5 text-gray-600" />
										<div>
											<div className="text-muted-foreground text-xs">Archivos Totales</div>
											<div className="font-semibold text-lg" data-testid="stats-total-files">
												{stats.totalFiles}
											</div>
										</div>
									</div>
								</div>

								{/* Segunda fila: Tipos de archivos multimedia */}
								<div className="grid grid-cols-2 gap-3">
									<div className="flex items-center gap-2 rounded bg-background/50 p-2">
										<Image className="h-4 w-4 text-green-600" />
										<div>
											<div className="text-muted-foreground text-xs">Imágenes</div>
											<div className="font-medium" data-testid="stats-total-images">
												{stats.totalImages}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2 rounded bg-background/50 p-2">
										<Video className="h-4 w-4 text-purple-600" />
										<div>
											<div className="text-muted-foreground text-xs">Videos</div>
											<div className="font-medium" data-testid="stats-total-videos">
												{stats.totalVideos}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2 rounded bg-background/50 p-2">
										<Music className="h-4 w-4 text-orange-600" />
										<div>
											<div className="text-muted-foreground text-xs">Audio</div>
											<div className="font-medium" data-testid="stats-total-audio">
												{stats.totalAudio}
											</div>
										</div>
									</div>
								</div>

								{/* Tercera fila: Documentos, Otros y Espacio */}
								<div className="grid grid-cols-3 gap-3">
									<div className="flex items-center gap-2 rounded bg-background/50 p-2">
										<FileText className="h-4 w-4 text-red-600" />
										<div>
											<div className="text-muted-foreground text-xs">Documentos</div>
											<div className="font-medium" data-testid="stats-total-documents">
												{stats.totalDocuments}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2 rounded bg-background/50 p-2">
										<File className="h-4 w-4 text-yellow-600" />
										<div>
											<div className="text-muted-foreground text-xs">Otros</div>
											<div className="font-medium" data-testid="stats-total-others">
												{stats.totalOthers}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2 rounded bg-background/50 p-2">
										<HardDrive className="h-4 w-4 text-indigo-600" />
										<div>
											<div className="text-muted-foreground text-xs">Espacio</div>
											<div className="font-medium text-sm" data-testid="stats-total-size">
												{stats.formattedSize}
											</div>
										</div>
									</div>
								</div>

								{/* Cuarta fila: Base de datos, Thumbnails y estadísticas adicionales */}
								{(stats.databaseSize || stats.thumbnailsCacheSize || stats.totalThumbnails) && (
									<div className="grid grid-cols-3 gap-3">
										{stats.databaseSize && (
											<div className="flex items-center gap-2 rounded bg-background/50 p-2">
												<Database className="h-4 w-4 text-blue-600" />
												<div>
													<div className="text-muted-foreground text-xs">Base de Datos</div>
													<div className="font-medium text-sm" data-testid="stats-database-size">
														{stats.formattedDatabaseSize || `${Math.round(stats.databaseSize / (1024 * 1024))} MB`}
													</div>
												</div>
											</div>
										)}
										{stats.thumbnailsCacheSize && (
											<div className="flex items-center gap-2 rounded bg-background/50 p-2">
												<ImageIcon className="h-4 w-4 text-orange-600" />
												<div>
													<div className="text-muted-foreground text-xs">Caché Thumbnails</div>
													<div className="font-medium text-sm" data-testid="stats-thumbnails-cache-size">
														{stats.formattedThumbnailsCacheSize ||
															`${Math.round(stats.thumbnailsCacheSize / (1024 * 1024))} MB`}
													</div>
												</div>
											</div>
										)}
										{stats.totalThumbnails && (
											<div className="flex items-center gap-2 rounded bg-background/50 p-2">
												<Image className="h-4 w-4 text-green-600" />
												<div>
													<div className="text-muted-foreground text-xs">Thumbnails</div>
													<div className="font-medium" data-testid="stats-total-thumbnails">
														{stats.totalThumbnails}
													</div>
												</div>
											</div>
										)}
									</div>
								)}
							</div>
							{pieData.length > 0 ? (
								<div>
									<ResponsiveContainer height="100%" width="100%">
										<PieChart>
											<Pie cx="50%" cy="50%" data={pieData} dataKey="value" outerRadius={50}>
												{pieData.map((entry) => (
													<Cell fill={entry.color} key={`cell-${entry.name}`} />
												))}
											</Pie>
											<Tooltip
												contentStyle={{ fontSize: '12px', padding: '4px 8px' }}
												formatter={(value: number | string | undefined, name: string | undefined) => [value ?? 0, name ?? '']}
												labelStyle={{ fontSize: '12px' }}
											/>
										</PieChart>
									</ResponsiveContainer>
								</div>
							) : (
								<div className="flex h-32 items-center justify-center text-muted-foreground text-xs">Sin datos</div>
							)}
						</CardContent>
					</div>
				</div>
			</div>

			{/* Nueva sección: Gráficos adicionales */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{/* Gráfico de barras para distribución de tipos de archivo */}
				{barData.length > 0 && (
					<Card className="border-border/40">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-sm">
								<Database className="h-4 w-4 text-primary" />
								Distribución por Tipo
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4">
							<div className="h-50">
								<ResponsiveContainer height="100%" width="100%">
									<BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
										<CartesianGrid stroke="hsl(var(--border) / 0.7)" strokeDasharray="3 3" />
										<XAxis angle={-45} dataKey="name" height={60} textAnchor="end" tick={{ fontSize: 11 }} />
										<YAxis tick={{ fontSize: 11 }} width={40} />
										<Tooltip
											contentStyle={{
												fontSize: '12px',
												padding: '8px 12px',
												backgroundColor: 'hsl(var(--popover) / 0.95)',
												border: '1px solid hsl(var(--border))',
												borderRadius: '6px',
											}}
											formatter={(value: number | string | undefined) => [Number(value ?? 0).toLocaleString(), 'Archivos']}
											labelFormatter={(name) => `Tipo: ${name}`}
										/>
										<Bar dataKey="value" radius={[2, 2, 0, 0]}>
											{barData.map((entry, index) => (
												<Cell fill={entry.color} key={`cell-${index}`} />
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Gráfico de líneas para tendencias de crecimiento */}
				{trendData.length > 0 && stats.totalFiles > 0 && (
					<Card className="border-border/40">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-sm">
								<HardDrive className="h-4 w-4 text-primary" />
								Tendencia de Archivos
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4">
							<div className="h-50">
								<ResponsiveContainer height="100%" width="100%">
									<LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
										<CartesianGrid stroke="hsl(var(--border) / 0.7)" strokeDasharray="3 3" />
										<XAxis dataKey="name" tick={{ fontSize: 11 }} />
										<YAxis tick={{ fontSize: 11 }} width={50} />
										<Tooltip
											contentStyle={{
												fontSize: '12px',
												padding: '8px 12px',
												backgroundColor: 'hsl(var(--popover) / 0.95)',
												border: '1px solid hsl(var(--border))',
												borderRadius: '6px',
											}}
											formatter={(value: number | string | undefined) => [Math.round(Number(value ?? 0)).toLocaleString(), 'Archivos']}
											labelFormatter={(name) => `Mes: ${name}`}
										/>
										<Line
											activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
											dataKey="archivos"
											dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
											stroke="hsl(var(--primary))"
											strokeWidth={2}
											type="monotone"
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
