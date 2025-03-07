'use client';

import { getImageUrl, updateImageStats } from '@/app/actions/image.actions';
import { parseMetadata } from '@/app/actions/metadata.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { cn, formatBytes, formatDate } from '@/lib/utils';
import { useFileManager } from '@/store/file-manager.store';
import { useImageViewer } from '@/store/image-viewer.store';
import type { FileItem, FileMetadata } from '@/types/file-item';
import {
	AlignLeft,
	Aperture,
	BookImage,
	Box,
	Bug,
	Calendar,
	Camera,
	Clock,
	Copy,
	Copyright,
	Dice5,
	Download,
	FileText,
	FileType,
	Flag,
	Focus,
	Folder,
	Gauge,
	GitBranch,
	GitGraph,
	HardDrive,
	Hash,
	Heading2,
	Heart,
	Image as ImageIcon,
	ImageOff,
	Info,
	Layers,
	Link,
	Loader2,
	Map as MapIcon,
	MapPin,
	Maximize2,
	MessageSquare,
	MessageSquareOff,
	MoreVertical,
	Mountain,
	Palette,
	Play,
	Plus,
	Scale,
	Scissors,
	Settings2,
	Share2,
	Shield,
	Star,
	TagIcon,
	Tags,
	Timer,
	Trash2,
	User2,
	Wand2,
	X,
} from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { StatsPanel } from '../stats/stats-panel';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useImageResources } from '@/store/image-resources.store';

interface InfoItemProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | boolean | undefined | null | Record<string, unknown>;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
	return (
		<div className="flex items-center justify-between text-sm">
			<div className="flex items-center gap-2">
				{icon}
				<span className="text-muted-foreground">{label}</span>
			</div>
			<span className="font-medium">{value?.toString() || 'N/A'}</span>
		</div>
	);
}

interface DetailsPanelProps {
	selectedItems: FileItem[];
	onClose?: () => void;
}

const getMetadata = (metadata: string | null): FileMetadata | null => {
	if (!metadata) {
		return null;
	}
	try {
		const parsed = JSON.parse(metadata);
		if (!parsed || typeof parsed !== 'object') {
			console.warn('Metadata inválida:', metadata);
			return null;
		}
		return parsed;
	} catch (error) {
		console.error('Error parseando metadata:', error);
		return null;
	}
};

// Configuración de carga de imágenes
const _LOAD_CONFIG = {
	batchSize: 5,
	retryAttempts: 3,
	retryDelay: 1000,
};

// Componente para la vista previa de imagen
const _ImagePreview = React.memo(function ImagePreview({
	item,
}: {
	item: FileItem;
}) {
	const { openViewer } = useImageViewer();
	const [imageUrl, setImageUrl] = React.useState<string | null>(null);
	const [error, setError] = React.useState<string | null>(null);
	const _metadata = React.useMemo(() => getMetadata(item.metadata), [item.metadata]);

	React.useEffect(() => {
		let mounted = true;

		const loadImage = async () => {
			try {
				const url = await getImageUrl(item.id);
				if (mounted && url) {
					setImageUrl(url);
				}
			} catch (error) {
				console.error('Error loading image:', error);
				if (mounted) {
					setError(error instanceof Error ? error.message : 'Error al cargar la imagen');
				}
			}
		};

		loadImage();

		return () => {
			mounted = false;
		};
	}, [item.id]);

	const handleClick = React.useCallback(() => {
		openViewer([item], 0);
	}, [item, openViewer]);

	if (error || !imageUrl) {
		return (
			<div className="flex items-center justify-center h-full bg-muted">
				<ImageOff className="h-8 w-8 text-muted-foreground" />
			</div>
		);
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					handleClick();
				}
			}}
			className="w-full h-full relative group outline-none"
			aria-label="Ver imagen"
		>
			<img src={imageUrl} alt={item.name} className="w-full h-full object-contain" loading="lazy" />
			<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
				<Maximize2 className="h-6 w-6 text-white" />
			</div>
		</button>
	);
});

// Componente optimizado para información básica
const _BasicInfo = React.memo(function BasicInfo({
	item,
	metadata,
}: {
	item: FileItem;
	metadata: FileMetadata | null;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<InfoItem icon={<FileText className="h-3.5 w-3.5 text-blue-400" />} label="Nombre" value={item.name} />
			<InfoItem
				icon={<ImageIcon className="h-3.5 w-3.5 text-green-400" />}
				label="Tipo"
				value={metadata?.mimeType?.split('/')[1] || 'Desconocido'}
			/>
			<InfoItem
				icon={<HardDrive className="h-3.5 w-3.5 text-purple-400" />}
				label="Tamaño"
				value={formatBytes(item.size)}
			/>
			{metadata?.dimensions && (
				<InfoItem
					icon={<Maximize2 className="h-3.5 w-3.5 text-yellow-400" />}
					label="Dimensiones"
					value={`${metadata.dimensions.width} × ${metadata.dimensions.height}`}
				/>
			)}
			{metadata?.colorSpace && (
				<InfoItem
					icon={<Palette className="h-3.5 w-3.5 text-orange-400" />}
					label="Espacio de color"
					value={metadata.colorSpace}
				/>
			)}
			{metadata?.hasAlpha && (
				<InfoItem icon={<Layers className="h-3.5 w-3.5 text-indigo-400" />} label="Canal alfa" value="Sí" />
			)}
			{metadata?.isAnimated && (
				<InfoItem icon={<Play className="h-3.5 w-3.5 text-pink-400" />} label="Animada" value="Sí" />
			)}
		</div>
	);
});

// Componente para entidades relacionadas
const _RelatedEntities = React.memo(function RelatedEntities({
	item,
}: {
	item: FileItem;
}) {
	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">Entidades relacionadas</h3>
			<div className="flex flex-col gap-1.5">
				{item.collections?.length > 0 && (
					<InfoItem
						icon={<BookImage className="h-3.5 w-3.5 text-blue-400" />}
						label="Colecciones"
						value={`${item.collections.length} ${item.collections.length === 1 ? 'colección' : 'colecciones'}`}
					/>
				)}
				{item.tags?.length > 0 && (
					<InfoItem
						icon={<TagIcon className="h-3.5 w-3.5 text-green-400" />}
						label="Etiquetas"
						value={`${item.tags.length} ${item.tags.length === 1 ? 'etiqueta' : 'etiquetas'}`}
					/>
				)}
				{item.albums?.length > 0 && (
					<InfoItem
						icon={<Camera className="h-3.5 w-3.5 text-purple-400" />}
						label="Álbumes"
						value={`${item.albums.length} ${item.albums.length === 1 ? 'álbum' : 'álbumes'}`}
					/>
				)}
				{item.characters?.length > 0 && (
					<InfoItem
						icon={<User2 className="h-3.5 w-3.5 text-yellow-400" />}
						label="Personajes"
						value={`${item.characters.length} ${item.characters.length === 1 ? 'personaje' : 'personajes'}`}
					/>
				)}
				{item.places?.length > 0 && (
					<InfoItem
						icon={<MapPin className="h-3.5 w-3.5 text-orange-400" />}
						label="Lugares"
						value={`${item.places.length} ${item.places.length === 1 ? 'lugar' : 'lugares'}`}
					/>
				)}
				{item.objects?.length > 0 && (
					<InfoItem
						icon={<Box className="h-3.5 w-3.5 text-indigo-400" />}
						label="Objetos"
						value={`${item.objects.length} ${item.objects.length === 1 ? 'objeto' : 'objetos'}`}
					/>
				)}
			</div>
		</div>
	);
});

// Componente optimizado para metadata de AI
const _AIGenerationInfo = React.memo(function AIGenerationInfo({
	metadata,
}: {
	metadata: FileMetadata | null;
}) {
	const { toast } = useToast();
	const [isPromptExpanded, setIsPromptExpanded] = useState(false);
	const [isNegativePromptExpanded, setIsNegativePromptExpanded] = useState(false);
	const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(false);

	if (!metadata?.generation) {
		return null;
	}

	const gen = metadata.generation;
	const isSD = gen.type === 'stable-diffusion';
	const isComfyUI = gen.type === 'comfyui';
	const isInvokeAI = gen.type === 'invoke-ai';
	const isNovelAI = gen.type === 'novel-ai';

	const truncateText = (text: string, maxLength = 150) => {
		if (text.length <= maxLength) {
			return text;
		}
		return `${text.slice(0, maxLength)}...`;
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<h3 className="text-xs font-medium text-muted-foreground">Información de Generación AI</h3>
				<Badge
					variant="outline"
					className={cn(
						'text-[10px] h-5 px-2',
						isSD && 'bg-blue-500/10 text-blue-500',
						isComfyUI && 'bg-green-500/10 text-green-500',
						isInvokeAI && 'bg-purple-500/10 text-purple-500',
						isNovelAI && 'bg-pink-500/10 text-pink-500'
					)}
				>
					{isSD && 'Stable Diffusion'}
					{isComfyUI && 'ComfyUI'}
					{isInvokeAI && 'InvokeAI'}
					{isNovelAI && 'NovelAI'}
				</Badge>
			</div>

			<div className="flex flex-col gap-1.5">
				{/* Prompt */}
				{gen.prompt && (
					<div className="flex flex-col gap-1">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<MessageSquare className="h-3.5 w-3.5 text-teal-400" />
								<span className="text-xs text-muted-foreground">Prompt</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 px-2"
								onClick={() => setIsPromptExpanded(!isPromptExpanded)}
							>
								{isPromptExpanded ? 'Colapsar' : 'Expandir'}
							</Button>
						</div>
						<div className={cn('text-xs bg-muted/30 p-2 rounded-sm', !isPromptExpanded && 'max-h-24 overflow-hidden')}>
							<p className="whitespace-pre-wrap break-words">
								{isPromptExpanded ? gen.prompt : truncateText(gen.prompt)}
							</p>
						</div>
					</div>
				)}

				{/* Prompt Negativo */}
				{gen.negative_prompt && (
					<div className="flex flex-col gap-1">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<MessageSquareOff className="h-3.5 w-3.5 text-rose-400" />
								<span className="text-xs text-muted-foreground">Prompt Negativo</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 px-2"
								onClick={() => setIsNegativePromptExpanded(!isNegativePromptExpanded)}
							>
								{isNegativePromptExpanded ? 'Colapsar' : 'Expandir'}
							</Button>
						</div>
						<div
							className={cn(
								'text-xs bg-muted/30 p-2 rounded-sm',
								!isNegativePromptExpanded && 'max-h-24 overflow-hidden'
							)}
						>
							<p className="whitespace-pre-wrap break-words">
								{isNegativePromptExpanded ? gen.negative_prompt : truncateText(gen.negative_prompt)}
							</p>
						</div>
					</div>
				)}

				{/* Modelo */}
				{gen.model && <InfoItem icon={<Box className="h-3.5 w-3.5 text-sky-400" />} label="Modelo" value={gen.model} />}

				{/* Parámetros */}
				<div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
					{gen.steps && (
						<InfoItem icon={<GitBranch className="h-3.5 w-3.5 text-lime-400" />} label="Pasos" value={gen.steps} />
					)}
					{(gen.cfg_scale || gen.cfg) && (
						<InfoItem
							icon={<Scale className="h-3.5 w-3.5 text-fuchsia-400" />}
							label="CFG"
							value={gen.cfg_scale || gen.cfg}
						/>
					)}
					{gen.seed && (
						<InfoItem icon={<Dice5 className="h-3.5 w-3.5 text-amber-400" />} label="Semilla" value={gen.seed} />
					)}
					{gen.sampler && (
						<InfoItem icon={<Gauge className="h-3.5 w-3.5 text-indigo-400" />} label="Sampler" value={gen.sampler} />
					)}
					{gen.scheduler && (
						<InfoItem
							icon={<Timer className="h-3.5 w-3.5 text-purple-400" />}
							label="Scheduler"
							value={gen.scheduler}
						/>
					)}
					{isSD && gen.clip_skip && (
						<InfoItem
							icon={<Scissors className="h-3.5 w-3.5 text-orange-400" />}
							label="CLIP Skip"
							value={gen.clip_skip}
						/>
					)}
				</div>

				{/* Workflow (ComfyUI) */}
				{isComfyUI && gen.workflow && (
					<div className="flex flex-col gap-1">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<GitGraph className="h-3.5 w-3.5 text-blue-400" />
								<span className="text-xs text-muted-foreground">Workflow</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 px-2"
								onClick={() => setIsWorkflowExpanded(!isWorkflowExpanded)}
							>
								{isWorkflowExpanded ? 'Colapsar' : 'Expandir'}
							</Button>
						</div>
						<div
							className={cn('text-xs bg-muted/30 p-2 rounded-sm', !isWorkflowExpanded && 'max-h-32 overflow-hidden')}
						>
							<pre className="whitespace-pre-wrap break-all">
								{isWorkflowExpanded ? gen.workflow : truncateText(gen.workflow, 300)}
							</pre>
						</div>
					</div>
				)}

				{/* Parámetros adicionales */}
				{gen.extra_params && Object.keys(gen.extra_params).length > 0 && (
					<div className="mt-2">
						<h4 className="text-xs font-medium text-muted-foreground mb-1">Parámetros adicionales</h4>
						<div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
							{Object.entries(gen.extra_params).map(([key, value]) => (
								<InfoItem
									key={key}
									icon={<Settings2 className="h-3.5 w-3.5 text-neutral-400" />}
									label={key}
									value={value}
								/>
							))}
						</div>
					</div>
				)}

				{/* Metadata completa */}
				<div className="mt-2">
					<Button
						variant="ghost"
						size="sm"
						className="w-full text-xs"
						onClick={() => {
							navigator.clipboard.writeText(JSON.stringify(gen));
							toast({
								title: 'Copiado',
								description: 'Metadata copiada al portapapeles',
							});
						}}
					>
						<Copy className="h-3.5 w-3.5 mr-2" />
						Copiar metadata completa
					</Button>
				</div>
			</div>
		</div>
	);
});

// Componente para metadata XMP
const _XMPInfo = React.memo(function XMPInfo({
	metadata,
}: {
	metadata: FileMetadata | null;
}) {
	if (!metadata?.xmp) {
		return null;
	}

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">Información XMP</h3>
			<div className="flex flex-col gap-1.5">
				{metadata.xmp.title && (
					<InfoItem
						icon={<FileText className="h-3.5 w-3.5 text-blue-400" />}
						label="Título"
						value={metadata.xmp.title}
					/>
				)}
				{metadata.xmp.creator && (
					<InfoItem
						icon={<User2 className="h-3.5 w-3.5 text-green-400" />}
						label="Creador"
						value={metadata.xmp.creator}
					/>
				)}
				{metadata.xmp.rights && (
					<InfoItem
						icon={<Shield className="h-3.5 w-3.5 text-red-400" />}
						label="Derechos"
						value={metadata.xmp.rights}
					/>
				)}
				{metadata.xmp.subject && metadata.xmp.subject.length > 0 && (
					<InfoItem
						icon={<Tags className="h-3.5 w-3.5 text-purple-400" />}
						label="Temas"
						value={metadata.xmp.subject.join(', ')}
					/>
				)}
				{metadata.xmp.rating !== undefined && (
					<InfoItem
						icon={<Star className="h-3.5 w-3.5 text-yellow-400" />}
						label="Valoración"
						value={metadata.xmp.rating}
					/>
				)}
			</div>
		</div>
	);
});

// Componente para metadata IPTC
const _IPTCInfo = React.memo(function IPTCInfo({
	metadata,
}: {
	metadata: FileMetadata | null;
}) {
	if (!metadata?.iptc) {
		return null;
	}

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">Información IPTC</h3>
			<div className="flex flex-col gap-1.5">
				{metadata.iptc.headline && (
					<InfoItem
						icon={<Heading2 className="h-3.5 w-3.5 text-blue-400" />}
						label="Titular"
						value={metadata.iptc.headline}
					/>
				)}
				{metadata.iptc.caption && (
					<InfoItem
						icon={<AlignLeft className="h-3.5 w-3.5 text-green-400" />}
						label="Descripción"
						value={metadata.iptc.caption}
					/>
				)}
				{metadata.iptc.keywords && metadata.iptc.keywords.length > 0 && (
					<InfoItem
						icon={<Hash className="h-3.5 w-3.5 text-purple-400" />}
						label="Palabras clave"
						value={metadata.iptc.keywords.join(', ')}
					/>
				)}
				{metadata.iptc.copyright && (
					<InfoItem
						icon={<Copyright className="h-3.5 w-3.5 text-red-400" />}
						label="Copyright"
						value={metadata.iptc.copyright}
					/>
				)}
				{metadata.iptc.source && (
					<InfoItem icon={<Link className="h-3.5 w-3.5 text-cyan-400" />} label="Fuente" value={metadata.iptc.source} />
				)}
			</div>
		</div>
	);
});

// Componente para metadata EXIF
const _ExifInfo = React.memo(function ExifInfo({
	metadata,
}: {
	metadata: FileMetadata | null;
}) {
	if (!metadata?.exif) {
		return null;
	}

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">Información EXIF</h3>
			<div className="flex flex-col gap-1.5">
				{metadata.exif.make && (
					<InfoItem
						icon={<Box className="h-3.5 w-3.5 text-indigo-400" />}
						label="Fabricante"
						value={metadata.exif.make}
					/>
				)}
				{metadata.exif.model && (
					<InfoItem
						icon={<Camera className="h-3.5 w-3.5 text-pink-400" />}
						label="Modelo"
						value={metadata.exif.model}
					/>
				)}
				{metadata.exif.software && (
					<InfoItem
						icon={<Layers className="h-3.5 w-3.5 text-cyan-400" />}
						label="Software"
						value={metadata.exif.software}
					/>
				)}
				{metadata.exif.dateTime && (
					<InfoItem
						icon={<Calendar className="h-3.5 w-3.5 text-orange-400" />}
						label="Fecha"
						value={formatDate(metadata.exif.dateTime)}
					/>
				)}
				{metadata.exif.exposureTime && (
					<InfoItem
						icon={<Timer className="h-3.5 w-3.5 text-red-400" />}
						label="Tiempo de exposición"
						value={`${metadata.exif.exposureTime}s`}
					/>
				)}
				{metadata.exif.fNumber && (
					<InfoItem
						icon={<Aperture className="h-3.5 w-3.5 text-emerald-400" />}
						label="Apertura"
						value={`f/${metadata.exif.fNumber}`}
					/>
				)}
				{metadata.exif.iso && (
					<InfoItem icon={<Scale className="h-3.5 w-3.5 text-violet-400" />} label="ISO" value={metadata.exif.iso} />
				)}
				{metadata.exif.focalLength && (
					<InfoItem
						icon={<Focus className="h-3.5 w-3.5 text-amber-400" />}
						label="Distancia focal"
						value={`${metadata.exif.focalLength}mm`}
					/>
				)}
				{metadata.exif.lens && (
					<InfoItem icon={<Camera className="h-3.5 w-3.5 text-teal-400" />} label="Lente" value={metadata.exif.lens} />
				)}
				{metadata.exif.copyright && (
					<InfoItem
						icon={<Copyright className="h-3.5 w-3.5 text-red-400" />}
						label="Copyright"
						value={metadata.exif.copyright}
					/>
				)}
				{metadata.exif.artist && (
					<InfoItem
						icon={<User2 className="h-3.5 w-3.5 text-purple-400" />}
						label="Artista"
						value={metadata.exif.artist}
					/>
				)}
				{metadata.exif.description && (
					<InfoItem
						icon={<FileText className="h-3.5 w-3.5 text-blue-400" />}
						label="Descripción"
						value={metadata.exif.description}
					/>
				)}
			</div>
		</div>
	);
});

// Componente para información GPS
const _GPSInfo = React.memo(function GPSInfo({
	metadata,
}: {
	metadata: FileMetadata | null;
}) {
	if (!metadata?.exif?.gps) {
		return null;
	}

	const { latitude, longitude, altitude } = metadata.exif.gps;
	const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">Información GPS</h3>
			<div className="flex flex-col gap-1.5">
				<InfoItem icon={<MapPin className="h-3.5 w-3.5 text-red-400" />} label="Latitud" value={latitude.toFixed(6)} />
				<InfoItem
					icon={<MapPin className="h-3.5 w-3.5 text-blue-400" />}
					label="Longitud"
					value={longitude.toFixed(6)}
				/>
				{altitude !== undefined && (
					<InfoItem
						icon={<Mountain className="h-3.5 w-3.5 text-green-400" />}
						label="Altitud"
						value={`${altitude.toFixed(1)}m`}
					/>
				)}
				<Button variant="ghost" size="sm" className="mt-1" onClick={() => window.open(mapsUrl, '_blank')}>
					<MapIcon className="h-3.5 w-3.5 mr-2" />
					Ver en Google Maps
				</Button>
			</div>
		</div>
	);
});

// Componente para información técnica de la imagen
const _TechnicalInfo = React.memo(function TechnicalInfo({
	metadata,
}: {
	metadata: FileMetadata | null;
}) {
	if (!metadata) {
		return null;
	}

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">Información Técnica</h3>
			<div className="flex flex-col gap-1.5">
				{metadata.mimeType && (
					<InfoItem
						icon={<FileType className="h-3.5 w-3.5 text-blue-400" />}
						label="Formato"
						value={metadata.mimeType.split('/')[1].toUpperCase()}
					/>
				)}
				{metadata.dimensions && (
					<InfoItem
						icon={<Maximize2 className="h-3.5 w-3.5 text-green-400" />}
						label="Dimensiones"
						value={`${metadata.dimensions.width} × ${metadata.dimensions.height}`}
					/>
				)}
			</div>
		</div>
	);
});

/**
 * Panel de detalles para mostrar información de imágenes seleccionadas
 */
export function DetailsPanel({ selectedItems }: DetailsPanelProps) {
	// Solo mostramos información de un ítem a la vez
	const item = selectedItems[0];
	const [metadata, setMetadata] = React.useState<FileMetadata | null>(null);
	const [isProcessing, setIsProcessing] = React.useState(false);
	const { toast } = useToast();

	// Efecto para cargar metadata cuando cambia el ítem seleccionado
	React.useEffect(() => {
		if (!item) {
			return;
		}

		let mounted = true;
		setIsProcessing(true);

		const loadMetadata = async () => {
			try {
				// Si ya tenemos metadata en el ítem, la usamos
				if (item.metadata) {
					setMetadata(getMetadata(item.metadata));
					setIsProcessing(false);
					return;
				}

				// Si no tenemos metadata, intentamos parsearla
				const result = await parseMetadata(item.id);
				if (mounted) {
					setMetadata(result);
					// Actualizamos estadísticas de vistas
					updateImageStats(item.id, { views: (item.stats?.views || 0) + 1 });
				}
			} catch (error) {
				if (mounted) {
					console.error('Error cargando metadata:', error);
					toast({
						title: 'Error',
						description: 'No se pudo cargar la información de la imagen',
						variant: 'destructive',
					});
				}
			} finally {
				if (mounted) {
					setIsProcessing(false);
				}
			}
		};

		loadMetadata();

		return () => {
			mounted = false;
		};
	}, [item, toast]);

	if (!item) {
		return null;
	}

	return (
		<ScrollArea className="h-full">
			<div className="flex flex-col gap-4 p-3">
				{/* Sección de vista previa de imagen */}
				<Card className="overflow-hidden">
					<div className="aspect-video bg-black">
						<_ImagePreview item={item} />
					</div>
				</Card>

				{/* Sección de información básica */}
				<Card>
					<CardContent className="p-4">
						<div className="flex flex-col gap-4">
							<_BasicInfo item={item} metadata={metadata} />
							<_RelatedEntities item={item} />
							{metadata && (
								<>
									<_AIGenerationInfo metadata={metadata} />
									<_XMPInfo metadata={metadata} />
									<_IPTCInfo metadata={metadata} />
									<_ExifInfo metadata={metadata} />
									<_GPSInfo metadata={metadata} />
									<_TechnicalInfo metadata={metadata} />
								</>
							)}
							{isProcessing && (
								<div className="flex justify-center py-2">
									<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</ScrollArea>
	);
}
