import { Copy, Crosshair, Download, Edit, FolderOpen, Fullscreen, Heart, Plus, RefreshCw, ScanEye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImageFallback } from '@/components/ui/image-fallback';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/entities';
import { useEnhancedMetadata } from '../hooks/use-enhanced-metadata';
import { getDetailedMetadata } from '../metadata/legacy-metadata';
import { getEntityIcon } from '../utils/icon-utils';
import { getMainImageUrl } from '../utils/image-utils';
import { getBasicMetadata, getRelatedEntities } from '../utils/metadata-utils';

interface SinglePanelProps {
	item: AnyEntityWithStats;
	enhancedMetadata: Array<{ key: string; value: string; category?: string }>;
	className?: string;
}

// Constantes para regex
const PATH_SEPARATOR_REGEX = /[/\\]/;
const FILE_EXTENSION_REGEX = /\.[^.]*$/;

export const SinglePanel: React.FC<SinglePanelProps> = ({ item, enhancedMetadata, className = '' }) => {
	// Hook de metadata mejorada (on-demand)
	const {
		enhancedMetadata: liveEnhanced,
		isLoadingMetadata: metaLoading,
		error: metaError,
		refetch,
	} = useEnhancedMetadata(item);

	// Preferir metadata live si existe; luego prop; fallback vacío
	const effectiveEnhanced = (liveEnhanced && liveEnhanced.length > 0 ? liveEnhanced : enhancedMetadata) || [];
	const mainImageUrl = getMainImageUrl(item);
	const basicMetadata = getBasicMetadata(item);
	const relatedEntities = getRelatedEntities(item);
	const detailedMetadata = getDetailedMetadata(item, effectiveEnhanced);
	const EntityIcon = getEntityIcon(item.entityType || 'file');

	return (
		<div className={cn('details-panel flex h-full w-full flex-col bg-background', className)}>
			{/* Header */}

			<div className="flex-1 overflow-y-auto">
				<div className="w-full items-center p-1 content-betwen ">
					{/* Toolbar de acciones */}
					<div className="background-secondary flex items-center gap-1">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button disabled={metaLoading} onClick={() => refetch()} size="icon" variant="ghost">
									<RefreshCw className={cn('h-4 w-4', metaLoading && 'animate-spin')} />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{metaLoading ? 'Extrayendo…' : 'Extraer Metadata'}</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button className="" size="icon" variant="ghost">
									<Edit className={cn('h-4 w-4')} />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Editar</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button className="" size="icon" variant="ghost">
									<FolderOpen className={cn('h-4 w-4')} />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Abrir en carpeta</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button className="" size="icon" variant="ghost">
									<Copy className={cn('h-4 w-4')} />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Copiar Imagen</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button className="" size="icon" variant="ghost">
									<Download className={cn('h-4 w-4')} />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Descargar</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button className="" size="icon" variant="ghost">
									<ScanEye className={cn('h-4 w-4')} />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Analizar</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button className="" size="icon" variant="ghost">
									<Crosshair className={cn('h-4 w-4')} />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Marcar</TooltipContent>
						</Tooltip>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button size="icon" variant="outline">
									<Plus className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuLabel>Agregar a</DropdownMenuLabel>
								<DropdownMenuItem>
									<Edit className="mr-2 h-4 w-4" />
									Renombrar
								</DropdownMenuItem>
								<DropdownMenuSeparator />
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					{/* Imagen principal */}
					{mainImageUrl && (
						<div className="relative w-full max-w-full overflow-hidden p-1">
							<Button className="absolute top-2 right-2 z-10" size="icon" variant="ghost">
								<Fullscreen className="h-4 w-4" />
							</Button>
							<ImageFallback
								alt={'name' in item ? item.name || 'Sin nombre' : 'Sin nombre'}
								className="h-full w-full object-contain"
								src={mainImageUrl}
							/>
						</div>
					)}
					<div className="flex-shrink-0 p-1">
						<div className="mb-1 flex items-center gap-2">
							<EntityIcon className="h-4 w-4 text-muted-foreground" />
							<h2 className="truncate font-semibold text-xs">{'name' in item ? item.name : 'Sin nombre'}</h2>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button className="" size="icon" variant="ghost">
										<Heart
											className={cn('h-4 w-4', 'isFavorite' in item && item.isFavorite && 'fill-red-500 text-red-500')}
										/>
									</Button>
								</TooltipTrigger>
								<TooltipContent>Favorito</TooltipContent>
							</Tooltip>
						</div>
						{'description' in item && item.description && (
							<p className="line-clamp-2 text-muted-foreground text-xs">{item.description}</p>
						)}
					</div>

					{/* Información básica */}
					{basicMetadata.length > 0 && (
						<div className="ph-4 flex w-full justify-center gap-4">
							{basicMetadata.map(({ key, value, icon: Icon }) => (
								<div className="flex items-center gap-1 pl-2 text-xs" key={key}>
									<Icon className="h-4 w-4" />
									<span className="font-medium">{value}</span>
								</div>
							))}
						</div>
					)}

					{/* Entidades relacionadas */}
					{relatedEntities.length > 0 && (
						<div>
							<div className="ph-4 flex w-full justify-center gap-4">
								{relatedEntities.map(({ type, count, icon: Icon, color }) => (
									<Badge className={cn('gap-1', color)} key={type} variant="secondary">
										<Icon className="h-3 w-3" />
										{count} {type}
									</Badge>
								))}
							</div>
						</div>
					)}

					{/* Metadatos detallados organizados por categorías */}
					{detailedMetadata.length > 0 && (
						<div>
							{/* Agrupar metadatos por categoría */}
							{(() => {
								const groupedMetadata = detailedMetadata.reduce(
									(acc, metaItem) => {
										const category = metaItem.category || 'general';
										if (!acc[category]) {
											acc[category] = [];
										}
										acc[category].push(metaItem);
										return acc;
									},
									{} as Record<string, typeof detailedMetadata>
								);

								// Orden de prioridad para categorías
								const categoryOrder = ['ia', 'exif', 'iptc', 'xmp', 'técnico', 'general', 'error'];
								const categoryNames = {
									ia: '🤖 Metadatos de IA',
									exif: '📷 EXIF (Cámara)',
									iptc: '📝 IPTC (Editorial)',
									xmp: '🏷️ XMP (Extensibles)',
									técnico: '⚙️ Técnico',
									general: '📊 General',
									error: '⚠️ Errores',
								};

								const sortedCategories = categoryOrder.filter((cat) => groupedMetadata[cat]);

								return sortedCategories.map((category) => (
									<div className="space-y-3" key={category}>
										<h4 className="pv-1 mt-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
											{categoryNames[category as keyof typeof categoryNames] || category}
										</h4>
										<div className="space-y-3 pl-1">
											{category === 'ia' && !metaLoading && !metaError && groupedMetadata.ia?.length === 0 && (
												<div className="flex flex-col gap-1 rounded border border-dashed p-2 text-muted-foreground text-xs">
													<span>No se encontraron metadatos de IA.</span>
													<Button className="self-start" onClick={() => refetch()} size="sm" variant="outline">
														Intentar extraer
													</Button>
												</div>
											)}
											{category === 'ia' && metaError && (
												<div className="text-red-600 text-xs dark:text-red-400">Error: {metaError}</div>
											)}
											{groupedMetadata[category].map(({ key, value }) => (
												<div
													className="flex w-full min-w-0 flex-col gap-1"
													key={`${category}-${key}-${value.substring(0, 20)}`}
												>
													<span className="truncate font-medium text-muted-foreground text-xs">{key}</span>
													<span
														className={cn(
															'overflow-wrap-anywhere w-full min-w-0 break-words text-xs leading-relaxed',
															category === 'ia' && 'text-blue-600 dark:text-blue-400',
															category === 'error' && 'text-red-600 dark:text-red-400'
														)}
													>
														{value}
													</span>
												</div>
											))}
										</div>
									</div>
								));
							})()}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
