"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FileItem } from "@/types/file-item";
import { formatFileSize } from "@/lib/utils";
import {
	ImageOff,
	Info,
	Maximize2,
	Folder,
	Download,
	Copy,
	BookmarkPlus,
	Heart,
	Tag as TagIcon,
	Trash2,
	FileText,
	Calendar,
	Image as ImageIcon,
	Hash,
	Cpu,
	Clock,
	Info as InfoIcon,
	Wand2,
	Layers,
	Scale,
	Dice5,
	Box,
	GitBranch,
	Gauge,
	HardDrive,
	Timer,
	Bug,
	Camera,
	Aperture,
	Focus,
	MessageSquare,
	MessageSquareOff,
	HeartOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useImageViewer } from "@/store/image-viewer";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

interface FileDetailsProps {
	selectedItem: FileItem | null;
}

interface InfoItemProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | null | undefined;
	tooltip?: string;
}

const InfoItem = ({ icon, label, value, tooltip }: InfoItemProps) => {
	if (!value) return null;

	const content = (
		<div className="flex items-center justify-between py-1.5">
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				{icon}
				<span>{label}</span>
			</div>
			<Badge variant="secondary" className="font-mono text-xs">
				{value}
			</Badge>
		</div>
	);

	if (tooltip) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>{content}</TooltipTrigger>
					<TooltipContent>
						<p>{tooltip}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return content;
};

export function FileDetails({ selectedItem }: FileDetailsProps) {
	const [imageError, setImageError] = React.useState(false);
	const { openViewer } = useImageViewer();

	React.useEffect(() => {
		setImageError(false);
	}, [selectedItem]);

	if (!selectedItem) {
		return (
			<div className="flex-1 flex items-center justify-center p-4">
				<Card className="w-full">
					<CardContent className="pt-6">
						<div className="flex flex-col items-center gap-2 text-muted-foreground">
							<Info className="h-8 w-8" />
							<p className="text-sm">
								Selecciona un archivo para ver su información
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const handleOpenViewer = () => {
		if (
			selectedItem.type === "image" ||
			selectedItem.mimeType?.startsWith("image/")
		) {
			openViewer(selectedItem);
		}
	};

	const renderImage = (src?: string, alt = "") => {
		if (!src || imageError) {
			return (
				<div className="flex flex-col items-center justify-center w-full h-full bg-muted/30 text-muted-foreground">
					<ImageOff className="h-8 w-8 mb-2" />
					<span className="text-xs">Error al cargar la imagen</span>
				</div>
			);
		}

		return (
			<img
				src={src}
				alt={alt}
				className="w-full h-full object-cover transition-transform hover:scale-105"
				onError={() => setImageError(true)}
			/>
		);
	};

	const metadata = selectedItem.metadata || {};
	let parsedMetadata = metadata;

	if (typeof metadata === "string") {
		try {
			parsedMetadata = JSON.parse(metadata);
		} catch (e) {
			console.error("Error parsing metadata:", e);
			parsedMetadata = {};
		}
	}

	const {
		dimensions = {},
		exif = {},
		fileSystem = {},
		generation = {},
	} = parsedMetadata;

	const formatDate = (dateStr: string) => {
		try {
			return new Date(dateStr).toLocaleString();
		} catch (e) {
			return dateStr;
		}
	};

	const formatValue = (value: any): string => {
		if (value === null || value === undefined) return "";
		if (typeof value === "number") return value.toString();
		if (typeof value === "boolean") return value ? "Sí" : "No";
		if (value instanceof Date) return value.toLocaleString();
		if (typeof value === "object") return JSON.stringify(value);
		return value.toString();
	};

	return (
		<ScrollArea className="h-full">
			<AnimatePresence mode="wait">
				<motion.div
					key={selectedItem.id}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					transition={{ duration: 0.2 }}
					className="space-y-4 p-4"
				>
					{/* Vista previa de imagen */}
					{(selectedItem.type === "image" ||
						selectedItem.mimeType?.startsWith("image/")) && (
						<Card>
							<CardContent className="p-0 relative group">
								<div
									className="aspect-square w-full overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
									onClick={handleOpenViewer}
								>
									{renderImage(
										selectedItem.previewUrl || selectedItem.thumbnailUrl,
										selectedItem.name
									)}
								</div>
								<Button
									variant="secondary"
									size="icon"
									className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
									onClick={handleOpenViewer}
								>
									<Maximize2 className="h-4 w-4" />
								</Button>
							</CardContent>
						</Card>
					)}

					{/* Toolbar */}
					<Card>
						<CardContent className="p-2 flex items-center justify-between">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button variant="ghost" size="icon">
											<Folder className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>Abrir carpeta</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button variant="ghost" size="icon">
											<Download className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>Descargar</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button variant="ghost" size="icon">
											<Copy className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>Copiar imagen</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button variant="ghost" size="icon">
											<BookmarkPlus className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>Agregar a colección</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button variant="ghost" size="icon">
											{selectedItem.isFavorite ? (
												<HeartOff className="h-4 w-4" />
											) : (
												<Heart className="h-4 w-4" />
											)}
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>
											{selectedItem.isFavorite
												? "Quitar de favoritos"
												: "Agregar a favoritos"}
										</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button variant="ghost" size="icon">
											<TagIcon className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>Marcar</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="text-destructive"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>Eliminar</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</CardContent>
					</Card>

					{/* Información básica */}
					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium">
								Información básica
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<InfoItem
								icon={<FileText className="h-4 w-4" />}
								label="Nombre"
								value={selectedItem.name}
							/>
							<InfoItem
								icon={<ImageIcon className="h-4 w-4" />}
								label="Tipo"
								value={selectedItem.mimeType}
							/>
							<InfoItem
								icon={<HardDrive className="h-4 w-4" />}
								label="Tamaño"
								value={formatFileSize(fileSystem.size)}
							/>
							{dimensions.width && dimensions.height && (
								<InfoItem
									icon={<Maximize2 className="h-4 w-4" />}
									label="Dimensiones"
									value={`${dimensions.width} × ${dimensions.height}`}
								/>
							)}
						</CardContent>
					</Card>

					{/* Información EXIF */}
					{Object.keys(exif).length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium">
									Información EXIF
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								{exif.Make && (
									<InfoItem
										icon={<Box className="h-4 w-4" />}
										label="Fabricante"
										value={exif.Make}
									/>
								)}
								{exif.Model && (
									<InfoItem
										icon={<Camera className="h-4 w-4" />}
										label="Modelo"
										value={exif.Model}
									/>
								)}
								{exif.Software && (
									<InfoItem
										icon={<Layers className="h-4 w-4" />}
										label="Software"
										value={exif.Software}
									/>
								)}
								{exif.DateTime && (
									<InfoItem
										icon={<Calendar className="h-4 w-4" />}
										label="Fecha"
										value={formatDate(exif.DateTime)}
									/>
								)}
								{exif.ExposureTime && (
									<InfoItem
										icon={<Timer className="h-4 w-4" />}
										label="Tiempo de exposición"
										value={`${exif.ExposureTime}s`}
									/>
								)}
								{exif.FNumber && (
									<InfoItem
										icon={<Aperture className="h-4 w-4" />}
										label="Apertura"
										value={`f/${exif.FNumber}`}
									/>
								)}
								{exif.ISO && (
									<InfoItem
										icon={<Scale className="h-4 w-4" />}
										label="ISO"
										value={exif.ISO}
									/>
								)}
								{exif.FocalLength && (
									<InfoItem
										icon={<Focus className="h-4 w-4" />}
										label="Distancia focal"
										value={`${exif.FocalLength}mm`}
									/>
								)}
							</CardContent>
						</Card>
					)}

					{/* Información de generación AI */}
					{Object.keys(generation).length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium">
									Información de generación
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								{generation.prompt && (
									<InfoItem
										icon={<MessageSquare className="h-4 w-4" />}
										label="Prompt"
										value={generation.prompt}
									/>
								)}
								{generation.negative_prompt && (
									<InfoItem
										icon={<MessageSquareOff className="h-4 w-4" />}
										label="Prompt negativo"
										value={generation.negative_prompt}
									/>
								)}
								{generation.model && (
									<InfoItem
										icon={<Box className="h-4 w-4" />}
										label="Modelo"
										value={generation.model}
									/>
								)}
								{generation.steps && (
									<InfoItem
										icon={<GitBranch className="h-4 w-4" />}
										label="Pasos"
										value={generation.steps}
									/>
								)}
								{generation.cfg_scale && (
									<InfoItem
										icon={<Scale className="h-4 w-4" />}
										label="Escala CFG"
										value={generation.cfg_scale}
									/>
								)}
								{generation.seed && (
									<InfoItem
										icon={<Dice5 className="h-4 w-4" />}
										label="Semilla"
										value={generation.seed}
									/>
								)}
								{generation.sampler && (
									<InfoItem
										icon={<Gauge className="h-4 w-4" />}
										label="Sampler"
										value={generation.sampler}
									/>
								)}
							</CardContent>
						</Card>
					)}

					{/* Información del sistema de archivos */}
					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium">
								Información del sistema
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<InfoItem
								icon={<Calendar className="h-4 w-4" />}
								label="Creado"
								value={formatDate(fileSystem.created)}
							/>
							<InfoItem
								icon={<Clock className="h-4 w-4" />}
								label="Modificado"
								value={formatDate(fileSystem.modified)}
							/>
							<InfoItem
								icon={<Clock className="h-4 w-4" />}
								label="Último acceso"
								value={formatDate(fileSystem.accessed)}
							/>
						</CardContent>
					</Card>

					{/* Debug */}
					{process.env.NODE_ENV === "development" && (
						<Card>
							<CardHeader>
								<CardTitle className="text-sm font-medium">Debug</CardTitle>
							</CardHeader>
							<CardContent>
								<pre className="text-xs overflow-x-auto p-2 bg-muted rounded-md">
									{JSON.stringify(parsedMetadata, null, 2)}
								</pre>
							</CardContent>
						</Card>
					)}
				</motion.div>
			</AnimatePresence>
		</ScrollArea>
	);
}
