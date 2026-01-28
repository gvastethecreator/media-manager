import { Calendar, ChevronRight, Folder, HardDrive, Hash, Image as ImageIcon } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
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
		<Card className="animate-fade-up rounded-dt-md border-border/50 bg-card/80 shadow-dt-1 transition-shadow duration-dt-normal hover:shadow-dt-2">
			<CardHeader className="p-3 pb-2">
				<CardTitle className="flex items-center gap-2 text-sm">
					<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-dt-sm bg-primary/10 text-primary transition-transform duration-dt-normal group-hover:scale-110">
						{icon}
					</span>
					<span className="heading-sm">{title}</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-3 pt-0">
				{isLoading ? (
					<div className="stack-md">
						<div className="grid grid-cols-2 gap-2">
							{[1, 2, 3, 4].map((i) => (
								<Skeleton className="h-16 rounded-dt-sm" key={i} />
							))}
						</div>
					</div>
				) : (
					<div className="space-y-4">
						{/* Estadísticas básicas */}
						<div className="grid grid-cols-2 gap-2">
							<div
								className="flex flex-col items-center justify-center rounded-dt-sm bg-muted/50 p-3 transition-colors duration-dt-fast hover:bg-muted/70"
								style={{ animationDelay: '0ms' }}
							>
								<span className="numeric-lg animate-count-up">{stats.total}</span>
								<span className="caption">Total</span>
							</div>
							<div
								className="flex flex-col items-center justify-center rounded-dt-sm bg-muted/50 p-3 transition-colors duration-dt-fast hover:bg-muted/70"
								style={{ animationDelay: '50ms' }}
							>
								<span className="numeric-lg animate-count-up" style={{ animationDelay: '50ms' }}>
									{stats.active}
								</span>
								<span className="caption">Activos</span>
							</div>
							<div
								className="flex flex-col items-center justify-center rounded-dt-sm bg-muted/50 p-3 transition-colors duration-dt-fast hover:bg-muted/70"
								style={{ animationDelay: '100ms' }}
							>
								<span className="numeric-lg animate-count-up" style={{ animationDelay: '100ms' }}>
									{stats.isFavorite}
								</span>
								<span className="caption">Favoritos</span>
							</div>
							<div
								className="flex flex-col items-center justify-center rounded-dt-sm bg-muted/50 p-3 transition-colors duration-dt-fast hover:bg-muted/70"
								style={{ animationDelay: '150ms' }}
							>
								<span className="numeric-lg animate-count-up" style={{ animationDelay: '150ms' }}>
									{stats.archived}
								</span>
								<span className="caption">Archivados</span>
							</div>
						</div>

						{/* Estadísticas extendidas */}
						{(stats.totalItems !== undefined ||
							stats.totalImages !== undefined ||
							stats.totalSize !== undefined ||
							stats.lastUpdated !== undefined) && (
								<div className="grid grid-cols-4 gap-2">
									<TooltipProvider>
										{stats.totalItems !== undefined && (
											<Tooltip>
												<TooltipTrigger asChild>
													<div className="flex flex-col items-center justify-center rounded-dt-sm bg-background/50 p-2 transition-colors duration-dt-fast hover:bg-background/80">
														<Hash className="mb-1 h-4 w-4 text-primary" />
														<p className="numeric-md">{stats.totalItems}</p>
														<p className="caption">Total</p>
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
													<div className="flex flex-col items-center justify-center rounded-dt-sm bg-background/50 p-2 transition-colors duration-dt-fast hover:bg-background/80">
														<ImageIcon className="mb-1 h-4 w-4 text-primary" />
														<p className="numeric-md">{stats.totalImages}</p>
														<p className="caption">Imágenes</p>
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
													<div className="flex flex-col items-center justify-center rounded-dt-sm bg-background/50 p-2 transition-colors duration-dt-fast hover:bg-background/80">
														<HardDrive className="mb-1 h-4 w-4 text-primary" />
														<p className="numeric-md">{formatSize(stats.totalSize)}</p>
														<p className="caption">Tamaño</p>
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
													<div className="flex flex-col items-center justify-center rounded-dt-sm bg-background/50 p-2 transition-colors duration-dt-fast hover:bg-background/80">
														<Calendar className="mb-1 h-4 w-4 text-primary" />
														<p className="body-sm font-medium">{formatDate(stats.lastUpdated)}</p>
														<p className="caption">Actualizado</p>
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
							<div className="stack-sm">
								<div className="flex items-center justify-between">
									<h4 className="heading-sm">Elementos Recientes</h4>
									<Badge variant="outline">{stats.recentItems.length}</Badge>
								</div>
								<ScrollArea className="h-30 rounded-dt-sm border bg-background/50 p-2">
									<div className="stack-xs">
										{stats.recentItems.map((item) => (
											<div
												className="group flex items-center justify-between rounded-dt-xs p-2 transition-colors duration-dt-fast hover:bg-muted"
												key={item.id}
											>
												<div className="flex items-center gap-2">
													<div
														className={cn(
															'flex h-8 w-8 items-center justify-center rounded-dt-sm border',
															!item.color && 'bg-muted'
														)}
														style={
															item.color
																? {
																	backgroundColor: `color-mix(in oklab, ${item.color}, transparent 90%)`,
																	color: item.color,
																	borderColor: `color-mix(in oklab, ${item.color}, transparent 80%)`,
																}
																: undefined
														}
													>
														{item.emoji || <Hash className="h-4 w-4" />}
													</div>
													<div>
														<p className="body-sm font-medium">{item.name}</p>
														{item.count !== undefined && <p className="caption">{item.count} imágenes</p>}
													</div>
												</div>
												<ChevronRight className="h-4 w-4 opacity-0 transition-opacity duration-dt-fast group-hover:opacity-100" />
											</div>
										))}
									</div>
								</ScrollArea>
							</div>
						)}

						{/* Distribución */}
						{stats.distribution && stats.distribution.length > 0 && (
							<div className="stack-sm">
								<div className="flex items-center justify-between">
									<h4 className="heading-sm">Distribución</h4>
									<Badge variant="outline">{stats.distribution.length}</Badge>
								</div>
								<div className="stack-xs">
									{stats.distribution.map((item) => (
										<div className="stack-xs" key={item.name}>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Folder className="h-4 w-4 text-muted-foreground" />
													<span className="body-sm font-medium">{item.name}</span>
												</div>
												<span className="caption tabular-nums">{item.count}</span>
											</div>
											<Progress className="h-1.5" value={(item.count / maxCount) * 100} />
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
