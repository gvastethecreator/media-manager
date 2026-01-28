import {
	AlignLeft,
	Bot,
	Camera,
	Copy,
	Cpu,
	Crosshair,
	Download,
	Edit,
	ExternalLink,
	FileJson,
	FolderOpen,
	Fullscreen,
	Gauge,
	GitBranch,
	Hash,
	Heart,
	Info,
	Monitor,
	MoreVertical,
	Package,
	Plus,
	RefreshCw,
	Settings,
	Share2,
	Tag,
	Target,
	Zap,
} from 'lucide-react';
import React, { useMemo } from 'react';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { getDetailedMetadata } from '../metadata/detailed-metadata';
import { getEntityIcon } from '../utils/icon-utils';
import { getMainImageUrl } from '../utils/image-utils';
import { getBasicMetadata, getRelatedEntities } from '../utils/metadata-utils';
import { JsonViewer } from './json-viewer';
import { MetadataTable } from './metadata-table';
import { CollapsiblePrompt } from './prompt-parser';

interface SinglePanelProps {
	item: AnyEntityWithStats;
	enhancedMetadata: Array<{ key: string; value: string; category?: string }>;
	className?: string;
}

const copyToClipboard = async (text: string): Promise<boolean> => {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'fixed';
		textArea.style.opacity = '0';
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		const result = document.execCommand('copy');
		document.body.removeChild(textArea);
		return result;
	}
};

const downloadFile = async (url: string, filename: string): Promise<void> => {
	try {
		const response = await fetch(url);
		const blob = await response.blob();
		const objectUrl = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = objectUrl;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(objectUrl);
	} catch (err) {
		console.error('Error descargando archivo:', err);
	}
};

export const SinglePanel: React.FC<SinglePanelProps> = ({ item, enhancedMetadata, className = '' }) => {
	const shouldUseInternalHook = !enhancedMetadata || enhancedMetadata.length === 0;

	const {
		enhancedMetadata: liveEnhanced,
		isLoadingMetadata: metaLoading,
		error: metaError,
		refetch,
		exportMetadata,
	} = useEnhancedMetadata(shouldUseInternalHook ? item : undefined);

	const [detectedLoras, setDetectedLoras] = React.useState<string[]>([]);
	const prevItemIdRef = React.useRef<string | undefined>(undefined);

	React.useEffect(() => {
		const currentItemId = item?.id;
		if (prevItemIdRef.current !== currentItemId) {
			setDetectedLoras([]);
			prevItemIdRef.current = currentItemId;
		}
	}, [item?.id]);

	const handleLorasDetected = React.useCallback((loras: string[]) => {
		setDetectedLoras((prev) => [...new Set([...prev, ...loras])]);
	}, []);

	const effectiveEnhanced = shouldUseInternalHook ? liveEnhanced || [] : enhancedMetadata || [];
	const effectiveLoading = shouldUseInternalHook ? metaLoading : false;
	const effectiveError = shouldUseInternalHook ? metaError : null;

	const mainImageUrl = getMainImageUrl(item);
	const basicMetadata = getBasicMetadata(item);
	const relatedEntities = getRelatedEntities(item);
	const detailedMetadata = getDetailedMetadata(item, effectiveEnhanced);
	const EntityIcon = getEntityIcon(item.entityType || 'file');

	const itemName = 'name' in item ? (item.name as string) : 'Sin nombre';
	const itemExtension = useMemo(() => {
		if ('path' in item && typeof item.path === 'string') {
			return item.path.split('.').pop()?.toUpperCase() || '';
		}
		return '';
	}, [item]);

	const handleCopyImage = React.useCallback(async () => {
		if (!mainImageUrl) return;
		try {
			const response = await fetch(mainImageUrl);
			const blob = await response.blob();
			await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
		} catch (err) {
			const itemPath = 'path' in item ? (item.path as string) : '';
			await copyToClipboard(itemPath || mainImageUrl || itemName);
		}
	}, [mainImageUrl, item, itemName]);

	const handleDownload = React.useCallback(() => {
		if (!mainImageUrl) return;
		downloadFile(mainImageUrl, itemName);
	}, [mainImageUrl, itemName]);

	const handleOpenInFolder = React.useCallback(() => {
		const itemPath = 'path' in item ? (item.path as string) : null;
		if (itemPath) copyToClipboard(itemPath);
	}, [item]);

	const groupedMetadata = useMemo(() => {
		return detailedMetadata.reduce(
			(acc, metaItem) => {
				const category = metaItem.category || 'general';
				if (!acc[category]) acc[category] = [];
				acc[category].push(metaItem);
				return acc;
			},
			{} as Record<string, typeof detailedMetadata>
		);
	}, [detailedMetadata]);

	const aiSection = useMemo(() => {
		const aiItems = groupedMetadata.ia || [];
		if (aiItems.length === 0 && !effectiveLoading && !effectiveError) return null;

		const kv = new Map<string, string>();
		for (const { key, value } of aiItems) {
			if (!kv.has(key)) kv.set(key, value);
		}

		const take = (label: string) => kv.get(label);
		const has = (label: string) => kv.has(label);

		const originRows = [];
		if (has('Engine IA')) {
			originRows.push({
				icon: Bot,
				iconColor: 'text-blue-500',
				label: 'Engine',
				value: take('Engine IA') ?? '',
			});
		}

		const modelKeys = ['Modelo', 'Checkpoint', 'VAE', 'LoRA', 'LoRAs', 'ControlNet'];
		const modelRows = modelKeys
			.filter((k) => has(k))
			.map((k) => ({
				icon: k.includes('LoRA') ? Zap : Package,
				iconColor: k.includes('LoRA') ? 'text-amber-500' : 'text-orange-500',
				label: k,
				value: take(k) ?? '',
				compact: true,
			}));

		const paramKeys = [
			'Pasos', 'CFG Scale', 'Guidance Scale', 'Sampler', 'Scheduler', 'Seed', 'Ancho', 'Alto', 'Tamaño', 'Batch Size', 'Denoising Strength', 'CLIP Skip',
		];
		const paramRows = paramKeys
			.filter((k) => has(k))
			.map((k) => {
				let icon = Settings;
				let iconColor = 'text-emerald-500';
				if (k === 'Seed') {
					icon = Target; iconColor = 'text-amber-500';
				} else if (['Ancho', 'Alto', 'Tamaño'].includes(k)) {
					icon = Monitor; iconColor = 'text-blue-400';
				} else if (['Pasos', 'CFG Scale'].includes(k)) {
					icon = Gauge;
				}
				return { icon, iconColor, label: k, value: take(k) ?? '', compact: true };
			});

		const promptsRows = [];
		if (has('Prompt')) {
			promptsRows.push({
				icon: AlignLeft,
				iconColor: 'text-primary',
				label: 'Prompt',
				value: <CollapsiblePrompt collapsedLines={6} defaultExpanded onLorasDetected={handleLorasDetected} prompt={take('Prompt') ?? ''} />,
				fullWidth: true,
			});
		}
		if (has('Prompt Negativo')) {
			promptsRows.push({
				icon: AlignLeft,
				iconColor: 'text-destructive',
				label: 'Negativo',
				value: <CollapsiblePrompt collapsedLines={6} defaultExpanded onLorasDetected={handleLorasDetected} prompt={take('Prompt Negativo') ?? ''} />,
				fullWidth: true,
			});
		}

		const workflowRows = [];
		const workflowLike = Array.from(kv.keys()).filter(
			(k) => /workflow/i.test(k) || k === 'Workflow ID' || k.toLowerCase().includes('comfyui')
		);
		for (const k of workflowLike) {
			const v = kv.get(k) ?? '';
			const isJson = typeof v === 'string' && (v.trim().startsWith('{') || v.trim().startsWith('['));
			workflowRows.push({
				icon: isJson ? FileJson : GitBranch,
				iconColor: isJson ? 'text-amber-500' : 'text-blue-400',
				label: k,
				value: isJson ? <JsonViewer content={v} defaultExpanded={false} maxHeight={200} /> : v,
				fullWidth: isJson,
			});
		}

		return (
			<div className="space-y-3 pt-1 min-w-0 w-full overflow-hidden">
				{effectiveError && (
					<div className="rounded-md border border-destructive/20 bg-destructive/5 p-2.5 text-[11px] min-w-0 overflow-hidden">
						<div className="flex items-center gap-2 font-bold text-destructive mb-1 uppercase tracking-tighter">
							<Info className="h-3 w-3 shrink-0" /> Error
						</div>
						<p className="text-muted-foreground mb-2 break-words leading-tight">{effectiveError}</p>
						<Button className="h-6 px-2 text-[9px] font-bold" onClick={() => refetch()} size="sm" variant="outline">
							<RefreshCw className="mr-1 h-2.5 w-2.5" /> REINTENTAR
						</Button>
					</div>
				)}

				{originRows.length > 0 && <MetadataTable dense rows={originRows} />}
				{modelRows.length > 0 && <MetadataTable dense multiColumn rows={modelRows} title="Modelos" />}
				{paramRows.length > 0 && <MetadataTable dense multiColumn rows={paramRows} title="Parámetros" />}
				{promptsRows.length > 0 && <MetadataTable rows={promptsRows} />}
				{detectedLoras.length > 0 && (
					<MetadataTable
						dense
						multiColumn
						rows={detectedLoras.map((lora, i) => ({ icon: Zap, label: `L${i+1}`, value: lora, compact: true }))}
						title={`LoRAs (${detectedLoras.length})`}
					/>
				)}
				{workflowRows.length > 0 && <MetadataTable dense rows={workflowRows} title="Workflow" />}
			</div>
		);
	}, [groupedMetadata.ia, effectiveLoading, effectiveError, handleLorasDetected, detectedLoras, refetch]);

	return (
		<div className={cn('flex h-full w-full min-w-0 flex-col bg-background overflow-hidden relative', className)}>
			{/* HEADER ULTRA-FLEXIBLE */}
			<header className="flex flex-col border-b bg-background/95 backdrop-blur shrink-0 min-w-0 w-full overflow-hidden">
				<div className="flex items-start justify-between gap-2 px-3 py-3 sm:px-4 min-w-0 w-full">
					<div className="flex items-start gap-2.5 min-w-0 flex-1 overflow-hidden">
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10 mt-0.5">
							<EntityIcon className="h-4.5 w-4.5" />
						</div>
						<div className="min-w-0 flex-1 overflow-hidden">
							<div className="flex flex-wrap items-center gap-1.5 min-w-0 overflow-hidden">
								<h2 className="font-bold text-xs sm:text-sm truncate text-foreground leading-none max-w-full">{itemName}</h2>
								{itemExtension && (
									<Badge className="h-3.5 px-1 text-[7px] font-black tracking-tighter shrink-0 uppercase border-none bg-muted text-muted-foreground" variant="outline">
										{itemExtension}
									</Badge>
								)}
							</div>
							<p className="text-[9px] text-muted-foreground truncate opacity-50 font-mono mt-1 w-full overflow-hidden break-all">
								{'path' in item ? (item.path as string) : 'ID: ' + item.id}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-0.5 shrink-0 ml-1">
						<Button
							className={cn(
								'h-7 w-7 transition-all',
								'isFavorite' in item && item.isFavorite ? 'text-destructive bg-destructive/10' : 'opacity-40 hover:opacity-100'
							)}
							size="icon"
							variant="ghost"
						>
							<Heart className={cn('h-3.5 w-3.5', 'isFavorite' in item && item.isFavorite && 'fill-current')} />
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button className="h-7 w-7 opacity-40 hover:opacity-100" size="icon" variant="ghost">
									<MoreVertical className="h-3.5 w-3.5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48 shadow-xl border-border/40">
								<DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.1em] opacity-40">Acciones</DropdownMenuLabel>
								<DropdownMenuItem className="text-xs font-medium" onClick={handleOpenInFolder}>
									<FolderOpen className="mr-2 h-3.5 w-3.5 opacity-60" /> Abrir Carpeta
								</DropdownMenuItem>
								<DropdownMenuItem className="text-xs font-medium" onClick={handleCopyImage}>
									<Copy className="mr-2 h-3.5 w-3.5 opacity-60" /> Copiar Imagen
								</DropdownMenuItem>
								<DropdownMenuSeparator className="opacity-40" />
								<DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.1em] opacity-40">Herramientas</DropdownMenuLabel>
								<DropdownMenuItem className="text-xs font-medium" onClick={() => refetch()}>
									<RefreshCw className={cn('mr-2 h-3.5 w-3.5 opacity-60', effectiveLoading && 'animate-spin')} />
									Extraer Metadata
								</DropdownMenuItem>
								<DropdownMenuItem className="text-xs font-medium" onClick={() => exportMetadata?.('json')}>
									<FileJson className="mr-2 h-3.5 w-3.5 opacity-60" /> Exportar JSON
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</header>

			<div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-muted/5 min-w-0 w-full">
				{/* HERO SECTION - ADAPTIVE */}
				<div className="relative group w-full bg-black/5 border-b overflow-hidden flex items-center justify-center min-h-[150px] max-h-[350px]">
					{mainImageUrl ? (
						<>
							<ImageFallback
								alt={itemName}
								className="w-full h-full object-contain transition-all duration-700 group-hover:scale-105"
								src={mainImageUrl}
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
							<div className="absolute bottom-2 inset-x-2 flex items-center justify-center gap-1.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
								<Button className="h-6 px-2 rounded-md bg-background/90 backdrop-blur shadow-xl text-[8px] font-black border-none uppercase tracking-wider flex-1 min-w-0" onClick={handleDownload} size="sm">
									<Download className="mr-1 h-2.5 w-2.5 shrink-0" /> <span className="truncate">GUARDAR</span>
								</Button>
								<Button className="h-6 px-2 rounded-md bg-background/90 backdrop-blur shadow-xl text-[8px] font-black border-none uppercase tracking-wider flex-1 min-w-0" size="sm">
									<Fullscreen className="mr-1 h-2.5 w-2.5 shrink-0" /> <span className="truncate">ZOOM</span>
								</Button>
							</div>
						</>
					) : (
						<div className="flex flex-col items-center gap-3 text-muted-foreground/10 py-12">
							<EntityIcon className="h-10 w-10" />
							<span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50 text-center px-4">Preview unavailable</span>
						</div>
					)}
				</div>

				<div className="p-3 sm:p-4 space-y-4 sm:space-y-5 min-w-0 w-full overflow-hidden">
					{/* RELATIONS - WRAPPABLE */}
					{relatedEntities.length > 0 && (
						<div className="flex flex-wrap gap-1 w-full min-w-0 overflow-hidden">
							{relatedEntities.map(({ type, count, icon: Icon, color }) => (
								<div className={cn('h-5 px-1.5 rounded-md flex items-center gap-1 text-[9px] font-black uppercase border-none tracking-tight shrink-0', color)} key={type}>
									<Icon className="h-2.5 w-2.5 shrink-0" /> <span>{count}</span>
								</div>
							))}
						</div>
					)}

					{/* DESCRIPTION - FLEXIBLE */}
					{'description' in item && item.description && (
						<div className="space-y-1 pl-2.5 border-l-2 border-primary/20 bg-primary/[0.02] py-1.5 rounded-r-md min-w-0 w-full overflow-hidden">
							<Label className="text-[8px] font-black uppercase tracking-[0.15em] text-primary opacity-60">Descripción</Label>
							<p className="text-[11px] leading-snug text-foreground/80 font-medium italic break-words">{item.description}</p>
						</div>
					)}

					{/* ACCORDION - REFINED TRIGGER FOR NARROW SPACE */}
					<Accordion className="w-full space-y-1.5" defaultValue={['ai', 'general']} type="multiple">
						{(effectiveEnhanced.length > 0 || effectiveLoading || effectiveError) && (
							<AccordionItem className="border-none bg-card/40 rounded-lg overflow-hidden border border-border/5" value="ai">
								<AccordionTrigger className="px-2.5 hover:no-underline py-2 sm:py-2.5 hover:bg-muted/30 transition-colors group">
									<div className="flex items-center gap-2 min-w-0 w-full text-left">
										<div className="rounded-md bg-amber-500/10 p-1 shrink-0 group-data-[state=open]:bg-amber-500/20 transition-colors">
											<Zap className="h-3.5 w-3.5 text-amber-500" />
										</div>
										<span className="text-[9.5px] font-black uppercase tracking-tight truncate flex-1 min-w-0">IA & Generación</span>
										{effectiveLoading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground mr-1 shrink-0" />}
									</div>
								</AccordionTrigger>
								<AccordionContent className="px-1.5 pb-2.5 pt-0 min-w-0 w-full overflow-hidden">
									{metaLoading ? (
										<div className="py-8 flex flex-col items-center justify-center gap-3">
											<RefreshCw className="h-5 w-5 animate-spin text-primary/40" />
											<p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] animate-pulse">Scanning...</p>
										</div>
									) : (
										aiSection
									)}
								</AccordionContent>
							</AccordionItem>
						)}

						<AccordionItem className="border-none bg-card/40 rounded-lg overflow-hidden border border-border/5" value="general">
							<AccordionTrigger className="px-2.5 hover:no-underline py-2 sm:py-2.5 hover:bg-muted/30 transition-colors group">
								<div className="flex items-center gap-2 min-w-0 w-full text-left">
									<div className="rounded-md bg-blue-500/10 p-1 shrink-0 group-data-[state=open]:bg-blue-500/20 transition-colors">
										<Info className="h-3.5 w-3.5 text-blue-500" />
									</div>
									<span className="text-[9.5px] font-black uppercase tracking-tight truncate flex-1 min-w-0">Propiedades</span>
								</div>
							</AccordionTrigger>
							<AccordionContent className="px-1.5 pb-2.5 pt-0 min-w-0 w-full overflow-hidden">
								<MetadataTable
									dense
									rows={basicMetadata.map(({ key, value, icon: Icon }) => ({
										icon: Icon,
										label: key,
										value: value,
									}))}
								/>
							</AccordionContent>
						</AccordionItem>

						{(groupedMetadata.exif || groupedMetadata.iptc || groupedMetadata.xmp) && (
							<AccordionItem className="border-none bg-card/40 rounded-lg overflow-hidden border border-border/5" value="technical">
								<AccordionTrigger className="px-2.5 hover:no-underline py-2 sm:py-2.5 hover:bg-muted/30 transition-colors group">
									<div className="flex items-center gap-2 min-w-0 w-full text-left">
										<div className="rounded-md bg-emerald-500/10 p-1 shrink-0 group-data-[state=open]:bg-emerald-500/20 transition-colors">
											<Camera className="h-3.5 w-3.5 text-emerald-500" />
										</div>
										<span className="text-[9.5px] font-black uppercase tracking-tight truncate flex-1 min-w-0">Técnico</span>
									</div>
								</AccordionTrigger>
								<AccordionContent className="px-1.5 pb-2.5 pt-0 space-y-2 min-w-0 w-full overflow-hidden">
									{['exif', 'iptc', 'xmp'].map((cat) => {
										const items = groupedMetadata[cat];
										if (!items || items.length === 0) return null;
										const catLabels: Record<string, { label: string; icon: any; color: string }> = {
											exif: { label: 'Cámara', icon: Camera, color: 'text-emerald-500' },
											iptc: { label: 'Editorial', icon: Tag, color: 'text-blue-500' },
											xmp: { label: 'XMP', icon: Hash, color: 'text-purple-500' },
										};
										const info = catLabels[cat];
										return (
											<MetadataTable
												dense
												key={cat}
												multiColumn
												rows={items.map((it) => ({ label: it.key, value: it.value, compact: true }))}
												title={
													<div className="flex items-center gap-2 min-w-0 overflow-hidden">
														<info.icon className={cn('h-2.5 w-2.5 shrink-0', info.color)} /> <span className="truncate">{info.label}</span>
													</div>
												}
											/>
										);
									})}
								</AccordionContent>
							</AccordionItem>
						)}
					</Accordion>
				</div>
			</div>

			<footer className="border-t bg-background/95 backdrop-blur px-3 py-2.5 shrink-0 min-w-0 w-full overflow-hidden">
				<div className="flex items-center gap-2 min-w-0 w-full">
					<Button className="flex-1 h-7 px-1 text-[8px] font-black uppercase tracking-tighter border-border/40 hover:bg-muted/50 min-w-0" variant="outline">
						<Share2 className="mr-1 h-3 w-3 shrink-0 opacity-60" /> <span className="truncate">COMPARTIR</span>
					</Button>
					<Button className="flex-1 h-7 px-1 text-[8px] font-black uppercase tracking-tighter border-border/40 hover:bg-muted/50 min-w-0" variant="outline">
						<ExternalLink className="mr-1 h-3 w-3 shrink-0 opacity-60" /> <span className="truncate">ABRIR</span>
					</Button>
				</div>
			</footer>
		</div>
	);
};
