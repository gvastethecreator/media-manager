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
	StarIcon,
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

interface FileDetailsProps {
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
		<div className="flex items-center justify-between py-1.5">
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				{icon}
				<span>{label}</span>
			</div>
			<Badge variant="secondary" className="font-mono text-xs rounded-none">
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

export function FileDetails({ selectedItems }: FileDetailsProps) {
	// 1. Todos los estados primero
	const [imageError, setImageError] = React.useState(false);

	// 2. Todos los hooks de contexto/store
	const { openViewer } = useImageViewer();
	const { toast } = useToast();
	const { toggleItemSelection } = useFileManager();
	const { settings } = useCollectionTagContext();

	// 3. Todos los efectos
	React.useEffect(() => {
		setImageError(false);
	}, [selectedItems]);

	// 4. Todos los callbacks
	const handleContextMenuAction = React.useCallback(
		async (action: string, file: FileItem, data?: any) => {
			try {
				switch (action) {
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
		(path: string) => async () => {
			try {
				await navigator.clipboard.writeText(path);
				toast({
					title: "Ruta copiada",
					description: "La ruta del archivo ha sido copiada al portapapeles",
				});
			} catch (error) {
				toast({
					title: "Error",
					description: "No se pudo copiar la ruta",
					variant: "destructive",
				});
			}
		},
		[toast]
	);

	const handleDownload = React.useCallback(
		(path: string) => () => {
			try {
				window.electron?.downloadFile(path);
				toast({
					title: "Descarga iniciada",
					description: "El archivo se está descargando",
				});
			} catch (error) {
				toast({
					title: "Error",
					description: "No se pudo descargar el archivo",
					variant: "destructive",
				});
			}
		},
		[toast]
	);

	const handleOpenFolder = React.useCallback(
		(path: string) => () => {
			try {
				window.electron?.openPath(path);
			} catch (error) {
				toast({
					title: "Error",
					description: "No se pudo abrir la carpeta",
					variant: "destructive",
				});
			}
		},
		[toast]
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
					className="w-full h-full object-cover transition-transform hover:scale-105"
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
				<Card className="w-full border-none rounded-none">
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

	// Actualizamos la toolbar con el nuevo diseño
	const renderToolbar = () => (
		<Card className="border-none rounded-none">
			<CardContent className="p-2 flex items-center justify-between gap-1">
				<div className="flex items-center gap-1">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => handleOpenFolder(selectedItem.path)}
									className="h-8 w-8"
								>
									<Folder className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Abrir ubicación</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>

					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => handleDownload(selectedItem.path)}
									className="h-8 w-8"
								>
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
								<Button
									variant="ghost"
									size="icon"
									onClick={() => handleCopy(selectedItem.path)}
									className="h-8 w-8"
								>
									<Copy className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Copiar ruta</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>

				<div className="flex items-center gap-1">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									onClick={() =>
										handleContextMenuAction("favorite-toggle", selectedItem)
									}
									className={cn(
										"h-8 w-8",
										selectedItem.isFavorite && "text-yellow-500"
									)}
								>
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

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<BookmarkPlus className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							{settings.collections.length > 0 ? (
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
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<TagIcon className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							{settings.tags.length > 0 ? (
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

					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									onClick={() =>
										handleContextMenuAction("delete", selectedItem)
									}
									className="h-8 w-8 text-destructive"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Eliminar</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</CardContent>
		</Card>
	);

	return (
		<ScrollArea className="h-full">
			<AnimatePresence mode="wait">
				<motion.div
					key={selectedItem.id}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					transition={{ duration: 0.2 }}
					className="space-y-4"
				>
					{/* Vista previa de imagen */}
					{(selectedItem.type === "image" ||
						selectedItem.metadata?.mimeType?.startsWith("image/")) && (
						<Card className="border-none rounded-none overflow-hidden">
							<CardContent className="p-0 relative">
								<div className="relative aspect-[16/10] w-full overflow-hidden">
									{/* Fondo blur */}
									<div
										className="absolute inset-0 blur-2xl brightness-50 scale-110"
										style={{
											backgroundImage: `url(${selectedItem.thumbnail})`,
											backgroundSize: "cover",
											backgroundPosition: "center",
										}}
									/>

									{/* Imagen principal */}
									<div className="absolute inset-0 flex items-center justify-center p-4">
										<div className="relative max-h-full">
											{renderImage(selectedItem)}
											{selectedItem.isFavorite && (
												<div className="absolute top-2 right-2 z-10">
													<StarIcon className="h-5 w-5 text-yellow-400 drop-shadow-lg" />
												</div>
											)}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Toolbar */}
					{renderToolbar()}

					{/* Información básica */}
					<Card className="border-none rounded-none">
						<CardHeader className="p-4 pb-2">
							<CardTitle className="text-sm font-medium">
								Información básica
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 pt-2 space-y-2">
							<InfoItem
								icon={<FileText className="h-4 w-4" />}
								label="Nombre"
								value={selectedItem.name}
							/>
							<InfoItem
								icon={<ImageIcon className="h-4 w-4" />}
								label="Tipo"
								value={selectedItem.metadata?.mimeType}
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
						<Card className="border-none rounded-none">
							<CardHeader className="p-4 pb-2">
								<CardTitle className="text-sm font-medium">
									Información EXIF
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-2 space-y-2">
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
						<Card className="border-none rounded-none">
							<CardHeader className="p-4 pb-2">
								<CardTitle className="text-sm font-medium">
									Información de generación
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-2 space-y-2">
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
					<Card className="border-none rounded-none">
						<CardHeader className="p-4 pb-2">
							<CardTitle className="text-sm font-medium">
								Información del sistema
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 pt-2 space-y-2">
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
						<Card className="border-none rounded-none">
							<CardHeader className="p-4 pb-2">
								<CardTitle className="text-sm font-medium">Debug</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-2">
								<pre className="text-xs overflow-x-auto p-2 bg-muted rounded-none">
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
