import { motion } from 'framer-motion';
import { Clock, File, FileText, Folder, HardDrive, Image, Music, Video } from 'lucide-react';
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
	].filter((item) => item.value > 0);

	return (
		<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
			{/* Título compacto */}
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
					<HardDrive className="h-4 w-4" />
					Estadísticas Generales
				</h3>
				<div className="flex items-center gap-1 text-xs text-muted-foreground">
					<Clock className="h-3 w-3" />
					<span>{stats.lastScanned ? new Date(stats.lastScanned).toLocaleString() : 'Nunca'}</span>
				</div>
			</div>

			{/* Contenedor principal con estadísticas y gráfico */}
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
				{/* Estadísticas organizadas en 3 filas */}
				<div className="lg:col-span-3">
					<Card className="bg-muted/30 rounded-sm border-none">
						<CardContent className="p-4">
							<div className="space-y-3">
								{/* Primera fila: Carpetas y Archivos totales */}
								<div className="grid grid-cols-2 gap-4">
									<div className="flex items-center gap-2 p-2 bg-background/50 rounded">
										<Folder className="h-5 w-5 text-blue-600" />
										<div>
											<div className="text-xs text-muted-foreground">Carpetas</div>
											<div className="font-semibold text-lg">{stats.totalFolders}</div>
										</div>
									</div>
									<div className="flex items-center gap-2 p-2 bg-background/50 rounded">
										<File className="h-5 w-5 text-gray-600" />
										<div>
											<div className="text-xs text-muted-foreground">Archivos Totales</div>
											<div className="font-semibold text-lg">{stats.totalFiles}</div>
										</div>
									</div>
								</div>

								{/* Segunda fila: Tipos de archivos multimedia */}
								<div className="grid grid-cols-3 gap-3">
									<div className="flex items-center gap-2 p-2 bg-background/50 rounded">
										<Image className="h-4 w-4 text-green-600" />
										<div>
											<div className="text-xs text-muted-foreground">Imágenes</div>
											<div className="font-medium">{stats.totalImages}</div>
										</div>
									</div>
									<div className="flex items-center gap-2 p-2 bg-background/50 rounded">
										<Video className="h-4 w-4 text-purple-600" />
										<div>
											<div className="text-xs text-muted-foreground">Videos</div>
											<div className="font-medium">{stats.totalVideos}</div>
										</div>
									</div>
									<div className="flex items-center gap-2 p-2 bg-background/50 rounded">
										<Music className="h-4 w-4 text-orange-600" />
										<div>
											<div className="text-xs text-muted-foreground">Audio</div>
											<div className="font-medium">{stats.totalAudio}</div>
										</div>
									</div>
								</div>

								{/* Tercera fila: Documentos, Otros y Espacio */}
								<div className="grid grid-cols-3 gap-3">
									<div className="flex items-center gap-2 p-2 bg-background/50 rounded">
										<FileText className="h-4 w-4 text-red-600" />
										<div>
											<div className="text-xs text-muted-foreground">Documentos</div>
											<div className="font-medium">{stats.totalDocuments}</div>
										</div>
									</div>
									<div className="flex items-center gap-2 p-2 bg-background/50 rounded">
										<File className="h-4 w-4 text-yellow-600" />
										<div>
											<div className="text-xs text-muted-foreground">Otros</div>
											<div className="font-medium">{stats.totalOthers}</div>
										</div>
									</div>
									<div className="flex items-center gap-2 p-2 bg-background/50 rounded">
										<HardDrive className="h-4 w-4 text-indigo-600" />
										<div>
											<div className="text-xs text-muted-foreground">Espacio</div>
											<div className="font-medium text-sm">{stats.formattedSize}</div>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Gráfico de pie */}
				<div className="lg:col-span-1">
					<Card className="bg-muted/30 rounded-sm border-none h-full">
						<CardContent className="p-3">
							<div className="text-xs font-medium text-muted-foreground mb-2 text-center">Distribución</div>
							{pieData.length > 0 ? (
								<div className="h-32">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie data={pieData} cx="50%" cy="50%" outerRadius={50} dataKey="value">
												{pieData.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={entry.color} />
												))}
											</Pie>
											<Tooltip
												formatter={(value: number, name: string) => [value, name]}
												labelStyle={{ fontSize: '12px' }}
												contentStyle={{ fontSize: '12px', padding: '4px 8px' }}
											/>
										</PieChart>
									</ResponsiveContainer>
								</div>
							) : (
								<div className="h-32 flex items-center justify-center text-xs text-muted-foreground">Sin datos</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</motion.div>
	);
}
