"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FileItem, FileMetadata } from "@/types/file-item";
import { useImageViewer } from "@/store/image-viewer.store";
import { ImageCard } from "@/components/panels/details/file-viewer-card";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ImageItem } from "@/components/features/file-viewer/file-viewer";
import { formatDate, formatFileSize } from "@/lib/utils";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface InfoItemProps {
	icon: React.ReactNode;
	label: string;
	value: string | number;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
	return (
		<div className="flex items-center justify-between text-sm">
			<div className="flex items-center gap-2">
				{icon}
				<span className="text-muted-foreground">{label}</span>
			</div>
			<span className="font-medium">{value}</span>
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
		return JSON.parse(metadata);
	} catch {
		return null;
	}
};

const animationConfig = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	transition: { type: "spring", stiffness: 500, damping: 30 },
};

const toolbarAnimation = {
	initial: { opacity: 0, y: -20 },
	animate: { opacity: 1, y: 0 },
	transition: { type: "spring", stiffness: 500, damping: 30 },
};

const staggerContainer = {
	animate: {
		transition: {
			staggerChildren: 0.1,
		},
	},
};

export function DetailsPanel({ selectedItems, onClose }: DetailsPanelProps) {
	const [imageError, setImageError] = React.useState(false);
	const [isMarked, setIsMarked] = React.useState(false);
	const [isLoading, setIsLoading] = React.useState(false);
	const [imageUrl, setImageUrl] = React.useState<string | null>(null);
	const { openViewer } = useImageViewer();
	const { toast } = useToast();
	const fileManager = useFileManager();

	// Obtener metadata
	const metadata =
		selectedItems[0] ? getMetadata(selectedItems[0].metadata) : null;
	const format = metadata?.mimeType?.split("/")[1] || "Desconocido";
	const dimensions = metadata?.dimensions;
	const colorSpace = metadata?.colorSpace;
	const hasAlpha = metadata?.hasAlpha;
	const isAnimated = metadata?.isAnimated;
	const exif = metadata?.exif || {};
	const generation = metadata?.generation || {};

	const handleOpenViewer = React.useCallback(
		async (item: FileItem) => {
			const metadata = getMetadata(item.metadata);
			if (item.type === "image" || metadata?.mimeType?.startsWith("image/")) {
				try {
					// Usar las imágenes del directorio actual
					const currentItems = fileManager.currentItems || [];
					const allImages = currentItems.filter((i: FileItem) => {
						const meta = getMetadata(i.metadata);
						return i.type === "image" || meta?.mimeType?.startsWith("image/");
					});

					if (allImages.length === 0) {
						throw new Error("No hay imágenes disponibles");
					}

					// Procesar imágenes en lotes para evitar sobrecarga
					const batchSize = 5;
					const validImages: ImageItem[] = [];

					for (let i = 0; i < allImages.length; i += batchSize) {
						const batch = allImages.slice(i, i + batchSize);
						const batchResults = await Promise.all(
							batch.map(async (img: FileItem) => {
								try {
									// Obtener URL original
									const originalUrl = await getImageUrl(img.id);

									// Intentar obtener thumbnail del caché primero
									let thumbnailUrl: string | null = null;
									try {
										const thumbnailResponse = await fetch(
											`/api/thumbnails/${img.id}?quality=medium`
										);
										if (thumbnailResponse.ok) {
											const data = await thumbnailResponse.json();
											thumbnailUrl = `data:${
												data.mimeType || "image/webp"
											};base64,${data.thumbnail}`;
										}
									} catch (error) {
										console.warn(
											`No se pudo cargar el thumbnail para ${img.name}:`,
											error
										);
									}

									return {
										id: img.id,
										name: img.name,
										type: "image",
										url: originalUrl,
										src: originalUrl,
										thumbnail: thumbnailUrl || originalUrl,
										alt: img.name,
										mimeType:
											getMetadata(img.metadata)?.mimeType || "image/jpeg",
										width: getMetadata(img.metadata)?.dimensions?.width,
										height: getMetadata(img.metadata)?.dimensions?.height,
										metadata: img.metadata,
									} as ImageItem;
								} catch (error) {
									console.error(`Error cargando imagen ${img.name}:`, error);
									return null;
								}
							})
						);

						// Filtrar y agregar imágenes válidas
						validImages.push(
							...batchResults.filter((img): img is ImageItem => img !== null)
						);

						// Pequeña pausa entre lotes para evitar sobrecarga
						if (i + batchSize < allImages.length) {
							await new Promise((resolve) => setTimeout(resolve, 100));
						}
					}

					if (validImages.length === 0) {
						throw new Error("No se pudieron cargar las imágenes");
					}

					// Encontrar el índice de la imagen actual
					const currentIndex = validImages.findIndex(
						(img: ImageItem) => img.id === item.id
					);

					if (currentIndex === -1) {
						throw new Error("No se encontró la imagen seleccionada");
					}

					console.log(
						`🖼️ Abriendo visor con ${validImages.length} imágenes desde índice ${currentIndex}`
					);
					openViewer(validImages as unknown as FileItem[], currentIndex);
					await updateImageStats(item.id, "view");
				} catch (error) {
					console.error("Error al abrir el visor:", error);
					toast({
						title: "Error",
						description:
							error instanceof Error ?
								error.message
							:	"No se pudo abrir la imagen",
						variant: "destructive",
					});
				}
			}
		},
		[fileManager.currentItems, openViewer, toast]
	);

	// Cargar URL firmada cuando cambia el item seleccionado
	React.useEffect(() => {
		async function loadImageUrl() {
			if (selectedItems.length !== 1) return;

			try {
				setIsLoading(true);
				setImageError(false);
				const url = await getImageUrl(selectedItems[0].id);
				setImageUrl(url);
			} catch (error) {
				console.error("Error cargando imagen:", error);
				setImageError(true);
			} finally {
				setIsLoading(false);
			}
		}

		loadImageUrl();
	}, [selectedItems]);

	const renderImage = React.useCallback(
		(item: FileItem) => {
			if (isLoading) {
				return (
					<div className="flex flex-col items-center justify-center w-full h-full bg-muted/30">
						<div className="animate-pulse w-full h-full bg-muted/50" />
					</div>
				);
			}

			if (imageError) {
				return (
					<div className="flex flex-col items-center justify-center w-full h-full bg-muted/30 text-muted-foreground">
						<ImageOff className="h-8 w-8 mb-2" />
						<span className="text-xs">Error al cargar la imagen</span>
					</div>
				);
			}

			if (!imageUrl) return null;

			const metadata = getMetadata(item.metadata);
			return (
				<div className="relative w-full h-full">
					<ImageCard
						src={imageUrl}
						alt={item.name}
						width={metadata?.dimensions?.width || 300}
						height={metadata?.dimensions?.height || 300}
						className="w-full h-full object-contain transition-transform rounded-none hover:scale-95 hover:rounded-sm cursor-pointer"
						priority={true}
						onClick={() => handleOpenViewer(item)}
						onError={() => {
							setImageError(true);
							setIsLoading(false);
						}}
					/>
				</div>
			);
		},
		[imageError, isLoading, handleOpenViewer, imageUrl]
	);

	React.useEffect(() => {
		if (selectedItems.length === 1) {
			setIsLoading(true);
			setImageError(false);
		}
	}, [selectedItems]);

	const handleAction = async (action: string) => {
		if (!selectedItems.length) return;
		const file = selectedItems[0];

		try {
			switch (action) {
				case "mark":
					setIsMarked(!isMarked);
					toast({
						title: isMarked ? "Desmarcado" : "Marcado",
						description: file.name,
					});
					break;
				case "favorite":
					// TODO: Implementar toggle favorito
					toast({
						title:
							file.isFavorite ?
								"Eliminado de favoritos"
							:	"Agregado a favoritos",
						description: file.name,
					});
					break;
				case "download":
					await updateImageStats(file.id, "download");
					toast({
						title: "Descarga iniciada",
						description: file.name,
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
						description: file.name,
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
	};

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
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const selectedItem = selectedItems[0];

	return (
		<ScrollArea className="h-full">
			<motion.div
				className="flex flex-col gap-4 p-0"
				variants={staggerContainer}
				initial="initial"
				animate="animate"
			>
				{/* Toolbar */}
				<motion.div
					variants={toolbarAnimation}
					className={cn("flex flex-col bg-primary/5 py-0", "border-b")}
				>
					<div className="flex w-full items-center justify-between gap-2 p-2">
						<div className="flex items-center gap-4 w-full min-w-0">
							<div className="flex items-center justify-center h-8 w-8 rounded-sm bg-muted shrink-0">
								<Info className="h-3.5 w-3.5 text-muted-foreground" />
							</div>
							<div className="flex flex-col min-w-0">
								<span className="text-sm font-medium">Detalles</span>
								<span className="text-xs text-muted-foreground truncate">
									{selectedItems.length === 1 ?
										selectedItems[0].name
									:	`${selectedItems.length} elementos seleccionados`}
								</span>
							</div>
						</div>
						<div className="flex items-center gap-2 shrink-0">
							{selectedItems.length === 1 && (
								<>
									<div className="hidden sm:flex items-center gap-2">
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7"
											onClick={() => handleAction("mark")}
											title={isMarked ? "Desmarcar" : "Marcar"}
										>
											<Flag className="h-3.5 w-3.5" />
										</Button>

										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7"
											onClick={() => handleAction("favorite")}
											title={
												selectedItems[0].isFavorite ?
													"Quitar de favoritos"
												:	"Agregar a favoritos"
											}
										>
											<Heart className="h-3.5 w-3.5" />
										</Button>

										<Separator orientation="vertical" className="h-4" />
									</div>

									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7"
												title="Agregar a..."
											>
												<Plus className="h-3.5 w-3.5" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem>
												<BookImage className="mr-2 h-4 w-4" />
												Colección
											</DropdownMenuItem>
											<DropdownMenuItem>
												<TagIcon className="mr-2 h-4 w-4" />
												Etiquetas
											</DropdownMenuItem>
											<DropdownMenuItem>
												<Camera className="mr-2 h-4 w-4" />
												Álbum
											</DropdownMenuItem>
											<DropdownMenuItem>
												<User2 className="mr-2 h-4 w-4" />
												Personaje
											</DropdownMenuItem>
											<DropdownMenuItem>
												<MapPin className="mr-2 h-4 w-4" />
												Lugar
											</DropdownMenuItem>
											<DropdownMenuItem>
												<Box className="mr-2 h-4 w-4" />
												Objeto
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>

									<Separator orientation="vertical" className="h-4" />

									<div className="hidden sm:flex items-center gap-2">
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7"
											onClick={() => handleOpenViewer(selectedItems[0])}
											title="Ver imagen"
										>
											<Maximize2 className="h-3.5 w-3.5" />
										</Button>

										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7"
											onClick={() => handleAction("download")}
											title="Descargar"
										>
											<Download className="h-3.5 w-3.5" />
										</Button>

										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7"
											onClick={() => handleAction("share")}
											title="Compartir"
										>
											<Share2 className="h-3.5 w-3.5" />
										</Button>
									</div>

									<div className="sm:hidden">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="h-7 w-7"
													title="Más acciones"
												>
													<MoreVertical className="h-3.5 w-3.5" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => handleAction("mark")}>
													<Flag className="mr-2 h-4 w-4" />
													{isMarked ? "Desmarcar" : "Marcar"}
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleAction("favorite")}
												>
													<Heart className="mr-2 h-4 w-4" />
													{selectedItems[0].isFavorite ?
														"Quitar de favoritos"
													:	"Agregar a favoritos"}
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleOpenViewer(selectedItems[0])}
												>
													<Maximize2 className="mr-2 h-4 w-4" />
													Ver imagen
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleAction("download")}
												>
													<Download className="mr-2 h-4 w-4" />
													Descargar
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => handleAction("share")}>
													<Share2 className="mr-2 h-4 w-4" />
													Compartir
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>

									<Separator orientation="vertical" className="h-4" />

									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7 text-destructive hover:text-destructive"
										onClick={() => handleAction("delete")}
										title="Eliminar"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</Button>
								</>
							)}
							{onClose && (
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7"
									onClick={onClose}
									title="Cerrar"
								>
									<X className="h-3.5 w-3.5" />
								</Button>
							)}
						</div>
					</div>
				</motion.div>

				{/* Contenido */}
				<motion.div
					className="flex flex-col gap-4 p-4"
					variants={staggerContainer}
				>
					{/* Vista previa */}
					<motion.div
						variants={animationConfig}
						className="relative aspect-square overflow-hidden rounded-sm bg-muted"
					>
						{selectedItems.length === 1 && renderImage(selectedItems[0])}
					</motion.div>

					{/* Información */}
					<motion.div
						className="grid gap-4 sm:grid-cols-2"
						variants={staggerContainer}
					>
						{/* Información básica */}
						<motion.div variants={animationConfig}>
							<Card className="border-none rounded-none">
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
										value={selectedItems[0].name}
									/>
									<InfoItem
										icon={<ImageIcon className="h-3.5 w-3.5 text-green-400" />}
										label="Tipo"
										value={format}
									/>
									<InfoItem
										icon={<HardDrive className="h-3.5 w-3.5 text-purple-400" />}
										label="Tamaño"
										value={formatFileSize(selectedItems[0].size)}
									/>
									{dimensions && (
										<InfoItem
											icon={
												<Maximize2 className="h-3.5 w-3.5 text-yellow-400" />
											}
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

						{/* Información del sistema */}
						<motion.div variants={animationConfig}>
							<Card className="border-none rounded-none">
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
										value={formatDate(selectedItems[0].createdAt)}
									/>
									<InfoItem
										icon={<Clock className="h-3.5 w-3.5 text-green-400" />}
										label="Modificado"
										value={formatDate(selectedItems[0].modifiedAt)}
									/>
									<InfoItem
										icon={<Clock className="h-3.5 w-3.5 text-yellow-400" />}
										label="Último acceso"
										value={formatDate(selectedItems[0].accessedAt)}
									/>
								</CardContent>
							</Card>
						</motion.div>
					</motion.div>

					{/* Información EXIF */}
					{Object.keys(exif).length > 0 && (
						<motion.div variants={animationConfig}>
							<Card className="border-none rounded-none">
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
											icon={
												<Calendar className="h-3.5 w-3.5 text-orange-400" />
											}
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
											icon={
												<Aperture className="h-3.5 w-3.5 text-emerald-400" />
											}
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
						<motion.div variants={animationConfig}>
							<Card className="border-none rounded-none">
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
												icon={
													<GitBranch className="h-3.5 w-3.5 text-lime-400" />
												}
												label="Pasos"
												value={generation.steps}
											/>
										)}
										{generation.cfg_scale && (
											<InfoItem
												icon={
													<Scale className="h-3.5 w-3.5 text-fuchsia-400" />
												}
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

					{/* Debug en desarrollo */}
					{process.env.NODE_ENV === "development" && (
						<motion.div variants={animationConfig}>
							<Card className="border-none rounded-none">
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
			</motion.div>
		</ScrollArea>
	);
}
