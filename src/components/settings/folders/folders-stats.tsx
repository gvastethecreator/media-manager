import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { 
	Folder, 
	Image, 
	Video, 
	Music, 
	FileText, 
	File, 
	HardDrive,
	Clock
} from 'lucide-react';
import type { FolderStats } from '@/types/folders';

interface FoldersStatsProps {
	stats: FolderStats;
}

interface StatCardProps {
	title: string;
	value: number | string;
	icon: React.ReactNode;
	color: string;
	delay?: number;
}

function StatCard({ title, value, icon, color, delay = 0 }: StatCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay, duration: 0.3 }}
		>
			<Card className="h-full">
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">{title}</p>
							<p className="text-2xl font-bold">{value}</p>
						</div>
						<div className={`p-2 rounded-lg ${color}`}>
							{icon}
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}

export function FoldersStats({ stats }: FoldersStatsProps) {
	return (
		<div className="space-y-6">
			{/* Título de la sección */}
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				className="space-y-2"
			>
				<h3 className="text-lg font-semibold flex items-center gap-2">
					<HardDrive className="h-5 w-5" />
					Estadísticas Generales
				</h3>
				<p className="text-sm text-muted-foreground">
					Resumen completo de tu biblioteca de medios
				</p>
			</motion.div>

			<Separator />

			{/* Grid principal de estadísticas */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard
					title="Total Carpetas"
					value={stats.totalFolders}
					icon={<Folder className="h-5 w-5 text-blue-600" />}
					color="bg-blue-100 dark:bg-blue-900/20"
					delay={0}
				/>
				<StatCard
					title="Total Archivos"
					value={stats.totalFiles}
					icon={<File className="h-5 w-5 text-gray-600" />}
					color="bg-gray-100 dark:bg-gray-900/20"
					delay={0.1}
				/>
				<StatCard
					title="Imágenes"
					value={stats.totalImages}
					icon={<Image className="h-5 w-5 text-green-600" />}
					color="bg-green-100 dark:bg-green-900/20"
					delay={0.2}
				/>
				<StatCard
					title="Videos"
					value={stats.totalVideos}
					icon={<Video className="h-5 w-5 text-purple-600" />}
					color="bg-purple-100 dark:bg-purple-900/20"
					delay={0.3}
				/>
			</div>

			{/* Grid secundario para tipos adicionales */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<StatCard
					title="Audio"
					value={stats.totalAudio}
					icon={<Music className="h-5 w-5 text-orange-600" />}
					color="bg-orange-100 dark:bg-orange-900/20"
					delay={0.4}
				/>
				<StatCard
					title="Documentos"
					value={stats.totalDocuments}
					icon={<FileText className="h-5 w-5 text-red-600" />}
					color="bg-red-100 dark:bg-red-900/20"
					delay={0.5}
				/>
				<StatCard
					title="Otros"
					value={stats.totalOthers}
					icon={<File className="h-5 w-5 text-yellow-600" />}
					color="bg-yellow-100 dark:bg-yellow-900/20"
					delay={0.6}
				/>
			</div>

			{/* Información de almacenamiento y última actualización */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.7 }}
				className="grid grid-cols-1 md:grid-cols-2 gap-4"
			>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-sm font-medium text-muted-foreground">Espacio Utilizado</p>
								<p className="text-xl font-bold">{stats.formattedSize}</p>
								<p className="text-xs text-muted-foreground">{stats.totalSize.toLocaleString()} bytes</p>
							</div>
							<div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
								<HardDrive className="h-5 w-5 text-indigo-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-sm font-medium text-muted-foreground">Última Actualización</p>
								<p className="text-sm font-medium">
									{stats.lastScanned ? new Date(stats.lastScanned).toLocaleString() : 'Nunca'}
								</p>
							</div>
							<div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/20">
								<Clock className="h-5 w-5 text-teal-600" />
							</div>
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}
