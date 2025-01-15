"use client";

import * as React from "react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FileItem, FileMetadata } from "@/types/file-item";
import { useImageViewer } from "@/store/image-viewer.store";
import {
	ImageOff,
	Info,
	Maximize2,
	Folder,
	Download,
	Copy,
	Heart,
	Flag,
	Trash2,
	FileText,
	Calendar,
	Image as ImageIcon,
	Clock,
	Play,
	X,
	Bug,
	HardDrive,
	GitBranch,
	Wand2,
	Box,
	MessageSquare,
	MessageSquareOff,
	Aperture,
	Scale,
	Focus,
	Timer,
	Camera,
	Layers,
	Palette,
	Gauge,
	Dice5,
	Share2,
	Plus,
	BookImage,
	TagIcon,
	User2,
	MapPin,
	MoreVertical,
	Scissors,
	GitGraph,
	Settings2,
	Shield,
	Tags,
	Star,
	Map,
	Mountain,
	AlignLeft,
	Hash,
	Copyright,
	Link,
	FileType,
	Heading2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatsPanel } from "../stats/stats-panel";
import { useToast } from "@/components/ui/use-toast";
import { updateImageStats, getImageUrl } from "@/app/actions/image.actions";
import { useFileManager } from "@/store/file-manager.store";
import { formatDate, formatBytes, cn } from "@/lib/utils";
import { parseMetadata } from "@/lib/metadata-parser";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useImageResources } from "@/store/image-resources.store";

interface InfoItemProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | boolean | undefined | null | any;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
	return (
		<div className="flex items-center justify-between text-sm">
			<div className="flex items-center gap-2">
				{icon}
				<span className="text-muted-foreground">{label}</span>
			</div>
			<span className="font-medium">{value?.toString() || "N/A"}</span>
		</div>
	);
}

interface DetailsPanelProps {
	selectedItems: FileItem[];
	onClose?: () => void;
}

const getMetadata = (metadata: string | null): FileMetadata | null => {
	if (!metadata) return null;
	try {
		const parsed = JSON.parse(metadata);
		if (!parsed || typeof parsed !== "object") {
			console.warn("Metadata inválida:", metadata);
			return null;
		}
		return parsed;
	} catch (error) {
		console.error("Error parseando metadata:", error);
		return null;
	}
};

// Configuración de carga de imágenes
const LOAD_CONFIG = {
	batchSize: 5,
	retryAttempts: 3,
	retryDelay: 1000,
};

// Componente para la vista previa de imagen
const ImagePreview = React.memo(function ImagePreview({
	item,
}: {
	item: FileItem;
}) {
	const { openViewer } = useImageViewer();
	const [imageUrl, setImageUrl] = React.useState<string | null>(null);
	const [error, setError] = React.useState<string | null>(null);
	const metadata = React.useMemo(
		() => getMetadata(item.metadata),
		[item.metadata]
	);

	React.useEffect(() => {
		let mounted = true;

		const loadImage = async () => {
			try {
				const url = await getImageUrl(item.id);
				if (mounted && url) {
					setImageUrl(url);
				}
			} catch (error) {
				console.error("Error loading image:", error);
				if (mounted) {
					setError(
						error instanceof Error ? error.message : "Error al cargar la imagen"
					);
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
		<div
			className="relative w-full h-full cursor-pointer group"
			onClick={handleClick}
		>
			<img
				src={imageUrl}
				alt={item.name}
				className="w-full h-full object-contain"
				loading="lazy"
			/>
			<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
				<Maximize2 className="h-6 w-6 text-white" />
			</div>
		</div>
	);
});

// Componente optimizado para información básica
const BasicInfo = React.memo(function BasicInfo({
	item,
	metadata,
}: {
	item: FileItem;
	metadata: FileMetadata | null;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<InfoItem
				icon={<FileText className="h-3.5 w-3.5 text-blue-400" />}
				label="Nombre"
				value={item.name}
			/>
			<InfoItem
				icon={<ImageIcon className="h-3.5 w-3.5 text-green-400" />}
				label="Tipo"
				value={metadata?.mimeType?.split("/")[1] || "Desconocido"}
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
				<InfoItem
					icon={<Layers className="h-3.5 w-3.5 text-indigo-400" />}
					label="Canal alfa"
					value="Sí"
				/>
			)}
			{metadata?.isAnimated && (
				<InfoItem
					icon={<Play className="h-3.5 w-3.5 text-pink-400" />}
					label="Animada"
					value="Sí"
				/>
			)}
		</div>
	);
});

// Componente para entidades relacionadas
const RelatedEntities = React.memo(function RelatedEntities({
	item,
}: {
	item: FileItem;
}) {
	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">
				Entidades relacionadas
			</h3>
			<div className="flex flex-col gap-1.5">
				{item.collections?.length > 0 && (
					<InfoItem
						icon={<BookImage className="h-3.5 w-3.5 text-blue-400" />}
						label="Colecciones"
						value={`${item.collections.length} ${
							item.collections.length === 1 ? "colección" : "colecciones"
						}`}
					/>
				)}
				{item.tags?.length > 0 && (
					<InfoItem
						icon={<TagIcon className="h-3.5 w-3.5 text-green-400" />}
						label="Etiquetas"
						value={`${item.tags.length} ${
							item.tags.length === 1 ? "etiqueta" : "etiquetas"
						}`}
					/>
				)}
				{item.albums?.length > 0 && (
					<InfoItem
						icon={<Camera className="h-3.5 w-3.5 text-purple-400" />}
						label="Álbumes"
						value={`${item.albums.length} ${
							item.albums.length === 1 ? "álbum" : "álbumes"
						}`}
					/>
				)}
				{item.characters?.length > 0 && (
					<InfoItem
						icon={<User2 className="h-3.5 w-3.5 text-yellow-400" />}
						label="Personajes"
						value={`${item.characters.length} ${
							item.characters.length === 1 ? "personaje" : "personajes"
						}`}
					/>
				)}
				{item.places?.length > 0 && (
					<InfoItem
						icon={<MapPin className="h-3.5 w-3.5 text-orange-400" />}
						label="Lugares"
						value={`${item.places.length} ${
							item.places.length === 1 ? "lugar" : "lugares"
						}`}
					/>
				)}
				{item.objects?.length > 0 && (
					<InfoItem
						icon={<Box className="h-3.5 w-3.5 text-indigo-400" />}
						label="Objetos"
						value={`${item.objects.length} ${
							item.objects.length === 1 ? "objeto" : "objetos"
						}`}
					/>
				)}
			</div>
		</div>
	);
});

// Componente optimizado para metadata de AI
const AIGenerationInfo = React.memo(function AIGenerationInfo({
	metadata,
}: {
	metadata: FileMetadata | null;
}) {
	const { toast } = useToast();
	const [isPromptExpanded, setIsPromptExpanded] = useState(false);
	const [isNegativePromptExpanded, setIsNegativePromptExpanded] =
		useState(false);
	const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(false);

	if (!metadata?.generation) return null;

	const gen = metadata.generation;
	const isSD = gen.type === "stable-diffusion";
	const isComfyUI = gen.type === "comfyui";
	const isInvokeAI = gen.type === "invoke-ai";
	const isNovelAI = gen.type === "novel-ai";

	const truncateText = (text: string, maxLength: number = 150) => {
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength) + "...";
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<h3 className="text-xs font-medium text-muted-foreground">
					Información de Generación AI
				</h3>
				<Badge
					variant="outline"
					className={cn(
						"text-[10px] h-5 px-2",
						isSD && "bg-blue-500/10 text-blue-500",
						isComfyUI && "bg-green-500/10 text-green-500",
						isInvokeAI && "bg-purple-500/10 text-purple-500",
						isNovelAI && "bg-pink-500/10 text-pink-500"
					)}
				>
					{isSD && "Stable Diffusion"}
					{isComfyUI && "ComfyUI"}
					{isInvokeAI && "InvokeAI"}
					{isNovelAI && "NovelAI"}
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
								{isPromptExpanded ? "Colapsar" : "Expandir"}
							</Button>
						</div>
						<div
							className={cn(
								"text-xs bg-muted/30 p-2 rounded-sm",
								!isPromptExpanded && "max-h-24 overflow-hidden"
							)}
						>
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
								<span className="text-xs text-muted-foreground">
									Prompt Negativo
								</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 px-2"
								onClick={() =>
									setIsNegativePromptExpanded(!isNegativePromptExpanded)
								}
							>
								{isNegativePromptExpanded ? "Colapsar" : "Expandir"}
							</Button>
						</div>
						<div
							className={cn(
								"text-xs bg-muted/30 p-2 rounded-sm",
								!isNegativePromptExpanded && "max-h-24 overflow-hidden"
							)}
						>
							<p className="whitespace-pre-wrap break-words">
								{isNegativePromptExpanded ?
									gen.negative_prompt
								:	truncateText(gen.negative_prompt)}
							</p>
						</div>
					</div>
				)}

				{/* Modelo */}
				{gen.model && (
					<InfoItem
						icon={<Box className="h-3.5 w-3.5 text-sky-400" />}
						label="Modelo"
						value={gen.model}
					/>
				)}

				{/* Parámetros */}
				<div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
					{gen.steps && (
						<InfoItem
							icon={<GitBranch className="h-3.5 w-3.5 text-lime-400" />}
							label="Pasos"
							value={gen.steps}
						/>
					)}
					{(gen.cfg_scale || gen.cfg) && (
						<InfoItem
							icon={<Scale className="h-3.5 w-3.5 text-fuchsia-400" />}
							label="CFG"
							value={gen.cfg_scale || gen.cfg}
						/>
					)}
					{gen.seed && (
						<InfoItem
							icon={<Dice5 className="h-3.5 w-3.5 text-amber-400" />}
							label="Semilla"
							value={gen.seed}
						/>
					)}
					{gen.sampler && (
						<InfoItem
							icon={<Gauge className="h-3.5 w-3.5 text-indigo-400" />}
							label="Sampler"
							value={gen.sampler}
						/>
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
								{isWorkflowExpanded ? "Colapsar" : "Expandir"}
							</Button>
						</div>
						<div
							className={cn(
								"text-xs bg-muted/30 p-2 rounded-sm",
								!isWorkflowExpanded && "max-h-32 overflow-hidden"
							)}
						>
							<pre className="whitespace-pre-wrap break-all">
								{isWorkflowExpanded ?
									gen.workflow
								:	truncateText(gen.workflow, 300)}
							</pre>
						</div>
					</div>
				)}

				{/* Parámetros adicionales */}
				{gen.extra_params && Object.keys(gen.extra_params).length > 0 && (
					<div className="mt-2">
						<h4 className="text-xs font-medium text-muted-foreground mb-1">
							Parámetros adicionales
						</h4>
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
								title: "Copiado",
								description: "Metadata copiada al portapapeles",
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
const XMPInfo = React.memo(function XMPInfo({
	metadata,
}: {
	metadata: FileMetadata | null;
}) {
	if (!metadata?.xmp) return null;

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">
				Información XMP
			</h3>
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
						value={metadata.xmp.subject.join(", ")}
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
const IPTCInfo = React.memo(function IPTCInfo({
	metadata,
}: {
	metadata: FileMetadata | null;
}) {
	if (!metadata?.iptc) return null;

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">
				Información IPTC
			</h3>
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
						value={metadata.iptc.keywords.join(", ")}
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
					<InfoItem
						icon={<Link className="h-3.5 w-3.5 text-cyan-400" />}
						label="Fuente"
						value={metadata.iptc.source}
					/>
				)}
			</div>
		</div>
	);
});

// Componente para metadata EXIF
const ExifInfo = React.memo(function ExifInfo({
	metadata,
}: {
	metadata: FileMetadata | null;
}) {
	if (!metadata?.exif) return null;

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">
				Información EXIF
			</h3>
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
					<InfoItem
						icon={<Scale className="h-3.5 w-3.5 text-violet-400" />}
						label="ISO"
						value={metadata.exif.iso}
					/>
				)}
				{metadata.exif.focalLength && (
					<InfoItem
						icon={<Focus className="h-3.5 w-3.5 text-amber-400" />}
						label="Distancia focal"
						value={`${metadata.exif.focalLength}mm`}
					/>
				)}
				{metadata.exif.lens && (
					<InfoItem
						icon={<Camera className="h-3.5 w-3.5 text-teal-400" />}
						label="Lente"
						value={metadata.exif.lens}
					/>
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
const GPSInfo = React.memo(function GPSInfo({
	metadata,
}: {
	metadata: FileMetadata | null;
}) {
	if (!metadata?.exif?.gps) return null;

	const { latitude, longitude, altitude } = metadata.exif.gps;
	const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">
				Información GPS
			</h3>
			<div className="flex flex-col gap-1.5">
				<InfoItem
					icon={<MapPin className="h-3.5 w-3.5 text-red-400" />}
					label="Latitud"
					value={latitude.toFixed(6)}
				/>
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
				<Button
					variant="ghost"
					size="sm"
					className="mt-1"
					onClick={() => window.open(mapsUrl, "_blank")}
				>
					<Map className="h-3.5 w-3.5 mr-2" />
					Ver en Google Maps
				</Button>
			</div>
		</div>
	);
});

// Componente para información técnica de la imagen
const TechnicalInfo = React.memo(function TechnicalInfo({
	metadata,
}: {
	metadata: FileMetadata | null;
}) {
	if (!metadata) return null;

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">
				Información Técnica
			</h3>
			<div className="flex flex-col gap-1.5">
				{metadata.mimeType && (
					<InfoItem
						icon={<FileType className="h-3.5 w-3.5 text-blue-400" />}
						label="Formato"
						value={metadata.mimeType.split("/")[1].toUpperCase()}
					/>
				)}
				{metadata.dimensions && (
					<InfoItem
						icon={<Maximize2 className="h-3.5 w-3.5 text-green-400" />}
						label="Dimensiones"
						value={`${metadata.dimensions.width} × ${metadata.dimensions.height}`}
					/>
				)}
				{metadata.colorSpace && (
					<InfoItem
						icon={<Palette className="h-3.5 w-3.5 text-purple-400" />}
						label="Espacio de color"
						value={metadata.colorSpace}
					/>
				)}
				{metadata.hasAlpha !== undefined && (
					<InfoItem
						icon={<Layers className="h-3.5 w-3.5 text-orange-400" />}
						label="Canal alfa"
						value={metadata.hasAlpha ? "Sí" : "No"}
					/>
				)}
				{metadata.isAnimated !== undefined && (
					<InfoItem
						icon={<Play className="h-3.5 w-3.5 text-pink-400" />}
						label="Animada"
						value={metadata.isAnimated ? "Sí" : "No"}
					/>
				)}
			</div>
		</div>
	);
});

// Componente para información del sistema
const SystemInfo = React.memo(function SystemInfo({
	item,
}: {
	item: FileItem;
}) {
	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">
				Información del sistema
			</h3>
			<div className="flex flex-col gap-1.5">
				<InfoItem
					icon={<Calendar className="h-3.5 w-3.5 text-blue-400" />}
					label="Creado"
					value={formatDate(item.createdAt)}
				/>
				<InfoItem
					icon={<Clock className="h-3.5 w-3.5 text-green-400" />}
					label="Modificado"
					value={formatDate(item.modifiedAt)}
				/>
				<InfoItem
					icon={<Clock className="h-3.5 w-3.5 text-yellow-400" />}
					label="Último acceso"
					value={formatDate(item.accessedAt)}
				/>
				<InfoItem
					icon={<HardDrive className="h-3.5 w-3.5 text-purple-400" />}
					label="Tamaño"
					value={formatBytes(item.size)}
				/>
				{item.folderId && (
					<InfoItem
						icon={<Folder className="h-3.5 w-3.5 text-orange-400" />}
						label="ID de Carpeta"
						value={item.folderId}
					/>
				)}
			</div>
		</div>
	);
});

// Actualizar el componente principal
export function DetailsPanel({ selectedItems, onClose }: DetailsPanelProps) {
	const [isMarked, setIsMarked] = React.useState(false);
	const imageResources = useImageResources();
	const { openViewer } = useImageViewer();
	const { toast } = useToast();
	const fileManager = useFileManager();

	// Memoizar metadata y selectedItem
	const selectedItem = selectedItems[0];
	const metadata = React.useMemo(() => {
		if (!selectedItem?.metadata) {
			console.warn("No hay metadata disponible para:", selectedItem?.name);
			return null;
		}

		console.log("🔍 Metadata raw:", selectedItem.metadata);

		try {
			const parsed = parseMetadata(selectedItem.metadata);
			console.log("✅ Metadata parseada:", {
				nombre: selectedItem.name,
				keys: parsed ? Object.keys(parsed) : [],
				metadata: parsed,
			});
			return parsed;
		} catch (error) {
			console.error("❌ Error parseando metadata:", {
				error,
				metadata: selectedItem.metadata,
			});
			return null;
		}
	}, [selectedItem?.metadata, selectedItem?.name]);

	// Memoizar handlers
	const handleAction = React.useCallback(
		async (action: string) => {
			if (!selectedItem) return;

			try {
				switch (action) {
					case "mark":
						setIsMarked(!isMarked);
						toast({
							title: isMarked ? "Desmarcado" : "Marcado",
							description: selectedItem.name,
						});
						break;
					case "favorite":
						// TODO: Implementar toggle favorito
						toast({
							title:
								selectedItem.isFavorite ?
									"Eliminado de favoritos"
								:	"Agregado a favoritos",
							description: selectedItem.name,
						});
						break;
					case "download":
						await updateImageStats(selectedItem.id, "download");
						toast({
							title: "Descarga iniciada",
							description: selectedItem.name,
						});
						break;
					case "share":
						// TODO: Implementar compartir
						toast({
							title: "Compartir",
							description: "Función no implementada",
						});
						break;
					case "delete":
						// TODO: Implementar eliminación
						toast({
							title: "Archivo eliminado",
							description: selectedItem.name,
						});
						break;
					default:
						break;
				}
			} catch (error) {
				console.error("Error ejecutando acción:", error);
				toast({
					title: "Error",
					description: "No se pudo completar la acción",
					variant: "destructive",
				});
			}
		},
		[selectedItem, isMarked, toast]
	);

	// Renderizado condicional optimizado
	if (!selectedItems.length) {
		return (
			<div className="flex-1 flex items-center justify-center p-4">
				<StatsPanel />
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			{/* Cabecera */}
			<div className="flex items-center justify-between p-4 border-b">
				<div className="flex items-center gap-2">
					<ImageIcon className="h-4 w-4" />
					<span className="font-medium">Detalles</span>
				</div>
				{onClose && (
					<Button variant="ghost" size="icon" onClick={onClose}>
						<X className="h-4 w-4" />
					</Button>
				)}
			</div>

			{/* Contenido */}
			<ScrollArea className="flex-1">
				<div className="flex flex-col gap-4 p-4">
					{/* Vista previa */}
					<div className="w-full bg-muted/30 rounded-sm overflow-hidden max-h-[600px]">
						<ImagePreview item={selectedItem} />
					</div>

					{/* Acciones */}
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleAction("mark")}
							className={cn(isMarked && "text-yellow-500")}
						>
							<Flag className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleAction("favorite")}
							className={cn(selectedItem.isFavorite && "text-red-500")}
						>
							<Heart className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleAction("download")}
						>
							<Download className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleAction("share")}
						>
							<Share2 className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleAction("delete")}
							className="text-red-500"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>

					<div className="grid grid-cols-1 gap-4">
						<h3 className="text-xs font-medium text-muted-foreground">
							Información AI
						</h3>

						{/* Información técnica */}
						<TechnicalInfo metadata={metadata} />

						{/* Información del sistema */}
						<SystemInfo item={selectedItem} />

						{/* Información EXIF */}
						<ExifInfo metadata={metadata} />

						{/* Información XMP */}
						<XMPInfo metadata={metadata} />

						{/* Información IPTC */}
						<IPTCInfo metadata={metadata} />

						{/* Información GPS */}
						<GPSInfo metadata={metadata} />

						{/* Información de generación AI */}
						<AIGenerationInfo metadata={metadata} />

						{/* Entidades relacionadas */}
						<RelatedEntities item={selectedItem} />

						{/* Debug en desarrollo */}
						{process.env.NODE_ENV === "development" && (
							<pre className="text-[10px] overflow-x-auto p-2 bg-muted rounded-sm">
								{JSON.stringify(metadata, null, 2)}
							</pre>
						)}
					</div>
				</div>
			</ScrollArea>
		</div>
	);
}
