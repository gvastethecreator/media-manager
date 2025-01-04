"use client";

import { useEffect, useMemo, memo } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { ViewProps } from "../types";
import { useStatsStore } from "@/store/stats";
import * as Icons from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";

// Animaciones
const containerVariants = {
	initial: { opacity: 0 },
	animate: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const itemVariants = {
	initial: { opacity: 0, y: 20 },
	animate: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.3,
		},
	},
};

// Función auxiliar para obtener el icono dinámicamente
const DynamicIcon = memo(
	({ name, className }: { name: string; className?: string }) => {
		if (!name) return null;

		const iconName = name.charAt(0).toUpperCase() + name.slice(1);
		const Icon = (Icons as any)[iconName];

		return Icon ? <Icon className={className} /> : null;
	}
);

// Componentes memorizados para evitar re-renders innecesarios
const StatCard = memo(
	({
		title,
		value,
		description,
		icon,
		color,
		isLoading,
	}: {
		title: string;
		value: number | string;
		description?: string;
		icon: string;
		color: string;
		isLoading: boolean;
	}) => (
		<motion.div variants={itemVariants}>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">{title}</CardTitle>
					<DynamicIcon name={icon} className={cn("h-4 w-4", color)} />
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<Skeleton className="h-8 w-20" />
					) : (
						<>
							<div className="text-2xl font-bold">{value}</div>
							{description && (
								<p className="text-xs text-muted-foreground">{description}</p>
							)}
						</>
					)}
				</CardContent>
			</Card>
		</motion.div>
	)
);

const FolderUsage = memo(
	({
		folder,
		isLoading,
	}: {
		folder?: { name: string; size: number; percentage: number };
		isLoading: boolean;
	}) => (
		<div className="space-y-1">
			{isLoading ? (
				<>
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-2 w-full" />
				</>
			) : (
				folder && (
					<>
						<div className="flex justify-between text-sm items-center">
							<div className="flex items-center space-x-2">
								<Icons.Folder className="h-3 w-3 text-muted-foreground" />
								<span className="truncate max-w-[150px]">{folder.name}</span>
							</div>
							<div className="flex items-center space-x-2">
								<span className="text-xs text-muted-foreground">
									{formatBytes(folder.size)}
								</span>
								<span className="text-xs font-medium">
									{folder.percentage}%
								</span>
							</div>
						</div>
						<Progress value={folder.percentage} className="h-1.5" />
					</>
				)
			)}
		</div>
	)
);

const TagUsage = memo(
	({
		tag,
		isLoading,
	}: {
		tag?: { name: string; color: string; count: number };
		isLoading: boolean;
	}) => (
		<div className="flex items-center justify-between">
			{isLoading ? (
				<>
					<Skeleton className="h-4 w-[100px]" />
					<Skeleton className="h-4 w-[50px]" />
				</>
			) : (
				tag && (
					<>
						<div className="flex items-center space-x-2">
							<div
								className="w-3 h-3 rounded-full"
								style={{ backgroundColor: tag.color }}
							/>
							<span className="text-sm">{tag.name}</span>
						</div>
						<span className="text-sm text-muted-foreground">
							{tag.count} imágenes
						</span>
					</>
				)
			)}
		</div>
	)
);

const Activity = memo(
	({
		activity,
		isLoading,
	}: {
		activity?: { description: string; timestamp: string; iconName: string };
		isLoading: boolean;
	}) => (
		<div className="flex items-center justify-between">
			{isLoading ? (
				<div className="space-y-1">
					<Skeleton className="h-4 w-[200px]" />
					<Skeleton className="h-3 w-[150px]" />
				</div>
			) : (
				activity && (
					<>
						<div className="space-y-1">
							<p className="text-sm font-medium leading-none">
								{activity.description}
							</p>
							<p className="text-sm text-muted-foreground">
								{activity.timestamp}
							</p>
						</div>
						<DynamicIcon
							name={activity.iconName}
							className="h-4 w-4 text-muted-foreground"
						/>
					</>
				)
			)}
		</div>
	)
);

export function DashboardView({ isResizing }: ViewProps) {
	const { stats, isLoading, error, initialize } = useStatsStore();

	useEffect(() => {
		initialize();
	}, [initialize]);

	// Memoizar las estadísticas principales
	const mainStats = useMemo(
		() => [
			{
				title: "Total de Imágenes",
				value: stats?.totalImages || 0,
				description: "Imágenes indexadas",
				icon: "Image",
				color: "text-blue-500",
			},
			{
				title: "Carpetas",
				value: stats?.totalFolders || 0,
				description: "Carpetas monitoreadas",
				icon: "FolderOpen",
				color: "text-orange-500",
			},
			{
				title: "Etiquetas",
				value: stats?.totalTags || 0,
				description: "Etiquetas creadas",
				icon: "Tag",
				color: "text-green-500",
			},
			{
				title: "Colecciones",
				value: stats?.totalCollections || 0,
				description: "Colecciones organizadas",
				icon: "Bookmark",
				color: "text-purple-500",
			},
		],
		[
			stats?.totalImages,
			stats?.totalFolders,
			stats?.totalTags,
			stats?.totalCollections,
		]
	);

	// Memoizar las estadísticas adicionales
	const additionalStats = useMemo(
		() => [
			{
				title: "Favoritos",
				value: stats?.totalFavorites || 0,
				icon: "Star",
				color: "text-yellow-500",
			},
			{
				title: "Vistas",
				value: stats?.totalViews || 0,
				icon: "Eye",
				color: "text-cyan-500",
			},
			{
				title: "Descargas",
				value: stats?.totalDownloads || 0,
				icon: "Download",
				color: "text-indigo-500",
			},
			{
				title: "Espacio Usado",
				value: formatBytes(stats?.totalSize || 0),
				icon: "HardDrive",
				color: "text-rose-500",
			},
		],
		[
			stats?.totalFavorites,
			stats?.totalViews,
			stats?.totalDownloads,
			stats?.totalSize,
		]
	);

	if (error) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="flex items-center justify-center h-full"
			>
				<Card className="w-[400px]">
					<CardHeader>
						<CardTitle className="text-red-500">Error</CardTitle>
						<CardDescription>
							No se pudieron cargar las estadísticas
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">{error}</p>
					</CardContent>
				</Card>
			</motion.div>
		);
	}

	return (
		<ScrollArea className="h-full overflow-auto">
			<motion.div
				className="p-6 space-y-6"
				variants={containerVariants}
				initial="initial"
				animate="animate"
			>
				<motion.div className="grid gap-4" variants={containerVariants}>
					{/* Stats Grid */}
					<div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
						{[...mainStats, ...additionalStats].map((stat, i) => (
							<StatCard key={i} {...stat} isLoading={isLoading} />
						))}
					</div>

					{/* Uso de Espacio y Tags */}
					<div className="grid gap-3 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Uso de Espacio por Carpeta</CardTitle>
								<CardDescription>
									Distribución del espacio utilizado
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{(isLoading
									? Array(3).fill(null)
									: stats?.folderStats || []
								).map((folder, i) => (
									<FolderUsage key={i} folder={folder} isLoading={isLoading} />
								))}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Etiquetas Más Usadas</CardTitle>
								<CardDescription>
									Top etiquetas por número de imágenes
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{(isLoading ? Array(5).fill(null) : stats?.topTags || []).map(
									(tag, i) => (
										<TagUsage key={i} tag={tag} isLoading={isLoading} />
									)
								)}
							</CardContent>
						</Card>
					</div>
				</motion.div>

				{/* Actividad Reciente */}
				<motion.div variants={itemVariants}>
					<Card>
						<CardHeader>
							<CardTitle>Actividad Reciente</CardTitle>
							<CardDescription>
								Últimas acciones realizadas en el sistema
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{(isLoading
									? Array(5).fill(null)
									: stats?.recentActivity || []
								).map((activity, i) => (
									<Activity key={i} activity={activity} isLoading={isLoading} />
								))}
							</div>
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</ScrollArea>
	);
}
