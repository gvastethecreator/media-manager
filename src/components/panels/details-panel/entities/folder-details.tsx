/**
 * @file Componente compacto y unificado para detalles de carpetas
 * @description Elimina duplicaciones y muestra metadata completa de manera compacta
 */

import {
    Archive,
    ChevronRight,
    Grid,
    HardDrive,
    Home,
    Image,
    Info,
    Star,
    Tag,
    Target,
    TrendingUp,
} from 'lucide-react';
import { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import type { FolderWithStats } from '@/types/entities/folder/types';
import type { EntityDetailsProps } from '../entity-details-registry';

/**
 * Componente unificado y compacto para mostrar detalles de carpetas
 * Elimina duplicaciones y muestra toda la metadata disponible
 */
export const FolderDetails = memo<EntityDetailsProps<FolderWithStats>>(
	function FolderDetails({ entity, onAction }) {
		const stats = entity.stats;

		// Header compacto con información principal
		const headerInfo = useMemo(() => {
			return {
				name: entity.name,
				emoji: entity.emoji || '📁',
				path: entity.path,
				isFavorite: entity.isFavorite,
				qualityGrade: stats?.qualityGrade || 'D',
				organizationScore: stats?.organizationScore || 0,
			};
		}, [entity, stats]);

		// Métricas principales en formato compacto
		const mainMetrics = useMemo(() => {
			return [
				{
					icon: <Grid className="h-4 w-4 text-blue-500" />,
					label: 'Elementos',
					value: stats?.totalItems?.toString() || '0',
					sublabel: `${stats?.folderCount || 0} carpetas, ${(stats?.totalItems || 0) - (stats?.folderCount || 0)} archivos`,
				},
				{
					icon: <HardDrive className="h-4 w-4 text-green-500" />,
					label: 'Tamaño',
					value: formatBytes(entity.totalSize || 0),
					sublabel: stats?.averageFileSize ? `Promedio: ${formatBytes(stats.averageFileSize)}` : undefined,
				},
				{
					icon: <TrendingUp className="h-4 w-4 text-purple-500" />,
					label: 'Organización',
					value: `${Math.round(stats?.organizationScore || 0)}%`,
					sublabel: `Calidad: ${stats?.qualityGrade || 'D'}`,
				},
				{
					icon: <Target className="h-4 w-4 text-orange-500" />,
					label: 'Jerarquía',
					value: `Nivel ${stats?.hierarchyDepth || 0}`,
					sublabel: `${stats?.totalDescendants || 0} descendientes`,
				},
			];
		}, [entity, stats]);

		// Distribución de contenido por tipo
		const contentDistribution = useMemo(() => {
			const items = [
				{ id: 'images', label: 'Imágenes', count: stats?.imageCount || 0, color: 'bg-blue-500' },
				{ id: 'videos', label: 'Videos', count: stats?.videoCount || 0, color: 'bg-red-500' },
				{ id: 'documents', label: 'Documentos', count: stats?.documentCount || 0, color: 'bg-green-500' },
				{ id: 'audio', label: 'Audio', count: stats?.totalAudio || 0, color: 'bg-yellow-500' },
				{ id: 'others', label: 'Otros', count: stats?.totalOthers || 0, color: 'bg-gray-500' },
			].filter((item) => item.count > 0);

			const total = items.reduce((sum, item) => sum + item.count, 0);
			return items.map((item) => ({
				...item,
				percentage: total > 0 ? (item.count / total) * 100 : 0,
			}));
		}, [stats]);

		// Breadcrumbs de navegación
		const breadcrumbs = useMemo(() => {
			if (stats?.breadcrumbs?.length) {
				return stats.breadcrumbs;
			}
			// Fallback: generar desde path
			const pathSegments = entity.path?.split('/').filter(Boolean) || [];
			return pathSegments.map((segment, index) => ({
				id: `breadcrumb-${index}`,
				name: segment,
				path: `/${pathSegments.slice(0, index + 1).join('/')}`,
			}));
		}, [entity.path, stats?.breadcrumbs]);

		// Tags y información adicional
		const additionalInfo = useMemo(() => {
			const info = [];

			// Auto-tags
			if (stats?.autoTags?.length) {
				info.push({
					id: 'tags',
					type: 'tags',
					label: 'Tags automáticos',
					items: stats.autoTags,
				});
			}

			// Información de actividad
			if (stats?.lastActivity) {
				info.push({
					id: 'activity',
					type: 'activity',
					label: 'Última actividad',
					value: new Date(stats.lastActivity).toLocaleDateString(),
				});
			}

			// Información de indexación
			if (entity.lastIndexed) {
				info.push({
					id: 'indexed',
					type: 'indexed',
					label: 'Última indexación',
					value: new Date(entity.lastIndexed).toLocaleDateString(),
				});
			}

			return info;
		}, [entity, stats]);

		// Imágenes recientes si están disponibles
		const recentImages = useMemo(() => {
			return entity.recentImages?.slice(0, 4) || [];
		}, [entity.recentImages]);

		const handleNavigate = (path: string) => {
			onAction?.('navigate', { path });
		};

		return (
			<div className="space-y-3">
				{/* Header compacto */}
				<Card>
					<CardContent className="p-4">
						<div className="flex items-start justify-between mb-3">
							<div className="flex items-center gap-2 flex-1 min-w-0">
								<span className="text-lg flex-shrink-0">{headerInfo.emoji}</span>
								<div className="min-w-0 flex-1">
									<h3 className="font-semibold truncate text-sm">{headerInfo.name}</h3>
									<p className="text-xs text-muted-foreground truncate">{headerInfo.path}</p>
								</div>
							</div>
							<div className="flex items-center gap-1 flex-shrink-0">
								{headerInfo.isFavorite && <Star className="h-4 w-4 text-yellow-500" />}
								<Badge
									variant={headerInfo.qualityGrade === 'A' ? 'primary' : 'secondary'}
									className="text-xs"
								>
									{headerInfo.qualityGrade}
								</Badge>
							</div>
						</div>

						{/* Breadcrumbs compactos */}
						{breadcrumbs.length > 0 && (
							<div className="flex items-center gap-1 text-xs mb-3 overflow-x-auto">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleNavigate('/')}
									className="h-5 px-1 flex-shrink-0"
								>
									<Home className="h-3 w-3" />
								</Button>
								{breadcrumbs.map((crumb) => (
									<div key={crumb.id} className="flex items-center gap-1 flex-shrink-0">
										<ChevronRight className="h-3 w-3 text-muted-foreground" />
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleNavigate(crumb.path)}
											className="h-5 px-1 text-xs max-w-20 truncate"
											disabled={crumb.id === breadcrumbs[breadcrumbs.length - 1]?.id}
										>
											{crumb.name}
										</Button>
									</div>
								))}
							</div>
						)}

						{/* Métricas principales en grid compacto */}
						<div className="grid grid-cols-2 gap-3">
							{mainMetrics.map((metric) => (
								<div key={metric.label} className="flex items-center gap-2">
									{metric.icon}
									<div className="min-w-0 flex-1">
										<div className="flex items-baseline gap-1">
											<span className="text-xs text-muted-foreground">{metric.label}:</span>
											<span className="text-sm font-medium">{metric.value}</span>
										</div>
										{metric.sublabel && (
											<p className="text-xs text-muted-foreground truncate">{metric.sublabel}</p>
										)}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Distribución de contenido */}
				{contentDistribution.length > 0 && (
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-2 mb-3">
								<Archive className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Distribución de contenido</span>
							</div>
							<div className="space-y-2">
								{contentDistribution.map((item) => (
									<div key={item.id} className="flex items-center gap-2">
										<div className={cn('w-2 h-2 rounded-full flex-shrink-0', item.color)} />
										<span className="text-xs text-muted-foreground min-w-0 flex-1">{item.label}</span>
										<span className="text-xs font-medium">{item.count}</span>
										<span className="text-xs text-muted-foreground">({Math.round(item.percentage)}%)</span>
									</div>
								))}
								{/* Barra de progreso visual */}
								<div className="flex h-2 bg-muted rounded-full overflow-hidden mt-2">
									{contentDistribution.map((item) => (
										<div
											key={item.id}
											className={cn('h-full', item.color)}
											style={{ width: `${item.percentage}%` }}
										/>
									))}
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Imágenes recientes */}
				{recentImages.length > 0 && (
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-2 mb-3">
								<Image className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Imágenes recientes</span>
							</div>
							<div className="grid grid-cols-4 gap-2">
								{recentImages.map((image) => (
									<button
										key={image.id}
										type="button"
										className="aspect-square bg-muted rounded-md overflow-hidden hover:opacity-80 transition-opacity"
										onClick={() => onAction?.('view-image', { imageId: image.id })}
									>
										{image.thumbnailUrl ? (
											<img
												src={image.thumbnailUrl}
												alt={image.name}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center">
												<Image className="h-4 w-4 text-muted-foreground" />
											</div>
										)}
									</button>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Información adicional y tags */}
				{additionalInfo.length > 0 && (
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-2 mb-3">
								<Info className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Información adicional</span>
							</div>
							<div className="space-y-3">
								{additionalInfo.map((info) => (
									<div key={info.id}>
										{info.type === 'tags' ? (
											<div>
												<span className="text-xs text-muted-foreground mb-2 block">{info.label}:</span>
												<div className="flex flex-wrap gap-1">
													{info.items?.map((tag: string, tagIndex: number) => (
														<Badge key={`${info.id}-tag-${tagIndex}`} variant="outline" className="text-xs">
															<Tag className="h-3 w-3 mr-1" />
															{tag}
														</Badge>
													))}
												</div>
											</div>
										) : (
											<div className="flex justify-between text-sm">
												<span className="text-muted-foreground">{info.label}:</span>
												<span className="font-medium">{info.value}</span>
											</div>
										)}
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Métricas técnicas avanzadas */}
				{stats && (
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-2 mb-3">
								<TrendingUp className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Métricas técnicas</span>
							</div>
							<div className="grid grid-cols-2 gap-2 text-xs">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Diversidad:</span>
									<span className="font-medium">{Math.round(stats.contentDiversity || 0)}%</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Frecuencia acceso:</span>
									<span className="font-medium">{Math.round(stats.accessFrequency || 0)}%</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Nombrado consistente:</span>
									<span className="font-medium">{stats.hasConsistentNaming ? 'Sí' : 'No'}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Bien organizada:</span>
									<span className="font-medium">{stats.isWellOrganized ? 'Sí' : 'No'}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Jerarquía profunda:</span>
									<span className="font-medium">{stats.hasDeepHierarchy ? 'Sí' : 'No'}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Relaciones:</span>
									<span className="font-medium">{(stats.imageCount || 0) + (stats.videoCount || 0) + (stats.folderCount || 0)}</span>
								</div>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		);
	}
);

// Componentes adicionales requeridos por el registro
export const FolderPreview = FolderDetails;
export const FolderMetadata = FolderDetails;
export const FolderToolbar = FolderDetails;
