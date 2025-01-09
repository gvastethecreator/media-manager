"use client";

import { useEffect, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStatsStore } from "@/store/stats";
import * as Icons from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import Meteors from "@/components/ui/meteors";
import { useThumbnailEvents } from "@/hooks/use-thumbnail-events";
import { statsEventEmitter } from "@/services/stats.service";

const itemVariants = {
	initial: { opacity: 0, y: 10 },
	animate: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.2,
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
			<div className="flex items-center py-1.5 px-2 rounded-sm bg-muted/50 transition-colors">
				<DynamicIcon name={icon} className={cn("h-4 w-4 mr-2", color)} />
				<div className="flex-1 min-w-0">
					<div className="flex items-baseline justify-between gap-2">
						<p className="text-xs text-muted-foreground">{title}</p>
						{isLoading ? (
							<Skeleton className="h-4 w-12" />
						) : (
							<span className="text-sm font-medium truncate">{value}</span>
						)}
					</div>
					{description && (
						<p className="text-[10px] text-muted-foreground/70">
							{description}
						</p>
					)}
				</div>
			</div>
		</motion.div>
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
		<div className="flex flex-wrap justify-start py-0.5 w-full">
			{isLoading ? (
				<></>
			) : (
				tag && (
					<>
						<span
							key={tag.name}
							style={{ backgroundColor: tag.color }}
							className={cn(
								"px-3 text-[10px] transition-colors rounded-xl text-black/90 font-bold",
								"bg-gradient-to-r from-black/30 to-black/35"
							)}
						>
							<span className="flex-1 text-left  text-[10px] truncate shadow-sm">
								{tag.name}
							</span>
							<span className="text-[10px] ml-2 h-4 text-white border-none">
								{tag.count}
							</span>
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
		<div className="flex items-start justify-between py-0.5">
			{isLoading ? (
				<div className="w-full"></div>
			) : (
				activity && (
					<>
						<div className="flex-1 min-w-0">
							<p className="text-xs leading-none truncate">
								{activity.description}
							</p>
							<p className="text-[10px] text-muted-foreground mt-0.5">
								{activity.timestamp}
							</p>
						</div>
						<DynamicIcon
							name={activity.iconName}
							className="h-3 w-3 text-muted-foreground ml-2 flex-shrink-0 mt-0.5"
						/>
					</>
				)
			)}
		</div>
	)
);

export function StatsPanel() {
	const { stats, isLoading, error, initialize } = useStatsStore();

	// Inicializar eventos SSE
	useThumbnailEvents();

	useEffect(() => {
		// Inicialización inicial
		initialize();

		// Suscribirse a eventos de actualización
		const handleStatsUpdate = () => {
			console.log("🔄 Actualizando estadísticas por cambios en el sistema...");
			initialize();
		};

		statsEventEmitter.on("stats_update_needed", handleStatsUpdate);

		return () => {
			statsEventEmitter.off("stats_update_needed", handleStatsUpdate);
		};
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
			<div className="flex items-center justify-center p-4">
				<Card className="w-full">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-red-500">Error</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-muted-foreground">{error}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<ScrollArea className="h-full w-full p-0">
			<div className="p-0 w-full h-full">
				<Meteors />
				<Card className="border-none rounded-none">
					<CardHeader className="p-0 py-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
							<Icons.BarChart className="h-4 w-4 text-primary" />
							Estadísticas generales
						</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-2 p-0 gap-2">
						{mainStats.map((stat, i) => (
							<StatCard key={i} {...stat} isLoading={isLoading} />
						))}
						{additionalStats.map((stat, i) => (
							<StatCard key={i} {...stat} isLoading={isLoading} />
						))}
					</CardContent>

					<CardHeader className="px-0 py-2 mt-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
							<Icons.Tag className="h-4 w-4 text-primary" />
							Etiquetas Más Usadas
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0 space-y-1 w-full gap-2">
						{(isLoading ? Array(5).fill(null) : stats?.topTags || []).map(
							(tag, i) => (
								<TagUsage key={i} tag={tag} isLoading={isLoading} />
							)
						)}
					</CardContent>

					<CardHeader className="p-0 pb-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
							<Icons.Clock className="h-4 w-4 text-primary" />
							Actividad Reciente
						</CardTitle>
					</CardHeader>
					<CardContent className="p-2 space-y-1">
						{(isLoading
							? Array(5).fill(null)
							: stats?.recentActivity || []
						).map((activity, i) => (
							<Activity key={i} activity={activity} isLoading={isLoading} />
						))}
					</CardContent>
				</Card>
			</div>
		</ScrollArea>
	);
}
