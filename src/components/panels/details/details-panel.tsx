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
import { ImageItem } from "@/components/features/file-viewer/file-viewer";
import { formatDate, formatBytes, cn } from "@/lib/utils";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useImageResources } from "@/store/image-resources.store";

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

// Configuración de carga de imágenes
const LOAD_CONFIG = {
	batchSize: 5,
	retryAttempts: 3,
	retryDelay: 1000,
};

export function DetailsPanel({ selectedItems, onClose }: DetailsPanelProps) {
	const [imageError, setImageError] = React.useState(false);
	const [isMarked, setIsMarked] = React.useState(false);
	const [thumbnailUrls, setThumbnailUrls] = React.useState<
		Record<string, string>
	>({});
	const [originalUrls, setOriginalUrls] = React.useState<
		Record<string, string>
	>({});
	const [loadingStates, setLoadingStates] = React.useState<
		Record<string, boolean>
	>({});

	const imageResources = useImageResources();
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

	// Limpiar errores y estados cuando cambian los items seleccionados
	React.useEffect(() => {
		if (selectedItems.length === 1) {
			setImageError(false);
			const itemId = selectedItems[0].id;

			// Cargar thumbnail si no existe
			if (!thumbnailUrls[itemId] && !loadingStates[itemId]) {
				setLoadingStates((prev) => ({ ...prev, [itemId]: true }));
				imageResources.getThumbnail(itemId).then((url) => {
					if (url) {
						setThumbnailUrls((prev) => ({ ...prev, [itemId]: url }));
					}
					setLoadingStates((prev) => ({ ...prev, [itemId]: false }));
				});
			}

			// Cargar imagen original en segundo plano
			if (thumbnailUrls[itemId] && !originalUrls[itemId]) {
				imageResources.getOriginalUrl(itemId).then((url) => {
					if (url) {
						setOriginalUrls((prev) => ({ ...prev, [itemId]: url }));
					}
				});
			}
		}
	}, [
		selectedItems,
		thumbnailUrls,
		originalUrls,
		loadingStates,
		imageResources,
	]);

	const handleOpenViewer = React.useCallback(
		async (item: FileItem) => {
			const metadata = getMetadata(item.metadata);
			if (item.type === "image" || metadata?.mimeType?.startsWith("image/")) {
				try {
					const currentItems = fileManager.currentItems || [];
					const allImages = currentItems.filter((i: FileItem) => {
						const meta = getMetadata(i.metadata);
						return i.type === "image" || meta?.mimeType?.startsWith("image/");
					});

					if (allImages.length === 0) {
						throw new Error("No hay imágenes disponibles");
					}

					const currentIndex = allImages.findIndex((img) => img.id === item.id);
					if (currentIndex === -1) {
						throw new Error("No se encontró la imagen seleccionada");
					}

					const startIndex = Math.max(0, currentIndex - 2);
					const endIndex = Math.min(allImages.length, currentIndex + 3);
					const visibleImages = allImages.slice(startIndex, endIndex);

					// Preparar imágenes iniciales con thumbnails
					const viewerImages = await Promise.all(
						visibleImages.map(async (img) => {
							const thumbnail = await imageResources.getThumbnail(img.id);
							return {
								...img,
								url: "", // Se cargará después
								thumbnail: thumbnail || "",
								mimeType: getMetadata(img.metadata)?.mimeType || "image/jpeg",
							};
						})
					);

					// Cargar URLs originales en segundo plano
					const loadOriginals = async () => {
						for (const img of visibleImages) {
							const url = await imageResources.getOriginalUrl(img.id);
							const index = viewerImages.findIndex((v) => v.id === img.id);
							if (index !== -1 && url) {
								viewerImages[index].url = url;
							}
						}
					};

					// Actualizar estadísticas y abrir visor
					await updateImageStats(item.id, "view");
					openViewer(viewerImages, currentIndex - startIndex);

					// Cargar originales y precargar siguiente lote
					loadOriginals();
					const remainingImages = allImages.filter(
						(img) => !visibleImages.find((v) => v.id === img.id)
					);

					if (remainingImages.length > 0) {
						setTimeout(() => {
							imageResources.preloadResources(
								remainingImages.map((img) => img.id)
							);
						}, 1000);
					}
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
		[fileManager.currentItems, imageResources, openViewer, toast]
	);

	const renderImage = React.useCallback(
		(item: FileItem) => {
			const thumbnailUrl = thumbnailUrls[item.id];
			const originalUrl = originalUrls[item.id];
			const isLoading = loadingStates[item.id];

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

			if (!thumbnailUrl) return null;

			const metadata = getMetadata(item.metadata);
			return (
				<div className="relative w-full h-full">
					{thumbnailUrl && (
						<>
							{/* Thumbnail como fallback */}
							<ImageCard
								src={thumbnailUrl}
								alt={item.name}
								width={metadata?.dimensions?.width || 300}
								height={metadata?.dimensions?.height || 300}
								className={cn(
									"w-full h-full object-contain transition-all rounded-none hover:scale-95 hover:rounded-sm cursor-pointer",
									originalUrl ? "opacity-0" : "opacity-100"
								)}
								priority={true}
								onClick={() => handleOpenViewer(item)}
								onError={() => setImageError(true)}
							/>
							{/* Imagen original con fade-in */}
							{originalUrl && (
								<ImageCard
									src={originalUrl}
									alt={item.name}
									width={metadata?.dimensions?.width || 300}
									height={metadata?.dimensions?.height || 300}
									className="w-full h-full object-contain transition-all rounded-none hover:scale-95 hover:rounded-sm cursor-pointer absolute inset-0 opacity-0 animate-fade-in"
									priority={true}
									onClick={() => handleOpenViewer(item)}
									onError={() => setImageError(true)}
								/>
							)}
						</>
					)}
				</div>
			);
		},
		[imageError, handleOpenViewer, thumbnailUrls, originalUrls, loadingStates]
	);

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
		<div className="flex flex-col h-full">
			<div className="flex w-full items-center justify-between gap-2 p-2 border-b">
				<div className="flex items-center gap-4 w-full min-w-0">
					<div className="flex items-center justify-center h-8 w-8 rounded-sm bg-muted shrink-0">
						<Info className="h-3.5 w-3.5 text-muted-foreground" />
					</div>
					<div className="flex flex-col min-w-0">
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
										<DropdownMenuItem onClick={() => handleAction("favorite")}>
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
										<DropdownMenuItem onClick={() => handleAction("download")}>
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

			<ScrollArea className="flex-1">
				<div className="flex flex-col gap-4 p-4">
					{/* Vista previa */}
					<div className="aspect-square w-full bg-muted/30 rounded-sm overflow-hidden">
						{selectedItems.length === 1 && renderImage(selectedItems[0])}
					</div>

					{/* Información */}
					<div className="flex flex-col gap-6">
						{/* Información básica */}
						<div className="flex flex-col gap-2">
							<h3 className="text-xs font-medium text-muted-foreground">
								Información básica
							</h3>
							<div className="flex flex-col gap-1.5">
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
									value={formatBytes(selectedItems[0].size)}
								/>
								{dimensions && (
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
							</div>
						</div>

						{/* Entidades relacionadas */}
						<div className="flex flex-col gap-2">
							<h3 className="text-xs font-medium text-muted-foreground">
								Entidades relacionadas
							</h3>
							<div className="flex flex-col gap-1.5">
								{selectedItems[0].collections?.length > 0 && (
									<InfoItem
										icon={<BookImage className="h-3.5 w-3.5 text-blue-400" />}
										label="Colecciones"
										value={`${selectedItems[0].collections.length} ${
											selectedItems[0].collections.length === 1 ?
												"colección"
											:	"colecciones"
										}`}
									/>
								)}
								{selectedItems[0].tags?.length > 0 && (
									<InfoItem
										icon={<TagIcon className="h-3.5 w-3.5 text-green-400" />}
										label="Etiquetas"
										value={`${selectedItems[0].tags.length} ${
											selectedItems[0].tags.length === 1 ?
												"etiqueta"
											:	"etiquetas"
										}`}
									/>
								)}
								{selectedItems[0].albums?.length > 0 && (
									<InfoItem
										icon={<Camera className="h-3.5 w-3.5 text-purple-400" />}
										label="Álbumes"
										value={`${selectedItems[0].albums.length} ${
											selectedItems[0].albums.length === 1 ? "álbum" : "álbumes"
										}`}
									/>
								)}
								{selectedItems[0].characters?.length > 0 && (
									<InfoItem
										icon={<User2 className="h-3.5 w-3.5 text-yellow-400" />}
										label="Personajes"
										value={`${selectedItems[0].characters.length} ${
											selectedItems[0].characters.length === 1 ?
												"personaje"
											:	"personajes"
										}`}
									/>
								)}
								{selectedItems[0].places?.length > 0 && (
									<InfoItem
										icon={<MapPin className="h-3.5 w-3.5 text-orange-400" />}
										label="Lugares"
										value={`${selectedItems[0].places.length} ${
											selectedItems[0].places.length === 1 ? "lugar" : "lugares"
										}`}
									/>
								)}
								{selectedItems[0].objects?.length > 0 && (
									<InfoItem
										icon={<Box className="h-3.5 w-3.5 text-indigo-400" />}
										label="Objetos"
										value={`${selectedItems[0].objects.length} ${
											selectedItems[0].objects.length === 1 ?
												"objeto"
											:	"objetos"
										}`}
									/>
								)}
							</div>
							{/* Lista detallada de entidades */}
							<div className="mt-3 space-y-3">
								{selectedItems[0].collections?.length > 0 && (
									<div className="space-y-1.5">
										<div className="flex items-center gap-2">
											<BookImage className="h-3.5 w-3.5 text-blue-400" />
											<span className="text-xs text-muted-foreground">
												Colecciones
											</span>
										</div>
										<div className="flex flex-wrap gap-1">
											{selectedItems[0].collections.map((collection) => (
												<Badge
													key={collection.id}
													variant="secondary"
													className="text-[10px] h-4 px-1.5 flex items-center gap-1 hover:bg-accent"
												>
													<span className="text-[10px]">📁</span>
													<span className="truncate">{collection.name}</span>
												</Badge>
											))}
										</div>
									</div>
								)}
								{selectedItems[0].tags?.length > 0 && (
									<div className="space-y-1.5">
										<div className="flex items-center gap-2">
											<TagIcon className="h-3.5 w-3.5 text-green-400" />
											<span className="text-xs text-muted-foreground">
												Etiquetas
											</span>
										</div>
										<div className="flex flex-wrap gap-1">
											{selectedItems[0].tags.map((tag) => (
												<Badge
													key={tag.id}
													variant="secondary"
													className="text-[10px] h-4 px-1.5 flex items-center gap-1 hover:bg-accent"
													style={{
														backgroundColor:
															tag.color ? `${tag.color}20` : undefined,
													}}
												>
													<span className="text-[10px]">🏷️</span>
													<span className="truncate">{tag.name}</span>
												</Badge>
											))}
										</div>
									</div>
								)}
								{selectedItems[0].albums?.length > 0 && (
									<div className="space-y-1.5">
										<div className="flex items-center gap-2">
											<Camera className="h-3.5 w-3.5 text-purple-400" />
											<span className="text-xs text-muted-foreground">
												Álbumes
											</span>
										</div>
										<div className="flex flex-wrap gap-1">
											{selectedItems[0].albums.map((album) => (
												<Badge
													key={album.id}
													variant="secondary"
													className="text-[10px] h-4 px-1.5 flex items-center gap-1 hover:bg-accent"
												>
													<span className="text-[10px]">📸</span>
													<span className="truncate">{album.name}</span>
												</Badge>
											))}
										</div>
									</div>
								)}
								{selectedItems[0].characters?.length > 0 && (
									<div className="space-y-1.5">
										<div className="flex items-center gap-2">
											<User2 className="h-3.5 w-3.5 text-yellow-400" />
											<span className="text-xs text-muted-foreground">
												Personajes
											</span>
										</div>
										<div className="flex flex-wrap gap-1">
											{selectedItems[0].characters.map((character) => (
												<Badge
													key={character.id}
													variant="secondary"
													className="text-[10px] h-4 px-1.5 flex items-center gap-1 hover:bg-accent"
												>
													<span className="text-[10px]">👤</span>
													<span className="truncate">{character.name}</span>
												</Badge>
											))}
										</div>
									</div>
								)}
								{selectedItems[0].places?.length > 0 && (
									<div className="space-y-1.5">
										<div className="flex items-center gap-2">
											<MapPin className="h-3.5 w-3.5 text-orange-400" />
											<span className="text-xs text-muted-foreground">
												Lugares
											</span>
										</div>
										<div className="flex flex-wrap gap-1">
											{selectedItems[0].places.map((place) => (
												<Badge
													key={place.id}
													variant="secondary"
													className="text-[10px] h-4 px-1.5 flex items-center gap-1 hover:bg-accent"
												>
													<span className="text-[10px]">📍</span>
													<span className="truncate">{place.name}</span>
												</Badge>
											))}
										</div>
									</div>
								)}
								{selectedItems[0].objects?.length > 0 && (
									<div className="space-y-1.5">
										<div className="flex items-center gap-2">
											<Box className="h-3.5 w-3.5 text-indigo-400" />
											<span className="text-xs text-muted-foreground">
												Objetos
											</span>
										</div>
										<div className="flex flex-wrap gap-1">
											{selectedItems[0].objects.map((object) => (
												<Badge
													key={object.id}
													variant="secondary"
													className="text-[10px] h-4 px-1.5 flex items-center gap-1 hover:bg-accent"
												>
													<span className="text-[10px]">🎯</span>
													<span className="truncate">{object.name}</span>
												</Badge>
											))}
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Información del sistema */}
						<div className="flex flex-col gap-2">
							<h3 className="text-xs font-medium text-muted-foreground">
								Información del sistema
							</h3>
							<div className="flex flex-col gap-1.5">
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
							</div>
						</div>

						{/* Información EXIF */}
						{Object.keys(exif).length > 0 && (
							<div className="flex flex-col gap-2">
								<h3 className="text-xs font-medium text-muted-foreground">
									Información EXIF
								</h3>
								<div className="flex flex-col gap-1.5">
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
								</div>
							</div>
						)}

						{/* Información de generación AI */}
						{Object.keys(generation).length > 0 && (
							<div className="flex flex-col gap-2">
								<h3 className="text-xs font-medium text-muted-foreground">
									Información de generación AI
								</h3>
								<div className="flex flex-col gap-1.5">
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
								</div>
							</div>
						)}

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
