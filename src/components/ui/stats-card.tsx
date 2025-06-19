import { Calendar, ChevronRight, Folder, HardDrive, Hash, Image as ImageIcon, Loader2 } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
	title: string;
	icon: React.ReactNode;
	isLoading?: boolean;
	stats: {
		// Campos básicos
		total: number;
		active: number;
		isFavorite: number;
		archived: number;
		// Campos extendidos
		totalItems?: number;
		totalImages?: number;
		totalSize?: number;
		lastUpdated?: Date;
		recentItems?: Array<{
			id: string;
			name: string;
			emoji?: string;
			color?: string;
			count?: number;
		}>;
		distribution?: Array<{
			name: string;
			count: number;
		}>;
	};
}

export function StatsCard({ title, icon, isLoading, stats }: StatsCardProps) {
	const formatSize = (bytes: number) => {
		if (bytes === 0) {
			return '0 B';
		}
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const formatDate = (date?: Date) => {
		if (!date) {
			return 'N/A';
		}
		return new Intl.DateTimeFormat('es', {
			dateStyle: 'medium',
			timeStyle: 'short',
		}).format(new Date(date));
	};

	// Calcular el porcentaje máximo para la distribución
	const maxCount = React.useMemo(() => {
		if (!stats.distribution?.length) {
			return 0;
		}
		return Math.max(...stats.distribution.map((item) => item.count));
	}, [stats.distribution]);

	return (
		<Card className="rounded-sm bg-muted/30">
			<CardHeader className="p-3">
				<CardTitle className="flex items-center gap-2 text-sm">
					{icon}
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-3 pt-0">
				{isLoading ? (
					<div className="flex items-center justify-center p-4">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : (
					<div className="space-y-6">
						{/* Estadísticas básicas */}
						<div className="grid grid-cols-2 gap-4">
							<div className="flex flex-col items-center justify-center p-4 rounded-sm bg-muted/50">
								<span className="text-2xl font-bold">{stats.total}</span>
								<span className="text-xs text-muted-foreground">Total</span>
							</div>
							<div className="flex flex-col items-center justify-center p-4 rounded-sm bg-muted/50">
								<span className="text-2xl font-bold">{stats.active}</span>
								<span className="text-xs text-muted-foreground">Activos</span>
							</div>
							<div className="flex flex-col items-center justify-center p-4 rounded-sm bg-muted/50">
								<span className="text-2xl font-bold">{stats.isFavorite}</span>
								<span className="text-xs text-muted-foreground">Favoritos</span>
							</div>
							<div className="flex flex-col items-center justify-center p-4 rounded-sm bg-muted/50">
								<span className="text-2xl font-bold">{stats.archived}</span>
								<span className="text-xs text-muted-foreground">Archivados</span>
							</div>
						</div>

						{/* Estadísticas extendidas */}
						{(stats.totalItems !== undefined ||
							stats.totalImages !== undefined ||
							stats.totalSize !== undefined ||
							stats.lastUpdated !== undefined) && (
							<div className="grid grid-cols-4 gap-4">
								<TooltipProvider>
									{stats.totalItems !== undefined && (
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="flex flex-col items-center justify-center rounded-lg bg-background/50 p-3 transition-colors hover:bg-background/80">
													<Hash className="mb-2 h-4 w-4 text-primary" />
													<p className="text-2xl font-bold">{stats.totalItems}</p>
													<p className="text-xs text-muted-foreground">Total</p>
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<p>Total de elementos</p>
											</TooltipContent>
										</Tooltip>
									)}

									{stats.totalImages !== undefined && (
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="flex flex-col items-center justify-center rounded-lg bg-background/50 p-3 transition-colors hover:bg-background/80">
													<ImageIcon className="mb-2 h-4 w-4 text-primary" />
													<p className="text-2xl font-bold">{stats.totalImages}</p>
													<p className="text-xs text-muted-foreground">Imágenes</p>
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<p>Total de imágenes asociadas</p>
											</TooltipContent>
										</Tooltip>
									)}

									{stats.totalSize !== undefined && (
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="flex flex-col items-center justify-center rounded-lg bg-background/50 p-3 transition-colors hover:bg-background/80">
													<HardDrive className="mb-2 h-4 w-4 text-primary" />
													<p className="text-2xl font-bold">{formatSize(stats.totalSize)}</p>
													<p className="text-xs text-muted-foreground">Tamaño</p>
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<p>Tamaño total de archivos</p>
											</TooltipContent>
										</Tooltip>
									)}

									{stats.lastUpdated && (
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="flex flex-col items-center justify-center rounded-lg bg-background/50 p-3 transition-colors hover:bg-background/80">
													<Calendar className="mb-2 h-4 w-4 text-primary" />
													<p className="text-sm font-medium">{formatDate(stats.lastUpdated)}</p>
													<p className="text-xs text-muted-foreground">Actualizado</p>
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<p>Última actualización</p>
											</TooltipContent>
										</Tooltip>
									)}
								</TooltipProvider>
							</div>
						)}

						{/* Items recientes */}
						{stats.recentItems && stats.recentItems.length > 0 && (
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<h4 className="text-sm font-medium">Elementos Recientes</h4>
									<Badge variant="outline" className="text-xs">
										{stats.recentItems.length}
									</Badge>
								</div>
								<ScrollArea className="h-[120px] rounded-md border bg-background/50 p-2">
									<div className="space-y-2">
										{stats.recentItems.map((item) => (
											<div
												key={item.id}
												className="group flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
											>
												<div className="flex items-center gap-2">
													<div
														className={cn(
															'flex h-8 w-8 items-center justify-center rounded-md border',
															item.color ? `bg-[${item.color}]/10 text-[${item.color}]` : 'bg-muted'
														)}
													>
														{item.emoji || <Hash className="h-4 w-4" />}
													</div>
													<div>
														<p className="text-sm font-medium">{item.name}</p>
														{item.count !== undefined && (
															<p className="text-xs text-muted-foreground">{item.count} imágenes</p>
														)}
													</div>
												</div>
												<ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
											</div>
										))}
									</div>
								</ScrollArea>
							</div>
						)}

						{/* Distribución */}
						{stats.distribution && stats.distribution.length > 0 && (
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<h4 className="text-sm font-medium">Distribución</h4>
									<Badge variant="outline" className="text-xs">
										{stats.distribution.length}
									</Badge>
								</div>
								<div className="space-y-2">
									{stats.distribution.map((item) => (
										<div key={item.name} className="space-y-1">
											<div className="flex items-center justify-between text-sm">
												<div className="flex items-center gap-2">
													<Folder className="h-4 w-4 text-muted-foreground" />
													<span className="font-medium">{item.name}</span>
												</div>
												<span className="text-xs text-muted-foreground">{item.count}</span>
											</div>
											<Progress value={(item.count / maxCount) * 100} className="h-2" />
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
