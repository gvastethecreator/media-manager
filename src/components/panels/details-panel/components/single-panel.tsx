import { Copy, Download, Edit, Heart, MoreHorizontal, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImageFallback } from '@/components/ui/image-fallback';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/entities';
import { exportToCSV, exportToJSON } from '../export/metadata-export';
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
	const mainImageUrl = getMainImageUrl(item);
	const basicMetadata = getBasicMetadata(item);
	const relatedEntities = getRelatedEntities(item);
	const detailedMetadata = getDetailedMetadata(item, enhancedMetadata);
	const EntityIcon = getEntityIcon(item.entityType || 'file');

	return (
		<div className={cn('details-panel flex h-full w-full flex-col bg-background', className)}>
			{/* Header */}
			<div className="flex-shrink-0 border-b p-4">
				<div className="mb-2 flex items-center gap-2">
					<EntityIcon className="h-5 w-5 text-muted-foreground" />
					<h2 className="truncate font-semibold text-lg">{'name' in item ? item.name : 'Sin nombre'}</h2>
				</div>
				{'description' in item && item.description && (
					<p className="line-clamp-2 text-muted-foreground text-sm">{item.description}</p>
				)}
			</div>

			<div className="flex-1 overflow-y-auto">
				<div className="w-full space-y-4 p-4">
					{/* Imagen principal */}
					{mainImageUrl && (
						<motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }}>
							<div className="w-full max-w-full">
								<AspectRatio className="w-full overflow-hidden rounded-lg bg-muted" ratio={16 / 9}>
									<ImageFallback
										alt={'name' in item ? item.name || 'Sin nombre' : 'Sin nombre'}
										className="h-full w-full object-contain"
										src={mainImageUrl}
									/>
								</AspectRatio>
							</div>
						</motion.div>
					)}

					{/* Toolbar de acciones */}
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="flex items-center gap-2"
						initial={{ opacity: 0, y: 20 }}
						transition={{ duration: 0.3, delay: 0.1 }}
					>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button size="icon" variant="outline">
										<Copy className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Copiar</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button size="icon" variant="outline">
										<Download className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Descargar</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button size="icon" variant="outline">
										<Heart
											className={cn('h-4 w-4', 'isFavorite' in item && item.isFavorite && 'fill-red-500 text-red-500')}
										/>
									</Button>
								</TooltipTrigger>
								<TooltipContent>Favorito</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button size="icon" variant="outline">
										<Edit className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Editar</TooltipContent>
							</Tooltip>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button size="icon" variant="outline">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem>
										<Edit className="mr-2 h-4 w-4" />
										Renombrar
									</DropdownMenuItem>
									<DropdownMenuItem>
										<Copy className="mr-2 h-4 w-4" />
										Duplicar
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem className="text-destructive">
										<Trash2 className="mr-2 h-4 w-4" />
										Eliminar
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</TooltipProvider>
					</motion.div>

					{/* Información básica */}
					{basicMetadata.length > 0 && (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="space-y-3"
							initial={{ opacity: 0, y: 20 }}
							transition={{ duration: 0.3, delay: 0.2 }}
						>
							<h3 className="font-medium text-sm">Información básica</h3>
							<div className="space-y-2">
								{basicMetadata.map(({ key, value, icon: Icon }) => (
									<div className="flex items-center justify-between text-sm" key={key}>
										<div className="flex items-center gap-2 text-muted-foreground">
											<Icon className="h-4 w-4" />
											{key}
										</div>
										<span className="font-medium">{value}</span>
									</div>
								))}
							</div>
						</motion.div>
					)}

					{/* Entidades relacionadas */}
					{relatedEntities.length > 0 && (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="space-y-3"
							initial={{ opacity: 0, y: 20 }}
							transition={{ duration: 0.3, delay: 0.3 }}
						>
							<h3 className="font-medium text-sm">Entidades relacionadas</h3>
							<div className="flex flex-wrap gap-2">
								{relatedEntities.map(({ type, count, icon: Icon, color }) => (
									<Badge className={cn('gap-1', color)} key={type} variant="secondary">
										<Icon className="h-3 w-3" />
										{count} {type}
									</Badge>
								))}
							</div>
						</motion.div>
					)}

					{/* Metadatos detallados organizados por categorías */}
					{detailedMetadata.length > 0 && (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="space-y-4"
							initial={{ opacity: 0, y: 20 }}
							transition={{ duration: 0.3, delay: 0.4 }}
						>
							<h3 className="font-medium text-sm">Metadatos detallados</h3>
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
									<div className="space-y-2" key={category}>
										<h4 className="border-b pb-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
											{categoryNames[category as keyof typeof categoryNames] || category}
										</h4>
										<div className="space-y-3 pl-1">
											{groupedMetadata[category].map(({ key, value }) => (
												<div
													className="flex w-full min-w-0 flex-col gap-1"
													key={`${category}-${key}-${value.substring(0, 20)}`}
												>
													<span className="truncate font-medium text-muted-foreground text-xs">{key}</span>
													<span
														className={cn(
															'overflow-wrap-anywhere w-full min-w-0 break-words text-sm leading-relaxed',
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
						</motion.div>
					)}

					{/* Botones de exportación de metadatos */}
					{detailedMetadata.length > 0 && (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="space-y-3 border-t pt-4"
							initial={{ opacity: 0, y: 20 }}
							transition={{ duration: 0.3, delay: 0.5 }}
						>
							<h3 className="font-medium text-sm">Exportar metadatos</h3>
							<div className="flex gap-2">
								<Button
									className="flex-1"
									onClick={() => {
										const filename =
											'path' in item
												? `${item.path.split(PATH_SEPARATOR_REGEX).pop()?.replace(FILE_EXTENSION_REGEX, '')}_metadata`
												: `${item.name}_metadata`;
										exportToCSV(detailedMetadata, filename);
									}}
									size="sm"
									variant="outline"
								>
									<Download className="mr-2 h-4 w-4" />
									CSV
								</Button>
								<Button
									className="flex-1"
									onClick={() => {
										const filename =
											'path' in item
												? `${item.path.split(PATH_SEPARATOR_REGEX).pop()?.replace(FILE_EXTENSION_REGEX, '')}_metadata`
												: `${item.name}_metadata`;
										exportToJSON(detailedMetadata, filename);
									}}
									size="sm"
									variant="outline"
								>
									<Download className="mr-2 h-4 w-4" />
									JSON
								</Button>
							</div>
						</motion.div>
					)}
				</div>
			</div>
		</div>
	);
};
