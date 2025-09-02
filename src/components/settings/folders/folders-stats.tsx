import { Clock, Database, File, FileText, Folder, HardDrive, Image, ImageIcon, Music, Video } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import type { FolderStats } from '@/types/folders';

interface FoldersStatsProps {
	stats: FolderStats;
}

export function FoldersStats({ stats }: FoldersStatsProps) {
	// Datos para el gráfico de pie
	const pieData = [
		{ name: 'Imágenes', value: stats.totalImages, color: '#10b981' },
		{ name: 'Videos', value: stats.totalVideos, color: '#8b5cf6' },
		{ name: 'Audio', value: stats.totalAudio, color: '#f59e0b' },
		{ name: 'Documentos', value: stats.totalDocuments, color: '#ef4444' },
		{ name: 'Otros', value: stats.totalOthers, color: '#eab308' },
		...(stats.databaseSize
			? [{ name: 'Base de Datos', value: Math.round(stats.databaseSize / (1024 * 1024)), color: '#3b82f6' }]
			: []),
		...(stats.thumbnailsCacheSize
			? [{ name: 'Caché Thumbnails', value: Math.round(stats.thumbnailsCacheSize / (1024 * 1024)), color: '#f97316' }]
			: []),
	].filter((item) => item.value > 0);

	return (
		<div className="space-y-3 p-4">
			{/* Título compacto */}
			<div className="flex items-center justify-between" data-testid="folders-stats">
				<h3 className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
					<HardDrive className="h-4 w-4" />
					Estadísticas Generales
				</h3>
				<div className="flex items-center gap-1 text-muted-foreground text-xs" data-testid="stats-last-scanned">
					<Clock className="h-3 w-3" />
					<span>{stats.lastScanned ? new Date(stats.lastScanned).toLocaleString() : 'Nunca'}</span>
				</div>
			</div>

			{/* Contenedor principal con estadísticas y gráfico */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
				{/* Estadísticas organizadas en 3 filas */}
				<div className="lg:col-span-3">
					<Card className="rounded-sm border-none bg-muted/30">
						<CardContent className="grid grid-cols-2 p-4">
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
								<div className="grid grid-cols-3 gap-3">
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
												formatter={(value: number, name: string) => [value, name]}
												labelStyle={{ fontSize: '12px' }}
											/>
										</PieChart>
									</ResponsiveContainer>
								</div>
							) : (
								<div className="flex h-32 items-center justify-center text-muted-foreground text-xs">Sin datos</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
