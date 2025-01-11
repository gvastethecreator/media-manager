"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FileItem } from "@/types/file-item";
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
	StarIcon,
	Flag,
	Palette,
	Play,
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
import { motion } from "motion/react";
import { ImageCard } from "@/components/features/file-viewer/components/file-viewer-card";
import { useToast } from "@/components/ui/use-toast";
import { useFileManager } from "@/store/file-manager";
import { useCollectionTagContext } from "@/context/settings-context";
import { cn } from "@/lib/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatsPanel } from "../stats/stats-panel";
import { useFiles } from "@/context/file-context";
import { statsService } from "@/services/stats.service";
import type { CacheInvalidationEvent } from "@/services/events.service";

// Interfaces primero
interface DetailsPanelProps {
	selectedItems: FileItem[];
}

interface InfoItemProps {
	icon: React.ReactNode;
	label: string;
	value: string;
	tooltip?: string;
}

interface ImageDimensions {
	width?: number;
	height?: number;
	aspectRatio?: number;
}

interface FileSystemMetadata {
	size?: number;
	created?: string;
	modified?: string;
	accessed?: string;
}

interface LocalImageMetadata {
	dimensions?: ImageDimensions;
	exif: Record<string, string | number>;
	fileSystem?: FileSystemMetadata;
	generation: Record<string, string | number>;
	format?: string | null;
	colorSpace?: string | null;
	hasAlpha?: boolean;
	isAnimated?: boolean;
}

// Funciones auxiliares
const safeString = (value: unknown): string => {
	if (value === null || value === undefined) return "";
	return String(value);
};

const getIconForExif = (key: string): React.ReactNode => {
	const icons: Record<string, React.ReactNode> = {
		Make: <Box className="h-3.5 w-3.5 text-indigo-400" />,
		Model: <Camera className="h-3.5 w-3.5 text-pink-400" />,
		Software: <Layers className="h-3.5 w-3.5 text-cyan-400" />,
		DateTime: <Calendar className="h-3.5 w-3.5 text-orange-400" />,
		ExposureTime: <Timer className="h-3.5 w-3.5 text-red-400" />,
		FNumber: <Aperture className="h-3.5 w-3.5 text-emerald-400" />,
		ISO: <Scale className="h-3.5 w-3.5 text-violet-400" />,
		FocalLength: <Focus className="h-3.5 w-3.5 text-amber-400" />,
	};
	return icons[key] || <Info className="h-3.5 w-3.5 text-muted-foreground" />;
};

const getIconForGeneration = (key: string): React.ReactNode => {
	const icons: Record<string, React.ReactNode> = {
		prompt: <MessageSquare className="h-3.5 w-3.5 text-teal-400" />,
		negative_prompt: <MessageSquareOff className="h-3.5 w-3.5 text-rose-400" />,
		model: <Box className="h-3.5 w-3.5 text-sky-400" />,
		steps: <GitBranch className="h-3.5 w-3.5 text-lime-400" />,
		cfg_scale: <Scale className="h-3.5 w-3.5 text-fuchsia-400" />,
		seed: <Dice5 className="h-3.5 w-3.5 text-amber-400" />,
		sampler: <Gauge className="h-3.5 w-3.5 text-indigo-400" />,
	};
	return icons[key] || <Wand2 className="h-3.5 w-3.5 text-muted-foreground" />;
};

// Componente InfoItem
const InfoItem = ({ icon, label, value, tooltip }: InfoItemProps) => {
	if (!value) return null;

	const content = (
		<div className="flex items-center py-1 grid grid-cols-[auto_1fr] gap-2 align-start">
			<div className="flex items-center gap-2 text-xs text-muted-foreground">
				{icon}
				<span>{label}</span>
			</div>
			<span className="font-mono text-[10px] px-2 py-0.5 bg-muted/50 hover:bg-muted/70 transition-colors rounded-sm">
				{value}
			</span>
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

export function DetailsPanel({ selectedItems }: DetailsPanelProps) {
	// 1. Estados
	const [imageError, setImageError] = React.useState(false);
	const [isMarked, setIsMarked] = React.useState(false);

	// 2. Hooks
	const { openViewer } = useImageViewer();
	const { toast } = useToast();
	const { handleSelectItem, toggleItemSelection } = useFiles();
	const { settings } = useCollectionTagContext();

	// Funciones de utilidad
	const formatFileSize = (size: number | undefined) => {
		if (!size || isNaN(size)) return "0 B";
		const units = ["B", "KB", "MB", "GB", "TB"];
		const i = Math.floor(Math.log(size) / Math.log(1024));
		return `${(size / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
	};

	const formatDate = (dateStr: string | undefined | null) => {
		if (!dateStr) return "";
		try {
			return new Date(dateStr).toLocaleString();
		} catch (e) {
			return dateStr;
		}
	};

	// Parsear metadata de manera segura
	const parseMetadata = (metadata: any): LocalImageMetadata => {
		const emptyMetadata: LocalImageMetadata = {
			dimensions: {},
			exif: {},
			fileSystem: {},
			generation: {},
		};

		if (!metadata) return emptyMetadata;

		if (typeof metadata === "string") {
			try {
				return JSON.parse(metadata);
			} catch (e) {
				console.error("Error parsing metadata:", e);
				return emptyMetadata;
			}
		}

		return {
			dimensions: metadata.dimensions || {},
			exif: metadata.exif || {},
			fileSystem: metadata.fileSystem || {},
			generation: metadata.generation || {},
			format: metadata.format || null,
			colorSpace: metadata.colorSpace || null,
			hasAlpha: !!metadata.hasAlpha,
			isAnimated: !!metadata.isAnimated,
		};
	};

	// 3. Efectos
	React.useEffect(() => {
		setImageError(false);
		setIsMarked(false);
	}, [selectedItems]);

	// 4. Callbacks
	const handleContextMenuAction = React.useCallback(
		async (action: string, file: FileItem, data?: any) => {
			try {
				switch (action) {
					case "mark-toggle":
						setIsMarked((prev) => !prev);
						break;

					case "favorite-toggle":
						try {
							const newFavoriteState = !file.isFavorite;
							const updatedFile = { ...file, isFavorite: newFavoriteState };
							toggleItemSelection(updatedFile, false);

							toast({
								title: newFavoriteState
									? "Agregado a favoritos"
									: "Eliminado de favoritos",
								description: file.name,
							});
						} catch (error) {
							console.error("Error toggling favorite:", error);
							toast({
								title: "Error",
								description: "No se pudo actualizar el estado de favorito",
								variant: "destructive",
							});
						}
						break;

					case "copy-path":
						try {
							await navigator.clipboard.writeText(file.path);
							toast({
								title: "Ruta copiada",
								description:
									"La ruta del archivo ha sido copiada al portapapeles",
							});
						} catch (error) {
							console.error("Error copying path:", error);
							toast({
								title: "Error",
								description: "No se pudo copiar la ruta al portapapeles",
								variant: "destructive",
							});
						}
						break;

					case "copy-name":
						try {
							await navigator.clipboard.writeText(file.name);
							toast({
								title: "Nombre copiado",
								description:
									"El nombre del archivo ha sido copiado al portapapeles",
							});
						} catch (error) {
							console.error("Error copying name:", error);
							toast({
								title: "Error",
								description: "No se pudo copiar el nombre al portapapeles",
								variant: "destructive",
							});
						}
						break;

					case "download":
						try {
							// TODO: Implementar descarga
							toast({
								title: "Descarga iniciada",
								description: file.name,
							});
						} catch (error) {
							console.error("Error downloading file:", error);
							toast({
								title: "Error",
								description: "No se pudo descargar el archivo",
								variant: "destructive",
							});
						}
						break;

					case "delete":
						try {
							// TODO: Implementar eliminación
							toast({
								title: "Archivo eliminado",
								description: file.name,
							});
						} catch (error) {
							console.error("Error deleting file:", error);
							toast({
								title: "Error",
								description: "No se pudo eliminar el archivo",
								variant: "destructive",
							});
						}
						break;

					default:
						console.warn("Unknown action:", action);
				}
			} catch (error) {
				console.error("Error handling context menu action:", error);
				toast({
					title: "Error",
					description: "Ocurrió un error al procesar la acción",
					variant: "destructive",
				});
			}
		},
		[toast, toggleItemSelection]
	);

	const handleOpenViewer = React.useCallback(
		(item: FileItem) => {
			if (
				item.type === "image" ||
				item.metadata?.mimeType?.startsWith("image/")
			) {
				openViewer([item], 0);
			}
		},
		[openViewer]
	);

	const handleCopy = React.useCallback(
		async (path: string) => {
			try {
				// Intentar obtener la imagen original primero
				let response = await fetch(`/api/files/${selectedItems[0].id}/raw`);

				// Si falla, intentar con el thumbnail
				if (!response.ok) {
					const thumbnailUrl = `/api/thumbnails/${selectedItems[0].id}?quality=high`;
					response = await fetch(thumbnailUrl);
				}

				if (!response.ok) {
					throw new Error("No se pudo obtener la imagen");
				}

				const blob = await response.blob();

				// Función para intentar copiar usando el portapapeles
				const tryClipboardCopy = async () => {
					if (navigator.clipboard && navigator.clipboard.write) {
						try {
							window.focus();
							await navigator.clipboard.write([
								new ClipboardItem({
									[blob.type]: blob,
								}),
							]);
							return true;
						} catch (clipboardError) {
							console.warn("Error copying image to clipboard:", clipboardError);
							return false;
						}
					}
					return false;
				};

				const clipboardSuccess = await tryClipboardCopy();
				if (clipboardSuccess) {
					toast({
						title: "Copiado",
						description: "Imagen copiada al portapapeles",
					});
					return;
				}

				// Si no se pudo usar el portapapeles, copiar el path
				await navigator.clipboard.writeText(path);
				toast({
					title: "Copiado",
					description: "Ruta del archivo copiada al portapapeles",
				});
			} catch (error) {
				console.error("Error copying to clipboard:", error);
				toast({
					title: "Error",
					description: "No se pudo copiar al portapapeles",
					variant: "destructive",
				});
			}
		},
		[selectedItems, toast]
	);

	const handleDownload = React.useCallback(
		async (path: string) => {
			try {
				const response = await fetch(
					`/api/files/${selectedItems[0].id}/download`
				);
				if (!response.ok) throw new Error("Error al descargar archivo");

				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = selectedItems[0].name;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);

				toast({
					title: "Descarga iniciada",
					description: `Se ha iniciado la descarga de ${selectedItems[0].name}`,
				});
			} catch (error) {
				console.error("Error downloading file:", error);
				toast({
					title: "Error",
					description: "No se pudo descargar el archivo",
					variant: "destructive",
				});
			}
		},
		[selectedItems, toast]
	);

	const handleOpenFolder = React.useCallback(
		async (path: string) => {
			try {
				const response = await fetch(
					`/api/files/${selectedItems[0].id}/location`,
					{
						method: "POST",
					}
				);

				if (!response.ok) throw new Error("Error al abrir ubicación");

				toast({
					title: "Ubicación abierta",
					description: "Se ha abierto la ubicación del archivo",
				});
			} catch (error) {
				console.error("Error opening location:", error);
				toast({
					title: "Error",
					description: "No se pudo abrir la ubicación",
					variant: "destructive",
				});
			}
		},
		[selectedItems, toast]
	);

	const renderImage = React.useCallback(
		(item: FileItem) => {
			if (imageError || !item.thumbnail) {
				return (
					<div className="flex flex-col items-center justify-center w-full h-full bg-muted/30 text-muted-foreground">
						<ImageOff className="h-8 w-8 mb-2" />
						<span className="text-xs">
							{imageError
								? "Error al cargar la imagen"
								: "No hay vista previa disponible"}
						</span>
					</div>
				);
			}

			return (
				<ImageCard
					src={item.thumbnail}
					alt={item.name}
					width={item.metadata?.dimensions?.width || 300}
					height={item.metadata?.dimensions?.height || 300}
					className="w-full h-full object-contain transition-transform rounded-none hover:scale-95 hover:rounded-sm cursor-pointer"
					priority={true}
					onClick={() => handleOpenViewer(item)}
				/>
			);
		},
		[imageError, handleOpenViewer]
	);

	// Early returns después de todos los hooks
	if (!selectedItems.length) {
		return (
			<div className="flex-1 flex items-center justify-center p-4">
				<StatsPanel />
			</div>
		);
	}

	if (selectedItems.length > 1) {
		return (
			<div className="flex-1 flex items-center justify-center p-4">
				<Card className="w-full border-none rounded-none">
					<CardContent className="pt-6">
						<div className="flex flex-col items-center gap-2">
							<div className="flex items-center justify-center w-12 h-12 rounded-none bg-primary/10">
								<ImageIcon className="h-6 w-6 text-primary" />
							</div>
							<p className="text-sm font-medium">
								{selectedItems.length} archivos seleccionados
							</p>
							<p className="text-xs text-muted-foreground text-center">
								Tamaño total:{" "}
								{formatFileSize(
									selectedItems.reduce(
										(acc, item) => acc + (item.metadata?.fileSystem?.size || 0),
										0
									)
								)}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const selectedItem = selectedItems[0];
	const metadata = parseMetadata(selectedItem.metadata);

	const hasCollections =
		selectedItem.collections && selectedItem.collections.length > 0;
	const hasTags = selectedItem.tags && selectedItem.tags.length > 0;
	const hasCharacters =
		selectedItem.characters && selectedItem.characters.length > 0;
	const hasPlaces = selectedItem.places && selectedItem.places.length > 0;
	const hasObjects = selectedItem.objects && selectedItem.objects.length > 0;

	// Emitir eventos de actualización si es necesario
	React.useEffect(() => {
		const events: CacheInvalidationEvent[] = [];
		if (hasCollections) events.push("collections:modified");
		if (hasTags) events.push("tags:modified");
		if (hasCharacters) events.push("characters:modified");
		if (hasPlaces) events.push("places:modified");
		if (hasObjects) events.push("objects:modified");
		if (selectedItem.isFavorite) events.push("favorites:modified");

		if (events.length > 0) {
			statsService.emitUpdateNeeded(events);
		}
	}, [
		hasCollections,
		hasTags,
		hasCharacters,
		hasPlaces,
		hasObjects,
		selectedItem.isFavorite,
	]);

	return (
		<ScrollArea className="h-full">
			<div className="flex flex-col gap-4 p-4">
				{/* Imagen */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-sm font-medium">
							<ImageIcon className="h-4 w-4" />
							Vista previa
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
							{!imageError ? (
								<ImageCard
									file={selectedItem}
									onError={() => setImageError(true)}
									onClick={() => openViewer(selectedItem)}
									className="cursor-pointer transition-transform hover:scale-105"
								/>
							) : (
								<div className="flex h-full items-center justify-center">
									<ImageOff className="h-12 w-12 text-muted-foreground" />
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Acciones */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-sm font-medium">
							<Play className="h-4 w-4" />
							Acciones
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => openViewer(selectedItem)}
							>
								<Maximize2 className="mr-2 h-4 w-4" />
								Ver
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									handleContextMenuAction("download", selectedItem)
								}
							>
								<Download className="mr-2 h-4 w-4" />
								Descargar
							</Button>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm">
										<Copy className="mr-2 h-4 w-4" />
										Copiar
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem
										onClick={() =>
											handleContextMenuAction("copy-path", selectedItem)
										}
									>
										<Folder className="mr-2 h-4 w-4" />
										Ruta
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											handleContextMenuAction("copy-name", selectedItem)
										}
									>
										<FileText className="mr-2 h-4 w-4" />
										Nombre
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

							<Button
								variant={selectedItem.isFavorite ? "default" : "outline"}
								size="sm"
								onClick={() =>
									handleContextMenuAction("favorite-toggle", selectedItem)
								}
							>
								{selectedItem.isFavorite ? (
									<>
										<HeartOff className="mr-2 h-4 w-4" />
										Quitar favorito
									</>
								) : (
									<>
										<Heart className="mr-2 h-4 w-4" />
										Favorito
									</>
								)}
							</Button>

							<Button
								variant={isMarked ? "default" : "outline"}
								size="sm"
								onClick={() =>
									handleContextMenuAction("mark-toggle", selectedItem)
								}
							>
								{isMarked ? (
									<>
										<Flag className="mr-2 h-4 w-4" />
										Desmarcar
									</>
								) : (
									<>
										<Flag className="mr-2 h-4 w-4" />
										Marcar
									</>
								)}
							</Button>

							<Button
								variant="destructive"
								size="sm"
								onClick={() => handleContextMenuAction("delete", selectedItem)}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Eliminar
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Información */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-sm font-medium">
							<Info className="h-4 w-4" />
							Información
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Información básica */}
						<div className="space-y-1">
							<InfoItem
								icon={<FileText className="h-3.5 w-3.5 text-blue-400" />}
								label="Nombre"
								value={selectedItem.name}
							/>
							<InfoItem
								icon={<Folder className="h-3.5 w-3.5 text-amber-400" />}
								label="Ruta"
								value={selectedItem.path}
							/>
							<InfoItem
								icon={<Scale className="h-3.5 w-3.5 text-emerald-400" />}
								label="Tamaño"
								value={formatFileSize(selectedItem.size)}
							/>
							<InfoItem
								icon={<Calendar className="h-3.5 w-3.5 text-violet-400" />}
								label="Creado"
								value={formatDate(selectedItem.createdAt)}
							/>
							<InfoItem
								icon={<Clock className="h-3.5 w-3.5 text-rose-400" />}
								label="Modificado"
								value={formatDate(selectedItem.updatedAt)}
							/>
						</div>

						{/* Dimensiones */}
						{metadata.dimensions && (
							<div className="space-y-1">
								<h4 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
									<ImageIcon className="h-3.5 w-3.5" />
									Dimensiones
								</h4>
								<InfoItem
									icon={<Scale className="h-3.5 w-3.5 text-cyan-400" />}
									label="Ancho"
									value={`${metadata.dimensions.width || 0}px`}
								/>
								<InfoItem
									icon={<Scale className="h-3.5 w-3.5 text-pink-400" />}
									label="Alto"
									value={`${metadata.dimensions.height || 0}px`}
								/>
								<InfoItem
									icon={<Scale className="h-3.5 w-3.5 text-indigo-400" />}
									label="Relación"
									value={`${metadata.dimensions.aspectRatio || 0}`}
								/>
							</div>
						)}

						{/* Sistema de archivos */}
						{metadata.fileSystem && (
							<div className="space-y-1">
								<h4 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
									<HardDrive className="h-3.5 w-3.5" />
									Sistema de archivos
								</h4>
								<InfoItem
									icon={<Scale className="h-3.5 w-3.5 text-teal-400" />}
									label="Tamaño"
									value={formatFileSize(metadata.fileSystem.size)}
								/>
								<InfoItem
									icon={<Calendar className="h-3.5 w-3.5 text-orange-400" />}
									label="Creado"
									value={formatDate(metadata.fileSystem.created)}
								/>
								<InfoItem
									icon={<Clock className="h-3.5 w-3.5 text-lime-400" />}
									label="Modificado"
									value={formatDate(metadata.fileSystem.modified)}
								/>
								<InfoItem
									icon={<Timer className="h-3.5 w-3.5 text-fuchsia-400" />}
									label="Accedido"
									value={formatDate(metadata.fileSystem.accessed)}
								/>
							</div>
						)}

						{/* EXIF */}
						{Object.keys(metadata.exif).length > 0 && (
							<div className="space-y-1">
								<h4 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
									<Camera className="h-3.5 w-3.5" />
									EXIF
								</h4>
								{Object.entries(metadata.exif).map(([key, value]) => (
									<InfoItem
										key={key}
										icon={getIconForExif(key)}
										label={key}
										value={safeString(value)}
									/>
								))}
							</div>
						)}

						{/* Generación */}
						{Object.keys(metadata.generation).length > 0 && (
							<div className="space-y-1">
								<h4 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
									<Wand2 className="h-3.5 w-3.5" />
									Generación
								</h4>
								{Object.entries(metadata.generation).map(([key, value]) => (
									<InfoItem
										key={key}
										icon={getIconForGeneration(key)}
										label={key}
										value={safeString(value)}
									/>
								))}
							</div>
						)}

						{/* Formato */}
						{metadata.format && (
							<div className="space-y-1">
								<h4 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
									<Palette className="h-3.5 w-3.5" />
									Formato
								</h4>
								<InfoItem
									icon={<FileText className="h-3.5 w-3.5 text-blue-400" />}
									label="Formato"
									value={metadata.format}
								/>
								{metadata.colorSpace && (
									<InfoItem
										icon={<Palette className="h-3.5 w-3.5 text-purple-400" />}
										label="Espacio de color"
										value={metadata.colorSpace}
									/>
								)}
								<InfoItem
									icon={<Layers className="h-3.5 w-3.5 text-yellow-400" />}
									label="Canal alfa"
									value={metadata.hasAlpha ? "Sí" : "No"}
								/>
								<InfoItem
									icon={<Play className="h-3.5 w-3.5 text-green-400" />}
									label="Animado"
									value={metadata.isAnimated ? "Sí" : "No"}
								/>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</ScrollArea>
	);
}
