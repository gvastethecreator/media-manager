import {
	AlignLeft,
	Bot,
	Camera,
	Copy,
	Cpu,
	Crosshair,
	Download,
	Edit,
	FileJson,
	FolderOpen,
	Fullscreen,
	Gauge,
	GitBranch,
	Hash,
	Heart,
	Monitor,
	Package,
	Plus,
	RefreshCw,
	ScanEye,
	Settings,
	Tag,
	Target,
	Zap,
} from 'lucide-react';
import React from 'react';
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
import { CollapsibleText, MetadataTable } from './metadata-table';
import { CollapsiblePrompt } from './prompt-parser';

interface SinglePanelProps {
	item: AnyEntityWithStats;
	enhancedMetadata: Array<{ key: string; value: string; category?: string }>;
	className?: string;
}

// Constantes para regex
const PATH_SEPARATOR_REGEX = /[/\\]/;
const FILE_EXTENSION_REGEX = /\.[^.]*$/;

export const SinglePanel: React.FC<SinglePanelProps> = ({ item, enhancedMetadata, className = '' }) => {
	// Solo usar hook interno si no hay metadata como prop
	const shouldUseInternalHook = !enhancedMetadata || enhancedMetadata.length === 0;

	// Hook de metadata mejorada (condicional)
	const {
		enhancedMetadata: liveEnhanced,
		isLoadingMetadata: metaLoading,
		error: metaError,
		refetch,
		exportMetadata,
	} = useEnhancedMetadata(shouldUseInternalHook ? item : undefined);

	// Estado para LoRAs detectados
	const [detectedLoras, setDetectedLoras] = React.useState<string[]>([]);

	// Referencia para detectar cambios de item
	const prevItemIdRef = React.useRef<string | undefined>(undefined);

	// Limpiar LoRAs detectados cuando cambia el item
	React.useEffect(() => {
		const currentItemId = item?.id;
		if (prevItemIdRef.current !== currentItemId) {
			setDetectedLoras([]);
			prevItemIdRef.current = currentItemId;
		}
	});

	const handleLorasDetected = React.useCallback((loras: string[]) => {
		setDetectedLoras((prev) => {
			const newLoras = [...new Set([...prev, ...loras])];
			return newLoras;
		});
	}, []);

	// Determinar metadata efectiva: si no usamos hook interno, usar prop; sino usar resultado del hook
	const effectiveEnhanced = shouldUseInternalHook ? liveEnhanced || [] : enhancedMetadata || [];

	// Estados efectivos de loading y error
	const effectiveLoading = shouldUseInternalHook ? metaLoading : false;
	const effectiveError = shouldUseInternalHook ? metaError : null;

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
								<Button disabled={effectiveLoading} onClick={() => refetch()} size="icon" variant="ghost">
									<RefreshCw className={cn('h-4 w-4', effectiveLoading && 'animate-spin')} />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{effectiveLoading ? (
									<div className="text-sm">
										<div className="font-medium">Extrayendo metadatos...</div>
										<div className="text-xs text-muted-foreground mt-1">
											• Analizando EXIF/IPTC/XMP<br />
											• Detectando engine de IA<br />
											• Extrayendo parámetros de generación
										</div>
									</div>
								) : (
									<div className="text-sm">
										<div className="font-medium">Extraer Metadatos</div>
										<div className="text-xs text-muted-foreground mt-1">
											Analizar archivos con sistema avanzado
										</div>
									</div>
								)}
							</TooltipContent>
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
								<DropdownMenuLabel>Exportar Metadatos</DropdownMenuLabel>
								<DropdownMenuItem
									onClick={() => exportMetadata?.('json')}
									disabled={!effectiveEnhanced.length || effectiveLoading}
								>
									<FileJson className="mr-2 h-4 w-4" />
									Exportar como JSON
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => exportMetadata?.('csv')}
									disabled={!effectiveEnhanced.length || effectiveLoading}
								>
									<Download className="mr-2 h-4 w-4" />
									Exportar como CSV
								</DropdownMenuItem>
								<DropdownMenuSeparator />
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Indicador de estado de carga de metadatos */}
					{effectiveLoading && (
						<div className="bg-blue-50 border border-blue-200 rounded-md p-2 m-1 dark:bg-blue-950/20 dark:border-blue-800/30">
							<div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
								<RefreshCw className="h-3 w-3 animate-spin" />
								<span className="text-xs font-medium">Extrayendo metadatos avanzados...</span>
							</div>
							<div className="text-blue-600 dark:text-blue-400 text-xs mt-1">
								Analizando archivo con sistema de detección IA
							</div>
						</div>
					)}

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
							{(() => {
								const groupedMetadata = detailedMetadata.reduce(
									(acc, metaItem) => {
										const category = metaItem.category || 'general';
										if (!acc[category]) acc[category] = [];
										acc[category].push(metaItem);
										return acc;
									},
									{} as Record<string, typeof detailedMetadata>
								);

								const categoryOrder = ['ia', 'exif', 'iptc', 'xmp', 'técnico', 'general', 'error'];
								const categoryNames = {
									ia: '🤖 Metadatos de IA',
									exif: '📷 EXIF (Cámara)',
									iptc: '📝 IPTC (Editorial)',
									xmp: '🏷️ XMP (Extensibles)',
									técnico: '⚙️ Técnico',
									general: '📊 General',
									error: '⚠️ Errores',
								} as const;

								const sortedCategories = categoryOrder.filter((cat) => groupedMetadata[cat]);

								return sortedCategories.map((category) => {
									if (category === 'ia') {
										const aiItems = groupedMetadata.ia || [];
										const kv = new Map<string, string>();
										for (const { key, value } of aiItems) {
											if (!kv.has(key)) kv.set(key, value);
										}

										// Helpers
										const take = (label: string) => kv.get(label);
										const has = (label: string) => kv.has(label);

										// Construir filas por secciones
										const originRows = [] as Array<{
											icon?: any;
											iconColor?: string;
											label: string;
											value: any;
											fullWidth?: boolean;
											compact?: boolean;
										}>;
										if (has('Engine IA')) {
											originRows.push({
												icon: Bot,
												iconColor: 'text-purple-500 dark:text-purple-400',
												label: 'Engine IA',
												value: take('Engine IA') ?? '',
											});
										}

										const modelKeys = ['Modelo', 'Checkpoint', 'VAE', 'LoRA', 'LoRAs', 'ControlNet'];
										const modelRows = modelKeys
											.filter((k) => has(k))
											.map((k) => ({
												icon: k === 'LoRA' || k === 'LoRAs' ? Zap : Package,
												iconColor:
													k === 'LoRA' || k === 'LoRAs'
														? 'text-blue-500 dark:text-blue-400'
														: 'text-indigo-500 dark:text-indigo-400',
												label: k,
												value: take(k) ?? '',
												compact: true,
											}));

										const paramKeys = [
											'Pasos',
											'CFG Scale',
											'Guidance Scale',
											'Sampler',
											'Scheduler',
											'Seed',
											'Ancho',
											'Alto',
											'Tamaño',
											'Batch Size',
											'Denoising Strength',
											'CLIP Skip',
											'ETA',
										];
										const paramRows = paramKeys
											.filter((k) => has(k))
											.map((k) => {
												// Iconos específicos para diferentes tipos de parámetros
												let icon = Settings;
												let iconColor = 'text-green-500 dark:text-green-400';

												if (k === 'Seed') {
													icon = Target;
													iconColor = 'text-orange-500 dark:text-orange-400';
												} else if (['Ancho', 'Alto', 'Tamaño'].includes(k)) {
													icon = Monitor;
													iconColor = 'text-teal-500 dark:text-teal-400';
												} else if (['Pasos', 'CFG Scale', 'Guidance Scale'].includes(k)) {
													icon = Gauge;
													iconColor = 'text-emerald-500 dark:text-emerald-400';
												} else if (['Sampler', 'Scheduler'].includes(k)) {
													icon = Cpu;
													iconColor = 'text-cyan-500 dark:text-cyan-400';
												}

												return {
													icon,
													iconColor,
													label: k,
													value: take(k) ?? '',
													compact: ['Seed', 'Ancho', 'Alto', 'Batch Size', 'CLIP Skip', 'ETA'].includes(k),
												};
											});

										const promptsRows = [] as Array<{
											icon?: any;
											iconColor?: string;
											label: string;
											value: any;
											fullWidth?: boolean;
										}>;
										if (has('Prompt')) {
											promptsRows.push({
												icon: AlignLeft,
												iconColor: 'text-pink-500 dark:text-pink-400',
												label: 'Prompt',
												value: (
													<CollapsiblePrompt
														collapsedLines={12}
														defaultExpanded
														onLorasDetected={handleLorasDetected}
														prompt={take('Prompt') ?? ''}
													/>
												),
												fullWidth: true,
											});
										}
										if (has('Prompt Negativo')) {
											promptsRows.push({
												icon: AlignLeft,
												iconColor: 'text-red-500 dark:text-red-400',
												label: 'Prompt Negativo',
												value: (
													<CollapsiblePrompt
														collapsedLines={12}
														defaultExpanded
														onLorasDetected={handleLorasDetected}
														prompt={take('Prompt Negativo') ?? ''}
													/>
												),
												fullWidth: true,
											});
										}

										// Workflow
										const workflowRows = [] as Array<{
											icon?: any;
											iconColor?: string;
											label: string;
											value: any;
											fullWidth?: boolean;
										}>;
										const workflowLike = Array.from(kv.keys()).filter(
											(k) => /workflow/i.test(k) || k === 'Workflow ID'
										);
										for (const k of workflowLike) {
											const v = kv.get(k) ?? '';
											if (/json/i.test(k)) {
												workflowRows.push({
													icon: FileJson,
													iconColor: 'text-amber-500 dark:text-amber-400',
													label: k,
													value: <CollapsibleText collapsedLines={10} text={v} />,
													fullWidth: true,
												});
											} else {
												workflowRows.push({
													icon: GitBranch,
													iconColor: 'text-violet-500 dark:text-violet-400',
													label: k,
													value: v,
												});
											}
										}

										// Otros: aquellos que no cayeron en grupos anteriores
										const usedKeys = new Set([
											'Engine IA',
											'engine',
											'confidence',
											...modelKeys,
											...paramKeys,
											'Prompt',
											'Prompt Negativo',
											...workflowLike,
										]);
										const otherRows = Array.from(kv.entries())
											.filter(([k]) => !usedKeys.has(k))
											.map(([k, v]) => ({ icon: undefined, label: k, value: v }));

										return (
											<div className="space-y-3" key={category}>
												<h4 className="pv-1 mt-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
													{categoryNames[category as keyof typeof categoryNames] || category}
												</h4>
												<div className="space-y-3 pl-1">
													{(() => {
														const notLoading = !effectiveLoading;
														const noError = !effectiveError;
														const emptyAi = aiItems.length === 0;
														const noAi = notLoading && noError && emptyAi;
														if (!noAi) return null;
														return (
															<div className="flex flex-col gap-1 rounded border border-dashed p-2 text-muted-foreground text-xs">
																<span>No se encontraron metadatos de IA.</span>
																<Button className="self-start" onClick={() => refetch()} size="sm" variant="outline">
																	Intentar extraer
																</Button>
															</div>
														);
													})()}
													{effectiveError && (
														<div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 text-sm dark:bg-red-950/20 dark:border-red-800/30 dark:text-red-300">
															<div className="flex items-center gap-2 mb-1">
																<span className="font-medium">Error de extracción:</span>
															</div>
															<div className="text-xs text-red-700 dark:text-red-400">
																{effectiveError}
															</div>
															<Button
																className="mt-2 self-start"
																onClick={() => refetch()}
																size="sm"
																variant="outline"
																disabled={effectiveLoading}
															>
																{effectiveLoading ? (
																	<>
																		<RefreshCw className="h-3 w-3 animate-spin mr-1" />
																		Reintentando...
																	</>
																) : (
																	<>
																		<RefreshCw className="h-3 w-3 mr-1" />
																		Reintentar
																	</>
																)}
															</Button>
														</div>
													)}

													{originRows.length > 0 && (
														<MetadataTable
															dense
															rows={originRows}
															title={
																<div className="flex items-center gap-2">
																	<Bot className="h-3.5 w-3.5" /> Origen
																</div>
															}
														/>
													)}

													{modelRows.length > 0 && (
														<MetadataTable
															dense
															multiColumn
															rows={modelRows}
															title={
																<div className="flex items-center gap-2">
																	<Package className="h-3.5 w-3.5" /> Modelo y Checkpoint
																</div>
															}
														/>
													)}

													{paramRows.length > 0 && (
														<MetadataTable
															dense
															multiColumn
															rows={paramRows}
															title={
																<div className="flex items-center gap-2">
																	<Settings className="h-3.5 w-3.5" /> Parámetros
																</div>
															}
														/>
													)}

													{promptsRows.length > 0 && (
														<MetadataTable
															rows={promptsRows}
															title={
																<div className="flex items-center gap-2">
																	<AlignLeft className="h-3.5 w-3.5" /> Prompts
																</div>
															}
														/>
													)}

													{detectedLoras.length > 0 && (
														<MetadataTable
															dense
															multiColumn
															rows={detectedLoras.map((lora, idx) => ({
																icon: Zap,
																iconColor: 'text-blue-500 dark:text-blue-400',
																label: `LoRA ${idx + 1}`,
																value: lora,
																compact: true,
															}))}
															title={
																<div className="flex items-center gap-2">
																	<Zap className="h-3.5 w-3.5" /> LoRAs Detectados ({detectedLoras.length})
																</div>
															}
														/>
													)}

													{workflowRows.length > 0 && (
														<MetadataTable
															dense
															rows={workflowRows}
															title={
																<div className="flex items-center gap-2">
																	<GitBranch className="h-3.5 w-3.5" /> Workflow
																</div>
															}
														/>
													)}

													{otherRows.length > 0 && <MetadataTable dense rows={otherRows} title="Otros" />}
												</div>
											</div>
										);
									}

									// Resto de categorías: usar MetadataTable con iconos por categoría
									return (
										<div className="space-y-3" key={category}>
											<h4 className="pv-1 mt-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
												{categoryNames[category as keyof typeof categoryNames] || category}
											</h4>
											<div className="space-y-3 pl-1">
												{(() => {
													const rows = groupedMetadata[category].map(({ key, value }) => ({
														icon:
															category === 'exif'
																? Camera
																: category === 'iptc'
																	? Tag
																	: category === 'xmp'
																		? Hash
																		: undefined,
														label: key,
														value,
													}));
													return <MetadataTable dense rows={rows} />;
												})()}
											</div>
										</div>
									);
								});
							})()}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
