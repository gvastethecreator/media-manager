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
import type { ImageMetadata } from "@/lib/metadata";
import { DashboardPanel, StatsPanel } from "../stats/stats-panel";
interface DetailsPanelProps {
	selectedItems: FileItem[];
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
	const { toggleItemSelection } = useFileManager();
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
	const parseMetadata = (metadata: any): ImageMetadata => {
		if (!metadata) return {};

		if (typeof metadata === "string") {
			try {
				return JSON.parse(metadata);
			} catch (e) {
				console.error("Error parsing metadata:", e);
				return {};
			}
		}

		return metadata;
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
								description: `${file.name} ha sido ${
									newFavoriteState ? "agregado a" : "eliminado de"
								} favoritos`,
							});

							const response = await fetch(`/api/images/${file.id}/favorite`, {
								method: "POST",
								headers: {
									"Content-Type": "application/json",
								},
								body: JSON.stringify({ isFavorite: newFavoriteState }),
							});

							if (!response.ok) {
								toggleItemSelection(
									{ ...file, isFavorite: !newFavoriteState },
									false
								);
								throw new Error("Error al actualizar favorito");
							}
						} catch (error) {
							console.error("Error toggling favorite:", error);
							toast({
								title: "Error",
								description: "No se pudo actualizar el estado de favorito",
								variant: "destructive",
							});
						}
						break;

					case "collection-add":
						try {
							if (!data?.collectionId)
								throw new Error("ID de colección no proporcionado");

							toast({
								title: "Agregando a colección",
								description: "Procesando...",
							});

							const response = await fetch(
								`/api/collections/${data.collectionId}/files`,
								{
									method: "POST",
									headers: {
										"Content-Type": "application/json",
									},
									body: JSON.stringify({ fileId: file.id }),
								}
							);

							const responseData = await response.json().catch(() => null);

							if (!response.ok) {
								throw new Error(
									responseData?.error || "Error al agregar a la colección"
								);
							}

							const updatedFile = {
								...file,
								collections: [
									...(file.collections || []),
									{
										id: responseData.collection.id,
										name: responseData.collection.name,
										emoji: responseData.collection.emoji,
										color: responseData.collection.color || "#000000",
									},
								],
							};
							toggleItemSelection(updatedFile, false);

							toast({
								title: "Agregado a la colección",
								description: `${file.name} ha sido agregado a ${responseData.collection.name}`,
							});
						} catch (error) {
							console.error("Error adding to collection:", error);
							toast({
								title: "Error",
								description:
									error instanceof Error
										? error.message
										: "No se pudo agregar a la colección",
								variant: "destructive",
							});
						}
						break;

					case "tag-add":
						try {
							if (!data?.tagId)
								throw new Error("ID de etiqueta no proporcionado");

							toast({
								title: "Agregando etiqueta",
								description: "Procesando...",
							});

							const response = await fetch(`/api/tags/${data.tagId}/files`, {
								method: "POST",
								headers: {
									"Content-Type": "application/json",
								},
								body: JSON.stringify({ fileId: file.id }),
							});

							const responseData = await response.json().catch(() => null);

							if (!response.ok) {
								throw new Error(
									responseData?.error || "Error al agregar la etiqueta"
								);
							}

							const updatedFile = {
								...file,
								tags: [
									...(file.tags || []),
									{
										id: responseData.tag.id,
										name: responseData.tag.name,
										color: responseData.tag.color || "#000000",
									},
								],
							};
							toggleItemSelection(updatedFile, false);

							toast({
								title: "Etiqueta agregada",
								description: `${file.name} ha sido etiquetado con ${responseData.tag.name}`,
							});
						} catch (error) {
							console.error("Error adding tag:", error);
							toast({
								title: "Error",
								description:
									error instanceof Error
										? error.message
										: "No se pudo agregar la etiqueta",
								variant: "destructive",
							});
						}
						break;

					default:
						console.warn("Acción no implementada:", action);
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
		[toggleItemSelection, toast]
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

	// Parsear metadata de manera segura
	const metadata = parseMetadata(selectedItem.metadata);
	const {
		dimensions = {},
		exif = {},
		fileSystem = {},
		generation = {},
		format = null,
		colorSpace = null,
		hasAlpha = false,
		isAnimated = false,
	} = metadata;

	// Actualizamos la toolbar con el nuevo diseño
	const renderToolbar = () => (
		<div className="flex flex-col bg-primary/10 py-1">
			<div className="flex items-center justify-between gap-2 px-2">
				<div className="flex gap-2 items-center">
					<div className="flex items-center justify-center h-5 w-5 rounded-sm bg-white/10">
						<ImageIcon className="h-3 w-3" />
					</div>
					<span className="text-[10px] text-muted-foreground">
						{selectedItem.metadata?.dimensions?.width || 0} ×{" "}
						{selectedItem.metadata?.dimensions?.height || 0}
					</span>
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => handleContextMenuAction("mark-toggle", selectedItem)}
					>
						<Flag className={cn("h-4 w-4", isMarked && "text-warning")} />
					</Button>

					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() =>
							handleContextMenuAction("favorite-toggle", selectedItem)
						}
					>
						{selectedItem.isFavorite ? (
							<HeartOff className="h-4 w-4" />
						) : (
							<Heart
								className={cn(
									"h-4 w-4",
									selectedItem.isFavorite && "text-yellow-500"
								)}
							/>
						)}
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-7 w-7">
								<BookmarkPlus className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							{settings?.collections?.length > 0 ? (
								settings.collections.map((collection) => (
									<DropdownMenuItem
										key={collection.id}
										onClick={() =>
											handleContextMenuAction("collection-add", selectedItem, {
												collectionId: collection.id,
											})
										}
									>
										<div className="flex items-center gap-2 w-full">
											<span className="mr-2">{collection.emoji}</span>
											<span className="flex-1">{collection.name}</span>
											<div
												className="w-3 h-3 rounded"
												style={{ backgroundColor: collection.color }}
											/>
										</div>
									</DropdownMenuItem>
								))
							) : (
								<DropdownMenuItem disabled>
									No hay colecciones disponibles
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-7 w-7">
								<TagIcon className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							{settings?.tags?.length > 0 ? (
								settings.tags.map((tag) => (
									<DropdownMenuItem
										key={tag.id}
										onClick={() =>
											handleContextMenuAction("tag-add", selectedItem, {
												tagId: tag.id,
											})
										}
									>
										<div className="flex items-center gap-2 w-full">
											<div
												className="w-3 h-3 rounded"
												style={{ backgroundColor: tag.color }}
											/>
											<span className="flex-1">{tag.name}</span>
											{tag.shortcut && (
												<Badge
													variant="outline"
													className="text-[10px] h-4 px-1"
												>
													{tag.shortcut}
												</Badge>
											)}
										</div>
									</DropdownMenuItem>
								))
							) : (
								<DropdownMenuItem disabled>
									No hay etiquetas disponibles
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>

					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => handleOpenFolder(selectedItem.path)}
					>
						<Folder className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => handleDownload(selectedItem.path)}
					>
						<Download className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => handleCopy(selectedItem.path)}
					>
						<Copy className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 text-destructive"
						onClick={() => handleContextMenuAction("delete", selectedItem)}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Sección de colecciones y tags actuales */}
			{(selectedItem.collections?.length > 0 ||
				selectedItem.tags?.length > 0) && (
				<div className="flex items-center gap-2 px-2 py-1 mt-1 border-t border-border/50">
					<div className="flex flex-wrap gap-1">
						{selectedItem.collections?.map((collection) => (
							<Badge
								key={collection.id}
								variant="secondary"
								className="h-5 text-[10px] bg-white/10 hover:bg-white/20 gap-1"
							>
								<span>{collection.emoji}</span>
								{collection.name}
							</Badge>
						))}
						{selectedItem.tags?.map((tag) => (
							<Badge
								key={tag.id}
								variant="outline"
								className="h-5 text-[10px] hover:bg-white/10"
								style={{ borderColor: tag.color }}
							>
								<div
									className="w-1.5 h-1.5 rounded-full mr-1"
									style={{ backgroundColor: tag.color }}
								/>
								{tag.name}
							</Badge>
						))}
					</div>
				</div>
			)}
		</div>
	);

	return (
		<ScrollArea className="h-full pr-2">
			<motion.div
				key={selectedItem.id}
				animate={{
					opacity: [0, 1],
					y: [20, 0],
				}}
				className="space-y-4"
			>
				{/* Vista previa de imagen */}
				{(selectedItem.type === "image" ||
					selectedItem.metadata?.mimeType?.startsWith("image/")) && (
					<Card className="border-none rounded-none overflow-hidden">
						<CardContent className="p-0 relative">
							<motion.div
								className="relative max-h-[500px] w-full overflow-hidden flex items-center justify-center"
								animate={{ opacity: [0, 1], scale: [0.95, 1] }}
							>
								{/* Imagen principal */}
								<div className="inset-0 flex items-center justify-center">
									<div className="relative max-h-full">
										{renderImage(selectedItem)}
										{selectedItem.isFavorite && (
											<motion.div
												className="absolute top-2 right-2 z-10"
												animate={{ scale: [0, 1] }}
											>
												<StarIcon className="h-5 w-5 text-yellow-400 drop-shadow-lg" />
											</motion.div>
										)}
									</div>
								</div>
							</motion.div>
						</CardContent>
					</Card>
				)}

				{/* Toolbar */}
				{renderToolbar()}

				{/* Información básica */}
				<motion.div
					animate={{
						opacity: [0, 1],
						y: [20, 0],
					}}
					style={{ delay: 0.1 }}
				>
					<Card className="border-none rounded-none mt-2">
						<CardHeader className="p-4 pb-2">
							<CardTitle className="text-sm font-medium flex items-center gap-2">
								<FileText className="h-4 w-4 text-primary" />
								Información básica
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 pt-2 space-y-1.5">
							<InfoItem
								icon={<FileText className="h-3.5 w-3.5 text-blue-400" />}
								label="Nombre"
								value={selectedItem.name}
							/>
							<InfoItem
								icon={<ImageIcon className="h-3.5 w-3.5 text-green-400" />}
								label="Tipo"
								value={
									format || selectedItem.metadata?.mimeType || "Desconocido"
								}
							/>
							<InfoItem
								icon={<HardDrive className="h-3.5 w-3.5 text-purple-400" />}
								label="Tamaño"
								value={formatFileSize(fileSystem.size)}
							/>
							{dimensions.width && dimensions.height && (
								<InfoItem
									icon={<Maximize2 className="h-3.5 w-3.5 text-yellow-400" />}
									label="Dimensiones"
									value={`${dimensions.width} × ${dimensions.height}`}
								/>
							)}
							{colorSpace && (
								<InfoItem
									icon={<Palette className="h-3.5 w-3.5 text-orange-400" />}
									label="Espacio de color"
									value={colorSpace}
								/>
							)}
							{hasAlpha && (
								<InfoItem
									icon={<Layers className="h-3.5 w-3.5 text-indigo-400" />}
									label="Canal alfa"
									value="Sí"
								/>
							)}
							{isAnimated && (
								<InfoItem
									icon={<Play className="h-3.5 w-3.5 text-pink-400" />}
									label="Animada"
									value="Sí"
								/>
							)}
						</CardContent>
					</Card>
				</motion.div>

				{/* Información EXIF */}
				{Object.keys(exif).length > 0 && (
					<motion.div
						animate={{
							opacity: [0, 1],
							y: [20, 0],
						}}
						style={{ delay: 0.2 }}
					>
						<Card className="border-none rounded-none mt-2">
							<CardHeader className="p-4 pb-2">
								<CardTitle className="text-sm font-medium flex items-center gap-2">
									<Camera className="h-4 w-4 text-primary" />
									Información EXIF
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-2 space-y-1.5">
								{exif.Make && (
									<InfoItem
										icon={<Box className="h-3.5 w-3.5 text-indigo-400" />}
										label="Fabricante"
										value={exif.Make}
									/>
								)}
								{exif.Model && (
									<InfoItem
										icon={<Camera className="h-3.5 w-3.5 text-pink-400" />}
										label="Modelo"
										value={exif.Model}
									/>
								)}
								{exif.Software && (
									<InfoItem
										icon={<Layers className="h-3.5 w-3.5 text-cyan-400" />}
										label="Software"
										value={exif.Software}
									/>
								)}
								{exif.DateTime && (
									<InfoItem
										icon={<Calendar className="h-3.5 w-3.5 text-orange-400" />}
										label="Fecha"
										value={formatDate(exif.DateTime)}
									/>
								)}
								{exif.ExposureTime && (
									<InfoItem
										icon={<Timer className="h-3.5 w-3.5 text-red-400" />}
										label="Tiempo de exposición"
										value={`${exif.ExposureTime}s`}
									/>
								)}
								{exif.FNumber && (
									<InfoItem
										icon={<Aperture className="h-3.5 w-3.5 text-emerald-400" />}
										label="Apertura"
										value={`f/${exif.FNumber}`}
									/>
								)}
								{exif.ISO && (
									<InfoItem
										icon={<Scale className="h-3.5 w-3.5 text-violet-400" />}
										label="ISO"
										value={exif.ISO}
									/>
								)}
								{exif.FocalLength && (
									<InfoItem
										icon={<Focus className="h-3.5 w-3.5 text-amber-400" />}
										label="Distancia focal"
										value={`${exif.FocalLength}mm`}
									/>
								)}
							</CardContent>
						</Card>
					</motion.div>
				)}

				{/* Información de generación AI */}
				{Object.keys(generation).length > 0 && (
					<motion.div
						animate={{
							opacity: [0, 1],
							y: [20, 0],
						}}
						style={{ delay: 0.3 }}
					>
						<Card className="border-none rounded-none mt-2">
							<CardHeader className="p-4 pb-2">
								<CardTitle className="text-sm font-medium flex items-center gap-2">
									<Wand2 className="h-4 w-4 text-primary" />
									Información de generación
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-2 space-y-1.5">
								<>
									{generation.prompt && (
										<InfoItem
											icon={
												<MessageSquare className="h-3.5 w-3.5 text-teal-400" />
											}
											label="Prompt"
											value={generation.prompt}
										/>
									)}
									{generation.negative_prompt && (
										<InfoItem
											icon={
												<MessageSquareOff className="h-3.5 w-3.5 text-rose-400" />
											}
											label="Prompt negativo"
											value={generation.negative_prompt}
										/>
									)}
									{generation.model && (
										<InfoItem
											icon={<Box className="h-3.5 w-3.5 text-sky-400" />}
											label="Modelo"
											value={generation.model}
										/>
									)}
									{generation.steps && (
										<InfoItem
											icon={<GitBranch className="h-3.5 w-3.5 text-lime-400" />}
											label="Pasos"
											value={generation.steps}
										/>
									)}
									{generation.cfg_scale && (
										<InfoItem
											icon={<Scale className="h-3.5 w-3.5 text-fuchsia-400" />}
											label="Escala CFG"
											value={generation.cfg_scale}
										/>
									)}
									{generation.seed && (
										<InfoItem
											icon={<Dice5 className="h-3.5 w-3.5 text-amber-400" />}
											label="Semilla"
											value={generation.seed}
										/>
									)}
									{generation.sampler && (
										<InfoItem
											icon={<Gauge className="h-3.5 w-3.5 text-indigo-400" />}
											label="Sampler"
											value={generation.sampler}
										/>
									)}
								</>
							</CardContent>
						</Card>
					</motion.div>
				)}

				{/* Información del sistema de archivos */}
				<motion.div
					animate={{
						opacity: [0, 1],
						y: [20, 0],
					}}
					style={{ delay: 0.4 }}
				>
					<Card className="border-none rounded-none mt-2">
						<CardHeader className="p-4 pb-2">
							<CardTitle className="text-sm font-medium flex items-center gap-2">
								<HardDrive className="h-4 w-4 text-primary" />
								Información del sistema
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 pt-2 space-y-1.5">
							<InfoItem
								icon={<Calendar className="h-3.5 w-3.5 text-blue-400" />}
								label="Creado"
								value={formatDate(fileSystem.created)}
							/>
							<InfoItem
								icon={<Clock className="h-3.5 w-3.5 text-green-400" />}
								label="Modificado"
								value={formatDate(fileSystem.modified)}
							/>
							<InfoItem
								icon={<Clock className="h-3.5 w-3.5 text-yellow-400" />}
								label="Último acceso"
								value={formatDate(fileSystem.accessed)}
							/>
						</CardContent>
					</Card>
				</motion.div>

				{/* Debug en desarrollo */}
				{process.env.NODE_ENV === "development" && (
					<motion.div
						animate={{
							opacity: [0, 1],
							y: [20, 0],
						}}
						style={{ delay: 0.5 }}
					>
						<Card className="border-none rounded-none mt-2">
							<CardHeader className="p-4 pb-2">
								<CardTitle className="text-sm font-medium flex items-center gap-2">
									<Bug className="h-4 w-4 text-primary" />
									Debug
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-2">
								<pre className="text-[10px] overflow-x-auto p-2 bg-muted rounded-sm">
									{JSON.stringify(metadata, null, 2)}
								</pre>
							</CardContent>
						</Card>
					</motion.div>
				)}
			</motion.div>
		</ScrollArea>
	);
}
